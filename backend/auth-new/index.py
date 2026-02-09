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
        print(f"[AUTH] Parsed action: {action}, body keys: {list(body.keys())}")
    except Exception as e:
        print(f"[AUTH] ERROR parsing body: {str(e)}, event.body: {event.get('body')}")
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
                """SELECT u.id, u.username, u.email, u.balance, rc.code, u.is_blocked, u.block_reason, u.role
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
                        'referral_code': user[4] or '',
                        'role': user[7] or 'user'
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
                """SELECT u.id, u.username, u.email, u.balance, rc.code, u.is_blocked, u.block_reason, u.role
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
                        'is_blocked': user[5] or False,
                        'role': user[7] or 'user'
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_crypto_balances':
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'User ID не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """SELECT btc_balance, eth_balance, bnb_balance, sol_balance, xrp_balance, trx_balance
                FROM users WHERE id = %s""",
                (user_id,)
            )
            balances = cur.fetchone()
            
            if not balances:
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
                    'balances': {
                        'BTC': float(balances[0]),
                        'ETH': float(balances[1]),
                        'BNB': float(balances[2]),
                        'SOL': float(balances[3]),
                        'XRP': float(balances[4]),
                        'TRX': float(balances[5])
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_usdt_to_crypto':
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            usdt_amount = body.get('usdt_amount')
            crypto_symbol = body.get('crypto_symbol')
            crypto_price = body.get('crypto_price')
            
            if not user_id or not usdt_amount or not crypto_symbol or not crypto_price:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT balance FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user or float(user[0]) < usdt_amount:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Недостаточно средств'}),
                    'isBase64Encoded': False
                }
            
            crypto_received = usdt_amount / crypto_price
            new_balance = float(user[0]) - usdt_amount
            
            balance_field = f"{crypto_symbol.lower()}_balance"
            cur.execute(
                f"UPDATE users SET balance = %s, {balance_field} = {balance_field} + %s WHERE id = %s",
                (new_balance, crypto_received, user_id)
            )
            
            cur.execute(
                """INSERT INTO crypto_transactions 
                (user_id, transaction_type, crypto_symbol, amount, price, total, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (user_id, 'buy', crypto_symbol, crypto_received, crypto_price, usdt_amount, 'completed')
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'crypto_received': crypto_received,
                    'new_balance': new_balance
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'exchange_crypto_to_usdt':
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            crypto_amount = body.get('crypto_amount')
            crypto_symbol = body.get('crypto_symbol')
            crypto_price = body.get('crypto_price')
            
            if not user_id or not crypto_amount or not crypto_symbol or not crypto_price:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            balance_field = f"{crypto_symbol.lower()}_balance"
            cur.execute(f"SELECT balance, {balance_field} FROM users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user or float(user[1]) < crypto_amount:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f'Недостаточно {crypto_symbol}'}),
                    'isBase64Encoded': False
                }
            
            usdt_received = crypto_amount * crypto_price
            new_balance = float(user[0]) + usdt_received
            
            cur.execute(
                f"UPDATE users SET balance = %s, {balance_field} = {balance_field} - %s WHERE id = %s",
                (new_balance, crypto_amount, user_id)
            )
            
            cur.execute(
                """INSERT INTO crypto_transactions 
                (user_id, transaction_type, crypto_symbol, amount, price, total, status)
                VALUES (%s, %s, %s, %s, %s, %s, %s)""",
                (user_id, 'sell', crypto_symbol, crypto_amount, crypto_price, usdt_received, 'completed')
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'usdt_received': usdt_received,
                    'new_balance': new_balance
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_referral_info':
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'User ID не указан'}),
                    'isBase64Encoded': False
                }
            
            # Получаем реферальный код пользователя
            cur.execute(
                "SELECT code FROM referral_codes WHERE user_id = %s AND is_active = true LIMIT 1",
                (user_id,)
            )
            ref_code = cur.fetchone()
            referral_code = ref_code[0] if ref_code else ''
            
            # Получаем список рефералов
            cur.execute(
                """SELECT u.id, u.username, u.created_at 
                FROM users u 
                WHERE u.referred_by_code = %s 
                ORDER BY u.created_at DESC""",
                (referral_code,)
            )
            referrals_data = cur.fetchall()
            
            referrals = []
            for ref in referrals_data:
                referrals.append({
                    'id': ref[0],
                    'referred_username': ref[1],
                    'status': 'active',
                    'created_at': ref[2].isoformat() if ref[2] else None,
                    'total_deposited': 0,
                    'bonus_earned': 0
                })
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'referral_code': referral_code,
                    'referrals': referrals,
                    'stats': {
                        'total_referrals': len(referrals),
                        'completed': 0,
                        'pending': 0,
                        'active': len(referrals),
                        'can_claim': False,
                        'total_earned': 0,
                        'total_claimed': 0
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_crypto_transactions':
            try:
                # Получение истории транзакций обменника для текущего пользователя
                print(f"[AUTH] get_crypto_transactions action triggered")
                user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
                print(f"[AUTH] user_id extracted: {user_id}")
                if not user_id:
                    print(f"[AUTH] ERROR: User ID не указан")
                    return {
                        'statusCode': 400,
                        'headers': cors_headers,
                        'body': json.dumps({'error': 'User ID не указан'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем транзакции обменника из crypto_transactions
                # Исключаем тестовые данные (amount = 0.01 AND price = 1000)
                print(f"[AUTH] Fetching crypto_transactions for user_id={user_id}")
                cur.execute(
                    """SELECT id, transaction_type, crypto_symbol, amount, price, total, 
                    wallet_address, created_at, status
                    FROM crypto_transactions
                    WHERE user_id = %s
                    AND NOT (amount = 0.01 AND price = 1000)
                    ORDER BY created_at DESC
                    LIMIT 100""",
                    (user_id,)
                )
                crypto_txs = cur.fetchall()
                print(f"[AUTH] Found {len(crypto_txs)} crypto_transactions")
            except Exception as e:
                print(f"[AUTH] EXCEPTION in get_crypto_transactions: {str(e)}")
                import traceback
                traceback.print_exc()
                return {
                    'statusCode': 500,
                    'headers': cors_headers,
                    'body': json.dumps({'error': f'Ошибка при получении транзакций: {str(e)}'}),
                    'isBase64Encoded': False
                }
            
            # Получаем старые транзакции из transactions (для обратной совместимости)
            cur.execute(
                """SELECT id, amount, type, description, created_at
                FROM transactions
                WHERE user_id = %s 
                AND type = 'exchange'
                AND description ILIKE '%обмен%'
                ORDER BY created_at DESC
                LIMIT 100""",
                (user_id,)
            )
            old_txs = cur.fetchall()
            
            # Получаем заявки на вывод из withdrawals
            cur.execute(
                """SELECT id, amount, crypto_symbol, address, status, created_at, processed_at
                FROM withdrawals
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 50""",
                (user_id,)
            )
            withdrawals = cur.fetchall()
            
            transactions = []
            
            # Добавляем транзакции обмена
            for tx in crypto_txs:
                transactions.append({
                    'id': f"tx_{tx[0]}",
                    'transaction_type': tx[1],
                    'crypto_symbol': tx[2],
                    'amount': float(tx[3]) if tx[3] else 0.0,
                    'price': float(tx[4]) if tx[4] else 0.0,
                    'total': float(tx[5]) if tx[5] else 0.0,
                    'wallet_address': tx[6],
                    'created_at': tx[7].isoformat() if tx[7] else None,
                    'status': tx[8]
                })
            
            # Парсим старые транзакции
            import re
            print(f"[AUTH] Processing {len(old_txs)} old transactions")
            for old_tx in old_txs:
                try:
                    desc = old_tx[3] or ''
                    
                    # Парсим описание вида "Обмен 108520.62 USDT на 732.32089805 SOL"
                    match = re.search(r'Обмен ([\d.]+)\s+(\w+)\s+на\s+([\d.]+)\s+(\w+)', desc, re.IGNORECASE)
                    if match:
                        from_amount = float(match.group(1))
                        from_crypto = match.group(2).upper()
                        to_amount = float(match.group(3))
                        to_crypto = match.group(4).upper()
                        
                        # Определяем тип операции
                        if from_crypto == 'USDT':
                            tx_type = 'buy'
                            crypto_symbol = to_crypto
                            crypto_amount = to_amount
                            usdt_amount = from_amount
                            price = usdt_amount / crypto_amount if crypto_amount > 0 else 0
                        elif to_crypto == 'USDT':
                            tx_type = 'sell'
                            crypto_symbol = from_crypto
                            crypto_amount = from_amount
                            usdt_amount = to_amount
                            price = usdt_amount / crypto_amount if crypto_amount > 0 else 0
                        else:
                            continue
                        
                        transactions.append({
                            'id': f"old_{old_tx[0]}",
                            'transaction_type': tx_type,
                            'crypto_symbol': crypto_symbol,
                            'amount': crypto_amount,
                            'price': price,
                            'total': usdt_amount,
                            'wallet_address': None,
                            'created_at': old_tx[4].isoformat() if old_tx[4] else None,
                            'status': 'completed'
                        })
                except (IndexError, ValueError) as e:
                    print(f"[AUTH] ERROR parsing old_tx: {e}, old_tx length: {len(old_tx)}, old_tx: {old_tx}")
                    continue
            
            # Добавляем заявки на вывод
            print(f"[AUTH] Processing {len(withdrawals)} withdrawals")
            for wd in withdrawals:
                try:
                    transactions.append({
                        'id': f"wd_{wd[0]}",
                        'transaction_type': 'withdraw',
                        'crypto_symbol': wd[2],
                        'amount': float(wd[1]),
                        'price': 0,
                        'total': 0,
                        'wallet_address': wd[3],
                        'created_at': wd[5].isoformat() if wd[5] else None,
                        'status': wd[4]
                    })
                except (IndexError, ValueError) as e:
                    print(f"[AUTH] ERROR parsing withdrawal: {e}, wd length: {len(wd)}, wd: {wd}")
                    continue
            
            # Сортируем по дате
            transactions.sort(key=lambda x: x['created_at'] or '', reverse=True)
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'transactions': transactions[:100]
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'get_user_expenses':
            # Детальная информация о расходах пользователя для админки
            target_user_id = body.get('user_id')
            if not target_user_id:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'user_id не указан'}),
                    'isBase64Encoded': False
                }
            
            # Получаем транзакции обменника
            cur.execute(
                """SELECT id, transaction_type, crypto_symbol, amount, price, total, 
                wallet_address, created_at, status
                FROM crypto_transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 100""",
                (target_user_id,)
            )
            exchange_txs = cur.fetchall()
            
            expenses = {
                'exchange_transactions': [{
                    'id': tx[0],
                    'type': tx[1],
                    'crypto': tx[2],
                    'amount': float(tx[3]),
                    'price': float(tx[4]),
                    'total': float(tx[5]),
                    'wallet': tx[6],
                    'date': tx[7].isoformat() if tx[7] else None,
                    'status': tx[8]
                } for tx in exchange_txs]
            }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'expenses': expenses
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'transactions':
            # История транзакций для личного кабинета (старый формат для совместимости)
            user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'User ID не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """SELECT id, amount, type, description, created_at
                FROM transactions
                WHERE user_id = %s
                ORDER BY created_at DESC
                LIMIT 100""",
                (user_id,)
            )
            txs = cur.fetchall()
            
            transactions = []
            for tx in txs:
                transactions.append({
                    'id': tx[0],
                    'amount': float(tx[1]),
                    'type': tx[2],
                    'description': tx[3],
                    'created_at': tx[4].isoformat() if tx[4] else None
                })
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'transactions': transactions
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