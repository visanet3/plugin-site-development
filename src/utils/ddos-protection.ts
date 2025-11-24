/**
 * DDoS Protection Utils
 * Защита от DDoS атак на клиентской стороне
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockUntil?: number;
}

class DDoSProtection {
  private requestMap: Map<string, RequestRecord> = new Map();
  private config: RateLimitConfig = {
    maxRequests: 100, // максимум запросов
    windowMs: 60000   // за 60 секунд
  };
  private blockDurationMs = 300000; // блокировка на 5 минут
  private suspiciousThreshold = 50; // порог подозрительной активности

  constructor() {
    // Очистка старых записей каждые 5 минут
    setInterval(() => this.cleanup(), 300000);
    
    // Проверка на открытые DevTools (защита от автоматизации)
    this.detectDevTools();
  }

  /**
   * Проверка rate limit для конкретного endpoint
   */
  checkRateLimit(endpoint: string): { allowed: boolean; reason?: string } {
    const now = Date.now();
    const key = this.getClientKey(endpoint);
    const record = this.requestMap.get(key);

    // Проверка на блокировку
    if (record?.blocked) {
      if (record.blockUntil && now < record.blockUntil) {
        return { 
          allowed: false, 
          reason: `Слишком много запросов. Попробуйте через ${Math.ceil((record.blockUntil - now) / 1000)} сек.` 
        };
      } else {
        // Снимаем блокировку
        record.blocked = false;
        record.blockUntil = undefined;
        record.count = 0;
        record.firstRequest = now;
      }
    }

    if (!record) {
      // Первый запрос
      this.requestMap.set(key, {
        count: 1,
        firstRequest: now,
        blocked: false
      });
      return { allowed: true };
    }

    // Проверка временного окна
    const timePassed = now - record.firstRequest;
    
    if (timePassed > this.config.windowMs) {
      // Окно истекло, сбрасываем счетчик
      record.count = 1;
      record.firstRequest = now;
      return { allowed: true };
    }

    // Увеличиваем счетчик
    record.count++;

    // Проверка подозрительной активности
    if (record.count > this.suspiciousThreshold && record.count <= this.config.maxRequests) {
      console.warn(`[DDoS Protection] Подозрительная активность обнаружена: ${endpoint}`);
    }

    // Проверка лимита
    if (record.count > this.config.maxRequests) {
      record.blocked = true;
      record.blockUntil = now + this.blockDurationMs;
      
      console.error(`[DDoS Protection] Клиент заблокирован на ${this.blockDurationMs / 1000} сек`);
      
      return { 
        allowed: false, 
        reason: `Превышен лимит запросов. Блокировка на ${this.blockDurationMs / 1000} сек.` 
      };
    }

    return { allowed: true };
  }

  /**
   * Получение уникального ключа клиента
   */
  private getClientKey(endpoint: string): string {
    // Используем комбинацию факторов для идентификации
    const fingerprint = this.generateFingerprint();
    return `${fingerprint}_${endpoint}`;
  }

  /**
   * Генерация fingerprint браузера
   */
  private generateFingerprint(): string {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    let fingerprint = '';
    
    // Canvas fingerprinting
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(0, 0, 100, 100);
      ctx.fillStyle = '#069';
      ctx.fillText('DDoS Protection', 2, 15);
      fingerprint += canvas.toDataURL().slice(-50);
    }

    // Информация о браузере
    fingerprint += navigator.userAgent;
    fingerprint += navigator.language;
    fingerprint += screen.colorDepth;
    fingerprint += screen.width + 'x' + screen.height;
    fingerprint += new Date().getTimezoneOffset();
    fingerprint += navigator.hardwareConcurrency || '0';
    fingerprint += navigator.deviceMemory || '0';

    // Простое хеширование
    return this.simpleHash(fingerprint);
  }

  /**
   * Простое хеширование строки
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Очистка старых записей
   */
  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.requestMap.forEach((record, key) => {
      const timePassed = now - record.firstRequest;
      
      // Удаляем записи старше 10 минут
      if (timePassed > 600000 && !record.blocked) {
        toDelete.push(key);
      }
      
      // Удаляем разблокированные записи
      if (record.blocked && record.blockUntil && now > record.blockUntil) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.requestMap.delete(key));
    
    if (toDelete.length > 0) {
      console.log(`[DDoS Protection] Очищено ${toDelete.length} записей`);
    }
  }

  /**
   * Обнаружение DevTools (защита от ботов)
   */
  private detectDevTools(): void {
    const threshold = 160;
    
    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      
      if (widthThreshold || heightThreshold) {
        console.warn('[DDoS Protection] DevTools обнаружены - возможна автоматизация');
      }
    };

    // Проверка каждые 1 секунду
    setInterval(checkDevTools, 1000);
  }

  /**
   * Получение статистики
   */
  getStats(): { total: number; blocked: number; active: number } {
    let blocked = 0;
    let active = 0;

    this.requestMap.forEach(record => {
      if (record.blocked) {
        blocked++;
      } else {
        active++;
      }
    });

    return {
      total: this.requestMap.size,
      blocked,
      active
    };
  }

  /**
   * Добавление задержки между запросами (throttling)
   */
  async throttle(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Экспоненциальная задержка для повторных попыток
   */
  async exponentialBackoff(attempt: number, baseDelay: number = 1000): Promise<void> {
    const delay = Math.min(baseDelay * Math.pow(2, attempt), 30000);
    return new Promise(resolve => setTimeout(resolve, delay));
  }
}

// Singleton instance
export const ddosProtection = new DDoSProtection();

/**
 * Обертка для fetch с защитой от DDoS
 */
export async function protectedFetch(
  url: string, 
  options?: RequestInit,
  retries: number = 3
): Promise<Response> {
  const endpoint = new URL(url).pathname;
  
  // Проверка rate limit
  const { allowed, reason } = ddosProtection.checkRateLimit(endpoint);
  
  if (!allowed) {
    throw new Error(reason || 'Rate limit exceeded');
  }

  // Добавляем небольшую задержку между запросами
  await ddosProtection.throttle(50);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(15000) // таймаут 15 секунд
      });

      // Успешный ответ
      if (response.ok) {
        return response;
      }

      // Ошибка 429 (Too Many Requests) - используем exponential backoff
      if (response.status === 429) {
        if (attempt < retries - 1) {
          await ddosProtection.exponentialBackoff(attempt);
          continue;
        }
      }

      // Другие ошибки HTTP
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);

    } catch (error) {
      lastError = error as Error;
      
      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === retries - 1) {
        throw lastError;
      }

      // Exponential backoff перед следующей попыткой
      await ddosProtection.exponentialBackoff(attempt);
    }
  }

  throw lastError || new Error('Request failed after retries');
}

/**
 * Защита для WebSocket соединений
 */
export class ProtectedWebSocket {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(
    private url: string,
    private protocols?: string | string[]
  ) {}

  connect(): WebSocket {
    const { allowed, reason } = ddosProtection.checkRateLimit('websocket');
    
    if (!allowed) {
      throw new Error(reason || 'WebSocket connection rate limited');
    }

    this.ws = new WebSocket(this.url, this.protocols);
    
    this.ws.addEventListener('close', () => {
      this.handleReconnect();
    });

    this.ws.addEventListener('error', (error) => {
      console.error('[Protected WebSocket] Error:', error);
    });

    return this.ws;
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Protected WebSocket] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    
    await ddosProtection.exponentialBackoff(
      this.reconnectAttempts, 
      this.reconnectDelay
    );

    console.log(`[Protected WebSocket] Reconnecting (attempt ${this.reconnectAttempts})`);
    this.connect();
  }

  getWebSocket(): WebSocket | null {
    return this.ws;
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export default ddosProtection;
