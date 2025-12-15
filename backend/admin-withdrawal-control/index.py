import json
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Админ-панель для управления блокировкой вывода средств пользователям
    Args: event - dict с httpMethod, headers, body, queryStringParameters
          context - object с request_id и другими атрибутами
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
    
    headers = event.get('headers', {})
    admin_id_str = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not admin_id_str:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Требуется авторизация'}),
            'isBase64Encoded': False
        }
    
    admin_id = int(admin_id_str)
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL не настроен'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        cur.execute(
            "SELECT role FROM t_p32599880_plugin_site_developm.users WHERE id = %s",
            (admin_id,)
        )
        admin_row = cur.fetchone()
        
        if not admin_row or admin_row[0] != 'admin':
            return {
                'statusCode': 403,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Доступ запрещен. Требуются права администратора'}),
                'isBase64Encoded': False
            }
        
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', 'list')
            
            if action == 'list':
                cur.execute("""
                    SELECT id, username, email, balance, withdrawal_blocked, 
                           withdrawal_blocked_reason, withdrawal_blocked_at
                    FROM t_p32599880_plugin_site_developm.users
                    ORDER BY withdrawal_blocked DESC, id DESC
                    LIMIT 100
                """)
                
                users = []
                for row in cur.fetchall():
                    users.append({
                        'id': row[0],
                        'username': row[1],
                        'email': row[2],
                        'balance': float(row[3]) if row[3] else 0,
                        'withdrawal_blocked': row[4] or False,
                        'withdrawal_blocked_reason': row[5],
                        'withdrawal_blocked_at': row[6].isoformat() if row[6] else None
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'block_withdrawal':
                target_user_id = body_data.get('user_id')
                reason = body_data.get('reason', 'Превышено количество пополнений. Обратитесь в поддержку.')
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите user_id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE t_p32599880_plugin_site_developm.users
                    SET withdrawal_blocked = TRUE,
                        withdrawal_blocked_reason = %s,
                        withdrawal_blocked_at = %s,
                        withdrawal_blocked_by = %s
                    WHERE id = %s
                """, (reason, datetime.utcnow(), admin_id, target_user_id))
                
                conn.commit()
                
                cur.execute("""
                    INSERT INTO t_p32599880_plugin_site_developm.admin_actions
                    (admin_id, action_type, target_user_id, details, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (admin_id, 'block_withdrawal', target_user_id, 
                      json.dumps({'reason': reason}), datetime.utcnow()))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Вывод заблокирован'}),
                    'isBase64Encoded': False
                }
            
            elif action == 'unblock_withdrawal':
                target_user_id = body_data.get('user_id')
                
                if not target_user_id:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Укажите user_id'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute("""
                    UPDATE t_p32599880_plugin_site_developm.users
                    SET withdrawal_blocked = FALSE,
                        withdrawal_blocked_reason = NULL,
                        withdrawal_blocked_at = NULL,
                        withdrawal_blocked_by = NULL
                    WHERE id = %s
                """, (target_user_id,))
                
                conn.commit()
                
                cur.execute("""
                    INSERT INTO t_p32599880_plugin_site_developm.admin_actions
                    (admin_id, action_type, target_user_id, details, created_at)
                    VALUES (%s, %s, %s, %s, %s)
                """, (admin_id, 'unblock_withdrawal', target_user_id, 
                      json.dumps({}), datetime.utcnow()))
                
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': 'Вывод разблокирован'}),
                    'isBase64Encoded': False
                }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
