"""
Business: Система верификации пользователей через загрузку документов
Args: event с httpMethod, body, headers; context с request_id
Returns: HTTP response с данными заявок на верификацию
"""

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p32599880_plugin_site_developm'

def escape_sql_string(s: str) -> str:
    """Экранирует строку для безопасной вставки в SQL"""
    if s is None:
        return 'NULL'
    return "'" + s.replace("'", "''").replace("\\", "\\\\") + "'"

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
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn, cursor_factory=RealDictCursor)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'status')
            
            if action == 'status':
                cur.execute(f"SELECT is_verified FROM {SCHEMA}.users WHERE id = {user_id}")
                user = cur.fetchone()
                
                cur.execute(
                    f"SELECT id, status, admin_comment, created_at, reviewed_at FROM {SCHEMA}.verification_requests WHERE user_id = {user_id} ORDER BY created_at DESC LIMIT 1"
                )
                request = cur.fetchone()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'is_verified': user['is_verified'] if user else False,
                        'request': dict(request) if request else None
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_list':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                status_filter = params.get('status', 'pending')
                status_escaped = escape_sql_string(status_filter)
                
                query = f"""
                    SELECT vr.id, vr.user_id, vr.full_name, vr.birth_date, vr.status, 
                           vr.admin_comment, vr.created_at, vr.reviewed_at,
                           u.username, u.email, u.avatar_url,
                           CASE WHEN vr.passport_photo IS NOT NULL THEN true ELSE false END as has_passport,
                           CASE WHEN vr.selfie_photo IS NOT NULL THEN true ELSE false END as has_selfie
                    FROM {SCHEMA}.verification_requests vr
                    JOIN {SCHEMA}.users u ON vr.user_id = u.id
                    WHERE vr.status = {status_escaped}
                    ORDER BY vr.created_at DESC
                """
                cur.execute(query)
                requests = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'requests': [dict(r) for r in requests]}, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_photos':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                request_id = params.get('request_id')
                if not request_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'request_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"SELECT passport_photo, selfie_photo FROM {SCHEMA}.verification_requests WHERE id = {request_id}"
                )
                request = cur.fetchone()
                
                if not request:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'passport_photo': request['passport_photo'],
                        'selfie_photo': request['selfie_photo']
                    }),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            try:
                body = json.loads(event.get('body', '{}'))
            except json.JSONDecodeError as e:
                print(f"JSON decode error: {e}")
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Некорректный формат данных'}),
                    'isBase64Encoded': False
                }
            
            action = body.get('action')
            
            if action == 'submit':
                full_name = body.get('full_name', '').strip()
                birth_date = body.get('birth_date', '').strip()
                passport_photo = body.get('passport_photo') or ''
                selfie_photo = body.get('selfie_photo') or ''
                
                print(f"Verification request from user {user_id}: name={full_name}, passport_size={len(passport_photo) if passport_photo else 0}, selfie_size={len(selfie_photo) if selfie_photo else 0}")
                
                if not all([full_name, birth_date, passport_photo]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                        'isBase64Encoded': False
                    }
                
                if len(passport_photo) > 5000000:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Размер фото паспорта слишком большой. Пожалуйста, загрузите изображение меньшего размера.'}),
                        'isBase64Encoded': False
                    }
                
                if selfie_photo and len(selfie_photo) > 5000000:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Размер селфи слишком большой. Пожалуйста, загрузите изображение меньшего размера.'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.verification_requests WHERE user_id = {user_id} AND status = 'pending'"
                )
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'У вас уже есть активная заявка на верификацию'}),
                        'isBase64Encoded': False
                    }
                
                full_name_esc = escape_sql_string(full_name)
                birth_date_esc = escape_sql_string(birth_date)
                passport_esc = escape_sql_string(passport_photo)
                selfie_esc = escape_sql_string(selfie_photo) if selfie_photo else 'NULL'
                
                print(f"Inserting verification request for user {user_id}")
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.verification_requests 
                    (user_id, full_name, birth_date, passport_photo, selfie_photo, status)
                    VALUES ({user_id}, {full_name_esc}, {birth_date_esc}, {passport_esc}, {selfie_esc}, 'pending')
                    RETURNING id"""
                )
                request_id = cur.fetchone()['id']
                print(f"Created verification request {request_id}")
                
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = {user_id}")
                user_info = cur.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                username_esc = escape_sql_string(username)
                
                message = escape_sql_string(f"Пользователь {username} подал заявку на верификацию")
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.admin_notifications 
                    (type, title, message, related_id, related_type) 
                    VALUES ('verification_request', '✅ Новая заявка на верификацию', {message}, {request_id}, 'verification')"""
                )
                
                conn.commit()
                print(f"Verification request {request_id} committed successfully")
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'request_id': request_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'review':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                request_id = body.get('request_id')
                status = body.get('status')
                admin_comment = body.get('admin_comment', '')
                
                if status not in ['approved', 'rejected']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Некорректный статус'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT user_id FROM {SCHEMA}.verification_requests WHERE id = {request_id}")
                request_data = cur.fetchone()
                
                if not request_data:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
                
                target_user_id = request_data['user_id']
                status_esc = escape_sql_string(status)
                comment_esc = escape_sql_string(admin_comment)
                
                cur.execute(
                    f"""UPDATE {SCHEMA}.verification_requests 
                    SET status = {status_esc}, admin_comment = {comment_esc}, reviewed_at = NOW()
                    WHERE id = {request_id}"""
                )
                
                if status == 'approved':
                    cur.execute(f"UPDATE {SCHEMA}.users SET is_verified = TRUE WHERE id = {target_user_id}")
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'mark_read':
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = {user_id}")
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                notification_id = body.get('notification_id')
                if notification_id:
                    cur.execute(f"UPDATE {SCHEMA}.admin_notifications SET is_read = TRUE WHERE id = {notification_id}")
                    conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()