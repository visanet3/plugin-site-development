"""
Business: Гарант-сервис для безопасных сделок между пользователями
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с информацией о сделках
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from typing import Dict, Any

def serialize_datetime(obj):
    """Сериализация datetime объектов в ISO формат с UTC"""
    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        return obj.isoformat()
    return str(obj)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'list')
            
            if action == 'list':
                status_filter = params.get('status', 'all')
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                if status_filter == 'all':
                    query = """
                        SELECT ed.*, 
                            seller.username as seller_name, seller.avatar_url as seller_avatar,
                            buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                        FROM escrow_deals ed
                        LEFT JOIN users seller ON ed.seller_id = seller.id
                        LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                        ORDER BY ed.created_at DESC
                    """
                    cursor.execute(query)
                else:
                    query = """
                        SELECT ed.*, 
                            seller.username as seller_name, seller.avatar_url as seller_avatar,
                            buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                        FROM escrow_deals ed
                        LEFT JOIN users seller ON ed.seller_id = seller.id
                        LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                        WHERE ed.status = %s
                        ORDER BY ed.created_at DESC
                    """
                    cursor.execute(query, (status_filter,))
                
                deals = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'deals': [dict(d) for d in deals]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'deal':
                deal_id = params.get('id')
                if not deal_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal ID required'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                query = """
                    SELECT ed.*, 
                        seller.username as seller_name, seller.avatar_url as seller_avatar,
                        buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                    FROM escrow_deals ed
                    LEFT JOIN users seller ON ed.seller_id = seller.id
                    LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                    WHERE ed.id = %s
                """
                cursor.execute(query, (deal_id,))
                deal = cursor.fetchone()
                
                if not deal:
                    cursor.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not found'}),
                        'isBase64Encoded': False
                    }
                
                messages_query = """
                    SELECT em.*, u.username, u.avatar_url
                    FROM escrow_messages em
                    LEFT JOIN users u ON em.user_id = u.id
                    WHERE em.deal_id = %s
                    ORDER BY em.created_at ASC
                """
                cursor.execute(messages_query, (deal_id,))
                messages = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'deal': dict(deal),
                        'messages': [dict(m) for m in messages]
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unauthorized'}),
                    'isBase64Encoded': False
                }
            
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            if action == 'create_deal':
                title = body.get('title')
                description = body.get('description')
                price = body.get('price')
                
                if not all([title, description, price]):
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                query = """
                    INSERT INTO escrow_deals (seller_id, title, description, price, status)
                    VALUES (%s, %s, %s, %s, 'open')
                    RETURNING id
                """
                cursor.execute(query, (user_id, title, description, price))
                deal_id = cursor.fetchone()['id']
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Сделка создана'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deal_id': deal_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'join_deal':
                deal_id = body.get('deal_id')
                
                query = """
                    UPDATE escrow_deals
                    SET buyer_id = %s, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND buyer_id IS NULL AND status = 'open'
                """
                cursor.execute(query, (user_id, deal_id))
                
                if cursor.rowcount == 0:
                    conn.rollback()
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not available'}),
                        'isBase64Encoded': False
                    }
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Покупатель присоединился к сделке'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_message':
                deal_id = body.get('deal_id')
                message = body.get('message')
                
                if not message or not deal_id:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing message or deal_id'}),
                        'isBase64Encoded': False
                    }
                
                query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, false)
                """
                cursor.execute(query, (deal_id, user_id, message))
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'buyer_paid':
                deal_id = body.get('deal_id')
                
                query = """
                    UPDATE escrow_deals
                    SET buyer_paid = true, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND buyer_id = %s
                """
                cursor.execute(query, (deal_id, user_id))
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Покупатель подтвердил оплату'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'seller_confirm':
                deal_id = body.get('deal_id')
                
                query = """
                    UPDATE escrow_deals
                    SET seller_confirmed = true, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND seller_id = %s
                """
                cursor.execute(query, (deal_id, user_id))
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Продавец подтвердил передачу товара'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'buyer_confirm':
                deal_id = body.get('deal_id')
                
                cursor.execute('SELECT seller_id, price FROM escrow_deals WHERE id = %s AND buyer_id = %s', (deal_id, user_id))
                deal = cursor.fetchone()
                
                if not deal:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not found'}),
                        'isBase64Encoded': False
                    }
                
                query = """
                    UPDATE escrow_deals
                    SET buyer_confirmed = true, status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """
                cursor.execute(query, (deal_id,))
                
                cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (deal['price'], deal['seller_id']))
                
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'escrow', 'Получено за сделку #%s')
                """, (deal['seller_id'], deal['price'], deal_id))
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Покупатель подтвердил получение товара. Сделка завершена!'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'open_dispute':
                deal_id = body.get('deal_id')
                reason = body.get('reason', 'Не указана причина')
                
                query = """
                    UPDATE escrow_deals
                    SET dispute = true, dispute_reason = %s, status = 'dispute', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND (seller_id = %s OR buyer_id = %s)
                """
                cursor.execute(query, (reason, deal_id, user_id, user_id))
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, f'Открыт спор: {reason}'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            cursor.close()
    
    finally:
        conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }
