'''
Сброс пароля без email - создание токена и сброс через БД
'''

import json
import os
import hashlib
import secrets
import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p32599880_plugin_site_developm'

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-User-Id',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type',
        'Access-Control-Max-Age': '86400',
        'Content-Type': 'application/json',
        'Vary': 'Origin'
    }
    
    try:
        method: str = event.get('httpMethod', 'POST')
        
        if method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': '',
                'isBase64Encoded': False
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            token = params.get('token')
            
            if not token:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Токен не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT user_id, expires_at FROM {SCHEMA}.password_reset_tokens WHERE token = %s AND used = false",
                (token,)
            )
            reset_token = cur.fetchone()
            
            if not reset_token:
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Токен недействителен или уже использован'}),
                    'isBase64Encoded': False
                }
            
            if datetime.datetime.now() > reset_token['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Срок действия токена истек'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'valid': True, 'user_id': reset_token['user_id']}),
                'isBase64Encoded': False
            }
        
        if method != 'POST':
            return {
                'statusCode': 405,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'request_reset':
            email = body_data.get('email', '').strip()
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT id, username FROM {SCHEMA}.users WHERE email = %s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 200,
                    'headers': cors_headers,
                    'body': json.dumps({
                        'success': True, 
                        'message': 'Заявка на сброс пароля создана. Администратор обработает её в течение 24 часов.'
                    }),
                    'isBase64Encoded': False
                }
            
            # Создаём токен (без email отправки!)
            token = secrets.token_urlsafe(32)
            expires_at = datetime.datetime.now() + datetime.timedelta(hours=24)
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user['id'], token, expires_at)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Заявка создана. Обратитесь к администратору для получения ссылки на сброс пароля.'
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset_password':
            token = body_data.get('token', '').strip()
            new_password = body_data.get('new_password', '').strip()
            
            if not token or not new_password:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Токен и новый пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(new_password) < 6:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT user_id, expires_at FROM {SCHEMA}.password_reset_tokens WHERE token = %s AND used = false",
                (token,)
            )
            reset_token = cur.fetchone()
            
            if not reset_token:
                return {
                    'statusCode': 404,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Токен недействителен или уже использован'}),
                    'isBase64Encoded': False
                }
            
            if datetime.datetime.now() > reset_token['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Срок действия токена истек'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(new_password)
            
            cur.execute(
                f"UPDATE {SCHEMA}.users SET password_hash = %s WHERE id = %s",
                (password_hash, reset_token['user_id'])
            )
            
            cur.execute(
                f"UPDATE {SCHEMA}.password_reset_tokens SET used = true WHERE token = %s",
                (token,)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'success': True, 'message': 'Пароль успешно изменен'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Unknown action'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f"ERROR: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        
        try:
            if 'conn' in locals():
                conn.rollback()
        except:
            pass
            
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'{type(e).__name__}: {str(e)}'}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()