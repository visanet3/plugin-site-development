'''
Функция авторизации и регистрации пользователей
'''

import json
import os
import psycopg2
from datetime import datetime
import secrets

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event, context):
    """Обработчик авторизации и регистрации"""
    
    method = event.get('httpMethod', 'POST')
    
    # CORS headers
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    # OPTIONS для CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': '',
            'isBase64Encoded': False
        }
    
    # Парсим тело запроса
    try:
        body = json.loads(event.get('body', '{}'))
        action = body.get('action', 'login')
    except:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({'error': 'Некорректный JSON'}),
            'isBase64Encoded': False
        }
    
    # Подключаемся к БД
    try:
        conn = get_db_connection()
        cur = conn.cursor()
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Ошибка БД: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    try:
        if action == 'register':
            # Регистрация
            username = body.get('username')
            password = body.get('password')
            email = body.get('email')
            referral_code = body.get('referral_code')
            
            if not username or not password or not email:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем существование пользователя
            cur.execute(
                "SELECT id FROM users WHERE username = %s OR email = %s",
                (username, email)
            )
            if cur.fetchone():
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Пользователь уже существует'}),
                    'isBase64Encoded': False
                }
            
            # Создаем пользователя
            token = secrets.token_urlsafe(32)
            user_ref_code = secrets.token_urlsafe(8)
            
            cur.execute(
                """INSERT INTO users 
                (username, password, email, token, referral_code, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s) 
                RETURNING id, username, email, balance, referral_code""",
                (username, password, email, token, user_ref_code, datetime.now())
            )
            user = cur.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'token': token,
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'balance': float(user[3]),
                        'referral_code': user[4]
                    }
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'login':
            # Вход
            username = body.get('username')
            password = body.get('password')
            
            if not username or not password:
                return {
                    'statusCode': 400,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Заполните все поля'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                """SELECT id, username, email, balance, token, referral_code 
                FROM users WHERE username = %s AND password = %s""",
                (username, password)
            )
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 401,
                    'headers': cors_headers,
                    'body': json.dumps({'error': 'Неверный логин или пароль'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'token': user[4],
                    'user': {
                        'id': user[0],
                        'username': user[1],
                        'email': user[2],
                        'balance': float(user[3]),
                        'referral_code': user[5]
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': cors_headers,
                'body': json.dumps({'error': 'Неизвестное действие'}),
                'isBase64Encoded': False
            }
    
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
