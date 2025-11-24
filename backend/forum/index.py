'''
Business: Управление темами форума и комментариями для авторизованных пользователей, модерация для администраторов
Args: event - dict с httpMethod, body, headers (X-User-Id), queryStringParameters
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с темами/комментариями или результатом создания/модерации
'''

import json
import os
from typing import Dict, Any, List
from datetime import datetime, timezone
import psycopg2
from psycopg2.extras import RealDictCursor

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

def is_admin(cur, user_id: str) -> bool:
    """Проверка является ли пользователь администратором"""
    cur.execute("SELECT role FROM users WHERE id = %s", (user_id,))
    user = cur.fetchone()
    return user and user['role'] == 'admin'

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
                        ft.created_at, ft.updated_at, ft.category_id,
                        u.id as author_id, u.username as author_name, u.avatar_url as author_avatar,
                        u.forum_role as author_forum_role, u.last_seen_at as author_last_seen,
                        u.is_verified as author_is_verified,
                        p.id as plugin_id, p.title as plugin_title,
                        fc.name as category_name, fc.slug as category_slug, fc.color as category_color, fc.icon as category_icon,
                        parent_fc.name as parent_category_name, parent_fc.slug as parent_category_slug, 
                        parent_fc.color as parent_category_color, parent_fc.icon as parent_category_icon
                    FROM forum_topics ft
                    LEFT JOIN users u ON ft.author_id = u.id
                    LEFT JOIN plugins p ON ft.plugin_id = p.id
                    LEFT JOIN forum_categories fc ON ft.category_id = fc.id
                    LEFT JOIN forum_categories parent_fc ON fc.parent_id = parent_fc.id
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
                        fc.id, fc.content, fc.created_at, fc.parent_id,
                        u.id as author_id, u.username as author_name, u.avatar_url as author_avatar,
                        u.forum_role as author_forum_role, u.last_seen_at as author_last_seen,
                        u.is_verified as author_is_verified
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
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            elif params.get('action') == 'get_categories':
                cur.execute("""
                    SELECT id, name, slug, description, icon, color, display_order, created_at, parent_id
                    FROM forum_categories
                    WHERE removed_at IS NULL
                    ORDER BY display_order ASC, name ASC
                """)
                all_categories = cur.fetchall()
                
                parent_categories = []
                subcategories_map = {}
                
                for cat in all_categories:
                    cat_dict = dict(cat)
                    if cat['parent_id'] is None:
                        cat_dict['subcategories'] = []
                        parent_categories.append(cat_dict)
                        subcategories_map[cat['id']] = cat_dict['subcategories']
                
                for cat in all_categories:
                    if cat['parent_id'] is not None:
                        parent_id = cat['parent_id']
                        if parent_id in subcategories_map:
                            subcategories_map[parent_id].append(dict(cat))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'categories': parent_categories
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            else:
                plugin_id = params.get('plugin_id')
                category_slug = params.get('category')
                query = """
                    SELECT 
                        ft.id, ft.title, ft.views, ft.is_pinned, ft.created_at, ft.updated_at, ft.category_id,
                        u.id as author_id, u.username as author_name, u.avatar_url as author_avatar, 
                        u.forum_role as author_forum_role, u.last_seen_at as author_last_seen,
                        u.is_verified as author_is_verified,
                        fcat.name as category_name, fcat.slug as category_slug, fcat.color as category_color, fcat.icon as category_icon,
                        parent_fc.name as parent_category_name, parent_fc.slug as parent_category_slug,
                        parent_fc.color as parent_category_color, parent_fc.icon as parent_category_icon,
                        COUNT(fcom.id) as comments_count
                    FROM forum_topics ft
                    LEFT JOIN users u ON ft.author_id = u.id
                    LEFT JOIN forum_comments fcom ON ft.id = fcom.topic_id AND fcom.removed_at IS NULL
                    LEFT JOIN forum_categories fcat ON ft.category_id = fcat.id
                    LEFT JOIN forum_categories parent_fc ON fcat.parent_id = parent_fc.id
                    WHERE ft.removed_at IS NULL
                """
                query_params: List[Any] = []
                
                if plugin_id:
                    query += " AND ft.plugin_id = %s"
                    query_params.append(plugin_id)
                
                if category_slug:
                    query += " AND fcat.slug = %s"
                    query_params.append(category_slug)
                
                query += " GROUP BY ft.id, ft.updated_at, u.id, u.username, u.avatar_url, u.forum_role, u.last_seen_at, fcat.id, fcat.name, fcat.slug, fcat.color, fcat.icon, parent_fc.id, parent_fc.name, parent_fc.slug, parent_fc.color, parent_fc.icon ORDER BY ft.is_pinned DESC, ft.created_at DESC"
                
                cur.execute(query, query_params)
                topics = cur.fetchall()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'topics': [dict(t) for t in topics]
                    }, default=serialize_datetime),
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
                category_id = body_data.get('category_id')
                
                if not title or not content:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Заполните все поля'}),
                        'isBase64Encoded': False
                    }
                
                if not category_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Выберите категорию'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    INSERT INTO forum_topics (title, content, author_id, plugin_id, category_id)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING id, title, content, views, created_at
                """, (title, content, user_id, plugin_id, category_id))
                
                new_topic = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'topic': dict(new_topic)
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'create_comment':
                topic_id = body_data.get('topic_id')
                content = body_data.get('content', '').strip()
                parent_id = body_data.get('parent_id')
                
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
                    INSERT INTO forum_comments (topic_id, author_id, content, parent_id)
                    VALUES (%s, %s, %s, %s)
                    RETURNING id, content, created_at, parent_id
                """, (topic_id, user_id, content, parent_id))
                
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
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_categories':
                cur.execute("""
                    SELECT id, name, slug, description, icon, color, display_order, created_at, parent_id
                    FROM forum_categories
                    WHERE removed_at IS NULL
                    ORDER BY display_order ASC, name ASC
                """)
                all_categories = cur.fetchall()
                
                parent_categories = []
                subcategories_map = {}
                
                for cat in all_categories:
                    cat_dict = dict(cat)
                    if cat['parent_id'] is None:
                        cat_dict['subcategories'] = []
                        parent_categories.append(cat_dict)
                        subcategories_map[cat['id']] = cat_dict['subcategories']
                
                for cat in all_categories:
                    if cat['parent_id'] is not None:
                        parent_id = cat['parent_id']
                        if parent_id in subcategories_map:
                            subcategories_map[parent_id].append(dict(cat))
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'categories': parent_categories
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_update_topic':
                if not is_admin(cur, user_id):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                topic_id = body_data.get('topic_id')
                title = body_data.get('title', '').strip()
                content = body_data.get('content', '').strip()
                category_id = body_data.get('category_id')
                is_pinned = body_data.get('is_pinned', False)
                is_closed = body_data.get('is_closed', False)
                
                if not topic_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указан ID темы'}),
                        'isBase64Encoded': False
                    }
                
                update_fields = []
                update_values = []
                
                if title:
                    update_fields.append('title = %s')
                    update_values.append(title)
                if content:
                    update_fields.append('content = %s')
                    update_values.append(content)
                if category_id:
                    update_fields.append('category_id = %s')
                    update_values.append(category_id)
                
                update_fields.append('is_pinned = %s')
                update_values.append(is_pinned)
                update_fields.append('is_closed = %s')
                update_values.append(is_closed)
                update_fields.append('updated_at = CURRENT_TIMESTAMP')
                
                update_values.append(topic_id)
                
                cur.execute(f"""
                    UPDATE forum_topics 
                    SET {', '.join(update_fields)}
                    WHERE id = %s
                    RETURNING id, title, content, is_pinned, is_closed, category_id, updated_at
                """, update_values)
                
                updated_topic = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'success': True,
                        'topic': dict(updated_topic)
                    }, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_delete_topic':
                if not is_admin(cur, user_id):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                topic_id = body_data.get('topic_id')
                
                if not topic_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указан ID темы'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE forum_topics 
                    SET removed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (topic_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_delete_comment':
                if not is_admin(cur, user_id):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                comment_id = body_data.get('comment_id')
                
                if not comment_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Не указан ID комментария'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE forum_comments 
                    SET removed_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (comment_id,))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'admin_manage_categories':
                if not is_admin(cur, user_id):
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Доступ запрещен'}),
                        'isBase64Encoded': False
                    }
                
                category_action = body_data.get('category_action')
                
                if category_action == 'create':
                    name = body_data.get('name', '').strip()
                    slug = body_data.get('slug', '').strip()
                    description = body_data.get('description', '').strip()
                    icon = body_data.get('icon', 'Folder')
                    color = body_data.get('color', '#3b82f6')
                    parent_id = body_data.get('parent_id')
                    display_order = body_data.get('display_order', 0)
                    
                    if not name or not slug:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Заполните название и slug'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute("""
                        INSERT INTO forum_categories (name, slug, description, icon, color, parent_id, display_order)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                        RETURNING id, name, slug, description, icon, color, parent_id, display_order, created_at
                    """, (name, slug, description, icon, color, parent_id, display_order))
                    
                    new_category = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'category': dict(new_category)
                        }, default=serialize_datetime),
                        'isBase64Encoded': False
                    }
                
                elif category_action == 'update':
                    category_id = body_data.get('category_id')
                    name = body_data.get('name', '').strip()
                    description = body_data.get('description', '').strip()
                    icon = body_data.get('icon')
                    color = body_data.get('color')
                    display_order = body_data.get('display_order')
                    
                    if not category_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Не указан ID категории'}),
                            'isBase64Encoded': False
                        }
                    
                    update_fields = []
                    update_values = []
                    
                    if name:
                        update_fields.append('name = %s')
                        update_values.append(name)
                    if description:
                        update_fields.append('description = %s')
                        update_values.append(description)
                    if icon:
                        update_fields.append('icon = %s')
                        update_values.append(icon)
                    if color:
                        update_fields.append('color = %s')
                        update_values.append(color)
                    if display_order is not None:
                        update_fields.append('display_order = %s')
                        update_values.append(display_order)
                    
                    update_values.append(category_id)
                    
                    cur.execute(f"""
                        UPDATE forum_categories 
                        SET {', '.join(update_fields)}
                        WHERE id = %s
                        RETURNING id, name, slug, description, icon, color, parent_id, display_order
                    """, update_values)
                    
                    updated_category = cur.fetchone()
                    conn.commit()
                    
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({
                            'success': True,
                            'category': dict(updated_category)
                        }, default=serialize_datetime),
                        'isBase64Encoded': False
                    }
                
                elif category_action == 'delete':
                    category_id = body_data.get('category_id')
                    
                    if not category_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                            'body': json.dumps({'error': 'Не указан ID категории'}),
                            'isBase64Encoded': False
                        }
                    
                    cur.execute("""
                        UPDATE forum_categories 
                        SET removed_at = CURRENT_TIMESTAMP
                        WHERE id = %s
                    """, (category_id,))
                    
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
                    'body': json.dumps({'error': 'Неизвестное действие с категорией'}),
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