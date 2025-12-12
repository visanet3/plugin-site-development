'''
Business: Автоматическая проверка и отмена истекших заявок на вывод средств
Args: event - dict с httpMethod (триггер для проверки заявок)
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с количеством отменённых заявок
'''

import json
import os
from typing import Dict, Any
from datetime import datetime, timezone
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
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        current_time = datetime.now(timezone.utc)
        
        # Находим все заявки, у которых истёк срок (более 1 часа с момента создания)
        cur.execute(
            """SELECT wr.id, wr.user_id, wr.amount, wr.created_at, wr.expires_at, u.username
               FROM withdrawal_requests wr
               LEFT JOIN users u ON wr.user_id = u.id
               WHERE wr.status IN ('processing', 'pending')
               AND (
                   wr.expires_at < %s 
                   OR (wr.expires_at IS NULL AND wr.created_at < %s - INTERVAL '1 hour')
               )
               LIMIT 100""",
            (current_time, current_time)
        )
        expired_requests = cur.fetchall()
        
        cancelled_count = 0
        
        for request in expired_requests:
            request_id = request['id']
            user_id = request['user_id']
            amount = float(request['amount'])
            username = request['username'] or f"ID {user_id}"
            
            # Комиссия за вывод
            usdt_commission = 5.0
            total_refund = amount + usdt_commission
            
            # Отменяем заявку
            cur.execute(
                """UPDATE withdrawal_requests 
                   SET status = 'cancelled', 
                       updated_at = CURRENT_TIMESTAMP,
                       admin_comment = 'Автоматическая отмена: истёк срок обработки (1 час)'
                   WHERE id = %s""",
                (request_id,)
            )
            
            # Возвращаем средства пользователю
            cur.execute(
                "UPDATE users SET balance = COALESCE(balance, 0) + %s WHERE id = %s",
                (total_refund, user_id)
            )
            
            # Создаём транзакцию возврата
            cur.execute(
                """INSERT INTO transactions (user_id, amount, type, description) 
                   VALUES (%s, %s, %s, %s)""",
                (user_id, total_refund, 'withdrawal_cancelled', 
                 f"Возврат средств: отмена заявки #{request_id} (истёк срок)")
            )
            
            # Уведомление пользователю
            cur.execute(
                """INSERT INTO notifications (user_id, type, title, message) 
                   VALUES (%s, %s, %s, %s)""",
                (user_id, 'warning', 'Заявка на вывод отменена', 
                 f"Ваша заявка на вывод {amount:.2f} USDT была автоматически отменена. "
                 f"Срок обработки истёк (1 час). Средства возвращены на баланс: {total_refund:.2f} USDT")
            )
            
            # Уведомление админам
            cur.execute(
                """INSERT INTO admin_notifications (type, title, message, related_id, related_type) 
                   VALUES (%s, %s, %s, %s, %s)""",
                ('withdrawal_cancelled', '⚠️ Автоматическая отмена вывода', 
                 f"Заявка #{request_id} пользователя {username} на {amount:.2f} USDT отменена (истёк срок)",
                 request_id, 'withdrawal')
            )
            
            cancelled_count += 1
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'success': True,
                'cancelled': cancelled_count,
                'message': f'Отменено заявок: {cancelled_count}'
            }),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f'Error in withdrawal checker: {e}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
