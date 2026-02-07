'''
Авторизация и регистрация пользователей
'''

import json
import os
import hashlib
import secrets
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p32599880_plugin_site_developm'

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
    """Получить IP адрес клиента"""
    headers = event.get('headers', {})
    real_ip = headers.get('x-real-ip') or headers.get('X-Real-IP')
    if real_ip:
        return real_ip.strip()
    forwarded_for = headers.get('x-forwarded-for') or headers.get('X-Forwarded-For')
    if forwarded_for:
        return forwarded_for.split(',')[0].strip()
    return 'unknown'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Обработчик авторизации и регистрации"""
    method = event.get('httpMethod', 'POST')
    
    # CORS preflight
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Получаем подключение к БД
    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': f'Database connection error: {str(e)}'})
        }
    
    try:
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            # Регистрация
            if action == 'register':
                username = body_data.get('username', '').strip()
                email = body_data.get('email', '').strip()
                password = body_data.get('password', '')
                referral_code = body_data.get('referral_code', '').strip().upper()
                
                if not username or not email or not password:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заполните все поля'})
                    }
                
                password_hash = hash_password(password)
                client_ip = get_client_ip(event)
                
                # Проверка существующего пользователя
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE username = %s OR email = %s",
                    (username, email)
                )
                if cur.fetchone():
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Пользователь уже существует'})
                    }
                
                # Проверка реферального кода
                referrer_id = None
                if referral_code:
                    cur.execute(
                        f"SELECT user_id FROM {SCHEMA}.referral_codes WHERE code = %s AND is_active = TRUE",
                        (referral_code,)
                    )
                    referrer = cur.fetchone()
                    if referrer:
                        referrer_id = referrer['user_id']
                
                # Создание пользователя
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.users 
                    (username, email, password_hash, referred_by_code, last_ip) 
                    VALUES (%s, %s, %s, %s, %s) 
                    RETURNING id, username, email, avatar_url, role, forum_role, balance, 
                    created_at, referred_by_code, referral_bonus_claimed, vip_until""",
                    (username, email, password_hash, referral_code if referral_code else None, client_ip)
                )
                user = cur.fetchone()
                user_id = user['id']
                
                # Создание реферального кода для нового пользователя
                new_referral_code = generate_referral_code()
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referral_codes (user_id, code) VALUES (%s, %s)",
                    (user_id, new_referral_code)
                )
                
                # Если использовался реферальный код, создаем запись
                if referrer_id:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.referrals (referrer_id, referred_user_id, referral_code, status) VALUES (%s, %s, %s, 'pending')",
                        (referrer_id, user_id, referral_code)
                    )
                
                conn.commit()
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'user': dict(user)
                    }, default=str)
                }
            
            # Вход
            elif action == 'login':
                username = body_data.get('username', '').strip()
                password = body_data.get('password', '')
                
                if not username or not password:
                    return {
                        'statusCode': 400,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Заполните все поля'})
                    }
                
                password_hash = hash_password(password)
                client_ip = get_client_ip(event)
                
                # Поиск пользователя
                cur.execute(
                    f"""SELECT id, username, email, avatar_url, role, forum_role, is_blocked, 
                    balance, created_at, referred_by_code, referral_bonus_claimed, vip_until 
                    FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s""",
                    (username, password_hash)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Неверные данные'})
                    }
                
                if user.get('is_blocked'):
                    return {
                        'statusCode': 403,
                        'headers': {
                            'Content-Type': 'application/json',
                            'Access-Control-Allow-Origin': '*'
                        },
                        'body': json.dumps({'error': 'Аккаунт заблокирован'})
                    }
                
                # Обновляем активность
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP, last_ip = %s WHERE id = %s",
                    (client_ip, user['id'])
                )
                conn.commit()
                
                token = generate_token()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'token': token,
                        'user': dict(user)
                    }, default=str)
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Неизвестное действие'})
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        cur.close()
        conn.close()
