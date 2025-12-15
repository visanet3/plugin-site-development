"""
Business: Система вывода USDT для пользователей с системными уведомлениями
Args: event с httpMethod, body, queryStringParameters; context с request_id
Returns: HTTP response с информацией о заявках на вывод
"""

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timezone
from typing import Dict, Any
import requests

SCHEMA = 't_p32599880_plugin_site_developm'

def send_telegram_notification(event_type: str, user_info: Dict, details: Dict):
    '''Send notification to admin via Telegram'''
    try:
        telegram_url = 'https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f'
        payload = {
            'event_type': event_type,
            'user_info': user_info,
            'details': details
        }
        requests.post(telegram_url, json=payload, timeout=5)
    except:
        pass

def serialize_datetime(obj):
    """Сериализация datetime объектов в ISO формат с UTC"""
    if isinstance(obj, datetime):
        if obj.tzinfo is None:
            obj = obj.replace(tzinfo=timezone.utc)
        return obj.isoformat()
    return str(obj)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = None
    
    try:
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', 'my_withdrawals')
            
            if action == 'my_withdrawals':
                cursor.execute(f"""
                    SELECT * FROM {SCHEMA}.withdrawal_requests
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                """, (user_id,))
                
                withdrawals = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'withdrawals': [dict(w) for w in withdrawals]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'all_withdrawals':
                cursor.execute(f'SELECT role FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                user_role = cursor.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                status_filter = params.get('status', 'all')
                
                if status_filter == 'all':
                    query = f"""
                        SELECT wr.*, u.username, u.email
                        FROM {SCHEMA}.withdrawal_requests wr
                        LEFT JOIN {SCHEMA}.users u ON wr.user_id = u.id
                        ORDER BY wr.created_at DESC
                    """
                    cursor.execute(query)
                else:
                    query = f"""
                        SELECT wr.*, u.username, u.email
                        FROM {SCHEMA}.withdrawal_requests wr
                        LEFT JOIN {SCHEMA}.users u ON wr.user_id = u.id
                        WHERE wr.status = %s
                        ORDER BY wr.created_at DESC
                    """
                    cursor.execute(query, (status_filter,))
                
                withdrawals = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'withdrawals': [dict(w) for w in withdrawals]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_notifications':
                cursor.execute(f"""
                    SELECT * FROM {SCHEMA}.withdrawal_notifications
                    WHERE user_id = %s AND is_read = false
                    ORDER BY created_at DESC
                """, (user_id,))
                
                notifications = cursor.fetchall()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'notifications': [dict(n) for n in notifications]}, default=serialize_datetime),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action')
            
            if action == 'create_withdrawal':
                amount = body.get('amount')
                usdt_wallet = body.get('usdt_wallet', '').strip()
                
                if not amount or not usdt_wallet:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Amount and wallet required'}),
                        'isBase64Encoded': False
                    }
                
                amount = float(amount)
                
                # Проверяем, не заблокирован ли вывод для этого пользователя
                cursor.execute(f'SELECT withdrawal_blocked, withdrawal_blocked_reason FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                withdrawal_check = cursor.fetchone()
                
                if withdrawal_check and withdrawal_check['withdrawal_blocked']:
                    cursor.close()
                    reason = withdrawal_check.get('withdrawal_blocked_reason') or 'Вывод в данный момент недоступен для вас. Обратитесь в поддержку.'
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': reason}),
                        'isBase64Encoded': False
                    }
                
                # Комиссия за вывод USDT
                usdt_commission = 5.0
                
                if amount < 100:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Minimum withdrawal amount is 100 USDT'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(f'SELECT balance, username FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                user = cursor.fetchone()
                
                # Проверяем, достаточно ли средств с учётом комиссии
                total_required = amount + usdt_commission
                if not user or user['balance'] < total_required:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': f'Insufficient balance (required {total_required} USDT including {usdt_commission} USDT commission)'}),
                        'isBase64Encoded': False
                    }
                
                # Списываем сумму + комиссию
                cursor.execute(f'UPDATE {SCHEMA}.users SET balance = balance - %s WHERE id = %s', (total_required, user_id))
                
                # Устанавливаем expires_at на 1 час от создания
                from datetime import timedelta
                expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.withdrawal_requests (user_id, amount, usdt_wallet, status, expires_at)
                    VALUES (%s, %s, %s, 'processing', %s)
                    RETURNING id
                """, (user_id, amount, usdt_wallet, expires_at))
                
                withdrawal_id = cursor.fetchone()['id']
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description)
                    VALUES (%s, %s, 'withdrawal_request', %s)
                """, (user_id, -total_required, f'Заявка на вывод {amount} USDT (комиссия: {usdt_commission} USDT)'))
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.withdrawal_notifications (user_id, withdrawal_id, message)
                    VALUES (%s, %s, %s)
                """, (user_id, withdrawal_id, f'Ваша заявка на вывод {amount} USDT находится в обработке (комиссия {usdt_commission} USDT уже списана). Пожалуйста, ожидайте.'))
                
                cursor.execute(f'SELECT username FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                user_info = cursor.fetchone()
                username = user_info['username'] if user_info else f"ID {user_id}"
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.admin_notifications (type, title, message, related_id, related_type)
                    VALUES (%s, %s, %s, %s, %s)
                """, ('withdrawal_request', '💸 Заявка на вывод', f"Пользователь {username} создал заявку на вывод {amount} USDT", withdrawal_id, 'withdrawal'))
                
                conn.commit()
                
                # Send Telegram notification to admin
                send_telegram_notification(
                    'withdrawal_request',
                    {'username': user['username'], 'user_id': user_id},
                    {'amount': amount, 'wallet': usdt_wallet}
                )
                
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'withdrawal_id': withdrawal_id}),
                    'isBase64Encoded': False
                }
            
            elif action == 'process_withdrawal':
                cursor.execute(f'SELECT role FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                user_role = cursor.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                withdrawal_id = body.get('withdrawal_id')
                new_status = body.get('status')
                admin_comment = body.get('comment', '')
                
                if new_status not in ['completed', 'rejected']:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Invalid status'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(f"""
                    SELECT user_id, amount, status, usdt_wallet FROM {SCHEMA}.withdrawal_requests
                    WHERE id = %s
                """, (withdrawal_id,))
                
                withdrawal = cursor.fetchone()
                
                if not withdrawal:
                    cursor.close()
                    return {
                        'statusCode': 404,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Withdrawal not found'}),
                        'isBase64Encoded': False
                    }
                
                if withdrawal['status'] not in ['pending', 'processing']:
                    cursor.close()
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Withdrawal already processed'}),
                        'isBase64Encoded': False
                    }
                
                if new_status == 'rejected':
                    # При отклонении возвращаем сумму + комиссию
                    usdt_commission = 5.0
                    refund_amount = float(withdrawal['amount']) + usdt_commission
                    
                    cursor.execute(f'UPDATE {SCHEMA}.users SET balance = balance + %s WHERE id = %s', 
                                 (refund_amount, withdrawal['user_id']))
                    
                    cursor.execute(f"""
                        INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description)
                        VALUES (%s, %s, 'withdrawal_rejected', %s)
                    """, (withdrawal['user_id'], refund_amount, f'Возврат средств (заявка #{withdrawal_id} отклонена, адрес: {withdrawal["usdt_wallet"]}, вкл. комиссию {usdt_commission} USDT)'))
                elif new_status == 'completed':
                    # При успешном выводе добавляем запись в историю транзакций
                    cursor.execute(f"""
                        INSERT INTO {SCHEMA}.transactions (user_id, amount, type, description)
                        VALUES (%s, %s, 'withdrawal_completed', %s)
                    """, (withdrawal['user_id'], -float(withdrawal['amount']), f'Вывод {withdrawal["amount"]} USDT на адрес {withdrawal["usdt_wallet"]} (заявка #{withdrawal_id})'))
                
                cursor.execute(f"""
                    UPDATE {SCHEMA}.withdrawal_requests
                    SET status = %s, admin_comment = %s, processed_by = %s, 
                        completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                """, (new_status, admin_comment, user_id, withdrawal_id))
                
                if new_status == 'completed':
                    notif_msg = f'Ваша заявка на вывод {withdrawal["amount"]} USDT успешно обработана! Средства отправлены на ваш кошелек.'
                    notification_type = 'withdrawal_completed'
                else:
                    notif_msg = f'Ваша заявка на вывод {withdrawal["amount"]} USDT отклонена.'
                    if admin_comment:
                        notif_msg += f' Причина: {admin_comment}'
                    notification_type = 'withdrawal_rejected'
                
                # Добавляем уведомление о выводе (старая таблица)
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.withdrawal_notifications (user_id, withdrawal_id, message)
                    VALUES (%s, %s, %s)
                """, (withdrawal['user_id'], withdrawal_id, notif_msg))
                
                # Добавляем системное уведомление в основную таблицу уведомлений
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.notifications (user_id, type, title, message, is_read)
                    VALUES (%s, %s, %s, %s, FALSE)
                """, (withdrawal['user_id'], notification_type, 'Заявка на вывод обработана', notif_msg))
                
                # Отправляем личное сообщение от администратора
                system_subject = 'Заявка на вывод обработана'
                system_content = notif_msg
                if admin_comment and new_status == 'rejected':
                    system_content = f"🔔 Заявка на вывод #{withdrawal_id} отклонена\n\n💰 Сумма: {withdrawal['amount']} USDT\n📍 Адрес: {withdrawal['usdt_wallet']}\n❌ Причина: {admin_comment}\n\nСредства возвращены на ваш баланс."
                elif new_status == 'completed':
                    system_content = f"✅ Заявка на вывод #{withdrawal_id} успешно обработана!\n\n💰 Сумма: {withdrawal['amount']} USDT\n📍 Адрес: {withdrawal['usdt_wallet']}\n📤 Средства отправлены на ваш кошелек."
                
                cursor.execute(f"""
                    INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, subject, content, is_read)
                    VALUES (%s, %s, %s, %s, FALSE)
                """, (user_id, withdrawal['user_id'], system_subject, system_content))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            elif action == 'send_historical_notifications':
                cursor.execute(f'SELECT role FROM {SCHEMA}.users WHERE id = %s', (user_id,))
                user_role = cursor.fetchone()
                
                if not user_role or user_role['role'] != 'admin':
                    cursor.close()
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Access denied'}),
                        'isBase64Encoded': False
                    }
                
                cursor.execute(f"""
                    SELECT id, user_id, amount, status, usdt_wallet, admin_comment, completed_at
                    FROM {SCHEMA}.withdrawal_requests
                    WHERE status IN ('completed', 'rejected') 
                    AND completed_at IS NOT NULL
                    ORDER BY completed_at DESC
                """)
                
                processed_withdrawals = cursor.fetchall()
                notifications_sent = 0
                
                for withdrawal in processed_withdrawals:
                    withdrawal_id = withdrawal['id']
                    wr_user_id = withdrawal['user_id']
                    status = withdrawal['status']
                    admin_comment = withdrawal['admin_comment'] or ''
                    
                    if status == 'completed':
                        notification_type = 'withdrawal_completed'
                        notif_msg = f'Ваша заявка на вывод {withdrawal["amount"]} USDT успешно обработана! Средства отправлены на ваш кошелек.'
                        system_message = f"✅ Заявка на вывод #{withdrawal_id} успешно обработана!\n\n💰 Сумма: {withdrawal['amount']} USDT\n📍 Адрес: {withdrawal['usdt_wallet']}\n📤 Средства отправлены на ваш кошелек."
                    else:
                        notification_type = 'withdrawal_rejected'
                        notif_msg = f'Ваша заявка на вывод {withdrawal["amount"]} USDT отклонена.'
                        if admin_comment:
                            notif_msg += f' Причина: {admin_comment}'
                        system_message = f"🔔 Заявка на вывод #{withdrawal_id} отклонена\n\n💰 Сумма: {withdrawal['amount']} USDT\n📍 Адрес: {withdrawal['usdt_wallet']}\n❌ Причина: {admin_comment}\n\nСредства возвращены на ваш баланс."
                    
                    cursor.execute(f"""
                        SELECT COUNT(*) as count FROM {SCHEMA}.messages 
                        WHERE to_user_id = %s 
                        AND content LIKE %s
                    """, (wr_user_id, f'%заявка на вывод #{withdrawal_id}%'))
                    
                    already_sent = cursor.fetchone()['count']
                    
                    if already_sent == 0:
                        cursor.execute(f"""
                            INSERT INTO {SCHEMA}.notifications (user_id, type, title, message, is_read)
                            VALUES (%s, %s, %s, %s, FALSE)
                        """, (wr_user_id, notification_type, 'Заявка на вывод обработана', notif_msg))
                        
                        cursor.execute(f"""
                            INSERT INTO {SCHEMA}.messages (from_user_id, to_user_id, subject, content, is_read)
                            VALUES (%s, %s, %s, %s, FALSE)
                        """, (user_id, wr_user_id, 'Заявка на вывод обработана', system_message))
                        
                        notifications_sent += 1
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'notifications_sent': notifications_sent, 'total_withdrawals': len(processed_withdrawals)}),
                    'isBase64Encoded': False
                }
            
            elif action == 'mark_notifications_read':
                cursor.execute(f"""
                    UPDATE {SCHEMA}.withdrawal_notifications
                    SET is_read = true
                    WHERE user_id = %s AND is_read = false
                """, (user_id,))
                
                conn.commit()
                cursor.close()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True}),
                    'isBase64Encoded': False
                }
            
            cursor.close()
    
    finally:
        if conn:
            conn.close()
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }