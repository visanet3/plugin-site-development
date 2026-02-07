import json
import os
import psycopg2
from typing import Dict, Any
import sys
sys.path.append(os.path.dirname(os.path.dirname(__file__)))
from cors_helper import fix_cors_response

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Proxy file requests to serve attachments from gitcrypto.pro domain
    Args: event with httpMethod, path parameters containing file ID
          context with request_id
    Returns: File data with proper content type
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
            'body': ''
        }
    
    if method != 'GET':
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
        query_params = event.get('queryStringParameters') or {}
        file_id = query_params.get('id')
        
        if not file_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing file id'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            SELECT file_data, filename, content_type
            FROM forum_attachments
            WHERE id = %s
        """, (file_id,))
        
        result = cur.fetchone()
        cur.close()
        conn.close()
        
        if not result:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'File not found'})
            }
        
        file_data, filename, content_type = result
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': content_type,
                'Content-Disposition': f'inline; filename="{filename}"',
                'Access-Control-Allow-Origin': '*',
                'Cache-Control': 'public, max-age=31536000'
            },
            'isBase64Encoded': True,
            'body': file_data
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': f'Proxy failed: {str(e)}'})
        }


# CORS Middleware - автоматически исправляет CORS во всех ответах
_original_handler = handler

def handler(event, context):
    """Wrapper для автоматического исправления CORS"""
    response = _original_handler(event, context)
    return fix_cors_response(response, event, include_credentials=True)