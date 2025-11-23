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
                # Проверяем статус верификации текущего пользователя
                cur.execute(f"SELECT is_verified FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                
                cur.execute(
                    f"SELECT id, status, admin_comment, created_at, reviewed_at FROM {SCHEMA}.verification_requests WHERE user_id = %s ORDER BY created_at DESC LIMIT 1",
                    (user_id,)
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
                # Проверяем права админа
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                status_filter = params.get('status', 'pending')
                
                query = f"""
                    SELECT vr.*, u.username, u.email, u.avatar_url
                    FROM {SCHEMA}.verification_requests vr
                    JOIN {SCHEMA}.users u ON vr.user_id = u.id
                    WHERE vr.status = %s
                    ORDER BY vr.created_at DESC
                """
                cur.execute(query, (status_filter,))
                requests = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'requests': [dict(r) for r in requests]}, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'submit':
                full_name = body.get('full_name', '').strip()
                birth_date = body.get('birth_date', '').strip()
                passport_photo = body.get('passport_photo', '')
                selfie_photo = body.get('selfie_photo', '')
                
                if not all([full_name, birth_date, passport_photo]):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все обязательные поля'}),
                        'isBase64Encoded': False
                    }
                
                # Проверяем, есть ли уже активная заявка
                cur.execute(
                    f"SELECT id FROM {SCHEMA}.verification_requests WHERE user_id = %s AND status = 'pending'",
                    (user_id,)
                )
                existing = cur.fetchone()
                
                if existing:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'У вас уже есть активная заявка на верификацию'}),
                        'isBase64Encoded': False
                    }
                
                # Создаем заявку
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.verification_requests 
                    (user_id, full_name, birth_date, passport_photo, selfie_photo, status)
                    VALUES (%s, %s, %s, %s, %s, 'pending')
                    RETURNING id""",
                    (user_id, full_name, birth_date, passport_photo, selfie_photo)
                )
                request_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'request_id': request_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'review':
                # Проверяем права админа
                cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
                user = cur.fetchone()
                
                if not user or user['role'] != 'admin':
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                request_id = body.get('request_id')
                status = body.get('status')  # 'approved' или 'rejected'
                admin_comment = body.get('admin_comment', '')
                
                if status not in ['approved', 'rejected']:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Некорректный статус'}),
                        'isBase64Encoded': False
                    }
                
                # Получаем данные заявки
                cur.execute(f"SELECT user_id FROM {SCHEMA}.verification_requests WHERE id = %s", (request_id,))
                request = cur.fetchone()
                
                if not request:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заявка не найдена'}),
                        'isBase64Encoded': False
                    }
                
                # Обновляем статус заявки
                cur.execute(
                    f"""UPDATE {SCHEMA}.verification_requests 
                    SET status = %s, admin_comment = %s, reviewed_by = %s, reviewed_at = CURRENT_TIMESTAMP
                    WHERE id = %s""",
                    (status, admin_comment, user_id, request_id)
                )
                
                # Если одобрено - устанавливаем is_verified = true
                if status == 'approved':
                    cur.execute(
                        f"UPDATE {SCHEMA}.users SET is_verified = TRUE WHERE id = %s",
                        (request['user_id'],)
                    )
                
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
    
    except Exception as e:
        conn.rollback()
        print(f'Verification error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
