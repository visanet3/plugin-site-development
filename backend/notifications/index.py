'''
Business: Управление уведомлениями и личными сообщениями пользователей
Args: event - dict с httpMethod, body, queryStringParameters, headers
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными уведомлений/сообщений
'''

import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Получить подключение к БД"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            UPDATE users
            SET last_seen_at = NOW()
            WHERE id = %s
        """, (user_id,))
        conn.commit()
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'notifications')
            
            if action == 'notifications':
                cur.execute("""
                    SELECT id, type, title, message, link, is_read, created_at
                    FROM notifications
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    LIMIT 50
                """, (user_id,))
                notifications = cur.fetchall()
                
                cur.execute("""
                    SELECT COUNT(*) as count
                    FROM notifications
                    WHERE user_id = %s AND is_read = FALSE
                """, (user_id,))
                unread_count = cur.fetchone()['count']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'notifications': [dict(n) for n in notifications],
                        'unread_count': unread_count
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'messages':
                cur.execute("""
                    SELECT 
                        m.id, m.subject, m.content, m.is_read, m.created_at,
                        m.from_user_id, u1.username as from_username, u1.avatar_url as from_avatar, u1.role as from_role, u1.last_seen_at as from_last_seen,
                        m.to_user_id, u2.username as to_username, u2.avatar_url as to_avatar, u2.role as to_role, u2.last_seen_at as to_last_seen
                    FROM messages m
                    JOIN users u1 ON m.from_user_id = u1.id
                    JOIN users u2 ON m.to_user_id = u2.id
                    WHERE m.to_user_id = %s OR m.from_user_id = %s
                    ORDER BY m.created_at DESC
                    LIMIT 100
                """, (user_id, user_id))
                messages = cur.fetchall()
                
                cur.execute("""
                    SELECT COUNT(*) as count
                    FROM messages
                    WHERE to_user_id = %s AND is_read = FALSE
                """, (user_id,))
                unread_count = cur.fetchone()['count']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [dict(m) for m in messages],
                        'unread_count': unread_count
                    }, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'send_message':
                to_user_id = body_data.get('to_user_id')
                subject = body_data.get('subject', '').strip()
                content = body_data.get('content', '').strip()
                
                if not to_user_id or not subject or not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO messages (from_user_id, to_user_id, subject, content)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, created_at
                """, (user_id, to_user_id, subject, content))
                result = cur.fetchone()
                
                cur.execute("""
                    SELECT username FROM users WHERE id = %s
                """, (user_id,))
                from_user = cur.fetchone()
                
                cur.execute("""
                    INSERT INTO notifications (user_id, type, title, message, link)
                    VALUES (%s, 'message', %s, %s, %s)
                """, (
                    to_user_id,
                    'Новое сообщение',
                    f'{from_user["username"]}: {subject}',
                    f'/messages/{result["id"]}'
                ))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'message_id': result['id']
                    }, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'mark_notification_read':
                notification_id = body_data.get('notification_id')
                
                cur.execute("""
                    UPDATE notifications
                    SET is_read = TRUE
                    WHERE id = %s AND user_id = %s
                """, (notification_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'mark_message_read':
                message_id = body_data.get('message_id')
                
                cur.execute("""
                    UPDATE messages
                    SET is_read = TRUE
                    WHERE id = %s AND to_user_id = %s
                """, (message_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'mark_all_read':
                notification_type = body_data.get('type', 'notifications')
                
                if notification_type == 'notifications':
                    cur.execute("""
                        UPDATE notifications
                        SET is_read = TRUE
                        WHERE user_id = %s AND is_read = FALSE
                    """, (user_id,))
                else:
                    cur.execute("""
                        UPDATE messages
                        SET is_read = TRUE
                        WHERE to_user_id = %s AND is_read = FALSE
                    """, (user_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'DELETE':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'delete_notification':
                notification_id = body_data.get('notification_id')
                
                cur.execute("""
                    DELETE FROM notifications
                    WHERE id = %s AND user_id = %s
                """, (notification_id, user_id))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'clear_all_notifications':
                cur.execute("""
                    DELETE FROM notifications
                    WHERE user_id = %s
                """, (user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Invalid request'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()