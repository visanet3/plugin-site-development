'''
Business: Регистрация и авторизация пользователей в каталоге плагинов
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с токеном и данными пользователя
'''

import json
import os
import hashlib
import secrets
import datetime
import urllib.request
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

SCHEMA = 't_p32599880_plugin_site_developm'

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("\\", "\\\\").replace("'", "''") + "'"

def send_telegram_notification(event_type: str, user_info: Dict, details: Dict):
    '''Send notification to admin via Telegram'''
    try:
        telegram_url = 'https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f'
        payload = {
            'event_type': event_type,
            'user_info': user_info,
            'details': details
        }
        requests.post(telegram_url, json=payload, timeout=5)
    except:
        pass

def get_db_connection():
    """Получить подключение к БД"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Генерация токена для сессии"""
    return secrets.token_urlsafe(32)

def generate_referral_code() -> str:
    """Генерация уникального реферального кода"""
    return secrets.token_urlsafe(8).upper().replace('-', '').replace('_', '')[:8]

def get_client_ip(event: Dict[str, Any]) -> str:
    """Получить IP адрес клиента из события"""
    headers = event.get('headers', {})
    
    # Check x-real-ip first (most reliable for proxied requests)
    real_ip = headers.get('x-real-ip') or headers.get('X-Real-IP')
    if real_ip:
        return real_ip.strip()
    
    # Check x-forwarded-for (split by comma, take first)
    forwarded_for = headers.get('x-forwarded-for') or headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    
    # Fallback to requestContext.identity.sourceIp
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    source_ip = identity.get('sourceIp')
    if source_ip:
        return source_ip.strip()
    
    return 'unknown'

def get_real_btc_price() -> float:
    """Получить реальную цену BTC с Binance API"""
    try:
        # Пробуем Binance API (наиболее надёжный источник)
        with urllib.request.urlopen('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', timeout=5) as response:
            data = json.loads(response.read().decode())
            real_price = float(data['price'])
            return real_price + 1000
    except Exception as e:
        print(f'Error fetching BTC price from Binance: {e}')
        # Fallback на Coinbase API
        try:
            with urllib.request.urlopen('https://api.coinbase.com/v2/prices/BTC-USD/spot', timeout=5) as response:
                data = json.loads(response.read().decode())
                real_price = float(data['data']['amount'])
                return real_price + 1000
        except Exception as e2:
            print(f'Error fetching BTC price from Coinbase: {e2}')
            return 0

