'''
Функция авторизации и регистрации пользователей
'''

import json
import os
import psycopg2
from datetime import datetime
import secrets
import hashlib

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def hash_password(password):
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token():
    """Генерация токена авторизации"""
    return secrets.token_urlsafe(32)

def handler(event, context):
    """Обработчик авторизации и регистрации"""
    
    method = event.get('httpMethod', 'POST')
    
    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
        'Content-Type': 'application/json'
    }
    
    # OPTIONS для CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    # Парсим тело запроса
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'login')
    except:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Некорректный JSON'}),
            'isBase64Encoded': False
        }
    
    # Подключаемся к БД
    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Ошибка БД: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        if action == 'register':
            # Регистрация
            username = body.get('username')
            password = body.get('password')
            email = body.get('email')
            referral_code_input = body.get('referral_code')
            
            if not username or not password or not email:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем существование пользователя
            cur.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пользователь уже существует'}),
                    'isBase64Encoded': False
                }
            
            # Хешируем пароль
            password_hash = hash_password(password)
            
            # Создаем пользователя
            cur.execute(
                """INSERT INTO users 
                (username, password_hash, email, created_at) 
                VALUES (%s, %s, %s, %s) 
                RETURNING id, username, email, balance""",
                (username, password_hash, email, datetime.now())
            )
            user = cur.fetchone()
            user_id = user[0]
            
            # Создаем реферальный код для нового пользователя
            user_ref_code = secrets.token_urlsafe(8)
            cur.execute(
                "INSERT INTO referral_codes (user_id, code) VALUES (%s, %s)",
                (user_id, user_ref_code)
            )
            
            # Если был указан реферальный код, привязываем
            if referral_code_input:
                cur.execute(
                    "UPDATE users SET referred_by_code = %s WHERE id = %s",
                    (referral_code_input, user_id)
                )
            
            conn.commit()
            
            # Генерируем токен
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'token': token,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'balance': float(user[3]),
                        'referral_code': user_ref_code
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            # Вход
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            # Хешируем пароль для сравнения
            password_hash = hash_password(password)
            print(f"[AUTH] Login attempt for user: {username}")
            
            # Получаем пользователя
            cur.execute(
                """SELECT u.id, u.username, u.email, u.balance, rc.code, u.is_blocked, u.block_reason
                FROM users u
                LEFT JOIN referral_codes rc ON rc.user_id = u.id AND rc.is_active = true
                WHERE u.username = %s AND u.password_hash = %s
                LIMIT 1""",
                (username, password_hash)
            )
            user = cur.fetchone()
            print(f"[AUTH] User found: {user is not None}, is_blocked: {user[5] if user else 'N/A'}")
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Неверный логин или пароль'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем блокировку
            if user[5] is True:  # is_blocked — явная проверка на True
                block_reason = user[6] or 'Ваш аккаунт заблокирован администратором'
                print(f"[AUTH] User {username} is BLOCKED: {block_reason}")
                return {
                    'statusCode': 403,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f'Аккаунт заблокирован: {block_reason}'}),
                    'isBase64Encoded': False
                }
            
            print(f"[AUTH] User {username} login SUCCESS")
            
            # Генерируем токен
            token = generate_token()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'token': token,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'balance': float(user[3]),
                        'referral_code': user[4] or ''
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_user':
            # Получение данных пользователя по ID
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id') or body.get('user_id')
            print(f"[AUTH] get_user request, user_id: {user_id}, headers: {event.get('headers', {})}")
            
            if not user_id:
                print(f"[AUTH] get_user ERROR: User ID не указан")
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'User ID не указан'}),
                    'isBase64Encoded': False
                }
            
            # Получаем пользователя по ID
            cur.execute(
                """SELECT u.id, u.username, u.email, u.balance, rc.code, u.is_blocked, u.block_reason
                FROM users u
                LEFT JOIN referral_codes rc ON rc.user_id = u.id AND rc.is_active = true
                WHERE u.id = %s
                LIMIT 1""",
                (user_id,)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'balance': float(user[3]),
                        'referral_code': user[4] or '',
                        'is_blocked': user[5] or False
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()