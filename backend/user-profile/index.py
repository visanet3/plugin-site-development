'''
Business: Получение публичного профиля пользователя
Args: event - dict с httpMethod, queryStringParameters (user_id)
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с данными профиля пользователя
'''

import json
import os
from typing import Dict, Any
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
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    params = event.get('queryStringParameters', {}) or {}
    user_id = params.get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'user_id обязателен'}),
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            SELECT 
                id, username, avatar_url, bio, 
                vk_url, telegram, discord, 
                forum_role, created_at, last_seen_at
            FROM users 
            WHERE id = %s AND is_blocked = FALSE
        """, (user_id,))
        
        user = cur.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Пользователь не найден'}),
                'isBase64Encoded': False
            }
        
        cur.execute("""
            SELECT COUNT(*) as topics_count
            FROM forum_topics
            WHERE author_id = %s AND removed_at IS NULL
        """, (user_id,))
        topics_stats = cur.fetchone()
        
        cur.execute("""
            SELECT COUNT(*) as comments_count
            FROM forum_comments
            WHERE author_id = %s AND removed_at IS NULL
        """, (user_id,))
        comments_stats = cur.fetchone()
        
        profile_data = dict(user)
        profile_data['topics_count'] = topics_stats['topics_count'] if topics_stats else 0
        profile_data['comments_count'] = comments_stats['comments_count'] if comments_stats else 0
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'user': profile_data
            }, default=str),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()