def validate_btc_price(client_price: float, tolerance_percent: float = 2.0) -> bool:
    """Валидация цены BTC от клиента с допустимым отклонением"""
    real_price = get_real_btc_price()
    if real_price == 0:
        return False
    
    lower_bound = real_price * (1 - tolerance_percent / 100)
    upper_bound = real_price * (1 + tolerance_percent / 100)
    
    return lower_bound <= client_price <= upper_bound

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'transactions':
                headers = event.get('headers', {})
                user_id = headers.get('X-User-Id') or headers.get('x-user-id')
                
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация'}),
                        'isBase64Encoded': False
                    }
                
                limit = int(params.get('limit', 50))
                offset = int(params.get('offset', 0))
                
                cur.execute(
                    f"SELECT id, amount, type, description, created_at FROM {SCHEMA}.transactions WHERE user_id = {int(user_id)} ORDER BY created_at DESC LIMIT {limit} OFFSET {offset}"
                )
                transactions = cur.fetchall()
                
                cur.execute(
                    f"SELECT COUNT(*) as total FROM {SCHEMA}.transactions WHERE user_id = {int(user_id)}"
                )
                total = cur.fetchone()['total']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'transactions': [dict(t) for t in transactions],
                        'total': total
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
        
        if method != 'POST':
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        # Get client IP for registration and login
        client_ip = get_client_ip(event)
        
        # Регистрация
        if action == 'register':
            username_raw = body_data.get('username')
            email_raw = body_data.get('email')
            password = body_data.get('password', '')
            referral_code_raw = body_data.get('referral_code')
            
            username = str(username_raw).strip() if username_raw else ''
            email = str(email_raw).strip() if email_raw else ''
            referral_code = str(referral_code_raw).strip().upper() if referral_code_raw else ''
            
            if not username or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            # Проверка существующего пользователя
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE username = {escape_sql_string(username)} OR email = {escape_sql_string(email)}"
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь уже существует'}),
                    'isBase64Encoded': False
                }
            
            # Проверка реферального кода
            referrer_id = None
            if referral_code:
                cur.execute(
                    f"SELECT user_id FROM {SCHEMA}.referral_codes WHERE code = {escape_sql_string(referral_code)} AND is_active = TRUE"
                )
                referrer = cur.fetchone()
                if referrer:
                    referrer_id = referrer['user_id']
            
            # Создание пользователя
            referred_by_value = escape_sql_string(referral_code) if referral_code else 'NULL'
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, referred_by_code, last_ip) VALUES ({escape_sql_string(username)}, {escape_sql_string(email)}, {escape_sql_string(password_hash)}, {referred_by_value}, {escape_sql_string(client_ip)}) RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until"
            )
            user = cur.fetchone()
            user_id = user['id']
            
            # Создание реферального кода для нового пользователя
            new_referral_code = generate_referral_code()
            max_attempts = 10
            for attempt in range(max_attempts):
                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.referral_codes (user_id, code) VALUES ({user_id}, {escape_sql_string(new_referral_code)})"
                    )
                    break
                except psycopg2.errors.UniqueViolation:
                    if attempt == max_attempts - 1:
                        raise
                    conn.rollback()
                    cur = conn.cursor()
                    new_referral_code = generate_referral_code()
            
            # Если использовался реферальный код, создаем запись в referrals
            referrer_username = None
            if referrer_id:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referrals (referrer_id, referred_user_id, referral_code, status) VALUES ({referrer_id}, {user_id}, {escape_sql_string(referral_code)}, 'pending')"
                )
                # Получаем имя реферера для уведомления
                cur.execute(
                    f"SELECT username FROM {SCHEMA}.users WHERE id = {referrer_id}"
                )
                referrer_data = cur.fetchone()
                referrer_username = referrer_data['username'] if referrer_data else None
            
            conn.commit()
            
            # Send Telegram notification to admin
            if referrer_username:
                send_telegram_notification(
                    'user_registration_referral',
                    {'username': username, 'user_id': user_id},
                    {'email': email, 'referrer_username': referrer_username, 'referral_code': referral_code}
                )
            else:
                send_telegram_notification(
                    'user_registration',
                    {'username': username, 'user_id': user_id},
                    {'email': email}
                )
            
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user': dict(user)
                }, default=str),
                'isBase64Encoded': False
            }
        
        # Вход
        elif action == 'login':
            username = body_data.get('username', '').strip()
            password = body_data.get('password', '')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(password)
            
            cur.execute(
                f"SELECT id, username, email, avatar_url, role, forum_role, is_blocked, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until, last_ip FROM {SCHEMA}.users WHERE username = {escape_sql_string(username)} AND password_hash = {escape_sql_string(password_hash)}"
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверные данные'}),
                    'isBase64Encoded': False
                }
            
            if user.get('is_blocked'):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Аккаунт заблокирован'}),
                    'isBase64Encoded': False
                }
            
            # Update last login and IP
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP, last_ip = {escape_sql_string(client_ip)} WHERE id = {user['id']}")
            conn.commit()
            
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'token': token,
                    'user': dict(user)
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'update_activity':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            # Update activity and IP
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP, last_ip = {escape_sql_string(client_ip)} WHERE id = {int(user_id)}")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'check_referral':
            referral_code = body_data.get('referral_code', '').strip().upper()
            
            if not referral_code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'valid': False, 'error': 'Код не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT rc.user_id, u.username FROM {SCHEMA}.referral_codes rc JOIN {SCHEMA}.users u ON rc.user_id = u.id WHERE rc.code = {escape_sql_string(referral_code)} AND rc.is_active = TRUE"
            )
            result = cur.fetchone()
            
            if result:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'valid': True,
                        'referrer': result['username']
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'valid': False,
                        'error': 'Неверный код'
                    }),
                    'isBase64Encoded': False
                }
        
        elif action == 'update_profile':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            avatar_url = body_data.get('avatar_url')
            
            if avatar_url:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET avatar_url = {escape_sql_string(avatar_url)} WHERE id = {int(user_id)}"
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Нет данных для обновления'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
