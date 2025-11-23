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
from typing import Dict, Any, Optional
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
                    f"SELECT id, amount, type, description, created_at FROM {SCHEMA}.transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
                    (int(user_id), limit, offset)
                )
                transactions = cur.fetchall()
                
                cur.execute(
                    f"SELECT COUNT(*) as total FROM {SCHEMA}.transactions WHERE user_id = %s",
                    (int(user_id),)
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
        
        # Регистрация
        if action == 'register':
            username = body_data.get('username', '').strip()
            email = body_data.get('email', '').strip()
            password = body_data.get('password', '')
            referral_code = body_data.get('referral_code', '').strip().upper()
            
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
                f"SELECT id FROM {SCHEMA}.users WHERE username = %s OR email = %s",
                (username, email)
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
                    f"SELECT user_id FROM {SCHEMA}.referral_codes WHERE code = %s AND is_active = TRUE",
                    (referral_code,)
                )
                referrer = cur.fetchone()
                if referrer:
                    referrer_id = referrer['user_id']
            
            # Создание пользователя
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, referred_by_code) VALUES (%s, %s, %s, %s) RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at",
                (username, email, password_hash, referral_code if referral_code else None)
            )
            user = cur.fetchone()
            user_id = user['id']
            
            # Создание реферального кода для нового пользователя
            new_user_code = generate_referral_code()
            while True:
                try:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.referral_codes (user_id, code) VALUES (%s, %s)",
                        (user_id, new_user_code)
                    )
                    break
                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    new_user_code = generate_referral_code()
            
            # Если использовался реферальный код, создаем запись в referrals
            if referrer_id:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referrals (referrer_id, referred_user_id, referral_code, status) VALUES (%s, %s, %s, 'pending')",
                    (referrer_id, user_id, referral_code)
                )
            
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
                f"SELECT id, username, email, avatar_url, role, forum_role, is_blocked, balance, created_at FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
                (username, password_hash)
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
            
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
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
            
            cur.execute(f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = %s", (user_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_user':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT id, username, email, avatar_url, role, forum_role, balance, created_at FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': dict(user)
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'get_balance':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            result = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'balance': float(result['balance']) if result and result['balance'] else 0
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'topup_balance':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            amount = body_data.get('amount')
            transaction_type = body_data.get('type', 'topup')
            description = body_data.get('description', 'Пополнение баланса')
            
            if not amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректная сумма'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = COALESCE(balance, 0) + %s WHERE id = %s RETURNING balance",
                (float(amount), int(user_id))
            )
            result = cur.fetchone()
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (int(user_id), float(amount), transaction_type, description)
            )
            
            cur.execute(
                f"SELECT id, total_deposited FROM {SCHEMA}.referrals WHERE referred_user_id = %s AND status = 'pending'",
                (int(user_id),)
            )
            referral_data = cur.fetchone()
            
            if referral_data and transaction_type == 'topup':
                new_total = float(referral_data['total_deposited']) + float(amount)
                cur.execute(
                    f"UPDATE {SCHEMA}.referrals SET total_deposited = %s WHERE id = %s",
                    (new_total, referral_data['id'])
                )
                
                if new_total >= 100:
                    cur.execute(
                        f"UPDATE {SCHEMA}.referrals SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (referral_data['id'],)
                    )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'new_balance': float(result['balance']) if result else 0
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset_password':
            email = body_data.get('email', '').strip()
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT id, username FROM {SCHEMA}.users WHERE email = %s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь с таким email не найден'}),
                    'isBase64Encoded': False
                }
            
            new_password = secrets.token_urlsafe(12)
            password_hash = hash_password(new_password)
            
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s", (password_hash, user['id']))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': f'Новый пароль: {new_password}. Сохраните его в безопасном месте.',
                    'new_password': new_password
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'upload_avatar':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            image_base64 = body_data.get('image')
            
            if not image_base64:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Изображение не предоставлено'}),
                    'isBase64Encoded': False
                }
            
            import base64
            import uuid
            
            try:
                aws_key = os.environ.get('AWS_ACCESS_KEY_ID')
                aws_secret = os.environ.get('AWS_SECRET_ACCESS_KEY')
                bucket_name = os.environ.get('S3_BUCKET_NAME', 'poehali-dev')
                
                if not aws_key or not aws_secret:
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'AWS секреты не настроены'}),
                        'isBase64Encoded': False
                    }
                
                import boto3
                
                image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
                
                s3_client = boto3.client('s3',
                    endpoint_url='https://storage.yandexcloud.net',
                    aws_access_key_id=aws_key,
                    aws_secret_access_key=aws_secret,
                    region_name='ru-central1'
                )
                
                file_extension = 'jpg'
                if image_base64.startswith('data:image/png'):
                    file_extension = 'png'
                elif image_base64.startswith('data:image/webp'):
                    file_extension = 'webp'
                
                file_name = f'avatars/{user_id}_{uuid.uuid4()}.{file_extension}'
                
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=file_name,
                    Body=image_data,
                    ContentType=f'image/{file_extension}'
                )
                
                avatar_url = f'https://storage.yandexcloud.net/{bucket_name}/{file_name}'
                
                cur.execute(f"UPDATE {SCHEMA}.users SET avatar_url = %s WHERE id = %s", (avatar_url, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'avatar_url': avatar_url
                    }),
                    'isBase64Encoded': False
                }
            
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Ошибка загрузки: {str(e)}',
                        'details': error_details
                    }),
                    'isBase64Encoded': False
                }
        
        elif action == 'place_bet':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            amount = body_data.get('amount')
            game_type = body_data.get('game_type', 'unknown')
            
            if not amount or amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Некорректная сумма ставки'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user or user['balance'] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s RETURNING balance",
                (float(amount), int(user_id))
            )
            result = cur.fetchone()
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (int(user_id), -float(amount), 'bet', f'Ставка в игре {game_type}')
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'new_balance': float(result['balance']) if result else 0
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'complete_game':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            won = body_data.get('won', False)
            amount = body_data.get('amount', 0)
            game_type = body_data.get('game_type', 'unknown')
            
            if won and amount > 0:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s RETURNING balance",
                    (float(amount), int(user_id))
                )
                result = cur.fetchone()
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                    (int(user_id), float(amount), 'win', f'Выигрыш в игре {game_type}')
                )
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'new_balance': float(result['balance']) if result else 0
                    }),
                    'isBase64Encoded': False
                }
            else:
                cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
                user = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'new_balance': float(user['balance']) if user else 0
                    }),
                    'isBase64Encoded': False
                }
        
        elif action == 'get_lottery':
            cur.execute(
                "SELECT id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at FROM {SCHEMA}.lottery_rounds WHERE status IN ('active', 'drawing') ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    "INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at"
                )
                round_data = cur.fetchone()
                conn.commit()
            
            round_id = round_data['id']
            
            cur.execute(
                "SELECT id, user_id, username, ticket_number, purchased_at FROM {SCHEMA}.lottery_tickets WHERE round_id = %s ORDER BY ticket_number",
                (round_id,)
            )
            tickets = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'round': dict(round_data),
                    'tickets': [dict(t) for t in tickets]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'buy_lottery_ticket':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            amount = body_data.get('amount', 50)
            
            cur.execute(f"SELECT id, username, balance FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user or user['balance'] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, status, total_tickets FROM {SCHEMA}.lottery_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    "INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets"
                )
                round_data = cur.fetchone()
                conn.commit()
            
            if round_data['total_tickets'] >= 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Все билеты проданы'}),
                    'isBase64Encoded': False
                }
            
            round_id = round_data['id']
            ticket_number = round_data['total_tickets'] + 1
            
            cur.execute(
                "UPDATE users SET balance = balance - %s WHERE id = %s",
                (float(amount), int(user_id))
            )
            
            cur.execute(
                "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (int(user_id), -float(amount), 'lottery_ticket', f'Покупка билета #{ticket_number} в лотерею')
            )
            
            cur.execute(
                "INSERT INTO {SCHEMA}.lottery_tickets (round_id, user_id, username, ticket_number) VALUES (%s, %s, %s, %s)",
                (round_id, int(user_id), user['username'], ticket_number)
            )
            
            cur.execute(
                "UPDATE {SCHEMA}.lottery_rounds SET total_tickets = total_tickets + 1, prize_pool = prize_pool + %s WHERE id = %s",
                (float(amount), round_id)
            )
            
            cur.execute(
                "SELECT total_tickets FROM {SCHEMA}.lottery_rounds WHERE id = %s",
                (round_id,)
            )
            updated_round = cur.fetchone()
            
            if updated_round['total_tickets'] >= 10:
                import datetime
                draw_time = datetime.datetime.now() + datetime.timedelta(minutes=1)
                cur.execute(
                    "UPDATE {SCHEMA}.lottery_rounds SET status = 'drawing', draw_time = %s WHERE id = %s",
                    (draw_time, round_id)
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'ticket_number': ticket_number
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery_chat':
            cur.execute(
                "SELECT id, user_id, username, message, created_at FROM {SCHEMA}.lottery_chat ORDER BY created_at DESC LIMIT 100"
            )
            messages = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'messages': [dict(m) for m in reversed(messages)]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'send_lottery_chat':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            message = body_data.get('message', '').strip()
            
            if not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Сообщение не может быть пустым'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO {SCHEMA}.lottery_chat (user_id, username, message) VALUES (%s, %s, %s)",
                (int(user_id), user['username'], message)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery_notifications':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, round_id, message, is_read, created_at FROM {SCHEMA}.lottery_notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
                (int(user_id),)
            )
            notifications = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'notifications': [dict(n) for n in notifications]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'mark_notifications_read':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE {SCHEMA}.lottery_notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
                (int(user_id),)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'clear_lottery_data':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user or user.get('role') != 'admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("DELETE FROM {SCHEMA}.lottery_chat")
            cur.execute("DELETE FROM {SCHEMA}.lottery_rounds WHERE status = 'completed'")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'История чата и победителей очищена'}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery_history':
            cur.execute(
                "SELECT id, status, total_tickets, prize_pool, winner_ticket_number, winner_user_id, winner_username, created_at, completed_at FROM {SCHEMA}.lottery_rounds WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 20"
            )
            history = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'history': [dict(h) for h in history]
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'check_lottery_draw':
            import random
            
            cur.execute(
                "SELECT id, draw_time FROM {SCHEMA}.lottery_rounds WHERE status = 'drawing' AND draw_time <= CURRENT_TIMESTAMP"
            )
            rounds_to_draw = cur.fetchall()
            
            for round_data in rounds_to_draw:
                round_id = round_data['id']
                
                cur.execute(
                    "SELECT id, user_id, username, ticket_number FROM {SCHEMA}.lottery_tickets WHERE round_id = %s",
                    (round_id,)
                )
                tickets = cur.fetchall()
                
                if not tickets:
                    cur.execute(
                        "UPDATE {SCHEMA}.lottery_rounds SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (round_id,)
                    )
                    continue
                
                winning_ticket = random.choice(tickets)
                
                cur.execute(
                    "UPDATE {SCHEMA}.lottery_rounds SET status = 'completed', winner_ticket_number = %s, winner_user_id = %s, winner_username = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (winning_ticket['ticket_number'], winning_ticket['user_id'], winning_ticket['username'], round_id)
                )
                
                cur.execute(
                    "UPDATE users SET balance = balance + %s WHERE id = %s",
                    (400, winning_ticket['user_id'])
                )
                
                ticket_num = winning_ticket['ticket_number']
                cur.execute(
                    "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                    (winning_ticket['user_id'], 400, 'lottery_win', f'Выигрыш в лотерее (билет #{ticket_num})')
                )
                
                winner_message = f'🎉 Поздравляем! Вы выиграли 400 USDT в лотерее! Выигрышный билет #{ticket_num}'
                for ticket in tickets:
                    if ticket['user_id'] == winning_ticket['user_id']:
                        message = winner_message
                    else:
                        message = f'Розыгрыш завершен. Победитель: {winning_ticket["username"]} (билет #{ticket_num}). Удачи в следующий раз!'
                    
                    cur.execute(
                        "INSERT INTO {SCHEMA}.lottery_notifications (user_id, round_id, message) VALUES (%s, %s, %s)",
                        (ticket['user_id'], round_id, message)
                    )
                
                cur.execute(
                    "INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0)"
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'processed_rounds': len(rounds_to_draw)
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_referral_info':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT code FROM {SCHEMA}.referral_codes WHERE user_id = %s AND is_active = TRUE",
                (int(user_id),)
            )
            code_data = cur.fetchone()
            referral_code = code_data['code'] if code_data else None
            
            cur.execute(
                f"""SELECT 
                    r.id, r.status, r.total_deposited, r.created_at, r.completed_at,
                    u.username as referred_username
                FROM {SCHEMA}.referrals r
                LEFT JOIN {SCHEMA}.users u ON r.referred_user_id = u.id
                WHERE r.referrer_id = %s
                ORDER BY r.created_at DESC""",
                (int(user_id),)
            )
            referrals = cur.fetchall()
            
            completed_count = sum(1 for r in referrals if r['status'] == 'completed')
            pending_count = sum(1 for r in referrals if r['status'] == 'pending')
            total_earned = completed_count // 10 * 250
            
            cur.execute(
                f"SELECT SUM(amount) as total_rewards FROM {SCHEMA}.referral_rewards WHERE referrer_id = %s",
                (int(user_id),)
            )
            rewards_data = cur.fetchone()
            total_rewards = float(rewards_data['total_rewards']) if rewards_data and rewards_data['total_rewards'] else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'referral_code': referral_code,
                    'referrals': [dict(r) for r in referrals],
                    'stats': {
                        'total_referrals': len(referrals),
                        'completed': completed_count,
                        'pending': pending_count,
                        'can_claim': completed_count >= 10 and (completed_count // 10) * 10 > (int(total_rewards / 250) * 10),
                        'total_earned': total_earned,
                        'total_claimed': total_rewards
                    }
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'claim_referral_reward':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT COUNT(*) as completed FROM {SCHEMA}.referrals WHERE referrer_id = %s AND status = 'completed'",
                (int(user_id),)
            )
            completed_data = cur.fetchone()
            completed_count = completed_data['completed']
            
            if completed_count < 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно завершенных рефералов'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT COALESCE(SUM(amount), 0) as total_rewards FROM {SCHEMA}.referral_rewards WHERE referrer_id = %s",
                (int(user_id),)
            )
            rewards_data = cur.fetchone()
            total_claimed = float(rewards_data['total_rewards']) if rewards_data['total_rewards'] else 0
            
            available_rewards = (completed_count // 10) * 250
            already_claimed_count = int(total_claimed / 250)
            
            if completed_count // 10 <= already_claimed_count:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Нет доступных наград для получения'}),
                    'isBase64Encoded': False
                }
            
            reward_amount = 250
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                (reward_amount, int(user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.referral_rewards (referrer_id, amount, referrals_count) VALUES (%s, %s, %s)",
                (int(user_id), reward_amount, 10)
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'referral_reward', 'Реферальная награда за 10 пользователей')",
                (int(user_id), reward_amount)
            )
            
            conn.commit()
            
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            user_data = cur.fetchone()
            new_balance = float(user_data['balance']) if user_data else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'reward_amount': reward_amount,
                    'new_balance': new_balance
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()