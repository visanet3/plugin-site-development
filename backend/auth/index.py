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
                    "SELECT id, amount, type, description, created_at FROM transactions WHERE user_id = %s ORDER BY created_at DESC LIMIT %s OFFSET %s",
                    (int(user_id), limit, offset)
                )
                transactions = cur.fetchall()
                
                cur.execute(
                    "SELECT COUNT(*) as total FROM transactions WHERE user_id = %s",
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
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь уже существует'}),
                    'isBase64Encoded': False
                }
            
            # Создание пользователя
            cur.execute(
                "INSERT INTO users (username, email, password_hash) VALUES (%s, %s, %s) RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at",
                (username, email, password_hash)
            )
            user = cur.fetchone()
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
                "SELECT id, username, email, avatar_url, role, forum_role, is_blocked, balance, created_at FROM users WHERE username = %s AND password_hash = %s",
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
            
            cur.execute("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = %s", (user['id'],))
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
            
            cur.execute("UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = %s", (user_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
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
                "UPDATE users SET balance = COALESCE(balance, 0) + %s WHERE id = %s RETURNING balance",
                (float(amount), int(user_id))
            )
            result = cur.fetchone()
            
            cur.execute(
                "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (int(user_id), float(amount), transaction_type, description)
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
            import boto3
            
            try:
                image_data = base64.b64decode(image_base64.split(',')[1] if ',' in image_base64 else image_base64)
                
                s3_client = boto3.client('s3',
                    endpoint_url='https://storage.yandexcloud.net',
                    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
                    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
                    region_name='ru-central1'
                )
                
                file_extension = 'jpg'
                if image_base64.startswith('data:image/png'):
                    file_extension = 'png'
                elif image_base64.startswith('data:image/webp'):
                    file_extension = 'webp'
                
                file_name = f'avatars/{user_id}_{uuid.uuid4()}.{file_extension}'
                bucket_name = os.environ.get('S3_BUCKET_NAME', 'poehali-dev')
                
                s3_client.put_object(
                    Bucket=bucket_name,
                    Key=file_name,
                    Body=image_data,
                    ContentType=f'image/{file_extension}'
                )
                
                avatar_url = f'https://storage.yandexcloud.net/{bucket_name}/{file_name}'
                
                cur.execute("UPDATE users SET avatar_url = %s WHERE id = %s", (avatar_url, user_id))
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
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка загрузки: {str(e)}'}),
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
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user or user['balance'] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "UPDATE users SET balance = balance - %s WHERE id = %s RETURNING balance",
                (float(amount), int(user_id))
            )
            result = cur.fetchone()
            
            cur.execute(
                "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
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
                    "UPDATE users SET balance = balance + %s WHERE id = %s RETURNING balance",
                    (float(amount), int(user_id))
                )
                result = cur.fetchone()
                
                cur.execute(
                    "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
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
                cur.execute("SELECT balance FROM users WHERE id = %s", (int(user_id),))
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
                "SELECT id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at FROM lottery_rounds WHERE status IN ('active', 'drawing') ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    "INSERT INTO lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at"
                )
                round_data = cur.fetchone()
                conn.commit()
            
            round_id = round_data['id']
            
            cur.execute(
                "SELECT id, user_id, username, ticket_number, purchased_at FROM lottery_tickets WHERE round_id = %s ORDER BY ticket_number",
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
            
            cur.execute("SELECT id, username, balance FROM users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user or user['balance'] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT id, status, total_tickets FROM lottery_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    "INSERT INTO lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets"
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
                "INSERT INTO lottery_tickets (round_id, user_id, username, ticket_number) VALUES (%s, %s, %s, %s)",
                (round_id, int(user_id), user['username'], ticket_number)
            )
            
            cur.execute(
                "UPDATE lottery_rounds SET total_tickets = total_tickets + 1, prize_pool = prize_pool + %s WHERE id = %s",
                (float(amount), round_id)
            )
            
            cur.execute(
                "SELECT total_tickets FROM lottery_rounds WHERE id = %s",
                (round_id,)
            )
            updated_round = cur.fetchone()
            
            if updated_round['total_tickets'] >= 10:
                import datetime
                draw_time = datetime.datetime.now() + datetime.timedelta(minutes=1)
                cur.execute(
                    "UPDATE lottery_rounds SET status = 'drawing', draw_time = %s WHERE id = %s",
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
                "SELECT id, user_id, username, message, created_at FROM lottery_chat ORDER BY created_at DESC LIMIT 100"
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
            
            cur.execute("SELECT username FROM users WHERE id = %s", (int(user_id),))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "INSERT INTO lottery_chat (user_id, username, message) VALUES (%s, %s, %s)",
                (int(user_id), user['username'], message)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'check_lottery_draw':
            import random
            
            cur.execute(
                "SELECT id, draw_time FROM lottery_rounds WHERE status = 'drawing' AND draw_time <= CURRENT_TIMESTAMP"
            )
            rounds_to_draw = cur.fetchall()
            
            for round_data in rounds_to_draw:
                round_id = round_data['id']
                
                cur.execute(
                    "SELECT id, user_id, username, ticket_number FROM lottery_tickets WHERE round_id = %s",
                    (round_id,)
                )
                tickets = cur.fetchall()
                
                if not tickets:
                    cur.execute(
                        "UPDATE lottery_rounds SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (round_id,)
                    )
                    continue
                
                winning_ticket = random.choice(tickets)
                
                cur.execute(
                    "UPDATE lottery_rounds SET status = 'completed', winner_ticket_number = %s, winner_user_id = %s, winner_username = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
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
                
                cur.execute(
                    "INSERT INTO lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0)"
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