import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

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

def get_admin_orders(event: Dict[str, Any]) -> Dict[str, Any]:
    '''Get all Flash USDT orders for admin panel'''
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Database configuration error'})
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute('''
            SELECT 
                fo.id, fo.user_id, fo.package_id, fo.amount, fo.price, 
                fo.wallet_address, fo.status, fo.created_at, fo.updated_at,
                u.username
            FROM flash_usdt_orders fo
            LEFT JOIN users u ON fo.user_id = u.id
            ORDER BY fo.created_at DESC
        ''')
        
        orders = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'orders': [dict(order) for order in orders]
            }, default=str)
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Process Flash USDT purchases with balance check and deduction, admin orders view
    Args: event with httpMethod, queryStringParameters (action=admin_orders), body for purchases
    Returns: HTTP response with transaction details, orders list, or error
    '''
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
            'body': ''
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters') or {}
        action = query_params.get('action')
        
        if action == 'admin_orders':
            return get_admin_orders(event)
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Invalid action'})
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('userId')
        package_id = body_data.get('packageId')
        amount = body_data.get('amount')
        price = body_data.get('price')
        wallet_address = body_data.get('walletAddress')
        
        if user_id is None or package_id is None or amount is None or price is None or not wallet_address:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing required fields'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Database configuration error'})
            }
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        cursor.execute('SELECT id, balance, username FROM users WHERE id = %s', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'User not found'})
            }
        
        user_balance = float(user['balance'] or 0)
        
        if user_balance < price:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({
                    'error': 'Insufficient balance',
                    'balance': user_balance,
                    'required': price
                })
            }
        
        new_balance = user_balance - price
        cursor.execute(
            'UPDATE users SET balance = %s, flash_usdt_balance = flash_usdt_balance + %s WHERE id = %s',
            (new_balance, amount, user_id)
        )
        
        cursor.execute('''
            INSERT INTO flash_usdt_orders (user_id, package_id, amount, price, wallet_address, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, NOW())
            RETURNING id, created_at
        ''', (user_id, package_id, amount, price, wallet_address, 'pending'))
        
        order = cursor.fetchone()
        
        conn.commit()
        cursor.close()
        conn.close()
        
        # Send Telegram notification to admin
        send_telegram_notification(
            'flash_usdt_purchase',
            {'username': user['username'], 'user_id': user_id},
            {
                'amount': amount,
                'price': price,
                'package': f'Package #{package_id}',
                'wallet': wallet_address
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'orderId': order['id'],
                'newBalance': new_balance,
                'amount': amount,
                'walletAddress': wallet_address,
                'createdAt': str(order['created_at'])
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }