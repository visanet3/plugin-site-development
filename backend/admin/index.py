'''
Business: Административные функции для управления пользователями, темами форума и профилями пользователей
Args: event - dict с httpMethod, body, headers (X-User-Id для проверки прав)
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с результатами операций или списком данных
'''

import json
import os
from typing import Dict, Any, List
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

SCHEMA = 't_p32599880_plugin_site_developm'

def get_db_connection():
    """Получить подключение к БД"""
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url, cursor_factory=RealDictCursor)

def serialize_datetime(obj):
    """Сериализация datetime объектов в ISO формат с UTC"""
    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        return obj.isoformat()
    return str(obj)

def check_admin(user_id: str, cur) -> bool:
    """Проверка прав администратора"""
    cur.execute(f"SELECT role FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    return user and user.get('role') == 'admin'

def log_admin_action(admin_id: str, action_type: str, target_type: str, target_id: int, details: str, cur):
    """Логирование действий администратора"""
    cur.execute(
        f"INSERT INTO {SCHEMA}.admin_actions (admin_id, action_type, target_type, target_id, details) VALUES (%s, %s, %s, %s, %s)",
        (admin_id, action_type, target_type, target_id, details)
    )

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
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action')
            
            if action == 'user_profile':
                user_profile_id = params.get('user_id')
                
                if not user_profile_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT 
                        id, username, avatar_url, bio, 
                        vk_url, telegram, discord, 
                        forum_role, created_at, last_seen_at
                    FROM {SCHEMA}.users 
                    WHERE id = %s AND is_blocked = FALSE
                """, (user_profile_id,))
                
                user_profile = cur.fetchone()
                
                if not user_profile:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"""
                    SELECT COUNT(*) as count
                    FROM {SCHEMA}.forum_topics
                    WHERE author_id = %s AND removed_at IS NULL
                """, (user_profile_id,))
                topics_count = cur.fetchone()['count']
                
                cur.execute(f"""
                    SELECT COUNT(*) as count
                    FROM {SCHEMA}.forum_comments
                    WHERE author_id = %s AND removed_at IS NULL
                """, (user_profile_id,))
                comments_count = cur.fetchone()['count']
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'user': dict(user_profile),
                        'topics_count': topics_count,
                        'comments_count': comments_count
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if not check_admin(user_id, cur):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            if action == 'users':
                cur.execute(f"""
                    SELECT id, username, email, role, forum_role, is_blocked, created_at 
                    FROM {SCHEMA}.users 
                    ORDER BY created_at DESC 
                    LIMIT 100
                """)
                users = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': [dict(u) for u in users]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'logs':
                cur.execute(f"""
                    SELECT aa.*, u.username as admin_name
                    FROM {SCHEMA}.admin_actions aa
                    LEFT JOIN {SCHEMA}.users u ON aa.admin_id = u.id
                    ORDER BY aa.created_at DESC
                    LIMIT 100
                """)
                logs = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'logs': [dict(l) for l in logs]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if not check_admin(user_id, cur):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'block_user':
                target_user_id = body_data.get('user_id')
                reason = body_data.get('reason', '')
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET is_blocked = TRUE, blocked_at = CURRENT_TIMESTAMP, blocked_by = %s, block_reason = %s WHERE id = %s",
                    (user_id, reason, target_user_id)
                )
                
                log_admin_action(user_id, 'block_user', 'user', target_user_id, reason, cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unblock_user':
                target_user_id = body_data.get('user_id')
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET is_blocked = FALSE, blocked_at = NULL, blocked_by = NULL, block_reason = NULL WHERE id = %s",
                    (target_user_id,)
                )
                
                log_admin_action(user_id, 'unblock_user', 'user', target_user_id, '', cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'delete_user':
                target_user_id = body_data.get('user_id')
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'user_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT username FROM {SCHEMA}.users WHERE id = %s", (target_user_id,))
                target_user = cur.fetchone()
                
                if not target_user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Пользователь не найден'}),
                        'isBase64Encoded': False
                    }
                
                log_admin_action(user_id, 'delete_user', 'user', target_user_id, f"Deleted user: {target_user['username']}", cur)
                
                # Delete in correct order to avoid foreign key violations
                # First: delete data that references escrow_deals
                cur.execute(f"""
                    DELETE FROM {SCHEMA}.escrow_dispute_notifications 
                    WHERE deal_id IN (
                        SELECT id FROM {SCHEMA}.escrow_deals 
                        WHERE buyer_id = %s OR seller_id = %s
                    )
                """, (target_user_id, target_user_id))
                
                cur.execute(f"""
                    DELETE FROM {SCHEMA}.escrow_messages 
                    WHERE deal_id IN (
                        SELECT id FROM {SCHEMA}.escrow_deals 
                        WHERE buyer_id = %s OR seller_id = %s
                    )
                """, (target_user_id, target_user_id))
                
                # Now delete other user data
                cur.execute(f"DELETE FROM {SCHEMA}.forum_comments WHERE author_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.forum_topics WHERE author_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.messages WHERE from_user_id = %s OR to_user_id = %s", (target_user_id, target_user_id))
                cur.execute(f"DELETE FROM {SCHEMA}.notifications WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.transactions WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.escrow_deals WHERE buyer_id = %s OR seller_id = %s", (target_user_id, target_user_id))
                cur.execute(f"DELETE FROM {SCHEMA}.crypto_payments WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.withdrawal_requests WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.flash_usdt_orders WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.lottery_tickets WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.lottery_chat WHERE user_id = %s", (target_user_id,))
                cur.execute(f"DELETE FROM {SCHEMA}.password_reset_tokens WHERE user_id = %s", (target_user_id,))
                
                cur.execute(f"DELETE FROM {SCHEMA}.users WHERE id = %s", (target_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'set_role':
                target_user_id = body_data.get('user_id')
                role = body_data.get('role', 'user')
                
                cur.execute(f"UPDATE {SCHEMA}.users SET role = %s WHERE id = %s", (role, target_user_id))
                
                log_admin_action(user_id, 'set_role', 'user', target_user_id, f'Role: {role}', cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'set_forum_role':
                target_user_id = body_data.get('user_id')
                forum_role = body_data.get('forum_role', 'new')
                
                cur.execute(f"UPDATE {SCHEMA}.users SET forum_role = %s WHERE id = %s", (forum_role, target_user_id))
                
                log_admin_action(user_id, 'set_forum_role', 'user', target_user_id, f'Forum role: {forum_role}', cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'add_balance':
                username = body_data.get('username', '').strip()
                amount = body_data.get('amount')
                
                if not username:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Никнейм обязателен'}),
                        'isBase64Encoded': False
                    }
                
                try:
                    amount = float(amount)
                    if amount <= 0:
                        raise ValueError()
                except (ValueError, TypeError):
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Некорректная сумма'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(f"SELECT id, balance FROM {SCHEMA}.users WHERE username = %s", (username,))
                target_user = cur.fetchone()
                
                if not target_user:
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Пользователь {username} не найден'}),
                        'isBase64Encoded': False
                    }
                
                target_user_id = target_user['id']
                new_balance = float(target_user['balance'] or 0) + amount
                
                cur.execute(
                    f"UPDATE {SCHEMA}.users SET balance = %s WHERE id = %s",
                    (new_balance, target_user_id)
                )
                
                cur.execute(
                    f"""INSERT INTO {SCHEMA}.transactions 
                       (user_id, amount, description, type) 
                       VALUES (%s, %s, %s, %s)""",
                    (target_user_id, amount, f'Пополнение администратором (ID: {user_id})', 'admin_topup')
                )
                
                log_admin_action(user_id, 'add_balance', 'user', target_user_id, f'Added {amount} USDT', cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'new_balance': new_balance,
                        'username': username
                    }),
                    'isBase64Encoded': False
                }
            
            elif action == 'delete_topic':
                topic_id = body_data.get('topic_id')
                
                if not topic_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'topic_id обязателен'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    f"UPDATE {SCHEMA}.forum_topics SET removed_at = CURRENT_TIMESTAMP, removed_by = %s WHERE id = %s",
                    (user_id, topic_id)
                )
                
                log_admin_action(user_id, 'delete_topic', 'topic', topic_id, 'Topic removed', cur)
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Unknown action'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'PUT':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if not check_admin(user_id, cur):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            body_data = json.loads(event.get('body', '{}'))
            topic_id = body_data.get('topic_id')
            title = body_data.get('title')
            content = body_data.get('content')
            
            if not topic_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'topic_id required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE {SCHEMA}.forum_topics SET title = COALESCE(%s, title), content = COALESCE(%s, content), updated_at = CURRENT_TIMESTAMP WHERE id = %s",
                (title, content, topic_id)
            )
            
            log_admin_action(user_id, 'edit_topic', 'topic', topic_id, f'Title: {title}', cur)
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            if not user_id:
                return {
                    'statusCode': 401,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Требуется авторизация'}),
                    'isBase64Encoded': False
                }
            
            if not check_admin(user_id, cur):
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Недостаточно прав'}),
                    'isBase64Encoded': False
                }
            
            params = event.get('queryStringParameters', {}) or {}
            target_type = params.get('type')
            target_id = params.get('id')
            
            if not target_type or not target_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'type and id required'}),
                    'isBase64Encoded': False
                }
            
            if target_type == 'topic':
                cur.execute(
                    f"UPDATE {SCHEMA}.forum_topics SET removed_at = CURRENT_TIMESTAMP, removed_by = %s WHERE id = %s",
                    (user_id, target_id)
                )
                log_admin_action(user_id, 'remove_topic', 'topic', int(target_id), '', cur)
            
            elif target_type == 'comment':
                cur.execute(
                    f"UPDATE {SCHEMA}.forum_comments SET removed_at = CURRENT_TIMESTAMP, removed_by = %s WHERE id = %s",
                    (user_id, target_id)
                )
                log_admin_action(user_id, 'remove_comment', 'comment', int(target_id), '', cur)
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid type'}),
                    'isBase64Encoded': False
                }
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True}),
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