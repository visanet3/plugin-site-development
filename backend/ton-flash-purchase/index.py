"""
Покупка TON Flash USDT пакетов

Обрабатывает покупку TON Flash пакетов, списывая средства с баланса пользователя
"""
import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from cors_helper import fix_cors_response

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = json.loads(event.get('body', '{}'))
        user_id = body.get('userId')
        package_id = body.get('packageId')
        package_name = body.get('packageName')
        price = body.get('price')
        amount = body.get('amount')
        package_type = body.get('type', 'ton-flash')
        ton_address = body.get('tonAddress', '')
        
        if user_id is None or package_id is None or not price or not amount or not ton_address:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required fields (userId, packageId, price, amount, tonAddress)'})
            }
        
        dsn = os.environ['DATABASE_URL']
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute('SELECT balance, flash_btc_balance, flash_usdt_balance FROM users WHERE id = %s', (user_id,))
        result = cur.fetchone()
        
        if not result:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'User not found'})
            }
        
        # КРИТИЧЕСКАЯ ПРОВЕРКА: вычисляем реальный баланс без Flash токенов
        total_balance = float(result[0] or 0)
        flash_btc = float(result[1] or 0)
        flash_usdt = float(result[2] or 0)
        real_balance = total_balance - flash_btc - flash_usdt
        
        if real_balance < price:
            cur.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': f'Недостаточно реальных средств! Flash-токены нельзя использовать для покупки TON Flash. Доступно: {real_balance:.2f} USDT',
                    'balance': real_balance,
                    'required': price
                })
            }
        
        new_balance = total_balance - price
        
        cur.execute(
            'UPDATE users SET balance = %s WHERE id = %s',
            (new_balance, user_id)
        )
        
        cur.execute('''
            INSERT INTO ton_flash_purchases 
            (user_id, package_id, package_name, price, amount, ton_address, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        ''', (user_id, package_id, package_name, price, amount, ton_address, datetime.now()))
        
        purchase_id = cur.fetchone()[0]
        
        cur.execute('''
            INSERT INTO transactions 
            (user_id, amount, type, description, created_at)
            VALUES (%s, %s, %s, %s, %s)
        ''', (
            user_id, 
            -price, 
            'ton_flash_purchase',
            f'Покупка TON Flash пакета "{package_name}" ({amount} USDT)',
            datetime.now()
        ))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'purchaseId': purchase_id,
                'newBalance': new_balance,
                'amount': amount,
                'message': f'Успешно куплен пакет "{package_name}"'
            })
        }
        
    except Exception as e:
        response = {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
        return fix_cors_response(response, event, include_credentials=True)