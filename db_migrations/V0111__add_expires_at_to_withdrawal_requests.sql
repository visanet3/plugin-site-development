-- Добавление поля expires_at к таблице withdrawal_requests для автоматической отмены через 1 час
ALTER TABLE withdrawal_requests ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;

-- Установка expires_at = created_at + 1 час для существующих записей
UPDATE withdrawal_requests 
SET expires_at = created_at + INTERVAL '1 hour'
WHERE expires_at IS NULL AND status IN ('pending', 'processing');

-- Создание индекса для быстрого поиска истекших заявок
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_expires_at 
ON withdrawal_requests(expires_at) 
WHERE status IN ('pending', 'processing');