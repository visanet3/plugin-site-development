'''
Функция авторизации - упрощенная версия для диагностики
'''

import json

def handler(event, context):
    """Минимальный тест авторизации"""
    
    method = event.get('httpMethod', 'POST')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    # Простой ответ для теста
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'success': True,
            'message': 'Auth function is working!',
            'method': method
        }),
        'isBase64Encoded': False
    }
