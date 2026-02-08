"""
CORS helper для всех backend функций
Использование:
    from cors_helper import get_cors_headers, handle_cors_preflight
"""

def get_cors_headers(event: dict, include_credentials: bool = True) -> dict:
    """
    Получить правильные CORS заголовки на основе origin запроса
    
    Args:
        event: Lambda event с headers
        include_credentials: Включить ли Access-Control-Allow-Credentials
    
    Returns:
        dict с CORS заголовками
    """
    # Получаем origin из запроса (поддержка разных регистров)
    origin = (event.get('headers', {}).get('origin') or 
              event.get('headers', {}).get('Origin') or 
              event.get('headers', {}).get('ORIGIN'))
    
    # Разрешенные origins для production
    allowed_origins = [
        'https://gitcrypto.pro',
        'https://www.gitcrypto.pro',
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        'https://gitcrypto.poehali.dev',
        'https://poehali.dev'
    ]
    
    # Если origin есть в списке разрешенных, используем его
    # Иначе используем первый production origin (для совместимости)
    cors_origin = origin if origin in allowed_origins else 'https://gitcrypto.pro'
    
    headers = {
        'Access-Control-Allow-Origin': cors_origin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id, X-Authorization, X-Cookie',
        'Access-Control-Max-Age': '86400'
    }
    
    if include_credentials:
        headers['Access-Control-Allow-Credentials'] = 'true'
    
    return headers


def handle_cors_preflight(event: dict, include_credentials: bool = True) -> dict:
    """
    Обработать OPTIONS preflight запрос
    
    Args:
        event: Lambda event
        include_credentials: Включить ли credentials
    
    Returns:
        dict с HTTP response для OPTIONS запроса
    """
    return {
        'statusCode': 200,
        'headers': get_cors_headers(event, include_credentials),
        'body': '',
        'isBase64Encoded': False
    }


def create_response(status_code: int, body: dict, event: dict, include_credentials: bool = True) -> dict:
    """
    Создать HTTP response с правильными CORS заголовками
    
    Args:
        status_code: HTTP status code
        body: Response body (будет сериализован в JSON)
        event: Lambda event (для получения origin)
        include_credentials: Включить ли credentials
    
    Returns:
        dict с HTTP response
    """
    import json
    
    headers = get_cors_headers(event, include_credentials)
    headers['Content-Type'] = 'application/json'
    
    return {
        'statusCode': status_code,
        'headers': headers,
        'body': json.dumps(body, ensure_ascii=False),
        'isBase64Encoded': False
    }


def fix_cors_response(response: dict, event: dict, include_credentials: bool = True) -> dict:
    """
    Исправить CORS заголовки в существующем response
    Заменяет 'Access-Control-Allow-Origin': '*' на правильный origin
    Добавляет Access-Control-Allow-Credentials если нужно
    
    Args:
        response: Существующий HTTP response dict
        event: Lambda event (для получения origin)
        include_credentials: Включить ли credentials
    
    Returns:
        dict с исправленным HTTP response
    """
    cors_origin = get_cors_headers(event, include_credentials).get('Access-Control-Allow-Origin')
    
    # Копируем response чтобы не мутировать оригинал
    fixed_response = response.copy()
    
    # Если есть headers, обновляем их
    if 'headers' in fixed_response:
        fixed_response['headers'] = fixed_response['headers'].copy()
        
        # Заменяем wildcard на конкретный origin
        if fixed_response['headers'].get('Access-Control-Allow-Origin') == '*':
            fixed_response['headers']['Access-Control-Allow-Origin'] = cors_origin
            
            # Добавляем credentials header если нужно
            if include_credentials:
                fixed_response['headers']['Access-Control-Allow-Credentials'] = 'true'
    
    return fixed_response