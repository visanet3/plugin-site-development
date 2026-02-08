'''
Business: Получение актуальных курсов криптовалют (BTC, ETH, BNB, SOL, XRP, TRX) с разными ценами для покупки (+0.5%) и продажи (-0.5%)
Args: event - dict с httpMethod
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response с курсами криптовалют (buy_prices и sell_prices)
'''

import json
import urllib.request
from typing import Dict, Any, Tuple

BUY_MARKUP = 0.5   # +0.5% для покупки криптовалюты (пользователь платит дороже)
SELL_DISCOUNT = 0.5  # -0.5% для продажи криптовалюты (пользователь получает меньше)

def get_crypto_prices() -> Tuple[Dict[str, float], Dict[str, float]]:
    """Получить реальные цены криптовалют с Binance API
    
    Returns:
        Tuple[buy_prices, sell_prices] - цены для покупки и продажи
    """
    symbols = {
        'BTC': 'BTCUSDT',
        'ETH': 'ETHUSDT',
        'BNB': 'BNBUSDT',
        'SOL': 'SOLUSDT',
        'XRP': 'XRPUSDT',
        'TRX': 'TRXUSDT'
    }
    
    buy_prices = {}
    sell_prices = {}
    
    try:
        # Получаем все цены одним запросом
        with urllib.request.urlopen('https://api.binance.com/api/v3/ticker/price', timeout=10) as response:
            all_prices = json.loads(response.read().decode())
            
            # Создаём словарь для быстрого поиска
            price_dict = {item['symbol']: float(item['price']) for item in all_prices}
            
            # Применяем разные цены для покупки и продажи
            for crypto, symbol in symbols.items():
                if symbol in price_dict:
                    real_price = price_dict[symbol]
                    # Для покупки +0.5% (пользователь платит дороже)
                    buy_prices[crypto] = round(real_price * (1 + BUY_MARKUP / 100), 8)
                    # Для продажи -0.5% (пользователь получает меньше)
                    sell_prices[crypto] = round(real_price * (1 - SELL_DISCOUNT / 100), 8)
            
            return buy_prices, sell_prices
    except Exception as e:
        print(f'Error fetching prices from Binance: {e}')
        
        # Fallback: пробуем получить цены по одной
        for crypto, symbol in symbols.items():
            try:
                url = f'https://api.binance.com/api/v3/ticker/price?symbol={symbol}'
                with urllib.request.urlopen(url, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    real_price = float(data['price'])
                    buy_prices[crypto] = round(real_price * (1 + BUY_MARKUP / 100), 8)
                    sell_prices[crypto] = round(real_price * (1 - SELL_DISCOUNT / 100), 8)
            except Exception as e2:
                print(f'Error fetching {crypto} price: {e2}')
                buy_prices[crypto] = 0
                sell_prices[crypto] = 0
        
        return buy_prices, sell_prices

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS preflight
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
    
    buy_prices, sell_prices = get_crypto_prices()
    
    # Проверяем что хотя бы одна цена получена
    if not buy_prices or all(price == 0 for price in buy_prices.values()):
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не удалось получить курсы криптовалют'}),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'buy_prices': buy_prices,
            'sell_prices': sell_prices,
            'buy_markup': BUY_MARKUP,
            'sell_discount': SELL_DISCOUNT
        }),
        'isBase64Encoded': False
    }