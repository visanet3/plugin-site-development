'''
Business: Обработка сброса пароля через email с токеном
Args: event - dict с httpMethod, body, queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict
Version: 1.6
'''

import json
import os
import hashlib
import secrets
import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def get_db_connection():
    """Получить подключение к БД"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def send_email(to_email: str, subject: str, html_content: str, custom_smtp: dict = None) -> bool:
    """Отправка email через SMTP с поддержкой кастомных настроек"""
    try:
        if custom_smtp:
            smtp_host = custom_smtp.get('host', 'smtp.gmail.com')
            smtp_port = int(custom_smtp.get('port', 587))
            smtp_user = custom_smtp.get('user')
            smtp_password = custom_smtp.get('password')
            from_email = custom_smtp.get('from_email', smtp_user)
        else:
            smtp_host = os.environ.get('SMTP_HOST', 'smtp.yandex.ru')
            smtp_port = int(os.environ.get('SMTP_PORT', '587'))
            smtp_user = os.environ.get('SMTP_USER', 'gitcrypto@yandex.ru')
            smtp_password = os.environ.get('SMTP_PASSWORD', 'tznbcenxhgpapbsi')
            from_email = os.environ.get('FROM_EMAIL', smtp_user)
        
        print(f'SMTP config: host={smtp_host}, port={smtp_port}, user={smtp_user}, from={from_email}')
        
        if not smtp_user or not smtp_password:
            print('SMTP credentials missing!')
            return False
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = from_email
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html')
        msg.attach(html_part)
        
        print(f'Connecting to SMTP server {smtp_host}:{smtp_port}...')
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            print('STARTTLS successful, logging in...')
            server.login(smtp_user, smtp_password)
            print('Login successful, sending email...')
            server.send_message(msg)
            print(f'Email sent successfully to {to_email}')
        
        return True
    except Exception as e:
        print(f'Email error: {type(e).__name__}: {str(e)}')
        import traceback
        traceback.print_exc()
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            token = params.get('token')
            
            if not token:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = %s AND used = false",
                (token,)
            )
            reset_token = cur.fetchone()
            
            if not reset_token:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен недействителен или уже использован'}),
                    'isBase64Encoded': False
                }
            
            if datetime.datetime.now() > reset_token['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Срок действия токена истек'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'valid': True, 'user_id': reset_token['user_id']}),
                'isBase64Encoded': False
            }
        
        if method != 'POST':
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
        
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'request_reset':
            email = body_data.get('email', '').strip()
            custom_smtp = body_data.get('smtp_settings')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Email обязателен'}),
                    'isBase64Encoded': False
                }
            
            cur.execute("SELECT id, username FROM users WHERE email = %s", (email,))
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Если email существует, на него будет отправлена ссылка'}),
                    'isBase64Encoded': False
                }
            
            token = secrets.token_urlsafe(32)
            expires_at = datetime.datetime.now() + datetime.timedelta(hours=1)
            
            cur.execute(
                "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user['id'], token, expires_at)
            )
            conn.commit()
            
            reset_url = f"https://your-domain.com/reset-password?token={token}"
            
            html_content = f"""
            <html>
                <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #10b981 0%, #14b8a6 50%, #06b6d4 100%); padding: 30px; border-radius: 10px; text-align: center;">
                        <h1 style="color: white; margin: 0;">GIT CRYPTO</h1>
                        <p style="color: white; opacity: 0.9; margin: 10px 0 0 0;">Сброс пароля</p>
                    </div>
                    <div style="padding: 30px; background: #f9fafb; border-radius: 10px; margin-top: 20px;">
                        <p style="color: #374151; font-size: 16px;">Привет, <strong>{user['username']}</strong>!</p>
                        <p style="color: #374151;">Вы запросили сброс пароля. Нажмите на кнопку ниже, чтобы создать новый пароль:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="{reset_url}" style="background: linear-gradient(135deg, #10b981, #06b6d4); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Сбросить пароль</a>
                        </div>
                        <p style="color: #6b7280; font-size: 14px;">Ссылка действительна в течение 1 часа.</p>
                        <p style="color: #6b7280; font-size: 14px;">Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #9ca3af; font-size: 12px;">
                        <p>© 2024 GIT CRYPTO. Все права защищены.</p>
                    </div>
                </body>
            </html>
            """
            
            email_sent = send_email(email, 'Сброс пароля - GIT CRYPTO', html_content, custom_smtp)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message': 'Ссылка для сброса пароля отправлена на email',
                    'email_sent': email_sent
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'reset_password':
            token = body_data.get('token', '').strip()
            new_password = body_data.get('new_password', '').strip()
            
            if not token or not new_password:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен и новый пароль обязательны'}),
                    'isBase64Encoded': False
                }
            
            if len(new_password) < 6:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                "SELECT user_id, expires_at FROM password_reset_tokens WHERE token = %s AND used = false",
                (token,)
            )
            reset_token = cur.fetchone()
            
            if not reset_token:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Токен недействителен или уже использован'}),
                    'isBase64Encoded': False
                }
            
            if datetime.datetime.now() > reset_token['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Срок действия токена истек'}),
                    'isBase64Encoded': False
                }
            
            password_hash = hash_password(new_password)
            
            cur.execute(
                "UPDATE users SET password_hash = %s WHERE id = %s",
                (password_hash, reset_token['user_id'])
            )
            
            cur.execute(
                "UPDATE password_reset_tokens SET used = true WHERE token = %s",
                (token,)
            )
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Пароль успешно изменен'}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unknown action'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()