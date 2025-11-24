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
    conn = None
    
    try:
        conn = psycopg2.connect(dsn)
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'list')
            
            if action == 'list':
                status_filter = params.get('status', 'all')
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Для открытых сделок
                if status_filter == 'open':
                    if user_id:
                        # Авторизованный пользователь видит:
                        # 1. Все сделки БЕЗ покупателя (status='open' AND buyer_id IS NULL)
                        # 2. Свои сделки в процессе (где он продавец или покупатель И status IN ('open', 'in_progress'))
                        query = """
                            SELECT ed.*, 
                                seller.username as seller_name, seller.avatar_url as seller_avatar,
                                buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                            FROM escrow_deals ed
                            LEFT JOIN users seller ON ed.seller_id = seller.id
                            LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                            WHERE (ed.status = 'open' AND ed.buyer_id IS NULL)
                               OR (ed.status IN ('open', 'in_progress') AND (ed.seller_id = %s OR ed.buyer_id = %s))
                            ORDER BY ed.created_at DESC
                        """
                        cursor.execute(query, (user_id, user_id))
                    else:
                        # Неавторизованный видит только открытые без покупателя
                        query = """
                            SELECT ed.*, 
                                seller.username as seller_name, seller.avatar_url as seller_avatar,
                                buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                            FROM escrow_deals ed
                            LEFT JOIN users seller ON ed.seller_id = seller.id
                            LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                            WHERE ed.status = 'open' AND ed.buyer_id IS NULL
                            ORDER BY ed.created_at DESC
                        """
                        cursor.execute(query)
                # Для завершенных и споров - только участники видят сделки
                elif status_filter == 'completed' or status_filter == 'dispute':
                    if user_id:
                        query = """
                            SELECT ed.*, 
                                seller.username as seller_name, seller.avatar_url as seller_avatar,
                                buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                            FROM escrow_deals ed
                            LEFT JOIN users seller ON ed.seller_id = seller.id
                            LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                            WHERE ed.status = %s AND (ed.seller_id = %s OR ed.buyer_id = %s)
                            ORDER BY ed.created_at DESC
                        """
                        cursor.execute(query, (status_filter, user_id, user_id))
                    else:
                        # Неавторизованные пользователи не видят завершенные сделки
                        deals = []
                        cursor.close()
                        return {
                            'statusCode': 200,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'deals': deals}, default=serialize_datetime),
                            'isBase64Encoded': False
                        }
                else:
                    # Для всех остальных фильтров показываем только открытые без покупателя
                    query = """
                        SELECT ed.*, 
                            seller.username as seller_name, seller.avatar_url as seller_avatar,
                            buyer.username as buyer_name, buyer.avatar_url as buyer_avatar
                        FROM escrow_deals ed
                        LEFT JOIN users seller ON ed.seller_id = seller.id
                        LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                        WHERE ed.status = 'open' AND ed.buyer_id IS NULL
                        ORDER BY ed.created_at DESC
                    """
                    cursor.execute(query)
                
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
                
                # Проверяем права доступа к сообщениям
                # Только участники сделки и админы видят сообщения
                if user_id:
                    cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
                    user_role_data = cursor.fetchone()
                    is_admin = user_role_data and user_role_data.get('role') == 'admin'
                    is_participant = deal['seller_id'] == int(user_id) or deal['buyer_id'] == int(user_id)
                    
                    if is_admin or is_participant:
                        messages_query = """
                            SELECT em.*, u.username, u.avatar_url, u.role as user_role
                            FROM escrow_messages em
                            LEFT JOIN users u ON em.user_id = u.id
                            WHERE em.deal_id = %s
                            ORDER BY em.created_at ASC
                        """
                        cursor.execute(messages_query, (deal_id,))
                        messages = cursor.fetchall()
                    else:
                        messages = []
                else:
                    messages = []
                
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
            
            elif action == 'get_dispute_notifications':
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Unauthorized'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                cursor.execute("""
                    SELECT * FROM escrow_dispute_notifications
                    WHERE user_id = %s AND is_read = false
                    ORDER BY created_at DESC
                """, (user_id,))
                
                notifications = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'notifications': [dict(n) for n in notifications]}, default=serialize_datetime),
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
                
                cursor.execute('SELECT title, price FROM escrow_deals WHERE id = %s AND buyer_id IS NULL AND status = \'open\'', (deal_id,))
                deal = cursor.fetchone()
                
                if not deal:
                    conn.rollback()
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not available'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('SELECT balance FROM users WHERE id = %s', (user_id,))
                user_data = cursor.fetchone()
                
                if not user_data or user_data['balance'] < deal['price']:
                    conn.rollback()
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Insufficient balance'}),
                        'isBase64Encoded': False
                    }
                
                query = """
                    UPDATE escrow_deals
                    SET buyer_id = %s, status = 'in_progress', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """
                cursor.execute(query, (user_id, deal_id))
                
                cursor.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (deal['price'], user_id))
                
                description = f"Блокировка средств для сделки: {deal['title']}"
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'escrow_purchase', %s)
                """, (user_id, -deal['price'], description))
                
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
                
                cursor.execute('SELECT seller_id, buyer_id, price, title FROM escrow_deals WHERE id = %s AND buyer_id = %s', (deal_id, user_id))
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
                
                seller_desc = f"Продажа через гарант: {deal['title']}"
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'escrow_sale', %s)
                """, (deal['seller_id'], deal['price'], seller_desc))
                
                buyer_desc = f"Покупка завершена: {deal['title']}"
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'escrow_complete', %s)
                """, (deal['buyer_id'], 0, buyer_desc))
                
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
                
                cursor.execute('SELECT title, seller_id, buyer_id FROM escrow_deals WHERE id = %s', (deal_id,))
                deal_info = cursor.fetchone()
                
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
                
                cursor.execute('SELECT username FROM users WHERE id = %s', (user_id,))
                user_info = cursor.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                
                cursor.execute("""
                    INSERT INTO admin_notifications (type, title, message, related_id, related_type)
                    VALUES (%s, %s, %s, %s, %s)
                """, ('escrow_dispute', '⚠️ Открыт спор в сделке', f"Пользователь {username} открыл спор в сделке \"{deal_info['title'] if deal_info else 'Неизвестно'}\"", deal_id, 'escrow'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'resolve_dispute':
                deal_id = body.get('deal_id')
                winner_id = body.get('winner_id')
                
                cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
                user_role = cursor.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    SELECT ed.seller_id, ed.buyer_id, ed.price, ed.title, 
                           seller.username as seller_name,
                           buyer.username as buyer_name
                    FROM escrow_deals ed
                    LEFT JOIN users seller ON ed.seller_id = seller.id
                    LEFT JOIN users buyer ON ed.buyer_id = buyer.id
                    WHERE ed.id = %s AND ed.status = 'dispute'
                """, (deal_id,))
                deal = cursor.fetchone()
                
                if not deal:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not found or not in dispute'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    UPDATE escrow_deals
                    SET status = 'completed', admin_decision = %s, completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (f'Спор разрешен в пользу пользователя ID {winner_id}', deal_id))
                
                cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (deal['price'], winner_id))
                
                winner_name = deal['seller_name'] if winner_id == deal['seller_id'] else deal['buyer_name']
                winner_desc = f"Спор разрешен в вашу пользу: {deal['title']}"
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'dispute_win', %s)
                """, (winner_id, deal['price'], winner_desc))
                
                loser_id = deal['buyer_id'] if winner_id == deal['seller_id'] else deal['seller_id']
                loser_desc = f"Спор разрешен не в вашу пользу: {deal['title']}"
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'dispute_loss', %s)
                """, (loser_id, 0, loser_desc))
                
                msg_query = """
                    INSERT INTO escrow_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, f'Администрация разрешила спор в пользу {winner_name}'))
                
                winner_notif_msg = f'Спор по сделке "{deal["title"]}" разрешен в вашу пользу. Средства зачислены на баланс (+{deal["price"]} USDT)'
                cursor.execute("""
                    INSERT INTO escrow_dispute_notifications (user_id, deal_id, message)
                    VALUES (%s, %s, %s)
                """, (winner_id, deal_id, winner_notif_msg))
                
                loser_notif_msg = f'Спор по сделке "{deal["title"]}" разрешен не в вашу пользу. Средства переданы другой стороне'
                cursor.execute("""
                    INSERT INTO escrow_dispute_notifications (user_id, deal_id, message)
                    VALUES (%s, %s, %s)
                """, (loser_id, deal_id, loser_notif_msg))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'mark_dispute_notifications_read':
                cursor.execute("""
                    UPDATE escrow_dispute_notifications
                    SET is_read = true
                    WHERE user_id = %s AND is_read = false
                """, (user_id,))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'delete_deal':
                deal_id = body.get('deal_id')
                
                if not deal_id:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Missing deal_id'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('SELECT role FROM users WHERE id = %s', (user_id,))
                user_data = cursor.fetchone()
                
                if not user_data or user_data['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute('DELETE FROM escrow_messages WHERE deal_id = %s', (deal_id,))
                cursor.execute('DELETE FROM escrow_dispute_notifications WHERE deal_id = %s', (deal_id,))
                cursor.execute('DELETE FROM escrow_deals WHERE id = %s', (deal_id,))
                
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
        if conn:
            conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }