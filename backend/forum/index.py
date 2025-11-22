'''
Business: Управление темами форума и комментариями для авторизованных пользователей
Args: event - dict с httpMethod, body, headers (X-User-Id), queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с темами/комментариями или результатом создания
'''

import json
import os
from typing import Dict, Any, List
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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token',
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
            topic_id = params.get('topic_id')
            
            if topic_id:
                cur.execute("""
                    SELECT 
                        ft.id, ft.title, ft.content, ft.views, ft.is_pinned, ft.is_closed,
                        ft.created_at, ft.updated_at,
                        u.id as author_id, u.username as author_name, u.avatar_url as author_avatar,
                        u.forum_role as author_forum_role,
                        p.id as plugin_id, p.title as plugin_title
                    FROM forum_topics ft
                    LEFT JOIN users u ON ft.author_id = u.id
                    LEFT JOIN plugins p ON ft.plugin_id = p.id
                    WHERE ft.id = %s AND ft.removed_at IS NULL
                """, (topic_id,))
                topic = cur.fetchone()
                
                if not topic:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Тема не найдена'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    SELECT 
                        fc.id, fc.content, fc.created_at,
                        u.id as author_id, u.username as author_name, u.avatar_url as author_avatar,
                        u.forum_role as author_forum_role
                    FROM forum_comments fc
                    LEFT JOIN users u ON fc.author_id = u.id
                    WHERE fc.topic_id = %s AND fc.removed_at IS NULL
                    ORDER BY fc.created_at ASC
                """, (topic_id,))
                comments = cur.fetchall()
                
                cur.execute("UPDATE forum_topics SET views = views + 1 WHERE id = %s", (topic_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'topic': dict(topic),
                        'comments': [dict(c) for c in comments]
                    }, default=str),
                    'isBase64Encoded': False
                }
            else:
                plugin_id = params.get('plugin_id')
                query = """
                    SELECT 
                        ft.id, ft.title, ft.views, ft.is_pinned, ft.created_at,
                        u.id as author_id, u.username as author_name, u.forum_role as author_forum_role,
                        COUNT(fc.id) as comments_count
                    FROM forum_topics ft
                    LEFT JOIN users u ON ft.author_id = u.id
                    LEFT JOIN forum_comments fc ON ft.id = fc.topic_id AND fc.removed_at IS NULL
                    WHERE ft.removed_at IS NULL
                """
                query_params: List[Any] = []
                
                if plugin_id:
                    query += " AND ft.plugin_id = %s"
                    query_params.append(plugin_id)
                
                query += " GROUP BY ft.id, u.id, u.username, u.forum_role ORDER BY ft.is_pinned DESC, ft.created_at DESC LIMIT 50"
                
                cur.execute(query, query_params)
                topics = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'topics': [dict(t) for t in topics]
                    }, default=str),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            headers = event.get('headers', {})
            user_id = headers.get('X-User-Id') or headers.get('x-user-id')
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'create_topic':
                title = body_data.get('title', '').strip()
                content = body_data.get('content', '').strip()
                plugin_id = body_data.get('plugin_id')
                
                if not title or not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO forum_topics (title, content, author_id, plugin_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, title, content, views, created_at
                """, (title, content, user_id, plugin_id))
                
                new_topic = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'topic': dict(new_topic)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_comment':
                topic_id = body_data.get('topic_id')
                content = body_data.get('content', '').strip()
                
                if not topic_id or not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("SELECT is_closed FROM forum_topics WHERE id = %s", (topic_id,))
                topic = cur.fetchone()
                
                if not topic:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Тема не найдена'}),
                        'isBase64Encoded': False
                    }
                
                if topic['is_closed']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Тема закрыта для комментариев'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO forum_comments (topic_id, author_id, content)
                    VALUES (%s, %s, %s)
                    RETURNING id, content, created_at
                """, (topic_id, user_id, content))
                
                new_comment = cur.fetchone()
                
                cur.execute("""
                    SELECT author_id FROM forum_topics WHERE id = %s
                """, (topic_id,))
                topic_result = cur.fetchone()
                
                if topic_result and topic_result['author_id'] != int(user_id):
                    cur.execute("""
                        SELECT username FROM users WHERE id = %s
                    """, (user_id,))
                    commenter = cur.fetchone()
                    
                    cur.execute("""
                        SELECT title FROM forum_topics WHERE id = %s
                    """, (topic_id,))
                    topic_data = cur.fetchone()
                    
                    if commenter and topic_data:
                        cur.execute("""
                            INSERT INTO notifications (user_id, type, title, message, link)
                            VALUES (%s, 'comment', %s, %s, %s)
                        """, (
                            topic_result['author_id'],
                            'Новый комментарий',
                            f'{commenter["username"]} оставил комментарий в теме "{topic_data["title"]}"',
                            f'/forum/topic/{topic_id}'
                        ))
                
                cur.execute("UPDATE forum_topics SET updated_at = CURRENT_TIMESTAMP WHERE id = %s", (topic_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'comment': dict(new_comment)
                    }, default=str),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()