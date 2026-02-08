import json
import os
import psycopg2
from typing import Dict, Any
from cors_helper import fix_cors_response

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload file attachments for forum comments (stored in database)
    Args: event with httpMethod, body containing base64 file data, filename, and content type
          context with request_id
    Returns: HTTP response with file ID or error
    '''
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'GET':
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
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': True,
            'body': file_data
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
        file_data = body_data.get('file_data')
        filename = body_data.get('filename')
        content_type = body_data.get('content_type', 'application/octet-stream')
        
        if not file_data or not filename:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing file_data or filename'})
            }
        
        import base64
        file_bytes = base64.b64decode(file_data)
        file_size = len(file_bytes)
        
        if file_size > 5 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'File size exceeds 5MB limit'})
            }
        
        allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx', '.txt', '.zip', '.rar']
        file_ext = os.path.splitext(filename)[1].lower()
        if file_ext not in allowed_extensions:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'File type {file_ext} not allowed'})
            }
        
        dsn = os.environ.get('DATABASE_URL')
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        cur.execute("""
            INSERT INTO forum_attachments (file_data, filename, content_type, file_size)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (file_data, filename, content_type, file_size))
        
        file_id = cur.fetchone()[0]
        conn.commit()
        cur.close()
        conn.close()
        
        file_url = f"/api/file?id={file_id}"
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'url': file_url,
                'filename': filename,
                'size': file_size,
                'content_type': content_type
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
            'body': json.dumps({'error': f'Upload failed: {str(e)}'})
        }


# CORS Middleware - автоматически исправляет CORS во всех ответах
_original_handler = handler

def handler(event, context):
    """Wrapper для автоматического исправления CORS"""
    response = _original_handler(event, context)
    return fix_cors_response(response, event, include_credentials=True)