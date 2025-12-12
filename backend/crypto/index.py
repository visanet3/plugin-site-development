'''
Business: Обработка криптовалютных платежей USDT для пополнения баланса
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с адресом кошелька или статусом платежа
'''

import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta
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

def check_tron_transaction(wallet_address: str, amount: float, min_timestamp: int) -> Optional[Dict[str, Any]]:
    """Проверить USDT транзакцию на TRON"""
    try:
        trongrid_api_key = os.environ.get('TRONGRID_API_KEY', '')
        headers = {'TRON-PRO-API-KEY': trongrid_api_key} if trongrid_api_key else {}
        
        url = f'https://api.trongrid.io/v1/accounts/{wallet_address}/transactions/trc20'
        params = {
            'limit': 20,
            'min_timestamp': min_timestamp
        }
        
        response = requests.get(url, params=params, headers=headers, timeout=10)
        if response.status_code != 200:
            return None
        
        data = response.json()
        transactions = data.get('data', [])
        
        usdt_contract = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
        
        for tx in transactions:
            token_info = tx.get('token_info', {})
            if token_info.get('address', '').lower() != usdt_contract.lower():
                continue
            
            tx_amount = float(tx.get('value', 0)) / (10 ** token_info.get('decimals', 6))
            
            if abs(tx_amount - amount) < 0.01:
                return {
                    'tx_hash': tx.get('transaction_id'),
                    'amount': tx_amount,
                    'timestamp': tx.get('block_timestamp'),
                    'from': tx.get('from'),
                    'to': tx.get('to')
                }
        
        return None
    except Exception as e:
        print(f'Error checking TRON transaction: {e}')
        return None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action', '')
            
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if action == 'create_payment':
                amount = body_data.get('amount')
                network = body_data.get('network', 'TRC20')
                
                if not amount or float(amount) <= 0:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Некорректная сумма'}),
                        'isBase64Encoded': False
                    }
                
                wallet_address = os.environ.get('USDT_WALLET_ADDRESS', 'TDemo123WalletAddressForTestingOnly')
                
                # Используем timezone-aware datetime для корректного сравнения в БД
                from datetime import timezone as tz
                expires_at = datetime.now(tz.utc) + timedelta(hours=1)
                
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.crypto_payments 
                       (user_id, wallet_address, amount, currency, network, status, expires_at) 
                       VALUES (%s, %s, %s, %s, %s, %s, %s) 
                       RETURNING id""",
                    (int(user_id), wallet_address, float(amount), 'USDT', network, 'pending', expires_at)
                )
                payment_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'payment_id': payment_id,
                        'wallet_address': wallet_address,
                        'amount': float(amount),
                        'network': network,
                        'expires_at': expires_at.isoformat()
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'confirm_payment':
                payment_id = body_data.get('payment_id')
                
                if not payment_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Отсутствует ID платежа'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    "SELECT * FROM crypto_payments WHERE id = %s AND user_id = %s",
                    (int(payment_id), int(user_id))
                )
                payment = cur.fetchone()
                
                if not payment:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Платеж не найден'}),
                        'isBase64Encoded': False
                    }
                
                if payment['status'] == 'confirmed':
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True, 'message': 'Платеж уже подтвержден'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, не истёк ли срок заявки
                if payment['status'] == 'cancelled':
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': False, 
                            'error': 'Срок заявки на пополнение истёк (1 час). Создайте новую заявку.'
                        }),
                        'isBase64Encoded': False
                    }
                
                # Проверяем срок expires_at
                from datetime import timezone as tz
                expires_at = payment.get('expires_at')
                if expires_at and datetime.now(tz.utc) > expires_at:
                    # Срок истёк - отменяем заявку
                    cur.execute(
                        f"UPDATE {SCHEMA}.crypto_payments SET status = 'cancelled' WHERE id = %s",
                        (int(payment_id),)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': False,
                            'error': 'Срок заявки на пополнение истёк (1 час). Создайте новую заявку.'
                        }),
                        'isBase64Encoded': False
                    }
                
                created_timestamp = int(payment['created_at'].timestamp() * 1000)
                
                tron_tx = check_tron_transaction(
                    payment['wallet_address'],
                    float(payment['amount']),
                    created_timestamp
                )
                
                if not tron_tx:
                    cur.execute(
                        f"UPDATE {SCHEMA}.crypto_payments SET status = 'pending' WHERE id = %s",
                        (int(payment_id),)
                    )
                    conn.commit()
                    
                    return {
                        'statusCode': 202,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': False,
                            'waiting': True,
                            'message': 'Ожидаем транзакцию в блокчейне. У вас есть 1 час на оплату, после чего платёж будет автоматически отменён.'
                        }),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"""UPDATE {SCHEMA}.crypto_payments 
                       SET status = %s, confirmed_at = CURRENT_TIMESTAMP, tx_hash = %s 
                       WHERE id = %s""",
                    ('confirmed', tron_tx['tx_hash'], int(payment_id))
                )
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = COALESCE(balance, 0) + %s WHERE id = %s RETURNING balance",
                    (float(payment['amount']), int(user_id))
                )
                result = cur.fetchone()
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                    (int(user_id), float(payment['amount']), 'crypto_deposit', f"Пополнение через {payment['network']}")
                )
                
                # Get username for notification
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
                user_data = cur.fetchone()
                username = user_data['username'] if user_data else 'Unknown'
                
                # Send Telegram notification
                send_telegram_notification(
                    'balance_topup',
                    {'username': username, 'user_id': user_id},
                    {'amount': float(payment['amount'])}
                )
                
                # Начисление реферального бонуса (10% от пополнения)
                cur.execute(
                    f"""SELECT r.referrer_id, u.username 
                       FROM {SCHEMA}.referrals r 
                       JOIN {SCHEMA}.users u ON r.referrer_id = u.id 
                       WHERE r.referred_user_id = %s AND r.status = 'pending'
                       LIMIT 1""",
                    (int(user_id),)
                )
                referrer = cur.fetchone()
                
                if referrer:
                    referral_bonus = float(payment['amount']) * 0.10
                    
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET balance = COALESCE(balance, 0) + %s WHERE id = %s",
                        (referral_bonus, referrer['referrer_id'])
                    )
                    
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                        (referrer['referrer_id'], referral_bonus, 'referral_bonus', f"Реферальный бонус 10% от пополнения реферала")
                    )
                    
                    cur.execute(
                        f"UPDATE {SCHEMA}.referrals SET status = 'active', bonus_earned = COALESCE(bonus_earned, 0) + %s WHERE referrer_id = %s AND referred_user_id = %s",
                        (referral_bonus, referrer['referrer_id'], int(user_id))
                    )
                    
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                        (referrer['referrer_id'], 'success', 'Реферальный бонус', f"Вы получили +{referral_bonus:.2f} USDT (10%) от пополнения вашего реферала!")
                    )
                
                cur.execute(
                    f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                    (int(user_id), 'success', 'Баланс пополнен', f"Ваш баланс успешно пополнен на {float(payment['amount']):.2f} USDT")
                )
                
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
                user_info = cur.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.users WHERE role = 'admin'"
                )
                admins = cur.fetchall()
                
                for admin in admins:
                    cur.execute(
                        f"INSERT INTO {SCHEMA}.notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                        (admin['id'], 'admin_alert', 'Пополнение баланса', f"Пользователь {username} пополнил баланс на {float(payment['amount']):.2f} USDT")
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
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {})
            payment_id = params.get('payment_id')
            action = params.get('action', '')
            
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if action == 'all_deposits':
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (int(user_id),))
                user_role = cur.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                status_filter = params.get('status', 'all')
                
                if status_filter == 'all':
                    query = f"""
                        SELECT cp.*, u.username, u.email
                        FROM {SCHEMA}.crypto_payments cp
                        LEFT JOIN {SCHEMA}.users u ON cp.user_id = u.id
                        ORDER BY cp.created_at DESC
                        LIMIT 100
                    """
                    cur.execute(query)
                else:
                    query = f"""
                        SELECT cp.*, u.username, u.email
                        FROM {SCHEMA}.crypto_payments cp
                        LEFT JOIN {SCHEMA}.users u ON cp.user_id = u.id
                        WHERE cp.status = %s
                        ORDER BY cp.created_at DESC
                        LIMIT 100
                    """
                    cur.execute(query, (status_filter,))
                
                deposits = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'deposits': [dict(d) for d in deposits]}, default=str),
                    'isBase64Encoded': False
                }
            
            if action == 'check_pending':
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Требуется авторизация'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"""SELECT * FROM {SCHEMA}.crypto_payments 
                       WHERE user_id = %s AND status = 'pending' 
                       AND created_at > NOW() - INTERVAL '2 hours'
                       ORDER BY created_at DESC""",
                    (int(user_id),)
                )
                pending_payments = cur.fetchall()
                
                auto_confirmed = []
                for payment in pending_payments:
                    created_timestamp = int(payment['created_at'].timestamp() * 1000)
                    tron_tx = check_tron_transaction(
                        payment['wallet_address'],
                        float(payment['amount']),
                        created_timestamp
                    )
                    
                    if tron_tx:
                        cur.execute(
                            """UPDATE crypto_payments 
                               SET status = %s, confirmed_at = CURRENT_TIMESTAMP, tx_hash = %s 
                               WHERE id = %s""",
                            ('confirmed', tron_tx['tx_hash'], payment['id'])
                        )
                        
                        cur.execute(
                            "UPDATE users SET balance = COALESCE(balance, 0) + %s WHERE id = %s",
                            (float(payment['amount']), int(user_id))
                        )
                        
                        cur.execute(
                            "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                            (int(user_id), float(payment['amount']), 'crypto_deposit', f"Автоматическое зачисление USDT {payment['network']}")
                        )
                        
                        cur.execute(
                            "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                            (int(user_id), 'payment', 'Баланс пополнен', f"Зачислено {float(payment['amount']):.2f} USDT")
                        )
                        
                        auto_confirmed.append({
                            'payment_id': payment['id'],
                            'amount': float(payment['amount']),
                            'tx_hash': tron_tx['tx_hash']
                        })
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'auto_confirmed': auto_confirmed,
                        'count': len(auto_confirmed)
                    }),
                    'isBase64Encoded': False
                }
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if payment_id:
                cur.execute(
                    "SELECT * FROM crypto_payments WHERE id = %s AND user_id = %s",
                    (int(payment_id), int(user_id))
                )
                payment = cur.fetchone()
                
                if not payment:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Платеж не найден'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'payment': dict(payment)}, default=str),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT * FROM crypto_payments WHERE user_id = %s ORDER BY created_at DESC LIMIT 10",
                (int(user_id),)
            )
            payments = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'payments': [dict(p) for p in payments]}, default=str),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()