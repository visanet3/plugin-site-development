"""
Business: API для управления тикетами технической поддержки
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами request_id, function_name
Returns: HTTP response dict с тикетами или результатом операции
"""
import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests

TELEGRAM_NOTIFY_URL = 'https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f'

def send_telegram_notification(event_type: str, user_info: dict, details: dict):
    """Отправить уведомление в Telegram"""
    try:
        requests.post(
            TELEGRAM_NOTIFY_URL,
            json={
                'event_type': event_type,
                'user_info': user_info,
                'details': details
            },
            timeout=5
        )
    except Exception as e:
        print(f'Failed to send telegram notification: {e}')

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
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'list')
            
            if action == 'list':
                # Получить все тикеты (для админа)
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, user_id, username, category, subject, message, 
                               status, admin_response, answered_by, answered_at, created_at
                        FROM support_tickets
                        ORDER BY created_at DESC
                    """)
                    tickets = cur.fetchall()
                    
                    # Конвертируем datetime в ISO строки
                    for ticket in tickets:
                        if ticket.get('created_at'):
                            ticket['created_at'] = ticket['created_at'].isoformat()
                        if ticket.get('answered_at'):
                            ticket['answered_at'] = ticket['answered_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'tickets': tickets}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'user_tickets':
                # Получить тикеты конкретного пользователя
                user_id = params.get('user_id')
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'user_id required'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, user_id, username, category, subject, message, 
                               status, admin_response, answered_by, answered_at, created_at
                        FROM support_tickets
                        WHERE user_id = %s
                        ORDER BY created_at DESC
                    """, (int(user_id),))
                    tickets = cur.fetchall()
                    
                    for ticket in tickets:
                        if ticket.get('created_at'):
                            ticket['created_at'] = ticket['created_at'].isoformat()
                        if ticket.get('answered_at'):
                            ticket['answered_at'] = ticket['answered_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'tickets': tickets}),
                        'isBase64Encoded': False
                    }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create':
                # Создать новый тикет
                user_id = body_data.get('user_id')
                username = body_data.get('username')
                category = body_data.get('category')
                subject = body_data.get('subject')
                message = body_data.get('message')
                
                if not all([user_id, username, category, subject, message]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        INSERT INTO support_tickets 
                        (user_id, username, category, subject, message, status, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, 'open', NOW(), NOW())
                        RETURNING id, user_id, username, category, subject, message, 
                                  status, created_at
                    """, (user_id, username, category, subject, message))
                    ticket = cur.fetchone()
                    
                    # Добавляем первое сообщение пользователя в историю
                    cur.execute("""
                        INSERT INTO ticket_messages (ticket_id, user_id, author_username, message, is_admin, created_at)
                        VALUES (%s, %s, %s, %s, false, NOW())
                    """, (ticket['id'], user_id, username, message))
                    
                    if ticket.get('created_at'):
                        ticket['created_at'] = ticket['created_at'].isoformat()
                    
                    # Отправляем уведомление в Telegram
                    send_telegram_notification(
                        'support_ticket_created',
                        {'username': username, 'user_id': user_id},
                        {
                            'ticket_id': ticket['id'],
                            'category': category,
                            'subject': subject,
                            'message': message
                        }
                    )
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'ticket': ticket}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'answer':
                # Ответить на тикет
                ticket_id = body_data.get('ticket_id')
                admin_response = body_data.get('admin_response')
                answered_by = body_data.get('answered_by')
                
                if not all([ticket_id, admin_response, answered_by]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Получаем информацию о тикете
                    cur.execute("""
                        SELECT user_id FROM support_tickets WHERE id = %s
                    """, (ticket_id,))
                    ticket = cur.fetchone()
                    
                    if not ticket:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({'success': False, 'error': 'Ticket not found'}),
                            'isBase64Encoded': False
                        }
                    
                    # Обновляем статус тикета
                    cur.execute("""
                        UPDATE support_tickets
                        SET admin_response = %s,
                            answered_by = %s,
                            answered_at = NOW(),
                            status = 'answered',
                            updated_at = NOW()
                        WHERE id = %s
                    """, (admin_response, answered_by, ticket_id))
                    
                    # Добавляем сообщение администратора в историю
                    cur.execute("""
                        INSERT INTO ticket_messages (ticket_id, user_id, author_username, message, is_admin, created_at)
                        VALUES (%s, NULL, %s, %s, true, NOW())
                    """, (ticket_id, answered_by, admin_response))
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'update_status':
                # Изменить статус тикета
                ticket_id = body_data.get('ticket_id')
                status = body_data.get('status')
                
                if not all([ticket_id, status]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        UPDATE support_tickets
                        SET status = %s,
                            updated_at = NOW()
                        WHERE id = %s
                        RETURNING id
                    """, (status, ticket_id))
                    result = cur.fetchone()
                    
                    if result:
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True}),
                            'isBase64Encoded': False
                        }
                    else:
                        return {
                            'statusCode': 404,
                            'headers': headers,
                            'body': json.dumps({'success': False, 'error': 'Ticket not found'}),
                            'isBase64Encoded': False
                        }
            
            elif action == 'get_messages':
                # Получить все сообщения тикета
                ticket_id = body_data.get('ticket_id')
                
                if not ticket_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'ticket_id required'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    cur.execute("""
                        SELECT id, ticket_id, user_id, author_username, message, is_admin, created_at
                        FROM ticket_messages
                        WHERE ticket_id = %s
                        ORDER BY created_at ASC
                    """, (int(ticket_id),))
                    messages = cur.fetchall()
                    
                    for msg in messages:
                        if msg.get('created_at'):
                            msg['created_at'] = msg['created_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'messages': messages}),
                        'isBase64Encoded': False
                    }
            
            elif action == 'send_message':
                # Отправить сообщение в тикет
                ticket_id = body_data.get('ticket_id')
                user_id = body_data.get('user_id')
                author_username = body_data.get('author_username')
                message = body_data.get('message')
                is_admin = body_data.get('is_admin', False)
                
                if not all([ticket_id, author_username, message]):
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'success': False, 'error': 'Missing required fields'}),
                        'isBase64Encoded': False
                    }
                
                with conn.cursor(cursor_factory=RealDictCursor) as cur:
                    # Вставляем сообщение
                    cur.execute("""
                        INSERT INTO ticket_messages 
                        (ticket_id, user_id, author_username, message, is_admin, created_at)
                        VALUES (%s, %s, %s, %s, %s, NOW())
                        RETURNING id, ticket_id, user_id, author_username, message, is_admin, created_at
                    """, (int(ticket_id), user_id, author_username, message, is_admin))
                    new_message = cur.fetchone()
                    
                    # Обновляем статус тикета если пользователь отвечает
                    if not is_admin:
                        cur.execute("""
                            UPDATE support_tickets
                            SET status = 'open', updated_at = NOW()
                            WHERE id = %s
                        """, (int(ticket_id),))
                    
                    if new_message.get('created_at'):
                        new_message['created_at'] = new_message['created_at'].isoformat()
                    
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({'success': True, 'message': new_message}),
                        'isBase64Encoded': False
                    }
        
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': 'Invalid action'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'conn' in locals():
            conn.close()