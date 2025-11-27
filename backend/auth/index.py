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
            username_raw = body_data.get('username')
            email_raw = body_data.get('email')
            password = body_data.get('password', '')
            referral_code_raw = body_data.get('referral_code')
            
            username = str(username_raw).strip() if username_raw else ''
            email = str(email_raw).strip() if email_raw else ''
            referral_code = str(referral_code_raw).strip().upper() if referral_code_raw else ''
            
            print(f"DEBUG register: username='{username}' email='{email}' password='{password}' username_raw={username_raw} email_raw={email_raw}")
            
            if not username or not email or not password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Заполните все поля (username={bool(username)}, email={bool(email)}, password={bool(password)})'}),
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
            
            # Проверка email верификации
            cur.execute(
                f"SELECT verified FROM {SCHEMA}.email_verifications WHERE email = %s AND verified = TRUE ORDER BY created_at DESC LIMIT 1",
                (email.lower(),)
            )
            verification = cur.fetchone()
            if not verification:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email не подтверждён. Пожалуйста, подтвердите email.'}),
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
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, referred_by_code) VALUES (%s, %s, %s, %s) RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until",
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
            referrer_username = None
            if referrer_id:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referrals (referrer_id, referred_user_id, referral_code, status) VALUES (%s, %s, %s, 'pending')",
                    (referrer_id, user_id, referral_code)
                )
                # Получаем имя реферера для уведомления
                cur.execute(
                    f"SELECT username FROM {SCHEMA}.users WHERE id = %s",
                    (referrer_id,)
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
                f"SELECT id, username, email, avatar_url, role, forum_role, is_blocked, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
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
            
            cur.execute(f"SELECT id, username, email, avatar_url, role, forum_role, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until FROM {SCHEMA}.users WHERE id = %s", (user_id,))
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
        
        elif action == 'search_user':
            username = body_data.get('username', '').strip()
            
            if not username:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Username required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT id, username, avatar_url FROM {SCHEMA}.users WHERE LOWER(username) = LOWER(%s) AND is_blocked = FALSE",
                (username,)
            )
            user = cur.fetchone()
            
            if user:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'user': dict(user)
                    }, default=str),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'User not found'}),
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
            
            if referral_data and float(amount) > 0 and transaction_type in ('topup', 'admin_topup', 'win', 'lottery_win', 'referral_reward', 'referral_bonus'):
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
            
            try:
                # Сохраняем base64 изображение напрямую в БД
                cur.execute(f"UPDATE {SCHEMA}.users SET avatar_url = %s WHERE id = %s", (image_base64, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'avatar_url': image_base64
                    }),
                    'isBase64Encoded': False
                }
            except Exception as upload_error:
                conn.rollback()
                print(f'Avatar upload error: {str(upload_error)}')
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка сохранения: {str(upload_error)}'}),
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
            is_draw = body_data.get('is_draw', False)
            bet_amount = body_data.get('bet_amount', 0)
            
            cur.execute(
                f"SELECT username FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            username = user_data['username'] if user_data else 'Unknown'
            
            if amount > 0 and (won or is_draw):
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s RETURNING balance",
                    (float(amount), int(user_id))
                )
                result = cur.fetchone()
                
                if is_draw:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                        (int(user_id), float(amount), 'draw', f'Ничья в игре {game_type} - возврат ставки')
                    )
                    
                    try:
                        notify_payload = {
                            'event_type': 'game_draw',
                            'user_info': {'username': username, 'user_id': user_id},
                            'details': {'game': game_type, 'bet_amount': bet_amount, 'returned_amount': amount}
                        }
                        requests.post('https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f', json=notify_payload, timeout=5)
                    except:
                        pass
                else:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                        (int(user_id), float(amount), 'win', f'Выигрыш в игре {game_type}')
                    )
                    
                    try:
                        notify_payload = {
                            'event_type': 'game_win',
                            'user_info': {'username': username, 'user_id': user_id},
                            'details': {'game': game_type, 'bet_amount': bet_amount, 'win_amount': amount}
                        }
                        requests.post('https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f', json=notify_payload, timeout=5)
                    except:
                        pass
                
                if won:
                    cur.execute(
                        f"SELECT username, avatar_url FROM {SCHEMA}.users WHERE id = %s",
                        (int(user_id),)
                    )
                    user_info = cur.fetchone()
                    
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.casino_wins (user_id, username, avatar_url, amount, game) VALUES (%s, %s, %s, %s, %s)",
                        (int(user_id), user_info['username'], user_info.get('avatar_url'), float(amount), game_type)
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
                
                try:
                    notify_payload = {
                        'event_type': 'game_loss',
                        'user_info': {'username': username, 'user_id': user_id},
                        'details': {'game': game_type, 'bet_amount': bet_amount}
                    }
                    requests.post('https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f', json=notify_payload, timeout=5)
                except:
                    pass
                
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
                f"SELECT id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at FROM {SCHEMA}.lottery_rounds WHERE status IN ('active', 'drawing') ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at"
                )
                round_data = cur.fetchone()
                conn.commit()
            
            round_id = round_data['id']
            
            cur.execute(
                f"SELECT id, user_id, username, ticket_number, purchased_at FROM {SCHEMA}.lottery_tickets WHERE round_id = %s ORDER BY ticket_number",
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
                f"SELECT id, status, total_tickets FROM {SCHEMA}.lottery_rounds WHERE status = 'active' ORDER BY id DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0) RETURNING id, status, total_tickets"
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
                f"UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s",
                (float(amount), int(user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                (int(user_id), -float(amount), 'lottery_ticket', f'Покупка билета #{ticket_number} в лотерею')
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.lottery_tickets (round_id, user_id, username, ticket_number) VALUES (%s, %s, %s, %s)",
                (round_id, int(user_id), user['username'], ticket_number)
            )
            
            cur.execute(
                f"UPDATE {SCHEMA}.lottery_rounds SET total_tickets = total_tickets + 1, prize_pool = prize_pool + %s WHERE id = %s",
                (float(amount), round_id)
            )
            
            cur.execute(
                f"SELECT total_tickets FROM {SCHEMA}.lottery_rounds WHERE id = %s",
                (round_id,)
            )
            updated_round = cur.fetchone()
            
            if updated_round['total_tickets'] >= 10:
                import datetime
                draw_time = datetime.datetime.now() + datetime.timedelta(minutes=1)
                cur.execute(
                    f"UPDATE {SCHEMA}.lottery_rounds SET status = 'drawing', draw_time = %s WHERE id = %s",
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
                f"SELECT id, user_id, username, message, created_at FROM {SCHEMA}.lottery_chat ORDER BY created_at DESC LIMIT 100"
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
                f"INSERT INTO {SCHEMA}.lottery_chat (user_id, username, message) VALUES (%s, %s, %s)",
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
                f"SELECT id, round_id, message, is_read, created_at FROM {SCHEMA}.lottery_notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
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
                f"UPDATE {SCHEMA}.lottery_notifications SET is_read = TRUE WHERE user_id = %s AND is_read = FALSE",
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
            
            cur.execute(f"DELETE FROM {SCHEMA}.lottery_chat")
            cur.execute(f"DELETE FROM {SCHEMA}.lottery_rounds WHERE status = 'completed'")
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'История чата и победителей очищена'}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery_history':
            cur.execute(
                f"SELECT id, status, total_tickets, prize_pool, winner_ticket_number, winner_user_id, winner_username, created_at, completed_at FROM {SCHEMA}.lottery_rounds WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 20"
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
                f"SELECT id, draw_time FROM {SCHEMA}.lottery_rounds WHERE status = 'drawing' AND draw_time <= CURRENT_TIMESTAMP"
            )
            rounds_to_draw = cur.fetchall()
            
            for round_data in rounds_to_draw:
                round_id = round_data['id']
                
                cur.execute(
                    f"SELECT id, user_id, username, ticket_number FROM {SCHEMA}.lottery_tickets WHERE round_id = %s",
                    (round_id,)
                )
                tickets = cur.fetchall()
                
                if not tickets:
                    cur.execute(
                        f"UPDATE {SCHEMA}.lottery_rounds SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                        (round_id,)
                    )
                    continue
                
                winning_ticket = random.choice(tickets)
                
                cur.execute(
                    f"UPDATE {SCHEMA}.lottery_rounds SET status = 'completed', winner_ticket_number = %s, winner_user_id = %s, winner_username = %s, completed_at = CURRENT_TIMESTAMP WHERE id = %s",
                    (winning_ticket['ticket_number'], winning_ticket['user_id'], winning_ticket['username'], round_id)
                )
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s",
                    (400, winning_ticket['user_id'])
                )
                
                ticket_num = winning_ticket['ticket_number']
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                    (winning_ticket['user_id'], 400, 'lottery_win', f'Выигрыш в лотерее (билет #{ticket_num})')
                )
                
                winner_message = f'🎉 Поздравляем! Вы выиграли 400 USDT в лотерее! Выигрышный билет #{ticket_num}'
                for ticket in tickets:
                    if ticket['user_id'] == winning_ticket['user_id']:
                        message = winner_message
                    else:
                        message = f'Розыгрыш завершен. Победитель: {winning_ticket["username"]} (билет #{ticket_num}). Удачи в следующий раз!'
                    
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.lottery_notifications (user_id, round_id, message) VALUES (%s, %s, %s)",
                        (ticket['user_id'], round_id, message)
                    )
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool) VALUES ('active', 0, 0)"
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
        
        elif action == 'save_game_session':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            game_type = body_data.get('game_type')
            bet_amount = body_data.get('bet_amount')
            game_state = body_data.get('game_state')
            
            if not game_type or not bet_amount or not game_state:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Не все параметры переданы'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"""INSERT INTO {SCHEMA}.active_game_sessions (user_id, game_type, bet_amount, game_state, updated_at)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id, game_type) 
                DO UPDATE SET 
                    bet_amount = EXCLUDED.bet_amount,
                    game_state = EXCLUDED.game_state,
                    updated_at = CURRENT_TIMESTAMP""",
                (int(user_id), game_type, float(bet_amount), json.dumps(game_state))
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_game_session':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            game_type = body_data.get('game_type')
            
            if not game_type:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Тип игры не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT bet_amount, game_state, created_at FROM {SCHEMA}.active_game_sessions WHERE user_id = %s AND game_type = %s AND expires_at > CURRENT_TIMESTAMP",
                (int(user_id), game_type)
            )
            session = cur.fetchone()
            
            if session:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'session': {
                            'bet_amount': float(session['bet_amount']),
                            'game_state': session['game_state'],
                            'created_at': str(session['created_at'])
                        }
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'session': None}),
                    'isBase64Encoded': False
                }
        
        elif action == 'clear_game_session':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            game_type = body_data.get('game_type')
            
            if not game_type:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Тип игры не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"DELETE FROM {SCHEMA}.active_game_sessions WHERE user_id = %s AND game_type = %s",
                (int(user_id), game_type)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
                    r.bonus_earned,
                    u.username as referred_username
                FROM {SCHEMA}.referrals r
                LEFT JOIN {SCHEMA}.users u ON r.referred_user_id = u.id
                WHERE r.referrer_id = %s AND (u.username NOT LIKE '[DELETED_%%' OR u.username IS NULL)
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
        
        elif action == 'claim_referral_bonus':
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
                f"SELECT referred_by_code, referral_bonus_claimed FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            
            if not user_data or not user_data['referred_by_code']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Вы не использовали реферальный код при регистрации'}),
                    'isBase64Encoded': False
                }
            
            if user_data['referral_bonus_claimed']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Бонус уже получен'}),
                    'isBase64Encoded': False
                }
            
            bonus_amount = 25
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + %s, referral_bonus_claimed = TRUE WHERE id = %s",
                (bonus_amount, int(user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'referral_bonus', 'Бонус за использование реферального кода')",
                (int(user_id), bonus_amount)
            )
            
            conn.commit()
            
            cur.execute(f"SELECT balance FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            updated_user = cur.fetchone()
            new_balance = float(updated_user['balance']) if updated_user else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'bonus_amount': bonus_amount,
                    'new_balance': new_balance
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_btc_balance':
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
                f"SELECT btc_balance FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            btc_balance = float(user_data['btc_balance']) if user_data and user_data['btc_balance'] else 0
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'btc_balance': btc_balance
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_usdt_to_btc':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            usdt_amount = float(body_data.get('usdt_amount', 0))
            client_btc_price = float(body_data.get('btc_price', 0))
            
            if usdt_amount < 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Минимальная сумма обмена: 10 USDT'}),
                    'isBase64Encoded': False
                }
            
            if client_btc_price <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректная цена BTC'}),
                    'isBase64Encoded': False
                }
            
            if not validate_btc_price(client_btc_price):
                real_price = get_real_btc_price()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Цена BTC устарела. Актуальный курс: ${real_price:.2f}',
                        'current_price': real_price
                    }),
                    'isBase64Encoded': False
                }
            
            btc_price = get_real_btc_price()
            if btc_price == 0:
                return {
                    'statusCode': 503,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сервис временно недоступен, попробуйте позже'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT balance, username FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            current_balance = float(user_data['balance']) if user_data else 0
            username = user_data['username'] if user_data else 'Unknown'
            
            if current_balance < usdt_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            # Комиссия 0.5% при обмене USDT → BTC
            commission = usdt_amount * 0.005
            usdt_after_commission = usdt_amount - commission
            btc_received = usdt_after_commission / btc_price
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - %s, btc_balance = btc_balance + %s WHERE id = %s",
                (usdt_amount, btc_received, int(user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'exchange', %s)",
                (int(user_id), -usdt_amount, f'Обмен {usdt_amount} USDT на {btc_received:.8f} BTC (комиссия 0.5%: {commission:.2f} USDT)')
            )
            
            conn.commit()
            
            # Send Telegram notification to admin
            send_telegram_notification(
                'usdt_to_btc_exchange',
                {'username': username, 'user_id': user_id},
                {'usdt_amount': usdt_amount, 'btc_received': round(btc_received, 8), 'btc_price': btc_price}
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'btc_received': btc_received
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_btc_to_usdt':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            btc_amount = float(body_data.get('btc_amount', 0))
            client_btc_price = float(body_data.get('btc_price', 0))
            
            if btc_amount < 0.0001:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Минимальная сумма обмена: 0.0001 BTC'}),
                    'isBase64Encoded': False
                }
            
            if client_btc_price <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректная цена BTC'}),
                    'isBase64Encoded': False
                }
            
            if not validate_btc_price(client_btc_price):
                real_price = get_real_btc_price()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'error': f'Цена BTC устарела. Актуальный курс: ${real_price:.2f}',
                        'current_price': real_price
                    }),
                    'isBase64Encoded': False
                }
            
            btc_price = get_real_btc_price()
            if btc_price == 0:
                return {
                    'statusCode': 503,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Сервис временно недоступен, попробуйте позже'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT btc_balance FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            current_btc_balance = float(user_data['btc_balance']) if user_data and user_data['btc_balance'] else 0
            
            username = user_data['username'] if user_data else 'Unknown'
            
            if current_btc_balance < btc_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно BTC'}),
                    'isBase64Encoded': False
                }
            
            # Комиссия 0.5% при обмене BTC → USDT
            usdt_gross = btc_amount * btc_price
            commission = usdt_gross * 0.005
            usdt_received = usdt_gross - commission
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + %s, btc_balance = btc_balance - %s WHERE id = %s",
                (usdt_received, btc_amount, int(user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'exchange', %s)",
                (int(user_id), usdt_received, f'Обмен {btc_amount:.8f} BTC на {usdt_received:.2f} USDT (комиссия 0.5%: {commission:.2f} USDT)')
            )
            
            conn.commit()
            
            # Send Telegram notification to admin
            send_telegram_notification(
                'btc_to_usdt_exchange',
                {'username': username, 'user_id': user_id},
                {'btc_amount': round(btc_amount, 8), 'usdt_received': round(usdt_received, 2), 'btc_price': btc_price}
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'usdt_received': usdt_received
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'withdraw_btc':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            btc_amount = float(body_data.get('btc_amount', 0))
            btc_address = body_data.get('btc_address', '').strip()
            
            if not btc_address:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Укажите BTC адрес'}),
                    'isBase64Encoded': False
                }
            
            # Комиссия за вывод BTC
            btc_commission = 0.00015
            
            if btc_amount < 0.001:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Минимальная сумма вывода: 0.001 BTC'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT btc_balance, username FROM {SCHEMA}.users WHERE id = %s",
                (int(user_id),)
            )
            user_data = cur.fetchone()
            current_btc_balance = float(user_data['btc_balance']) if user_data and user_data['btc_balance'] else 0
            username = user_data['username'] if user_data else 'Unknown'
            
            # Проверяем, достаточно ли средств с учётом комиссии
            total_required = btc_amount + btc_commission
            if current_btc_balance < total_required:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Недостаточно BTC (требуется {total_required:.8f} BTC включая комиссию {btc_commission:.8f} BTC)'}),
                    'isBase64Encoded': False
                }
            
            try:
                # Списываем сумму + комиссию
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET btc_balance = btc_balance - %s WHERE id = %s",
                    (total_required, int(user_id))
                )
            except Exception as update_error:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка UPDATE users: {str(update_error)}'}),
                    'isBase64Encoded': False
                }
            
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'btc_withdrawal', %s)",
                    (int(user_id), 0.01, f'Вывод {btc_amount:.8f} BTC на адрес {btc_address} (комиссия: {btc_commission:.8f} BTC)')
                )
            except Exception as trans_error:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка INSERT transactions: {str(trans_error)}'}),
                    'isBase64Encoded': False
                }
            
            try:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.withdrawals (user_id, amount, currency, address, status) VALUES (%s, %s, 'BTC', %s, 'pending') RETURNING id",
                    (int(user_id), btc_amount, btc_address)
                )
                withdrawal_id = cur.fetchone()['id']
            except Exception as withdraw_error:
                conn.rollback()
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Ошибка INSERT withdrawals: {str(withdraw_error)}'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_notifications (type, title, message, related_id, related_type) VALUES (%s, %s, %s, %s, %s)",
                ('btc_withdrawal', 'Новая заявка на вывод BTC', f'Пользователь {username} запросил вывод {btc_amount:.8f} BTC', withdrawal_id, 'withdrawal')
            )
            
            conn.commit()
            
            # Send Telegram notification to admin
            send_telegram_notification(
                'btc_withdrawal',
                {'username': username, 'user_id': user_id},
                {'btc_amount': round(btc_amount, 8), 'btc_address': btc_address}
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'process_btc_withdrawal':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
            admin_user = cur.fetchone()
            
            if not admin_user or admin_user.get('role') != 'admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            withdrawal_id = body_data.get('withdrawal_id')
            new_status = body_data.get('status')
            admin_comment = body_data.get('admin_comment', '')
            
            if new_status not in ['completed', 'rejected']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Неверный статус'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT user_id, amount FROM {SCHEMA}.withdrawals WHERE id = %s AND status = 'pending'",
                (withdrawal_id,)
            )
            withdrawal = cur.fetchone()
            
            if not withdrawal:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка не найдена или уже обработана'}),
                    'isBase64Encoded': False
                }
            
            if new_status == 'rejected':
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET btc_balance = btc_balance + %s WHERE id = %s",
                    (float(withdrawal['amount']), withdrawal['user_id'])
                )
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'btc_refund', %s)",
                    (withdrawal['user_id'], 0.01, f'Возврат {float(withdrawal["amount"]):.8f} BTC (вывод отклонен)')
                )
            
            cur.execute(
                f"UPDATE {SCHEMA}.withdrawals SET status = %s, processed_at = CURRENT_TIMESTAMP, admin_comment = %s WHERE id = %s",
                (new_status, admin_comment, withdrawal_id)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_recent_wins':
            limit = body_data.get('limit', 10)
            
            cur.execute(
                f"SELECT id, user_id, username, avatar_url, amount, game, created_at FROM {SCHEMA}.casino_wins ORDER BY created_at DESC LIMIT %s",
                (int(limit),)
            )
            wins = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'wins': [dict(w) for w in wins]
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
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP WHERE id = %s",
                (int(user_id),)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif action == 'admin_manage_btc':
            headers = event.get('headers', {})
            admin_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not admin_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (int(admin_id),))
            admin = cur.fetchone()
            
            if not admin or admin['role'] != 'admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Доступ запрещен'}),
                    'isBase64Encoded': False
                }
            
            target_user_id = body_data.get('user_id')
            btc_action = body_data.get('btc_action')
            btc_amount = body_data.get('btc_amount')
            
            if not target_user_id or not btc_action or btc_amount is None:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Отсутствуют обязательные параметры'}),
                    'isBase64Encoded': False
                }
            
            btc_amount = float(btc_amount)
            if btc_amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Сумма должна быть больше нуля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT id, username, btc_balance FROM {SCHEMA}.users WHERE id = %s",
                (int(target_user_id),)
            )
            target_user = cur.fetchone()
            
            if not target_user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            current_btc_balance = float(target_user['btc_balance'] or 0)
            
            if btc_action == 'add':
                new_balance = current_btc_balance + btc_amount
                description = f'Начисление {btc_amount:.8f} BTC администратором'
            elif btc_action == 'subtract':
                if current_btc_balance < btc_amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'message': 'Недостаточно BTC на балансе'}),
                        'isBase64Encoded': False
                    }
                new_balance = current_btc_balance - btc_amount
                description = f'Списание {btc_amount:.8f} BTC администратором'
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Неверное действие'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET btc_balance = %s WHERE id = %s",
                (new_balance, int(target_user_id))
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, 'admin_btc_adjustment', %s)",
                (int(target_user_id), 0.01, description)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'new_balance': round(new_balance, 8)
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
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()