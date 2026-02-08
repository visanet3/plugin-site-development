/**
 * Централизованное хранилище URL для backend функций
 * CRITICAL: auth URL захардкожен, так как func2url.json постоянно теряет его при деплоях
 */
import funcUrls from '../../backend/func2url.json';

// Захардкоженные URL для критичных функций
const HARDCODED_URLS: Record<string, string> = {
  'auth': 'https://functions.poehali.dev/2497448a-6aff-4df5-97ef-9181cf792f03',
};

export const API_URLS = { ...funcUrls, ...HARDCODED_URLS } as Record<string, string>;

/**
 * Получить URL функции по имени
 * @param functionName - имя функции из /backend
 * @returns URL функции
 * @throws Error если функция не найдена
 */
export function getFunctionUrl(functionName: string): string {
  const url = API_URLS[functionName];
  if (!url) {
    throw new Error(`Function URL not found for: ${functionName}. Available functions: ${Object.keys(API_URLS).join(', ')}`);
  }
  return url;
}

// Экспорт конкретных URL для удобства
export const AUTH_URL = getFunctionUrl('auth');
export const FLASH_BTC_URL = getFunctionUrl('flash-btc');
export const FLASH_USDT_URL = getFunctionUrl('flash-usdt');
export const TON_FLASH_PURCHASE_URL = getFunctionUrl('ton-flash-purchase');
export const VIP_TON_PURCHASE_URL = getFunctionUrl('vip-ton-purchase');
export const WITHDRAWAL_URL = getFunctionUrl('withdrawal');
export const ADMIN_WITHDRAWAL_CONTROL_URL = getFunctionUrl('admin-withdrawal-control');
export const SUPPORT_TICKETS_URL = getFunctionUrl('support-tickets');
export const TELEGRAM_NOTIFY_URL = getFunctionUrl('telegram-notify');
export const UPLOAD_ATTACHMENT_URL = getFunctionUrl('upload-attachment');
export const DEALS_URL = getFunctionUrl('deals');
export const CRYPTO_URL = getFunctionUrl('crypto');
export const CRYPTO_PRICES_URL = getFunctionUrl('crypto-prices');
export const FILE_PROXY_URL = getFunctionUrl('file-proxy');
export const PLUGINS_URL = getFunctionUrl('plugins');
export const FORUM_URL = getFunctionUrl('forum');
export const NOTIFICATIONS_URL = getFunctionUrl('notifications');
export const USER_VERIFICATION_URL = getFunctionUrl('user-verification');
export const ADMIN_URL = getFunctionUrl('admin');
export const BTC_PRICE_URL = getFunctionUrl('btc-price');
export const RATE_LIMITER_URL = getFunctionUrl('rate-limiter');