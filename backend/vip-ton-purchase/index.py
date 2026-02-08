import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
from typing import Dict, Any

SCHEMA = 't_p32599880_plugin_site_developm'
TON_WALLET = 'UQCF1nZKca68-nGFl7z8CRDMiG5XeiwAf7LKvBu-dA2icqDl'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Система покупки VIP статуса через криптовалюту TON
    Args: event - dict с httpMethod, headers, body, queryStringParameters
          context - object с request_id и другими атрибутами
    Returns: HTTP response dict
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
    user_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    user_id = int(user_id_str)
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL не настроен'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'my_orders')
            
            if action == 'my_orders':
                cur.execute(f"""
                    SELECT id, amount_ton, ton_wallet_address, status, vip_duration_days,
                           user_transaction_hash, admin_comment, created_at, updated_at, completed_at
                    FROM {SCHEMA}.vip_ton_orders
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 20
                """, (user_id,))
                
                orders = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'orders': [dict(row) for row in orders],
                        'ton_wallet': TON_WALLET
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_orders':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                admin_row = cur.fetchone()
                
                if not admin_row or admin_row['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT o.*, u.username, u.email
                    FROM {SCHEMA}.vip_ton_orders o
                    JOIN {SCHEMA}.users u ON o.user_id = u.id
                    ORDER BY 
                        CASE WHEN o.status = 'pending' THEN 0 ELSE 1 END,
                        o.created_at DESC
                    LIMIT 100
                """)
                
                orders = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'orders': [dict(row) for row in orders]}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create_order':
                amount_ton = body_data.get('amount_ton', 100)
                vip_days = body_data.get('vip_duration_days', 30)
                
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                user_row = cur.fetchone()
                
                if not user_row:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.vip_ton_orders 
                    (user_id, username, amount_ton, vip_duration_days, status)
                    VALUES (%s, %s, %s, %s, 'pending')
                    RETURNING id
                """, (user_id, user_row['username'], amount_ton, vip_days))
                
                order_id = cur.fetchone()['id']
                
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.admin_notifications 
                    (type, title, message, related_id, related_type)
                    VALUES (%s, %s, %s, %s, %s)
                """, (
                    'vip_ton_purchase',
                    'Новая заявка на VIP через TON',
                    f'Пользователь {user_row["username"]} создал заявку на покупку VIP ({vip_days} дней) за {amount_ton} TON',
                    order_id,
                    'vip_ton_order'
                ))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'order_id': order_id,
                        'ton_wallet': TON_WALLET,
                        'amount_ton': amount_ton
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'update_transaction_hash':
                order_id = body_data.get('order_id')
                tx_hash = body_data.get('transaction_hash', '').strip()
                
                if not order_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите order_id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.vip_ton_orders
                    SET user_transaction_hash = %s, updated_at = %s
                    WHERE id = %s AND user_id = %s
                """, (tx_hash, datetime.utcnow(), order_id, user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_approve':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                admin_row = cur.fetchone()
                
                if not admin_row or admin_row['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                order_id = body_data.get('order_id')
                admin_comment = body_data.get('admin_comment', '')
                
                cur.execute(f"""
                    SELECT user_id, vip_duration_days, username
                    FROM {SCHEMA}.vip_ton_orders
                    WHERE id = %s
                """, (order_id,))
                
                order = cur.fetchone()
                
                if not order:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заказ не найден'}),
                        'isBase64Encoded': False
                    }
                
                vip_until = datetime.utcnow() + timedelta(days=order['vip_duration_days'])
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.users
                    SET vip_until = %s
                    WHERE id = %s
                """, (vip_until, order['user_id']))
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.vip_ton_orders
                    SET status = 'completed',
                        admin_comment = %s,
                        completed_at = %s,
                        updated_at = %s
                    WHERE id = %s
                """, (admin_comment, datetime.utcnow(), datetime.utcnow(), order_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': f'VIP выдан пользователю {order["username"]}'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_reject':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                admin_row = cur.fetchone()
                
                if not admin_row or admin_row['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                order_id = body_data.get('order_id')
                admin_comment = body_data.get('admin_comment', 'Отклонено администратором')
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.vip_ton_orders
                    SET status = 'rejected',
                        admin_comment = %s,
                        updated_at = %s
                    WHERE id = %s
                """, (admin_comment, datetime.utcnow(), order_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Заявка отклонена'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_grant_vip':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                admin_row = cur.fetchone()
                
                if not admin_row or admin_row['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                target_user_id = body_data.get('target_user_id')
                vip_days = body_data.get('vip_days', 30)
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите target_user_id'}),
                        'isBase64Encoded': False
                    }
                
                vip_until = datetime.utcnow() + timedelta(days=vip_days)
                
                cur.execute(f"""
                    UPDATE {SCHEMA}.users
                    SET vip_until = %s
                    WHERE id = %s
                """, (vip_until, target_user_id))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': f'VIP статус выдан на {vip_days} дней'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()