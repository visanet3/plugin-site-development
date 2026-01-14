/**
 * Централизованная конфигурация API endpoints
 * Автоматически переключается между локальным и продакшн API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    REGISTER: `${API_BASE_URL}/auth/register`,
    LOGIN: `${API_BASE_URL}/auth/login`,
    GET_USER: `${API_BASE_URL}/auth/user`,
  },

  // Crypto Operations
  CRYPTO: {
    BALANCES: `${API_BASE_URL}/crypto/balances`,
    EXCHANGE_USDT_TO_CRYPTO: `${API_BASE_URL}/crypto/exchange-usdt-to-crypto`,
    EXCHANGE_CRYPTO_TO_USDT: `${API_BASE_URL}/crypto/exchange-crypto-to-usdt`,
    WITHDRAW: `${API_BASE_URL}/crypto/withdraw`,
    TRANSACTIONS: `${API_BASE_URL}/crypto/transactions`,
    PRICES: `${API_BASE_URL}/crypto/prices`,
  },

  // Health Check
  HEALTH: `${API_BASE_URL}/health`,
};

/**
 * Helper для создания заголовков с user ID
 */
export const createHeaders = (userId?: number | string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (userId) {
    headers['X-User-Id'] = userId.toString();
  }

  return headers;
};

/**
 * Утилита для API запросов с обработкой ошибок
 */
export const apiRequest = async (
  url: string,
  options: RequestInit = {}
): Promise<any> => {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: `HTTP ${response.status}: ${response.statusText}`,
      }));
      throw new Error(error.error || 'Network request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

export default API_ENDPOINTS;
