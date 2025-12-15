import json
import os
from datetime import datetime, timedelta
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

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
    
    conn = None
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute(
            "SELECT id, username, balance, vip_until FROM t_p32599880_plugin_site_developm.users WHERE id = %s",
            (user_id,)
        )
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': False, 'error': 'User not found'}),
                'isBase64Encoded': False
            }
        
        balance = float(user['balance'] or 0)
        
        if balance < VIP_PRICE:
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
        current_vip_until = user['vip_until']
        
        if current_vip_until and current_vip_until > now:
            new_vip_until = current_vip_until + timedelta(days=VIP_DURATION_DAYS)
        else:
            new_vip_until = now + timedelta(days=VIP_DURATION_DAYS)
        
        new_balance = balance - VIP_PRICE
        
        cur.execute(
            """
            UPDATE t_p32599880_plugin_site_developm.users 
            SET balance = %s, vip_until = %s 
            WHERE id = %s
            """,
            (new_balance, new_vip_until, user_id)
        )
        
        cur.execute(
            """
            INSERT INTO t_p32599880_plugin_site_developm.transactions 
            (user_id, amount, type, description, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (user_id, -VIP_PRICE, 'vip_purchase', f'Покупка VIP статуса на {VIP_DURATION_DAYS} дней', now)
        )
        
        conn.commit()
        
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
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            cur.close()
            conn.close()