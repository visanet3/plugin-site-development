'''
Business: Получение актуальных курсов криптовалют (BTC, ETH, BNB, SOL, XRP, TRX) с markup +1.5%
Args: event - dict с httpMethod
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response с курсами криптовалют
'''

import json
import urllib.request
from typing import Dict, Any

MARKUP_PERCENT = 1.5  # +1.5% к реальной цене

def get_crypto_prices() -> Dict[str, float]:
    """Получить реальные цены криптовалют с Binance API"""
    symbols = {
        'BTC': 'BTCUSDT',
        'ETH': 'ETHUSDT',
        'BNB': 'BNBUSDT',
        'SOL': 'SOLUSDT',
        'XRP': 'XRPUSDT',
        'TRX': 'TRXUSDT'
    }
    
    prices = {}
    
    try:
        # Получаем все цены одним запросом
        with urllib.request.urlopen('https://api.binance.com/api/v3/ticker/price', timeout=10) as response:
            all_prices = json.loads(response.read().decode())
            
            # Создаём словарь для быстрого поиска
            price_dict = {item['symbol']: float(item['price']) for item in all_prices}
            
            # Применяем markup для каждой криптовалюты
            for crypto, symbol in symbols.items():
                if symbol in price_dict:
                    real_price = price_dict[symbol]
                    marked_up_price = real_price * (1 + MARKUP_PERCENT / 100)
                    prices[crypto] = round(marked_up_price, 8)
            
            return prices
    except Exception as e:
        print(f'Error fetching prices from Binance: {e}')
        
        # Fallback: пробуем получить цены по одной
        for crypto, symbol in symbols.items():
            try:
                url = f'https://api.binance.com/api/v3/ticker/price?symbol={symbol}'
                with urllib.request.urlopen(url, timeout=5) as response:
                    data = json.loads(response.read().decode())
                    real_price = float(data['price'])
                    marked_up_price = real_price * (1 + MARKUP_PERCENT / 100)
                    prices[crypto] = round(marked_up_price, 8)
            except Exception as e2:
                print(f'Error fetching {crypto} price: {e2}')
                prices[crypto] = 0
        
        return prices

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
    
    prices = get_crypto_prices()
    
    # Проверяем что хотя бы одна цена получена
    if not prices or all(price == 0 for price in prices.values()):
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
            'prices': prices,
            'markup': MARKUP_PERCENT
        }),
        'isBase64Encoded': False
    }
