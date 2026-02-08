"""
Business: Отправка уведомлений администратору в Telegram о действиях пользователей
Args: event с httpMethod, body с типом события и данными
Returns: HTTP response с результатом отправки
"""

import json
import os
from typing import Dict, Any
import requests

def send_telegram_message(text: str) -> bool:
    """Отправить сообщение в Telegram"""
    try:
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_ADMIN_CHAT_ID')
        
        if not bot_token or not chat_id:
            print('Telegram credentials not configured')
            return False
        
        url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
        payload = {
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }
        
        response = requests.post(url, json=payload, timeout=10)
        return response.status_code == 200
    except Exception as e:
        print(f'Error sending Telegram message: {e}')
        return False

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Business: Отправка уведомлений администратору о действиях пользователей
    Args: event - dict с httpMethod, body (event_type, user_info, details)
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
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        event_type = body_data.get('event_type', '')
        user_info = body_data.get('user_info', {})
        details = body_data.get('details', {})
        
        username = user_info.get('username', 'Unknown')
        user_id = user_info.get('user_id', 'N/A')
        
        # Формируем сообщение в зависимости от типа события
        message = ''
        
        if event_type == 'balance_topup':
            amount = details.get('amount', 0)
            method = details.get('method', 'unknown')
            method_text = {
                'card': '💳 Банковская карта',
                'crypto': '₿ Криптовалюта',
                'unknown': '❓ Неизвестно'
            }.get(method, '❓ Неизвестно')
            message = f"💰 <b>Пополнение баланса</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n💵 Сумма: {amount} USDT\n💳 Способ: {method_text}"
        
        elif event_type == 'withdrawal_request':
            amount = details.get('amount', 0)
            wallet = details.get('wallet', 'N/A')
            message = f"💸 <b>Заявка на вывод</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n💵 Сумма: {amount} USDT\n💼 Кошелек: {wallet}"
        
        elif event_type == 'flash_usdt_purchase':
            amount = details.get('amount', 0)
            price = details.get('price', 0)
            package = details.get('package', 'N/A')
            wallet = details.get('wallet', 'N/A')
            message = f"⚡ <b>Покупка Flash USDT</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n📦 Пакет: {package}\n💵 Количество: {amount} USDT\n💰 Цена: {price} USDT\n💼 Кошелек: {wallet}"
        
        elif event_type == 'deal_created':
            deal_title = details.get('title', 'N/A')
            deal_amount = details.get('amount', 0)
            message = f"🤝 <b>Создание сделки в гаранте</b>\n\n👤 Продавец: {username} (ID: {user_id})\n📋 Название: {deal_title}\n💵 Сумма: {deal_amount} USDT"
        
        elif event_type == 'forum_topic_created':
            topic_title = details.get('title', 'N/A')
            category = details.get('category', 'N/A')
            message = f"📝 <b>Новая тема на форуме</b>\n\n👤 Автор: {username} (ID: {user_id})\n📂 Категория: {category}\n📋 Название: {topic_title}"
        
        elif event_type == 'usdt_to_btc_exchange':
            usdt_amount = details.get('usdt_amount', 0)
            btc_received = details.get('btc_received', 0)
            btc_price = details.get('btc_price', 0)
            message = f"🔄 <b>Обмен USDT → BTC</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n💵 Обменял: {usdt_amount} USDT\n₿ Получил: {btc_received} BTC\n📊 Курс: ${btc_price:,.2f}"
        
        elif event_type == 'btc_to_usdt_exchange':
            btc_amount = details.get('btc_amount', 0)
            usdt_received = details.get('usdt_received', 0)
            btc_price = details.get('btc_price', 0)
            message = f"🔄 <b>Обмен BTC → USDT</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n₿ Обменял: {btc_amount} BTC\n💵 Получил: {usdt_received} USDT\n📊 Курс: ${btc_price:,.2f}"
        
        elif event_type == 'btc_withdrawal':
            btc_amount = details.get('btc_amount', 0)
            btc_address = details.get('btc_address', 'N/A')
            message = f"💸 <b>Вывод BTC</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n₿ Сумма: {btc_amount} BTC\n💼 Адрес: <code>{btc_address}</code>"
        
        elif event_type == 'crypto_exchange':
            exchange_type = details.get('type', 'buy')
            from_currency = details.get('from_currency', 'N/A')
            to_currency = details.get('to_currency', 'N/A')
            from_amount = details.get('from_amount', 0)
            to_amount = details.get('to_amount', 0)
            rate = details.get('rate', 0)
            
            # Эмодзи для разных криптовалют
            crypto_emoji = {
                'BTC': '₿',
                'ETH': 'Ξ',
                'BNB': '◆',
                'SOL': '◎',
                'XRP': '✕',
                'TRX': '▲',
                'USDT': '💵'
            }
            
            from_emoji = crypto_emoji.get(from_currency, '💰')
            to_emoji = crypto_emoji.get(to_currency, '💰')
            
            if exchange_type == 'buy':
                message = f"🔄 <b>Обмен {from_currency} → {to_currency}</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n{from_emoji} Обменял: {from_amount:.2f} {from_currency}\n{to_emoji} Получил: {to_amount:.8f} {to_currency}\n📊 Курс: ${rate:,.2f}"
            else:
                message = f"🔄 <b>Обмен {from_currency} → {to_currency}</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n{from_emoji} Обменял: {from_amount:.8f} {from_currency}\n{to_emoji} Получил: {to_amount:.2f} {to_currency}\n📊 Курс: ${rate:,.2f}"
        
        elif event_type == 'user_registration':
            email = details.get('email', 'N/A')
            message = f"👋 <b>Новый пользователь</b>\n\n👤 Имя: {username} (ID: {user_id})\n📧 Email: {email}\n🔗 Реферал: Нет"
        
        elif event_type == 'user_registration_referral':
            email = details.get('email', 'N/A')
            referrer_username = details.get('referrer_username', 'N/A')
            referral_code = details.get('referral_code', 'N/A')
            message = f"👋 <b>Новый пользователь (по реферальной ссылке)</b>\n\n👤 Имя: {username} (ID: {user_id})\n📧 Email: {email}\n🔗 Пригласил: {referrer_username}\n🎟 Код: {referral_code}"
        
        elif event_type == 'game_win':
            game = details.get('game', 'N/A')
            bet_amount = details.get('bet_amount', 0)
            win_amount = details.get('win_amount', 0)
            profit = win_amount - bet_amount
            message = f"🎰 <b>Выигрыш в казино</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n🎮 Игра: {game}\n💰 Ставка: {bet_amount} USDT\n🏆 Выигрыш: {win_amount} USDT\n📈 Прибыль: +{profit} USDT"
        
        elif event_type == 'game_loss':
            game = details.get('game', 'N/A')
            bet_amount = details.get('bet_amount', 0)
            message = f"🎰 <b>Проигрыш в казино</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n🎮 Игра: {game}\n💰 Ставка: {bet_amount} USDT\n📉 Проигрыш: -{bet_amount} USDT"
        
        elif event_type == 'game_draw':
            game = details.get('game', 'N/A')
            bet_amount = details.get('bet_amount', 0)
            returned_amount = details.get('returned_amount', 0)
            message = f"🎰 <b>Ничья в казино</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n🎮 Игра: {game}\n💰 Ставка: {bet_amount} USDT\n↩️ Возврат: {returned_amount} USDT"
        
        elif event_type == 'support_ticket_created':
            category = details.get('category', 'N/A')
            subject = details.get('subject', 'N/A')
            message_text = details.get('message', 'N/A')
            ticket_id = details.get('ticket_id', 'N/A')
            message = f"🎫 <b>Новый тикет поддержки</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n🆔 Тикет: #{ticket_id}\n📂 Категория: {category}\n📋 Тема: {subject}\n💬 Сообщение: {message_text[:100]}{'...' if len(message_text) > 100 else ''}"
        
        elif event_type == 'casino_bet':
            game = details.get('game', 'N/A')
            bet_amount = details.get('bet_amount', 0)
            message = f"🎲 <b>Ставка в казино</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n🎮 Игра: {game}\n💰 Ставка: {bet_amount} USDT"
        
        elif event_type == 'forum_comment':
            topic_title = details.get('topic_title', 'N/A')
            comment_text = details.get('comment', 'N/A')
            topic_id = details.get('topic_id', 'N/A')
            message = f"💬 <b>Новый комментарий на форуме</b>\n\n👤 Автор: {username} (ID: {user_id})\n📋 Тема: {topic_title}\n🆔 ID темы: {topic_id}\n💭 Комментарий: {comment_text[:100]}{'...' if len(comment_text) > 100 else ''}"
        
        elif event_type == 'user_online':
            message = f"🟢 <b>Пользователь онлайн</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n⏰ Вход в систему"
        
        else:
            message = f"ℹ️ <b>{event_type}</b>\n\n👤 Пользователь: {username} (ID: {user_id})\n📋 Детали: {json.dumps(details, ensure_ascii=False)}"
        
        # Отправляем уведомление
        success = send_telegram_message(message)
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': success,
                'message': 'Notification sent' if success else 'Failed to send notification'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }