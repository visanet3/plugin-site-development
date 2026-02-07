'''
Business: Получение актуального курса BTC с добавлением markup +$1000
Args: event - dict с httpMethod
      context - объект с атрибутами: request_id, function_name
Returns: HTTP response с курсом BTC
'''

import json
import urllib.request
from typing import Dict, Any
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from cors_helper import fix_cors_response

def get_real_btc_price() -> float:
    """Получить реальную цену BTC с Binance API"""
    try:
        # Пробуем Binance API (наиболее надёжный источник)
        with urllib.request.urlopen('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', timeout=5) as response:
            data = json.loads(response.read().decode())
            real_price = float(data['price'])
            return real_price + 1000
    except Exception as e:
        print(f'Error fetching BTC price from Binance: {e}')
        # Fallback на Coinbase API
        try:
            with urllib.request.urlopen('https://api.coinbase.com/v2/prices/BTC-USD/spot', timeout=5) as response:
                data = json.loads(response.read().decode())
                real_price = float(data['data']['amount'])
                return real_price + 1000
        except Exception as e2:
            print(f'Error fetching BTC price from Coinbase: {e2}')
            return 0

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
    
    btc_price = get_real_btc_price()
    
    if btc_price == 0:
        return {
            'statusCode': 503,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Не удалось получить курс BTC'}),
            'isBase64Encoded': False
        }
    
    response = {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'btc_price': btc_price
        }),
        'isBase64Encoded': False
    }
    
    return fix_cors_response(response, event, include_credentials=True)