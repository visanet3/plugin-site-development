import json
import urllib.request
import urllib.error
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получает актуальные новости о криптовалютах с CryptoCompare API
    Args: event - dict с httpMethod, queryStringParameters
          context - object с request_id, function_name
    Returns: HTTP response dict с новостями
    '''
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
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        news_url = 'https://min-api.cryptocompare.com/data/v2/news/?lang=RU&api_key=demo'
        
        req = urllib.request.Request(
            news_url,
            headers={
                'User-Agent': 'Mozilla/5.0'
            }
        )
        
        with urllib.request.urlopen(req, timeout=15) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            news_items = []
            if data.get('Type') == 100:
                for item in data.get('Data', [])[:25]:
                    body_text = item.get('body') or ''
                    
                    news_items.append({
                        'id': item.get('id'),
                        'title': item.get('title'),
                        'body': body_text,
                        'url': item.get('url') or item.get('guid'),
                        'imageurl': item.get('imageurl'),
                        'published_at': item.get('published_on'),
                        'source': item.get('source', 'CryptoNews'),
                        'source_info': item.get('source_info', {}),
                        'categories': item.get('categories', '').split('|') if item.get('categories') else [],
                        'lang': item.get('lang', 'RU'),
                        'tags': item.get('tags', '').split('|') if item.get('tags') else []
                    })
            
            if not news_items:
                news_url_en = 'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&api_key=demo'
                req_en = urllib.request.Request(news_url_en, headers={'User-Agent': 'Mozilla/5.0'})
                
                with urllib.request.urlopen(req_en, timeout=15) as response_en:
                    data_en = json.loads(response_en.read().decode('utf-8'))
                    
                    if data_en.get('Type') == 100:
                        for item in data_en.get('Data', [])[:25]:
                            body_text = item.get('body') or ''
                            
                            news_items.append({
                                'id': item.get('id'),
                                'title': item.get('title'),
                                'body': body_text,
                                'url': item.get('url') or item.get('guid'),
                                'imageurl': item.get('imageurl'),
                                'published_at': item.get('published_on'),
                                'source': item.get('source', 'CryptoNews'),
                                'source_info': item.get('source_info', {}),
                                'categories': item.get('categories', '').split('|') if item.get('categories') else [],
                                'lang': 'EN',
                                'tags': item.get('tags', '').split('|') if item.get('tags') else []
                            })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Cache-Control': 'public, max-age=600'
                },
                'body': json.dumps({
                    'success': True,
                    'news': news_items,
                    'count': len(news_items)
                }, ensure_ascii=False),
                'isBase64Encoded': False
            }
            
    except urllib.error.HTTPError as e:
        return {
            'statusCode': e.code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': f'API error: {e.reason}'
            }),
            'isBase64Encoded': False
        }
    except urllib.error.URLError as e:
        return {
            'statusCode': 503,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': 'Service unavailable'
            }),
            'isBase64Encoded': False
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            }),
            'isBase64Encoded': False
        }