import json
import base64
import os
import uuid
import boto3
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Upload file attachments for forum comments
    Args: event with httpMethod, body containing base64 file data, filename, and content type
          context with request_id
    Returns: HTTP response with file URL or error
    '''
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
            'body': ''
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
        
        file_bytes = base64.b64decode(file_data)
        file_size = len(file_bytes)
        
        if file_size > 10 * 1024 * 1024:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'File size exceeds 10MB limit'})
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
        
        s3_client = boto3.client(
            's3',
            endpoint_url='https://storage.yandexcloud.net',
            aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
            aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
            region_name='ru-central1'
        )
        
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        unique_filename = f"forum-attachments/{uuid.uuid4()}{file_ext}"
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=unique_filename,
            Body=file_bytes,
            ContentType=content_type
        )
        
        file_url = f"https://storage.yandexcloud.net/{bucket_name}/{unique_filename}"
        
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
