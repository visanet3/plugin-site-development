"""
Business: Гарант-сервис для безопасных сделок с поэтапной системой (оптимизированная версия)
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с данными о сделках
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor, execute_batch
from datetime import datetime, timezone
from typing import Dict, Any, List
from decimal import Decimal
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
    print(f"DEBUG: method={method}, event keys={list(event.keys())}")
    print(f"DEBUG: queryStringParameters={event.get('queryStringParameters')}")
    
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
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'list')
            print(f"GET request - action: {action}, params: {params}")
            
            if action == 'list':
                status_filter = params.get('status', 'active')
                
                if status_filter == 'active':
                    # Активные объявления (без покупателя) - оптимизировано одним запросом
                    query = """
                        SELECT d.id, d.seller_id, d.title, d.description, d.price, d.status, 
                               d.step, d.created_at, d.updated_at,
                               s.username as seller_name, s.avatar_url as seller_avatar
                        FROM deals d
                        INNER JOIN users s ON d.seller_id = s.id
                        WHERE d.status = 'active' AND d.buyer_id IS NULL
                        ORDER BY d.created_at DESC
                        LIMIT 100
                    """
                    cursor.execute(query)
                    
                elif status_filter == 'my_deals':
                    if not user_id:
                        cursor.close()
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Unauthorized'}),
                            'isBase64Encoded': False
                        }
                    
                    # Мои сделки - оптимизировано одним запросом
                    query = """
                        SELECT d.id, d.seller_id, d.buyer_id, d.title, d.description, d.price, 
                               d.status, d.step, d.created_at, d.updated_at,
                               s.username as seller_name, s.avatar_url as seller_avatar,
                               b.username as buyer_name, b.avatar_url as buyer_avatar
                        FROM deals d
                        INNER JOIN users s ON d.seller_id = s.id
                        LEFT JOIN users b ON d.buyer_id = b.id
                        WHERE (d.seller_id = %s OR d.buyer_id = %s)
                          AND d.status IN ('in_progress', 'active')
                        ORDER BY d.updated_at DESC
                        LIMIT 100
                    """
                    cursor.execute(query, (user_id, user_id))
                    
                elif status_filter == 'completed':
                    if not user_id:
                        cursor.close()
                        return {
                            'statusCode': 401,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Unauthorized'}),
                            'isBase64Encoded': False
                        }
                    
                    # Завершенные сделки - оптимизировано одним запросом
                    query = """
                        SELECT d.id, d.seller_id, d.buyer_id, d.title, d.description, d.price, 
                               d.status, d.step, d.created_at, d.updated_at,
                               s.username as seller_name, s.avatar_url as seller_avatar,
                               b.username as buyer_name, b.avatar_url as buyer_avatar
                        FROM deals d
                        INNER JOIN users s ON d.seller_id = s.id
                        LEFT JOIN users b ON d.buyer_id = b.id
                        WHERE (d.seller_id = %s OR d.buyer_id = %s)
                          AND d.status = 'completed'
                        ORDER BY d.updated_at DESC
                        LIMIT 100
                    """
                    cursor.execute(query, (user_id, user_id))
                else:
                    # По умолчанию активные
                    query = """
                        SELECT d.id, d.seller_id, d.title, d.description, d.price, d.status, 
                               d.step, d.created_at, d.updated_at,
                               s.username as seller_name, s.avatar_url as seller_avatar
                        FROM deals d
                        INNER JOIN users s ON d.seller_id = s.id
                        WHERE d.status = 'active' AND d.buyer_id IS NULL
                        ORDER BY d.created_at DESC
                        LIMIT 100
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
                if not user_id:
                    cursor.close()
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Unauthorized'}),
                        'isBase64Encoded': False
                    }
                
                # Проверка админа одним запросом
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
                
                # Все сделки одним оптимизированным запросом
                query = """
                    SELECT d.id, d.seller_id, d.buyer_id, d.title, d.description, d.price, 
                           d.status, d.step, d.created_at, d.updated_at,
                           s.username as seller_username, s.avatar_url as seller_avatar_url,
                           b.username as buyer_username, b.avatar_url as buyer_avatar_url
                    FROM deals d
                    INNER JOIN users s ON d.seller_id = s.id
                    LEFT JOIN users b ON d.buyer_id = b.id
                    ORDER BY d.created_at DESC
                    LIMIT 500
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
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal ID required'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем сделку и сообщения одним запросом через CTE
                query = """
                    WITH deal_info AS (
                        SELECT d.id, d.seller_id, d.buyer_id, d.title, d.description, d.price, 
                               d.status, d.step, d.created_at, d.updated_at,
                               s.username as seller_name, s.avatar_url as seller_avatar,
                               b.username as buyer_name, b.avatar_url as buyer_avatar
                        FROM deals d
                        INNER JOIN users s ON d.seller_id = s.id
                        LEFT JOIN users b ON d.buyer_id = b.id
                        WHERE d.id = %s
                    )
                    SELECT * FROM deal_info
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
                
                # Сообщения отдельным оптимизированным запросом
                messages_query = """
                    SELECT dm.id, dm.deal_id, dm.user_id, dm.message, dm.is_system, dm.created_at,
                           u.username, u.avatar_url
                    FROM deal_messages dm
                    LEFT JOIN users u ON dm.user_id = u.id
                    WHERE dm.deal_id = %s
                    ORDER BY dm.created_at ASC
                    LIMIT 1000
                """
                cursor.execute(messages_query, (deal_id,))
                messages = cursor.fetchall()
                
                cursor.close()
                
                print(f"DEBUG: Returning deal data: deal_id={deal_id}, messages_count={len(messages)}")
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'deal': dict(deal),
                        'messages': [dict(m) for m in messages]
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            else:
                cursor.close()
                print(f"DEBUG: Unknown action in GET: {action}")
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Unknown action: {action}'}),
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
                
                # Создаем сделку и системное сообщение одной транзакцией
                cursor.execute("""
                    WITH new_deal AS (
                        INSERT INTO deals (seller_id, title, description, price, status, step)
                        VALUES (%s, %s, %s, %s, 'active', 'waiting_buyer')
                        RETURNING id
                    ),
                    new_message AS (
                        INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                        SELECT id, %s, 'Объявление создано', true FROM new_deal
                        RETURNING deal_id
                    )
                    SELECT id FROM new_deal
                """, (user_id, title, description, price, user_id))
                
                deal_id = cursor.fetchone()['id']
                
                # Получаем username для уведомления
                cursor.execute('SELECT username FROM users WHERE id = %s', (user_id,))
                user_data = cursor.fetchone()
                username = user_data['username'] if user_data else 'Unknown'
                
                conn.commit()
                cursor.close()
                
                # Отправка уведомления асинхронно
                try:
                    send_telegram_notification('new_deal', {'username': username}, {'title': title, 'price': price})
                except:
                    pass
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deal_id': deal_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'accept_deal':
                deal_id = body.get('deal_id')
                
                if not deal_id:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal ID required'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем сделку и обновляем одним запросом
                cursor.execute("""
                    UPDATE deals 
                    SET buyer_id = %s, status = 'in_progress', step = 'buyer_payment', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND status = 'active' AND buyer_id IS NULL
                    RETURNING id, seller_id
                """, (user_id, deal_id))
                
                result = cursor.fetchone()
                
                if not result:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Deal not available'}),
                        'isBase64Encoded': False
                    }
                
                # Системное сообщение
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, 'Покупатель принял сделку', true)
                """, (deal_id, user_id))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'confirm_payment':
                deal_id = body.get('deal_id')
                
                # Обновляем шаг сделки
                cursor.execute("""
                    UPDATE deals 
                    SET step = 'seller_confirmation', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND buyer_id = %s AND step = 'buyer_payment'
                    RETURNING id
                """, (deal_id, user_id))
                
                result = cursor.fetchone()
                
                if not result:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid operation'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, 'Покупатель подтвердил оплату', true)
                """, (deal_id, user_id))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'complete_deal':
                deal_id = body.get('deal_id')
                
                # Завершаем сделку одной транзакцией
                cursor.execute("""
                    UPDATE deals 
                    SET status = 'completed', step = 'completed', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND seller_id = %s AND step = 'seller_confirmation'
                    RETURNING id
                """, (deal_id, user_id))
                
                result = cursor.fetchone()
                
                if not result:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid operation'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, 'Сделка завершена', true)
                """, (deal_id, user_id))
                
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
                message = body.get('message', '').strip()
                
                if not message:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Message required'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем участие в сделке и отправляем сообщение одним запросом
                cursor.execute("""
                    WITH deal_check AS (
                        SELECT id FROM deals WHERE id = %s AND (seller_id = %s OR buyer_id = %s)
                    )
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    SELECT %s, %s, %s, false FROM deal_check
                    RETURNING id
                """, (deal_id, user_id, user_id, deal_id, user_id, message))
                
                result = cursor.fetchone()
                
                if not result:
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'cancel_deal':
                deal_id = body.get('deal_id')
                
                # Отменяем сделку
                cursor.execute("""
                    UPDATE deals 
                    SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s AND (seller_id = %s OR buyer_id = %s) AND status != 'completed'
                    RETURNING id
                """, (deal_id, user_id, user_id))
                
                result = cursor.fetchone()
                
                if not result:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Cannot cancel deal'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute("""
                    INSERT INTO deal_messages (deal_id, user_id, message, is_system)
                    VALUES (%s, %s, 'Сделка отменена', true)
                """, (deal_id, user_id))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            cursor.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
        
    except Exception as e:
        if conn:
            conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if conn:
            conn.close()