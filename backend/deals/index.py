"""
Business: Гарант-сервис для безопасных сделок с поэтапной системой
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с данными о сделках
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from typing import Dict, Any
from decimal import Decimal

def serialize_datetime(obj):
    """Сериализация datetime и Decimal объектов"""
    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        return obj.isoformat()
    if isinstance(obj, Decimal):
        return float(obj)
    return str(obj)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
                status_filter = params.get('status', 'active')
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                if status_filter == 'active':
                    # Активные объявления (без покупателя)
                    query = """
                        SELECT d.*, 
                            s.username as seller_name, s.avatar_url as seller_avatar
                        FROM deals d
                        JOIN users s ON d.seller_id = s.id
                        WHERE d.status = 'active' AND d.buyer_id IS NULL
                        ORDER BY d.created_at DESC
                    """
                    cursor.execute(query)
                    
                elif status_filter == 'my_deals':
                    # Мои сделки (где я продавец или покупатель)
                    if not user_id:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Unauthorized'}),
                            'isBase64Encoded': False
                        }
                    
                    query = """
                        SELECT d.*, 
                            s.username as seller_name, s.avatar_url as seller_avatar,
                            b.username as buyer_name, b.avatar_url as buyer_avatar
                        FROM deals d
                        JOIN users s ON d.seller_id = s.id
                        LEFT JOIN users b ON d.buyer_id = b.id
                        WHERE (d.seller_id = %s OR d.buyer_id = %s)
                          AND d.status IN ('in_progress', 'active')
                        ORDER BY d.updated_at DESC
                    """
                    cursor.execute(query, (user_id, user_id))
                    
                elif status_filter == 'completed':
                    # Завершенные сделки
                    if not user_id:
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Unauthorized'}),
                            'isBase64Encoded': False
                        }
                    
                    query = """
                        SELECT d.*, 
                            s.username as seller_name, s.avatar_url as seller_avatar,
                            b.username as buyer_name, b.avatar_url as buyer_avatar
                        FROM deals d
                        JOIN users s ON d.seller_id = s.id
                        LEFT JOIN users b ON d.buyer_id = b.id
                        WHERE (d.seller_id = %s OR d.buyer_id = %s)
                          AND d.status = 'completed'
                        ORDER BY d.updated_at DESC
                    """
                    cursor.execute(query, (user_id, user_id))
                else:
                    # По умолчанию активные
                    query = """
                        SELECT d.*, 
                            s.username as seller_name, s.avatar_url as seller_avatar
                        FROM deals d
                        JOIN users s ON d.seller_id = s.id
                        WHERE d.status = 'active' AND d.buyer_id IS NULL
                        ORDER BY d.created_at DESC
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
            
            elif action == 'admin_all_deals':
                # Админская функция - все сделки
                if not user_id:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Unauthorized'}),
                        'isBase64Encoded': False
                    }
                
                cursor = conn.cursor(cursor_factory=RealDictCursor)
                
                # Проверка что пользователь админ
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_role = cursor.fetchone()
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                query = """
                    SELECT d.*, 
                        s.username as seller_username, s.avatar_url as seller_avatar_url,
                        b.username as buyer_username, b.avatar_url as buyer_avatar_url
                    FROM deals d
                    JOIN users s ON d.seller_id = s.id
                    LEFT JOIN users b ON d.buyer_id = b.id
                    ORDER BY d.created_at DESC
                """
                cursor.execute(query)
                deals = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deals': [dict(d) for d in deals]}, default=serialize_datetime),
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
                    SELECT d.*, 
                        s.username as seller_name, s.avatar_url as seller_avatar,
                        b.username as buyer_name, b.avatar_url as buyer_avatar
                    FROM deals d
                    JOIN users s ON d.seller_id = s.id
                    LEFT JOIN users b ON d.buyer_id = b.id
                    WHERE d.id = %s
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
                
                # Загрузка сообщений чата
                messages_query = """
                    SELECT dm.*, u.username, u.avatar_url
                    FROM deal_messages dm
                    LEFT JOIN users u ON dm.user_id = u.id
                    WHERE dm.deal_id = %s
                    ORDER BY dm.created_at ASC
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
                    INSERT INTO deals (seller_id, title, description, price, status, step)
                    VALUES (%s, %s, %s, %s, 'active', 'waiting_buyer')
                    RETURNING id
                """
                cursor.execute(query, (user_id, title, description, price))
                deal_id = cursor.fetchone()['id']
                
                # Системное сообщение
                msg_query = """
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """
                cursor.execute(msg_query, (deal_id, user_id, 'Объявление создано'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deal_id': deal_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'buyer_pay':
                deal_id = body.get('deal_id')
                
                # Получаем данные о сделке
                cursor.execute('SELECT price, seller_id FROM deals WHERE id = %s AND buyer_id IS NULL AND status = %s', (deal_id, 'active'))
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
                
                # Проверка баланса покупателя
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
                
                # Блокируем средства покупателя
                cursor.execute('UPDATE users SET balance = balance - %s WHERE id = %s', (deal['price'], user_id))
                
                # Транзакция покупателя
                cursor.execute("""
                    INSERT INTO transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'deal_hold', %s)
                """, (user_id, -deal['price'], f'Блокировка средств для сделки #{deal_id}'))
                
                # Обновляем сделку
                cursor.execute("""
                    UPDATE deals
                    SET buyer_id = %s, status = 'in_progress', step = 'buyer_paid', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (user_id, deal_id))
                
                # Системное сообщение
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """, (deal_id, user_id, 'Покупатель оплатил сделку. Средства заблокированы'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'seller_sent':
                deal_id = body.get('deal_id')
                
                # Проверка что текущий пользователь - продавец
                cursor.execute('SELECT seller_id, step FROM deals WHERE id = %s', (deal_id,))
                deal = cursor.fetchone()
                
                if not deal or deal['seller_id'] != int(user_id):
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                if deal['step'] != 'buyer_paid':
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid step'}),
                        'isBase64Encoded': False
                    }
                
                # Обновляем этап сделки
                cursor.execute("""
                    UPDATE deals
                    SET step = 'seller_sent', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (deal_id,))
                
                # Системное сообщение
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """, (deal_id, user_id, 'Продавец передал товар покупателю'))
                
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
                
                try:
                    # Получаем данные о сделке
                    cursor.execute("""
                        SELECT seller_id, buyer_id, price, step, title
                        FROM deals
                        WHERE id = %s
                    """, (deal_id,))
                    deal = cursor.fetchone()
                    
                    if not deal or deal['buyer_id'] != int(user_id):
                        cursor.close()
                        return {
                            'statusCode': 403,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Access denied'}),
                            'isBase64Encoded': False
                        }
                    
                    if deal['step'] != 'seller_sent':
                        cursor.close()
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Invalid step'}),
                            'isBase64Encoded': False
                        }
                    
                    # Рассчитываем комиссию (1% с продавца)
                    commission = float(deal['price']) * 0.01
                    seller_amount = float(deal['price']) - commission
                    
                    # Переводим средства продавцу (минус комиссия)
                    cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (seller_amount, deal['seller_id']))
                    
                    # Транзакция продавца
                    cursor.execute("""
                        INSERT INTO transactions (user_id, amount, type, description)
                        VALUES (%s, %s, 'deal_sale', %s)
                    """, (deal['seller_id'], seller_amount, f'Продажа через гарант (сделка #{deal_id}, комиссия 1%)'))
                    
                    # Обновляем сделку
                    cursor.execute("""
                        UPDATE deals
                        SET status = 'completed', step = 'completed', commission = %s, updated_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (commission, deal_id))
                    
                    # Системное сообщение
                    cursor.execute("""
                        INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                        VALUES (%s, %s, %s, true)
                    """, (deal_id, user_id, f'Сделка завершена! Продавец получил {seller_amount:.2f} USDT (комиссия {commission:.2f} USDT)'))
                    
                    conn.commit()
                    cursor.close()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
                except Exception as e:
                    print(f"ERROR in buyer_confirm: {type(e).__name__}: {str(e)}")
                    conn.rollback()
                    cursor.close()
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'{type(e).__name__}: {str(e)}'}),
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
                
                # Проверка доступа к сделке
                cursor.execute('SELECT seller_id, buyer_id FROM deals WHERE id = %s', (deal_id,))
                deal = cursor.fetchone()
                
                if not deal or (deal['seller_id'] != int(user_id) and (not deal['buyer_id'] or deal['buyer_id'] != int(user_id))):
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                # Добавляем сообщение
                query = """
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
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
            
            elif action == 'admin_complete_deal':
                # Админ принудительно завершает сделку
                deal_id = body.get('deal_id')
                
                # Проверка роли
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_role = cursor.fetchone()
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                # Завершаем сделку
                cursor.execute("""
                    SELECT seller_id, price
                    FROM deals
                    WHERE id = %s
                """, (deal_id,))
                deal = cursor.fetchone()
                
                if not deal:
                    cursor.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not found'}),
                        'isBase64Encoded': False
                    }
                
                commission = float(deal['price']) * 0.05
                seller_amount = float(deal['price']) - commission
                
                # Переводим средства продавцу
                cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (seller_amount, deal['seller_id']))
                
                # Обновляем сделку
                cursor.execute("""
                    UPDATE deals
                    SET status = 'completed', step = 'completed', commission = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (commission, deal_id))
                
                # Системное сообщение
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """, (deal_id, user_id, 'Сделка завершена администратором'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_cancel_deal':
                # Админ отменяет сделку
                deal_id = body.get('deal_id')
                
                # Проверка роли
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_role = cursor.fetchone()
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                # Возвращаем средства покупателю если были заблокированы
                cursor.execute("""
                    SELECT buyer_id, price, status
                    FROM deals
                    WHERE id = %s
                """, (deal_id,))
                deal = cursor.fetchone()
                
                if not deal:
                    cursor.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not found'}),
                        'isBase64Encoded': False
                    }
                
                if deal['buyer_id'] and deal['status'] == 'in_progress':
                    cursor.execute('UPDATE users SET balance = balance + %s WHERE id = %s', (deal['price'], deal['buyer_id']))
                
                # Обновляем сделку
                cursor.execute("""
                    UPDATE deals
                    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (deal_id,))
                
                # Системное сообщение
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, %s, true)
                """, (deal_id, user_id, 'Сделка отменена администратором. Средства возвращены покупателю'))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            cursor.close()
        
        elif method == 'PUT':
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
            
            if action == 'admin_update_deal':
                # Проверка роли
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_role = cursor.fetchone()
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                deal_id = body.get('deal_id')
                title = body.get('title')
                description = body.get('description')
                price = body.get('price')
                status = body.get('status')
                step = body.get('step')
                
                cursor.execute("""
                    UPDATE deals
                    SET title = %s, description = %s, price = %s, status = %s, step = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (title, description, price, status, step, deal_id))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            cursor.close()
        
        elif method == 'DELETE':
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
            
            if action == 'admin_delete_deal':
                # Проверка роли
                cursor.execute("SELECT role FROM users WHERE id = %s", (user_id,))
                user_role = cursor.fetchone()
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                deal_id = body.get('deal_id')
                
                # Удаляем сначала сообщения
                cursor.execute("DELETE FROM deal_messages WHERE deal_id = %s", (deal_id,))
                
                # Удаляем сделку
                cursor.execute("DELETE FROM deals WHERE id = %s", (deal_id,))
                
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