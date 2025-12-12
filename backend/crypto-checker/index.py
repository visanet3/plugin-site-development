'''
Business: Автоматическая проверка криптовалютных транзакций в блокчейне
Args: event - dict с httpMethod (триггер для проверки pending платежей)
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с количеством обработанных платежей
'''

import json
import os
from typing import Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

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
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        current_time = datetime.now(timezone.utc)
        
        # Получаем все pending платежи
        cur.execute(
            """SELECT * FROM crypto_payments 
               WHERE status = 'pending'
               ORDER BY created_at ASC
               LIMIT 100"""
        )
        pending_payments = cur.fetchall()
        
        # Получаем отменённые платежи (чтобы проверить, не оплатил ли пользователь после истечения срока)
        cur.execute(
            """SELECT * FROM crypto_payments 
               WHERE status = 'cancelled' 
               AND created_at > NOW() - INTERVAL '24 hours'
               ORDER BY created_at ASC
               LIMIT 50"""
        )
        cancelled_payments = cur.fetchall()
        
        processed_count = 0
        confirmed_count = 0
        expired_count = 0
        rejected_late_count = 0
        
        for payment in pending_payments:
            payment_id = payment['id']
            user_id = payment['user_id']
            expires_at = payment.get('expires_at')
            
            # Проверяем, не истёк ли срок оплаты (1 час)
            if expires_at and current_time > expires_at:
                cur.execute(
                    "UPDATE crypto_payments SET status = 'cancelled' WHERE id = %s",
                    (payment_id,)
                )
                
                cur.execute(
                    "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                    (user_id, 'warning', 'Платеж отменён', f"Платеж на {float(payment['amount']):.2f} USDT был автоматически отменён. Срок оплаты истёк (1 час).")
                )
                
                expired_count += 1
                processed_count += 1
                continue
            
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
                    ('confirmed', tron_tx['tx_hash'], payment_id)
                )
                
                cur.execute(
                    "UPDATE users SET balance = COALESCE(balance, 0) + %s WHERE id = %s",
                    (float(payment['amount']), user_id)
                )
                
                cur.execute(
                    "INSERT INTO transactions (user_id, amount, type, description) VALUES (%s, %s, %s, %s)",
                    (user_id, float(payment['amount']), 'crypto_deposit', f"Пополнение через {payment['network']}")
                )
                
                cur.execute(
                    "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                    (user_id, 'success', 'Баланс пополнен', f"Ваш баланс успешно пополнен на {float(payment['amount']):.2f} USDT")
                )
                
                cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
                user_info = cur.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                
                cur.execute(
                    "INSERT INTO admin_notifications (type, title, message, related_id, related_type) VALUES (%s, %s, %s, %s, %s)",
                    ('balance_topup', '💰 Пополнение баланса', f"Пользователь {username} пополнил баланс на {float(payment['amount']):.2f} USDT", user_id, 'user')
                )
                
                confirmed_count += 1
                processed_count += 1
        
        # Проверяем отменённые платежи на случай, если пользователь оплатил после истечения срока
        for payment in cancelled_payments:
            payment_id = payment['id']
            user_id = payment['user_id']
            
            created_timestamp = int(payment['created_at'].timestamp() * 1000)
            
            tron_tx = check_tron_transaction(
                payment['wallet_address'],
                float(payment['amount']),
                created_timestamp
            )
            
            if tron_tx:
                # Транзакция найдена, но заявка уже отменена - НЕ зачисляем средства
                cur.execute(
                    """UPDATE crypto_payments 
                       SET status = %s, tx_hash = %s, confirmed_at = CURRENT_TIMESTAMP 
                       WHERE id = %s""",
                    ('expired_paid', tron_tx['tx_hash'], payment_id)
                )
                
                cur.execute(
                    "INSERT INTO notifications (user_id, type, title, message) VALUES (%s, %s, %s, %s)",
                    (user_id, 'error', 'Оплата после истечения срока', 
                     f"Платёж на {float(payment['amount']):.2f} USDT был оплачен после истечения срока заявки (1 час). "
                     f"Средства не зачислены. Обратитесь в поддержку для возврата. TX: {tron_tx['tx_hash'][:16]}...")
                )
                
                cur.execute("SELECT username FROM users WHERE id = %s", (user_id,))
                user_info = cur.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                
                cur.execute(
                    "INSERT INTO admin_notifications (type, title, message, related_id, related_type) VALUES (%s, %s, %s, %s, %s)",
                    ('payment_late', '⚠️ Оплата после истечения', 
                     f"Пользователь {username} оплатил {float(payment['amount']):.2f} USDT ПОСЛЕ истечения срока заявки. "
                     f"Средства НЕ зачислены. TX: {tron_tx['tx_hash']}", payment_id, 'payment')
                )
                
                rejected_late_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'processed': processed_count,
                'confirmed': confirmed_count,
                'expired': expired_count,
                'rejected_late': rejected_late_count
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error in crypto checker: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }