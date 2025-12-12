"""
Business: Обработка платежей банковскими картами через Stripe для пополнения баланса
Args: event - dict с httpMethod, body (action, amount, user_id, payment_intent_id)
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response dict с client_secret для Stripe или статусом платежа
"""

import json
import os
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor
import requests
import stripe

SCHEMA = 't_p32599880_plugin_site_developm'
TELEGRAM_NOTIFY_URL = 'https://functions.poehali.dev/02d813a8-279b-4a13-bfe4-ffb7d0cf5a3f'

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

def escape_sql_string(s: str) -> str:
    if s is None:
        return 'NULL'
    return "'" + str(s).replace("\\", "\\\\").replace("'", "''") + "'"

def send_telegram_notification(event_type: str, user_info: Dict, details: Dict):
    """Отправить уведомление в Telegram"""
    try:
        requests.post(
            TELEGRAM_NOTIFY_URL,
            json={
                'event_type': event_type,
                'user_info': user_info,
                'details': details
            },
            timeout=5
        )
    except Exception as e:
        print(f'Failed to send telegram notification: {e}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Обработка платежей банковскими картами через Stripe
    Args: event - dict с httpMethod, body (action, amount, user_id, payment_intent_id)
          context - объект с атрибутами: request_id, function_name
    Returns: HTTP response dict
    """
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    if not stripe.api_key:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': 'STRIPE_SECRET_KEY not configured'}),
            'isBase64Encoded': False
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        conn = psycopg2.connect(dsn)
        conn.autocommit = True
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        if action == 'create_payment_intent':
            user_id = body_data.get('user_id')
            amount = body_data.get('amount', 0)
            
            if not user_id or amount <= 0:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Invalid parameters'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"SELECT username, email FROM {SCHEMA}.users WHERE id = {int(user_id)}")
            user = cur.fetchone()
            
            if not user:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'User not found'}),
                    'isBase64Encoded': False
                }
            
            amount_cents = int(float(amount) * 100)
            
            payment_intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency='usd',
                metadata={
                    'user_id': str(user_id),
                    'username': user['username']
                },
                description=f'Balance topup for user {user["username"]}'
            )
            
            cur.execute(f"""
                INSERT INTO {SCHEMA}.card_payments 
                (user_id, amount, status, payment_provider, transaction_id, created_at)
                VALUES ({int(user_id)}, {float(amount)}, 'pending', 'stripe', 
                        {escape_sql_string(payment_intent.id)}, NOW())
                RETURNING id
            """)
            payment = cur.fetchone()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'client_secret': payment_intent.client_secret,
                    'payment_id': payment['id'],
                    'amount': amount
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'confirm_payment':
            payment_intent_id = body_data.get('payment_intent_id')
            
            if not payment_intent_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Payment intent ID required'}),
                    'isBase64Encoded': False
                }
            
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            if payment_intent.status != 'succeeded':
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Payment not succeeded'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                SELECT cp.*, u.username 
                FROM {SCHEMA}.card_payments cp
                JOIN {SCHEMA}.users u ON cp.user_id = u.id
                WHERE cp.transaction_id = {escape_sql_string(payment_intent_id)} 
                AND cp.status = 'pending'
            """)
            payment = cur.fetchone()
            
            if not payment:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Payment not found or already processed'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(f"""
                UPDATE {SCHEMA}.card_payments
                SET status = 'completed', completed_at = NOW()
                WHERE id = {int(payment['id'])}
            """)
            
            cur.execute(f"""
                UPDATE {SCHEMA}.users
                SET balance = balance + {float(payment['amount'])}
                WHERE id = {int(payment['user_id'])}
            """)
            
            cur.execute(f"""
                INSERT INTO {SCHEMA}.transactions
                (user_id, amount, type, description, created_at)
                VALUES ({int(payment['user_id'])}, {float(payment['amount'])}, 
                        'deposit', {escape_sql_string(f'Пополнение картой Stripe #{payment["id"]}')}, NOW())
            """)
            
            send_telegram_notification(
                'balance_topup',
                {'username': payment['username'], 'user_id': payment['user_id']},
                {'amount': payment['amount'], 'method': 'card'}
            )
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Payment confirmed',
                    'amount': payment['amount']
                }),
                'isBase64Encoded': False
            }
        
        elif action == 'check_status':
            payment_intent_id = body_data.get('payment_intent_id')
            
            if not payment_intent_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Payment intent ID required'}),
                    'isBase64Encoded': False
                }
            
            payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            cur.execute(f"""
                SELECT id, user_id, amount, status, created_at, completed_at
                FROM {SCHEMA}.card_payments
                WHERE transaction_id = {escape_sql_string(payment_intent_id)}
            """)
            payment = cur.fetchone()
            
            if not payment:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'success': False, 'error': 'Payment not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'payment': {
                        'id': payment['id'],
                        'amount': str(payment['amount']),
                        'status': payment['status'],
                        'stripe_status': payment_intent.status,
                        'created_at': payment['created_at'].isoformat() if payment['created_at'] else None
                    }
                }),
                'isBase64Encoded': False
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'success': False, 'error': 'Invalid action'}),
                'isBase64Encoded': False
            }
    
    except stripe.error.StripeError as e:
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': f'Stripe error: {str(e)}'}),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'success': False, 'error': str(e)}),
            'isBase64Encoded': False
        }
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()
