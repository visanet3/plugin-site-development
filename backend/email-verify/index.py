'''
Business: Email verification for user registration
Args: event - dict with httpMethod, body
      context - object with attributes: request_id, function_name
Returns: HTTP response dict
'''

import json
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta

SCHEMA = 't_p32599880_plugin_site_developm'

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def generate_code() -> str:
    return ''.join([str(secrets.randbelow(10)) for _ in range(6)])

def send_verification_email(email: str, code: str) -> bool:
    try:
        # Use Gmail with hardcoded credentials (same as password-reset function)
        smtp_host = 'smtp.gmail.com'
        smtp_port = 587
        smtp_user = 'visanet33@gmail.com'
        smtp_password = 'txvnmgppnhlmkbkd'
        from_email = smtp_user
        
        print(f'SMTP config: host={smtp_host}, port={smtp_port}, user={smtp_user}')
        
        msg = MIMEMultipart('alternative')
        msg['Subject'] = 'Код верификации GitCrypto'
        msg['From'] = from_email
        msg['To'] = email
        
        html = f'''
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; text-align: center;">Добро пожаловать в GitCrypto!</h2>
              <p style="color: #666; font-size: 16px;">Ваш код верификации:</p>
              <div style="background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 5px; margin: 20px 0;">
                <h1 style="color: #007bff; font-size: 36px; margin: 0; letter-spacing: 5px;">{code}</h1>
              </div>
              <p style="color: #666; font-size: 14px;">Код действителен в течение 10 минут.</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px; text-align: center;">Если вы не регистрировались на GitCrypto, проигнорируйте это письмо.</p>
            </div>
          </body>
        </html>
        '''
        
        msg.attach(MIMEText(html, 'html'))
        
        with smtplib.SMTP(smtp_host, smtp_port) as server:
            server.starttls()
            server.login(smtp_user, smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f'Error sending email: {e}')
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        body_str = event.get('body', '{}')
        if not body_str:
            body_str = '{}'
        body_data = json.loads(body_str)
        action = body_data.get('action', '')
        
        if action == 'send_code':
            email_raw = body_data.get('email')
            email = str(email_raw).strip().lower() if email_raw else ''
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Email не указан'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT id FROM {SCHEMA}.users WHERE email = %s",
                (email,)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Email уже зарегистрирован'}),
                    'isBase64Encoded': False
                }
            
            code = generate_code()
            expires_at = datetime.utcnow() + timedelta(minutes=10)
            
            cur.execute(
                f"DELETE FROM {SCHEMA}.email_verifications WHERE email = %s",
                (email,)
            )
            
            cur.execute(
                f"INSERT INTO {SCHEMA}.email_verifications (email, code, expires_at) VALUES (%s, %s, %s)",
                (email, code, expires_at)
            )
            conn.commit()
            
            email_sent = send_verification_email(email, code)
            
            if not email_sent:
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Ошибка отправки email. Попробуйте позже.'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Код отправлен на email'}),
                'isBase64Encoded': False
            }
        
        elif action == 'verify_code':
            email_raw = body_data.get('email')
            code_raw = body_data.get('code')
            email = str(email_raw).strip().lower() if email_raw else ''
            code = str(code_raw).strip() if code_raw else ''
            
            if not email or not code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Email и код обязательны'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT code, expires_at FROM {SCHEMA}.email_verifications WHERE email = %s ORDER BY created_at DESC LIMIT 1",
                (email,)
            )
            verification = cur.fetchone()
            
            if not verification:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Код не найден. Запросите новый код.'}),
                    'isBase64Encoded': False
                }
            
            if verification['code'] != code:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Неверный код'}),
                    'isBase64Encoded': False
                }
            
            if datetime.utcnow() > verification['expires_at']:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': False, 'error': 'Код истёк. Запросите новый код.'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.email_verifications SET verified = TRUE WHERE email = %s",
                (email,)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Email подтверждён'}),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Unknown action'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        print(f'Error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        cur.close()
        conn.close()