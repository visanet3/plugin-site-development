'''
Business: API для получения списка плагинов и категорий (заглушка)
Args: event - dict с httpMethod, queryStringParameters
      context - объект с request_id
Returns: HTTP response с плагинами и категориями
'''

import json
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if method == 'GET':
        # Возвращаем пустые списки для плагинов и категорий
        response_data = {
            'plugins': [],
            'categories': [
                {'id': 1, 'name': 'Все', 'slug': 'all', 'icon': 'Grid'},
                {'id': 2, 'name': 'Flash USDT', 'slug': 'flash', 'icon': 'Zap'},
                {'id': 3, 'name': 'Криптобиржи', 'slug': 'exchanges', 'icon': 'TrendingUp'}
            ]
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_data),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 405,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }