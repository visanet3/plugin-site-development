import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import pg8000.native

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Purchase VIP subscription for 30 days
    Args: event with httpMethod, body (action, user_id), headers (X-User-Id)
    Returns: HTTP response with success status and new vip_until date
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
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id_header = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_header:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'User ID required'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_header)
    
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'purchase_vip':
            return purchase_vip(user_id)
    
    return {
        'statusCode': 400,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'success': False, 'error': 'Invalid request'}),
        'isBase64Encoded': False
    }

def purchase_vip(user_id: int) -> Dict[str, Any]:
    VIP_PRICE = 1650
    VIP_DURATION_DAYS = 30
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': 'Database connection error'}),
            'isBase64Encoded': False
        }
    
    try:
        from urllib.parse import urlparse
        print(f"[DEBUG] Connecting to database with DSN: {dsn[:30]}...")
        parsed = urlparse(dsn)
        
        print(f"[DEBUG] Parsed - host: {parsed.hostname}, port: {parsed.port}, db: {parsed.path[1:] if parsed.path else 'postgres'}")
        conn = pg8000.native.Connection(
            user=parsed.username,
            password=parsed.password,
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:] if parsed.path else 'postgres'
        )
        print("[DEBUG] Database connection established")
        
        query = f"SELECT id, username, balance, vip_until FROM t_p32599880_plugin_site_developm.users WHERE id = {user_id}"
        print(f"[DEBUG] Executing query: {query}")
        rows = conn.run(query)
        print(f"[DEBUG] Query returned {len(rows)} rows")
        
        if not rows:
            conn.close()
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        user = rows[0]
        balance = float(user[2] or 0)

        
        if balance < VIP_PRICE:
            conn.close()
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'success': False,
                    'error': f'Insufficient balance. Required: {VIP_PRICE} USDT, Available: {balance} USDT'
                }),
                'isBase64Encoded': False
            }
        
        now = datetime.utcnow()
        current_vip_until = user[3]
        
        if current_vip_until and current_vip_until > now:
            new_vip_until = current_vip_until + timedelta(days=VIP_DURATION_DAYS)
        else:
            new_vip_until = now + timedelta(days=VIP_DURATION_DAYS)
        
        new_balance = balance - VIP_PRICE
        
        update_query = f"""
            UPDATE t_p32599880_plugin_site_developm.users 
            SET balance = {new_balance}, vip_until = '{new_vip_until.isoformat()}' 
            WHERE id = {user_id}
        """
        conn.run(update_query)
        
        insert_query = f"""
            INSERT INTO t_p32599880_plugin_site_developm.transactions 
            (user_id, amount, type, description, created_at)
            VALUES ({user_id}, {-VIP_PRICE}, 'vip_purchase', 'Покупка VIP статуса на {VIP_DURATION_DAYS} дней', '{now.isoformat()}')
        """
        conn.run(insert_query)
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'new_balance': new_balance,
                'vip_until': new_vip_until.isoformat(),
                'message': f'VIP статус успешно приобретён на {VIP_DURATION_DAYS} дней'
            }),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        print(f"[ERROR] Exception occurred: {type(e).__name__}: {str(e)}")
        import traceback
        print(f"[ERROR] Traceback: {traceback.format_exc()}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }