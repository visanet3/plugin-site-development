'''
Business: Регистрация, авторизация пользователей и обработка вывода криптовалют
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с токеном и данными пользователя

Updated: 2026-02-08 - fixed CORS wrapper removal
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
import traceback

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
    if not database_url:
        raise ValueError('DATABASE_URL environment variable is not set')
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
    """Обработчик запросов авторизации, регистрации и управления выводом криптовалют"""
    
    # Добавляем try-except на весь handler для отладки
    try:
        method: str = event.get('httpMethod', 'POST')
        
        # CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': 'https://gitcrypto.pro',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
            'Access-Control-Allow-Credentials': 'true'
        }
        
        # CORS preflight - КРИТИЧНО: проверяем ДО подключения к БД
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': '',
                'isBase64Encoded': False
            }
        
        # Подключаемся к БД только после проверки OPTIONS
        try:
            conn = get_db_connection()
            cur = conn.cursor()
        except Exception as db_error:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': f'Database connection failed: {str(db_error)}'}),
                'isBase64Encoded': False
            }
    except Exception as global_error:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Handler init failed: {str(global_error)}', 'traceback': traceback.format_exc()}),
            'isBase64Encoded': False
        }
    
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
                
                # Получаем обычные транзакции
                cur.execute(
                    f"SELECT id, amount, type, description, created_at, NULL as status, NULL as network, NULL as tx_hash, NULL as confirmed_at FROM {SCHEMA}.transactions WHERE user_id = {int(user_id)}"
                )
                transactions = cur.fetchall()
                
                # Получаем крипто-пополнения
                cur.execute(
                    f"""SELECT 
                        id, 
                        amount, 
                        'crypto_payment' as type, 
                        CASE 
                            WHEN status = 'pending' THEN 'Ожидание USDT ' || network || ' (' || amount || ' USDT)'
                            WHEN status = 'confirmed' THEN 'Зачисление USDT ' || network || ' (' || amount || ' USDT)'
                            WHEN status = 'cancelled' THEN 'Отменено USDT ' || network || ' (' || amount || ' USDT)'
                            ELSE 'Крипто-пополнение ' || network
                        END as description, 
                        created_at,
                        status,
                        network,
                        tx_hash,
                        confirmed_at
                    FROM {SCHEMA}.crypto_payments 
                    WHERE user_id = {int(user_id)}"""
                )
                crypto_payments = cur.fetchall()
                
                # Объединяем и сортируем все по дате
                all_transactions = [dict(t) for t in transactions] + [dict(c) for c in crypto_payments]
                all_transactions.sort(key=lambda x: x['created_at'], reverse=True)
                
                # Применяем пагинацию после сортировки
                paginated_transactions = all_transactions[offset:offset+limit]
                total = len(all_transactions)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'transactions': paginated_transactions,
                        'total': total
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_crypto_withdrawals':
                headers = event.get('headers', {})
                user_id = headers.get('X-User-Id') or headers.get('x-user-id')
                
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, что пользователь - админ
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {int(user_id)}")
                user_role = cur.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем все заявки на вывод криптовалют
                cur.execute(
                    f"""
                    SELECT w.*, u.username 
                    FROM {SCHEMA}.withdrawals w
                    LEFT JOIN {SCHEMA}.users u ON w.user_id = u.id
                    ORDER BY w.created_at DESC
                    """
                )
                withdrawals = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'withdrawals': [dict(w) for w in withdrawals]}, default=str),
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
        
        # Get user data action
        if action == 'get_user':
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
                f"""SELECT id, username, email, avatar_url, role, forum_role, balance, 
                   created_at, referred_by_code, referral_bonus_claimed, vip_until, is_blocked, 
                   is_verified
                   FROM {SCHEMA}.users WHERE id = {int(user_id)}"""
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            user_dict = dict(user)
            user_dict['balance'] = float(user_dict.get('balance', 0))
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'user': user_dict
                }, default=str),
                'isBase64Encoded': False
            }
        
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
            
            # Проверка существующего пользователя (параметризированный запрос)
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
            
            # Проверка реферального кода (параметризированный запрос)
            referrer_id = None
            if referral_code:
                cur.execute(
                    f"SELECT user_id FROM {SCHEMA}.referral_codes WHERE code = %s AND is_active = TRUE",
                    (referral_code,)
                )
                referrer = cur.fetchone()
                if referrer:
                    referrer_id = referrer['user_id']
            
            # Создание пользователя (параметризированный запрос)
            cur.execute(
                f"INSERT INTO {SCHEMA}.users (username, email, password_hash, referred_by_code, last_ip) VALUES (%s, %s, %s, %s, %s) RETURNING id, username, email, avatar_url, role, forum_role, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until",
                (username, email, password_hash, referral_code if referral_code else None, client_ip)
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
            
            # Параметризированный запрос для входа
            cur.execute(
                f"SELECT id, username, email, avatar_url, role, forum_role, is_blocked, balance, created_at, referred_by_code, referral_bonus_claimed, vip_until, last_ip FROM {SCHEMA}.users WHERE username = %s AND password_hash = %s",
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
            
            # Update last login and IP (параметризированный запрос)
            cur.execute(
                f"UPDATE {SCHEMA}.users SET last_seen_at = CURRENT_TIMESTAMP, last_ip = %s WHERE id = %s",
                (client_ip, user['id'])
            )
            conn.commit()
            
            token = generate_token()
            
            # Отправляем уведомление в Telegram о входе пользователя
            send_telegram_notification(
                'user_online',
                {'username': user['username'], 'user_id': user['id']},
                {}
            )
            
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
                f"SELECT code FROM {SCHEMA}.referral_codes WHERE user_id = {int(user_id)} AND is_active = TRUE LIMIT 1"
            )
            code_result = cur.fetchone()
            referral_code = code_result['code'] if code_result else None
            
            if not referral_code:
                new_code = generate_referral_code()
                cur.execute(
                    f"INSERT INTO {SCHEMA}.referral_codes (user_id, code) VALUES ({int(user_id)}, {escape_sql_string(new_code)})"
                )
                conn.commit()
                referral_code = new_code
            
            cur.execute(
                f"""
                SELECT r.id, r.status, r.total_deposited, r.created_at, r.completed_at,
                       u.username as referred_username,
                       COALESCE(r.bonus_earned, 0) as bonus_earned
                FROM {SCHEMA}.referrals r
                JOIN {SCHEMA}.users u ON r.referred_user_id = u.id
                WHERE r.referrer_id = {int(user_id)}
                ORDER BY r.created_at DESC
                """
            )
            referrals = cur.fetchall()
            
            total_referrals = len(referrals)
            completed = sum(1 for r in referrals if r['status'] == 'completed')
            pending = sum(1 for r in referrals if r['status'] == 'pending')
            active = sum(1 for r in referrals if r['status'] == 'active')
            total_earned = sum(r['bonus_earned'] for r in referrals)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'referral_code': referral_code,
                    'referrals': [dict(r) for r in referrals],
                    'stats': {
                        'total_referrals': total_referrals,
                        'completed': completed,
                        'pending': pending,
                        'active': active,
                        'total_earned': float(total_earned),
                        'total_claimed': 0,
                        'can_claim': False
                    }
                }, default=str),
                'isBase64Encoded': False
            }
        
        elif action == 'update_christmas_bonus':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            bonus_percent = body_data.get('bonus_percent')
            
            if not bonus_percent or not isinstance(bonus_percent, int) or bonus_percent < 10 or bonus_percent > 100:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректный процент бонуса'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET bonus_percent = {int(bonus_percent)} WHERE id = {int(user_id)}"
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'bonus_percent': bonus_percent}),
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
        
        elif action == 'get_crypto_transactions':
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
                f"SELECT id, transaction_type, crypto_symbol, amount, price, total, status, wallet_address, created_at FROM {SCHEMA}.crypto_transactions WHERE user_id = {int(user_id)} ORDER BY created_at DESC LIMIT 100"
            )
            transactions = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'transactions': [dict(t) for t in transactions]}, default=str),
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
            
            amount = body_data.get('amount', 0)
            game_type = body_data.get('game_type', 'Unknown')
            
            if amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Некорректная сумма ставки'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['balance'] < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - {float(amount)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {-float(amount)}, 'bet', {escape_sql_string(f'Ставка в игре {game_type}')})"
            )
            
            conn.commit()
            
            # Получаем имя пользователя для уведомления
            cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = {int(user_id)}")
            user_info = cur.fetchone()
            
            # Отправляем уведомление в Telegram о ставке в казино
            if user_info:
                send_telegram_notification(
                    'casino_bet',
                    {'username': user_info['username'], 'user_id': user_id},
                    {'game': game_type, 'bet_amount': amount}
                )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
                f"SELECT COALESCE(btc_balance, 0) as btc_balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'btc_balance': float(user_data['btc_balance']) if user_data else 0}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_crypto_balances':
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
                f"SELECT COALESCE(btc_balance, 0) as btc_balance, COALESCE(eth_balance, 0) as eth_balance, COALESCE(bnb_balance, 0) as bnb_balance, COALESCE(sol_balance, 0) as sol_balance, COALESCE(xrp_balance, 0) as xrp_balance, COALESCE(trx_balance, 0) as trx_balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'balances': {
                        'BTC': float(user_data['btc_balance']) if user_data else 0,
                        'ETH': float(user_data['eth_balance']) if user_data else 0,
                        'BNB': float(user_data['bnb_balance']) if user_data else 0,
                        'SOL': float(user_data['sol_balance']) if user_data else 0,
                        'XRP': float(user_data['xrp_balance']) if user_data else 0,
                        'TRX': float(user_data['trx_balance']) if user_data else 0
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_usdt_to_crypto':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            usdt_amount = body_data.get('usdt_amount', 0)
            crypto_symbol = body_data.get('crypto_symbol', '')
            crypto_price = body_data.get('crypto_price', 0)
            
            if usdt_amount <= 0 or crypto_price <= 0 or not crypto_symbol:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            if crypto_symbol.upper() not in ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Неподдерживаемая криптовалюта'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['balance'] < usdt_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            crypto_amount = usdt_amount / crypto_price
            crypto_column = f"{crypto_symbol.lower()}_balance"
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - {float(usdt_amount)}, {crypto_column} = COALESCE({crypto_column}, 0) + {float(crypto_amount)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {-float(usdt_amount)}, 'exchange', {escape_sql_string(f'Обмен {usdt_amount} USDT на {crypto_amount:.8f} {crypto_symbol}')})"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.crypto_transactions (user_id, transaction_type, crypto_symbol, amount, price, total, status) VALUES ({int(user_id)}, 'buy', {escape_sql_string(crypto_symbol)}, {float(crypto_amount)}, {float(crypto_price)}, {float(usdt_amount)}, 'completed')"
            )
            
            conn.commit()
            
            # Получаем информацию о пользователе для уведомления
            cur.execute(
                f"SELECT id, username, email FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_info_data = cur.fetchone()
            
            # Отправляем уведомление администратору
            send_telegram_notification(
                'crypto_exchange',
                {
                    'user_id': user_info_data['id'],
                    'username': user_info_data.get('username', 'Неизвестный'),
                    'email': user_info_data.get('email', 'Нет email')
                },
                {
                    'type': 'buy',
                    'from_currency': 'USDT',
                    'to_currency': crypto_symbol,
                    'from_amount': usdt_amount,
                    'to_amount': crypto_amount,
                    'rate': crypto_price
                }
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'crypto_received': crypto_amount}),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_crypto_to_usdt':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            crypto_amount = body_data.get('crypto_amount', 0)
            crypto_symbol = body_data.get('crypto_symbol', '')
            crypto_price = body_data.get('crypto_price', 0)
            
            if crypto_amount <= 0 or crypto_price <= 0 or not crypto_symbol:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            if crypto_symbol.upper() not in ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Неподдерживаемая криптовалюта'}),
                    'isBase64Encoded': False
                }
            
            crypto_column = f"{crypto_symbol.lower()}_balance"
            
            cur.execute(
                f"SELECT {crypto_column} FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or (user_data[crypto_column] or 0) < crypto_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            usdt_amount = crypto_amount * crypto_price
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance + {float(usdt_amount)}, {crypto_column} = COALESCE({crypto_column}, 0) - {float(crypto_amount)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {float(usdt_amount)}, 'exchange', {escape_sql_string(f'Обмен {crypto_amount:.8f} {crypto_symbol} на {usdt_amount} USDT')})"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.crypto_transactions (user_id, transaction_type, crypto_symbol, amount, price, total, status) VALUES ({int(user_id)}, 'sell', {escape_sql_string(crypto_symbol)}, {float(crypto_amount)}, {float(crypto_price)}, {float(usdt_amount)}, 'completed')"
            )
            
            conn.commit()
            
            # Получаем информацию о пользователе для уведомления
            cur.execute(
                f"SELECT id, username, email FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_info_data = cur.fetchone()
            
            # Отправляем уведомление администратору
            send_telegram_notification(
                'crypto_exchange',
                {
                    'user_id': user_info_data['id'],
                    'username': user_info_data.get('username', 'Неизвестный'),
                    'email': user_info_data.get('email', 'Нет email')
                },
                {
                    'type': 'sell',
                    'from_currency': crypto_symbol,
                    'to_currency': 'USDT',
                    'from_amount': crypto_amount,
                    'to_amount': usdt_amount,
                    'rate': crypto_price
                }
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'usdt_received': usdt_amount}),
                'isBase64Encoded': False
            }
        
        elif action == 'withdraw_crypto':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            crypto_symbol = body_data.get('crypto_symbol', '')
            amount = body_data.get('amount', 0)
            address = body_data.get('address', '')
            
            if amount <= 0 or not crypto_symbol or not address:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            if crypto_symbol.upper() not in ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'TRX']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Неподдерживаемая криптовалюта'}),
                    'isBase64Encoded': False
                }
            
            crypto_column = f"{crypto_symbol.lower()}_balance"
            
            # КРИТИЧЕСКАЯ ПРОВЕРКА: проверяем что не выводятся Flash токены
            cur.execute(
                f"SELECT {crypto_column}, flash_btc_balance, flash_usdt_balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            crypto_balance = float(user_data[crypto_column] or 0)
            flash_btc = float(user_data.get('flash_btc_balance') or 0)
            
            # Если выводим BTC - нужно проверить что это не Flash BTC
            if crypto_symbol.upper() == 'BTC' and flash_btc > 0:
                real_btc_balance = crypto_balance - flash_btc
                if real_btc_balance < amount:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': False, 'error': f'Недостаточно реальных BTC! Flash BTC нельзя вывести. Доступно: {real_btc_balance:.8f} BTC'}),
                        'isBase64Encoded': False
                    }
            elif crypto_balance < amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET {crypto_column} = COALESCE({crypto_column}, 0) - {float(amount)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.withdrawals (user_id, crypto_symbol, amount, address, status, created_at) VALUES ({int(user_id)}, {escape_sql_string(crypto_symbol.upper())}, {float(amount)}, {escape_sql_string(address)}, 'pending', NOW()) RETURNING id"
            )
            
            withdrawal_id = cur.fetchone()['id']
            
            # Получаем username для уведомления
            cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = {int(user_id)}")
            user_info = cur.fetchone()
            username = user_info['username'] if user_info else f"User #{user_id}"
            
            # Получаем текущую цену для crypto_transactions
            cur.execute(f"SELECT price FROM {SCHEMA}.crypto_transactions WHERE crypto_symbol = {escape_sql_string(crypto_symbol)} ORDER BY created_at DESC LIMIT 1")
            price_data = cur.fetchone()
            current_price = float(price_data['price']) if price_data else 0
            
            # Сохраняем в crypto_transactions
            cur.execute(
                f"INSERT INTO {SCHEMA}.crypto_transactions (user_id, transaction_type, crypto_symbol, amount, price, total, status, wallet_address) VALUES ({int(user_id)}, 'withdraw', {escape_sql_string(crypto_symbol)}, {float(amount)}, {float(current_price)}, {float(amount * current_price)}, 'pending', {escape_sql_string(address)})"
            )
            
            # Создаём уведомление для админа
            cur.execute(
                f"INSERT INTO {SCHEMA}.admin_notifications (type, title, message, related_id, related_type) VALUES ('crypto_withdrawal', '💰 Новая заявка на вывод', {escape_sql_string(f'Пользователь {username} создал заявку на вывод {amount} {crypto_symbol.upper()}')}, {withdrawal_id}, 'withdrawal')"
            )
            
            conn.commit()
            
            # Отправляем Telegram уведомление
            send_telegram_notification(
                'crypto_withdrawal',
                {'username': username, 'user_id': user_id},
                {'amount': amount, 'crypto': crypto_symbol.upper(), 'address': address, 'withdrawal_id': withdrawal_id}
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
            
            # Проверяем, что пользователь - админ
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {int(user_id)}")
            user_role = cur.fetchone()
            
            if not user_role or user_role['role'] != 'admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Access denied'}),
                    'isBase64Encoded': False
                }
            
            withdrawal_id = body_data.get('withdrawal_id')
            new_status = body_data.get('status')
            admin_comment = body_data.get('admin_comment', '')
            
            if not withdrawal_id or not new_status:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            # Получаем данные заявки на вывод
            cur.execute(
                f"SELECT user_id, crypto_symbol, amount, status FROM {SCHEMA}.withdrawals WHERE id = {int(withdrawal_id)}"
            )
            withdrawal = cur.fetchone()
            
            if not withdrawal:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка не найдена'}),
                    'isBase64Encoded': False
                }
            
            if withdrawal['status'] != 'pending':
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Заявка уже обработана'}),
                    'isBase64Encoded': False
                }
            
            # Если отклоняем - возвращаем средства на ПРАВИЛЬНЫЙ криптобаланс
            if new_status == 'rejected':
                withdrawal_crypto = withdrawal['crypto_symbol']
                withdrawal_amount = withdrawal['amount']
                withdrawal_user = withdrawal['user_id']
                crypto_column = f"{withdrawal_crypto.lower()}_balance"
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET {crypto_column} = COALESCE({crypto_column}, 0) + {float(withdrawal_amount)} WHERE id = {int(withdrawal_user)}"
                )
                
                # Добавляем транзакцию о возврате
                description = f"Возврат {withdrawal_amount} {withdrawal_crypto} (заявка #{withdrawal_id} отклонена)"
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(withdrawal_user)}, {float(withdrawal_amount)}, 'withdrawal_rejected', {escape_sql_string(description)})"
                )
            
            # Обновляем статус заявки
            cur.execute(
                f"UPDATE {SCHEMA}.withdrawals SET status = {escape_sql_string(new_status)}, admin_comment = {escape_sql_string(admin_comment)}, processed_at = NOW() WHERE id = {int(withdrawal_id)}"
            )
            
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
            
            cur.execute(
                f"SELECT balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'balance': float(user_data['balance'])}),
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
            
            usdt_amount = body_data.get('usdt_amount', 0)
            btc_price = body_data.get('btc_price', 0)
            
            if usdt_amount <= 0 or btc_price <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            real_price = get_real_btc_price()
            if not validate_btc_price(btc_price, tolerance_percent=2.0):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Курс устарел', 'current_price': real_price}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['balance'] < usdt_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            commission = usdt_amount * 0.005
            after_commission = usdt_amount - commission
            btc_received = after_commission / btc_price
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - {float(usdt_amount)}, btc_balance = COALESCE(btc_balance, 0) + {float(btc_received)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {-float(usdt_amount)}, 'exchange', {escape_sql_string(f'Обмен {usdt_amount} USDT на {btc_received:.8f} BTC')})"
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'btc_received': f'{btc_received:.8f}'}),
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
            
            btc_amount = body_data.get('btc_amount', 0)
            btc_price = body_data.get('btc_price', 0)
            
            if btc_amount <= 0 or btc_price <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректные параметры'}),
                    'isBase64Encoded': False
                }
            
            real_price = get_real_btc_price()
            if not validate_btc_price(btc_price, tolerance_percent=2.0):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Курс устарел', 'current_price': real_price}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT COALESCE(btc_balance, 0) as btc_balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['btc_balance'] < btc_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно BTC'}),
                    'isBase64Encoded': False
                }
            
            gross = btc_amount * btc_price
            commission = gross * 0.005
            usdt_received = gross - commission
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET btc_balance = btc_balance - {float(btc_amount)}, balance = balance + {float(usdt_received)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {float(usdt_received)}, 'exchange', {escape_sql_string(f'Обмен {btc_amount:.8f} BTC на {usdt_received:.2f} USDT')})"
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'usdt_received': f'{usdt_received:.2f}'}),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery':
            cur.execute(
                f"SELECT id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at FROM {SCHEMA}.lottery_rounds WHERE status IN ('active', 'drawing') ORDER BY created_at DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                cur.execute(
                    f"INSERT INTO {SCHEMA}.lottery_rounds (status, total_tickets, prize_pool, created_at) VALUES ('active', 0, 0, NOW()) RETURNING id, status, total_tickets, prize_pool, draw_time, winner_ticket_number, winner_username, created_at"
                )
                round_data = cur.fetchone()
                conn.commit()
            
            cur.execute(
                f"SELECT id, user_id, username, ticket_number, purchased_at FROM {SCHEMA}.lottery_tickets WHERE round_id = {round_data['id']} ORDER BY ticket_number"
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
            
            ticket_price = body_data.get('amount', 50)
            
            cur.execute(
                f"SELECT id, status, total_tickets FROM {SCHEMA}.lottery_rounds WHERE status = 'active' ORDER BY created_at DESC LIMIT 1"
            )
            round_data = cur.fetchone()
            
            if not round_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Нет активного раунда'}),
                    'isBase64Encoded': False
                }
            
            if round_data['total_tickets'] >= 10:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Все билеты проданы'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT balance, username FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['balance'] < ticket_price:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            ticket_number = round_data['total_tickets'] + 1
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET balance = balance - {float(ticket_price)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.lottery_tickets (round_id, user_id, username, ticket_number, purchased_at) VALUES ({round_data['id']}, {int(user_id)}, {escape_sql_string(user_data['username'])}, {ticket_number}, NOW())"
            )
            
            cur.execute(
                f"UPDATE {SCHEMA}.lottery_rounds SET total_tickets = total_tickets + 1, prize_pool = prize_pool + {float(ticket_price)} WHERE id = {round_data['id']}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {-float(ticket_price)}, 'lottery', {escape_sql_string(f'Покупка билета #{ticket_number} в лотерею')})"
            )
            
            if ticket_number == 10:
                draw_time = datetime.datetime.now() + datetime.timedelta(minutes=1)
                cur.execute(
                    f"UPDATE {SCHEMA}.lottery_rounds SET status = 'drawing', draw_time = {escape_sql_string(draw_time.strftime('%Y-%m-%d %H:%M:%S'))} WHERE id = {round_data['id']}"
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
        
        elif action == 'check_lottery_draw':
            cur.execute(
                f"SELECT id, draw_time FROM {SCHEMA}.lottery_rounds WHERE status = 'drawing' AND draw_time <= NOW()"
            )
            rounds = cur.fetchall()
            
            processed = 0
            for round_data in rounds:
                cur.execute(
                    f"SELECT id, user_id, username, ticket_number FROM {SCHEMA}.lottery_tickets WHERE round_id = {round_data['id']} ORDER BY ticket_number"
                )
                tickets = cur.fetchall()
                
                if len(tickets) > 0:
                    import random
                    winner = random.choice(tickets)
                    
                    prize = 400
                    winner_id = winner['user_id']
                    winner_ticket = winner['ticket_number']
                    winner_name = winner['username']
                    
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET balance = balance + {float(prize)} WHERE id = {winner_id}"
                    )
                    
                    cur.execute(
                        f"UPDATE {SCHEMA}.lottery_rounds SET status = 'completed', winner_ticket_number = {winner_ticket}, winner_user_id = {winner_id}, winner_username = {escape_sql_string(winner_name)}, completed_at = NOW() WHERE id = {round_data['id']}"
                    )
                    
                    win_desc = f'Выигрыш в лотерее (билет #{winner_ticket})'
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({winner_id}, {float(prize)}, 'lottery_win', {escape_sql_string(win_desc)})"
                    )
                    
                    for ticket in tickets:
                        if ticket['user_id'] == winner_id:
                            msg = f'Победитель: {winner_name} (билет #{winner_ticket}). Приз: {prize} USDT'
                        else:
                            msg = f'Победитель: {winner_name} (билет #{winner_ticket})'
                        
                        cur.execute(
                            f"INSERT INTO {SCHEMA}.lottery_notifications (user_id, round_id, message, is_read, created_at) VALUES ({ticket['user_id']}, {round_data['id']}, {escape_sql_string(msg)}, FALSE, NOW())"
                        )
                    
                    processed += 1
            
            if processed > 0:
                conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'processed_rounds': processed
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_lottery_notifications':
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
                f"SELECT id, round_id, message, is_read, created_at FROM {SCHEMA}.lottery_notifications WHERE user_id = {int(user_id)} ORDER BY created_at DESC LIMIT 10"
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
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.lottery_notifications SET is_read = TRUE WHERE user_id = {int(user_id)}"
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
        
        elif action == 'get_lottery_chat':
            cur.execute(
                f"SELECT id, user_id, username, message, created_at FROM {SCHEMA}.lottery_chat ORDER BY created_at DESC LIMIT 50"
            )
            messages = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'messages': [dict(m) for m in messages][::-1]
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
            
            if len(message) > 500:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Сообщение слишком длинное'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT username FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'message': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.lottery_chat (user_id, username, message, created_at) VALUES ({int(user_id)}, {escape_sql_string(user_data['username'])}, {escape_sql_string(message)}, NOW())"
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
            
            btc_amount = body_data.get('btc_amount', 0)
            btc_address = body_data.get('btc_address', '').strip()
            
            if btc_amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректная сумма'}),
                    'isBase64Encoded': False
                }
            
            if not btc_address or len(btc_address) < 26:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Некорректный BTC адрес'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT COALESCE(btc_balance, 0) as btc_balance FROM {SCHEMA}.users WHERE id = {int(user_id)}"
            )
            user_data = cur.fetchone()
            
            if not user_data or user_data['btc_balance'] < btc_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Недостаточно BTC'}),
                    'isBase64Encoded': False
                }
            
            network_fee = 0.0001
            total_amount = btc_amount + network_fee
            
            if user_data['btc_balance'] < total_amount:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': f'Недостаточно BTC (с учетом комиссии {network_fee} BTC)'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET btc_balance = btc_balance - {float(total_amount)} WHERE id = {int(user_id)}"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {-float(total_amount)}, 'withdrawal', {escape_sql_string(f'Вывод {btc_amount:.8f} BTC на {btc_address}')})"
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.withdrawal_requests (user_id, amount, currency, address, status, created_at) VALUES ({int(user_id)}, {float(btc_amount)}, 'BTC', {escape_sql_string(btc_address)}, 'pending', NOW())"
            )
            
            conn.commit()
            
            send_telegram_notification(
                'btc_withdrawal_request',
                {'user_id': user_id},
                {'amount': btc_amount, 'address': btc_address, 'fee': network_fee}
            )
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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
            is_draw = body_data.get('is_draw', False)
            amount = body_data.get('amount', 0)
            bet_amount = body_data.get('bet_amount', 0)
            game_type = body_data.get('game_type', 'Unknown')
            
            if won or is_draw:
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = balance + {float(amount)} WHERE id = {int(user_id)}"
                )
                
                if won and not is_draw:
                    transaction_type = 'win'
                    description = f'Выигрыш в игре {game_type}: +{amount:.2f} USDT'
                else:
                    transaction_type = 'draw'
                    description = f'Ничья в игре {game_type}: возврат {amount:.2f} USDT'
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES ({int(user_id)}, {float(amount)}, {escape_sql_string(transaction_type)}, {escape_sql_string(description)})"
                )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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