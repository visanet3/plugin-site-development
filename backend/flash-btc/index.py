import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import requests
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from cors_helper import fix_cors_response

def serialize_datetime(obj):
    if isinstance(obj, datetime):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def send_telegram_notification(message: str):
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
    chat_id = os.environ.get('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        return
    
    try:
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        requests.post(url, json={
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML'
        }, timeout=5)
    except:
        pass

def handler(event, context):
    dsn = os.environ.get('DATABASE_URL')
    
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database not configured'}),
            'isBase64Encoded': False
        }
    
    method = event.get('httpMethod', 'GET')
    
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
    
    conn = psycopg2.connect(dsn)
    
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        schema_query = "SELECT current_schema()"
        cur.execute(schema_query)
        SCHEMA = cur.fetchone()['current_schema']
        
        if method == 'POST':
            body_str = event.get('body', '{}')
            if not body_str or body_str.strip() == '':
                body_str = '{}'
            body = json.loads(body_str)
            user_id = body.get('userId')
            package_id = body.get('packageId')
            amount = body.get('amount')
            price = body.get('price')
            wallet_address = body.get('walletAddress')
            
            if not all([user_id, amount, price, wallet_address]):
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно данных'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT id, username, balance FROM {SCHEMA}.users WHERE id = %s", (user_id,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пользователь не найден'}),
                    'isBase64Encoded': False
                }
            
            if user['balance'] < price:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно средств на балансе'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                INSERT INTO {SCHEMA}.flash_btc_orders (user_id, package_id, amount, price, wallet_address, status)
                VALUES (%s, %s, %s, %s, %s, 'completed')
                RETURNING id
            """, (user_id, package_id, amount, price, wallet_address))
            
            order_id = cur.fetchone()['id']
            
            new_balance = user['balance'] - price
            cur.execute(f"""
                UPDATE {SCHEMA}.users 
                SET balance = %s,
                    flash_btc_balance = flash_btc_balance + %s
                WHERE id = %s
            """, (new_balance, amount, user_id))
            
            cur.execute(f"""
                INSERT INTO {SCHEMA}.transactions (user_id, type, amount, description)
                VALUES (%s, 'withdrawal', %s, %s)
            """, (user_id, price, f'Покупка Flash BTC: {amount} BTC'))
            
            conn.commit()
            
            package_name = 'Тестовая покупка' if package_id == 0 else f'Пакет #{package_id}'
            telegram_message = f"""
🟠 <b>Новый заказ Flash BTC</b>

📦 {package_name}
💰 Сумма: {amount} BTC
💵 Цена: ${price:,.0f} USDT
👤 Пользователь: {user['username']} (ID: {user_id})
📍 Кошелек: <code>{wallet_address}</code>
🆔 Заказ: #{order_id}
"""
            send_telegram_notification(telegram_message)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'orderId': order_id,
                    'newBalance': float(new_balance)
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            user_id_header = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
            
            if not user_id_header:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id_header,))
            user = cur.fetchone()
            
            if not user or user['role'] != 'admin':
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT 
                    o.id,
                    o.user_id,
                    u.username,
                    u.email,
                    o.package_id,
                    o.amount,
                    o.price,
                    o.wallet_address,
                    o.status,
                    o.created_at,
                    o.updated_at
                FROM {SCHEMA}.flash_btc_orders o
                JOIN {SCHEMA}.users u ON o.user_id = u.id
                ORDER BY o.created_at DESC
                LIMIT 100
            """)
            
            orders = cur.fetchall()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'orders': [dict(order) for order in orders]
                }, default=serialize_datetime),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
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
        conn.close()


# CORS Middleware - автоматически исправляет CORS во всех ответах
_original_handler = handler

def handler(event, context):
    """Wrapper для автоматического исправления CORS"""
    response = _original_handler(event, context)
    return fix_cors_response(response, event, include_credentials=True)