"""
Business: Rate limiting и защита от DDoS атак на уровне backend
Args: event с httpMethod, headers, sourceIp; context с request_id
Returns: HTTP response с rate limit информацией
"""

import json
import os
import time
from typing import Dict, Any
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from cors_helper import fix_cors_response
from collections import defaultdict
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

# Конфигурация rate limiting
RATE_LIMITS = {
    'default': {'requests': 100, 'window': 60},      # 100 запросов в минуту
    'auth': {'requests': 10, 'window': 60},          # 10 попыток входа в минуту
    'withdrawal': {'requests': 5, 'window': 300},    # 5 заявок на вывод за 5 минут
    'forum': {'requests': 30, 'window': 60},         # 30 постов/комментов в минуту
    'admin': {'requests': 200, 'window': 60}         # 200 запросов для админов
}

# In-memory хранилище (в production лучше использовать Redis)
request_tracker: Dict[str, Dict[str, Any]] = defaultdict(lambda: {
    'count': 0,
    'window_start': time.time(),
    'blocked_until': 0
})

def get_client_key(event: Dict[str, Any]) -> str:
    """Получение уникального ключа клиента"""
    headers = event.get('headers', {})
    
    # IP адрес из разных источников
    source_ip = (
        event.get('requestContext', {}).get('identity', {}).get('sourceIp') or
        headers.get('X-Forwarded-For', '').split(',')[0].strip() or
        headers.get('X-Real-IP') or
        'unknown'
    )
    
    # User-Agent для дополнительной идентификации
    user_agent = headers.get('User-Agent', headers.get('user-agent', ''))
    
    # Комбинированный ключ
    return f"{source_ip}:{hash(user_agent) % 10000}"

def get_rate_limit_type(event: Dict[str, Any]) -> str:
    """Определение типа rate limit по endpoint"""
    path = event.get('requestContext', {}).get('httpMethod', '')
    body = {}
    
    try:
        body = json.loads(event.get('body', '{}'))
    except:
        pass
    
    action = body.get('action', '')
    
    # Определяем тип по action
    if action in ('login', 'register', 'reset_password'):
        return 'auth'
    elif action in ('create_withdrawal', 'withdraw_btc', 'process_withdrawal'):
        return 'withdrawal'
    elif 'forum' in action or 'topic' in action or 'comment' in action:
        return 'forum'
    
    return 'default'

def check_rate_limit(
    client_key: str, 
    limit_type: str = 'default',
    is_admin: bool = False
) -> Dict[str, Any]:
    """Проверка rate limit для клиента"""
    
    # Админы получают больший лимит
    if is_admin:
        limit_type = 'admin'
    
    config = RATE_LIMITS.get(limit_type, RATE_LIMITS['default'])
    max_requests = config['requests']
    window_seconds = config['window']
    
    current_time = time.time()
    client_data = request_tracker[client_key]
    
    # Проверка блокировки
    if client_data['blocked_until'] > current_time:
        remaining_time = int(client_data['blocked_until'] - current_time)
        return {
            'allowed': False,
            'reason': 'rate_limit_exceeded',
            'retry_after': remaining_time,
            'limit': max_requests,
            'remaining': 0
        }
    
    # Проверка временного окна
    if current_time - client_data['window_start'] > window_seconds:
        # Новое окно
        client_data['count'] = 1
        client_data['window_start'] = current_time
        client_data['blocked_until'] = 0
    else:
        # Увеличиваем счетчик
        client_data['count'] += 1
    
    remaining = max(0, max_requests - client_data['count'])
    
    # Проверка превышения лимита
    if client_data['count'] > max_requests:
        # Блокируем на 5 минут
        block_duration = 300
        client_data['blocked_until'] = current_time + block_duration
        
        return {
            'allowed': False,
            'reason': 'rate_limit_exceeded',
            'retry_after': block_duration,
            'limit': max_requests,
            'remaining': 0
        }
    
    # Запрос разрешен
    return {
        'allowed': True,
        'limit': max_requests,
        'remaining': remaining,
        'reset': int(client_data['window_start'] + window_seconds)
    }

def log_suspicious_activity(
    client_key: str,
    reason: str,
    event: Dict[str, Any]
):
    """Логирование подозрительной активности"""
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        
        headers = event.get('headers', {})
        user_agent = headers.get('User-Agent', headers.get('user-agent', 'unknown'))
        
        cursor.execute("""
            INSERT INTO security_logs 
            (event_type, client_key, reason, user_agent, created_at)
            VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
        """, ('rate_limit_violation', client_key, reason, user_agent))
        
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"Failed to log suspicious activity: {e}")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Обработчик rate limiting"""
    method = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        # Получаем ключ клиента
        client_key = get_client_key(event)
        
        # Определяем тип rate limit
        limit_type = get_rate_limit_type(event)
        
        # Проверяем, админ ли пользователь
        headers = event.get('headers', {})
        user_id = headers.get('X-User-Id') or headers.get('x-user-id')
        is_admin = False
        
        if user_id:
            try:
                dsn = os.environ.get('DATABASE_URL')
                conn = psycopg2.connect(dsn)
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_data = cursor.fetchone()
                is_admin = user_data and user_data['role'] == 'admin'
                cursor.close()
                conn.close()
            except:
                pass
        
        # Проверяем rate limit
        result = check_rate_limit(client_key, limit_type, is_admin)
        
        if not result['allowed']:
            # Логируем подозрительную активность
            log_suspicious_activity(
                client_key,
                f"Rate limit exceeded for {limit_type}",
                event
            )
            
            return {
                'statusCode': 429,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-RateLimit-Limit': str(result['limit']),
                    'X-RateLimit-Remaining': '0',
                    'Retry-After': str(result['retry_after'])
                },
                'body': json.dumps({
                    'error': 'Too many requests',
                    'message': f'Превышен лимит запросов. Попробуйте через {result["retry_after"]} секунд.',
                    'retry_after': result['retry_after']
                }),
                'isBase64Encoded': False
            }
        
        # GET запрос - возвращаем статистику
        if method == 'GET':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'X-RateLimit-Limit': str(result['limit']),
                    'X-RateLimit-Remaining': str(result['remaining']),
                    'X-RateLimit-Reset': str(result['reset'])
                },
                'body': json.dumps({
                    'success': True,
                    'rate_limit': {
                        'limit': result['limit'],
                        'remaining': result['remaining'],
                        'reset': result['reset']
                    }
                }),
                'isBase64Encoded': False
            }
        
        # POST запрос - проверка и пропуск
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-RateLimit-Limit': str(result['limit']),
                'X-RateLimit-Remaining': str(result['remaining']),
                'X-RateLimit-Reset': str(result['reset'])
            },
            'body': json.dumps({
                'success': True,
                'message': 'Request allowed'
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }
        return fix_cors_response(response, event, include_credentials=True)