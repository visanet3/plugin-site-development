-- Отмена просроченных платежей (где expires_at уже прошло)
UPDATE crypto_payments 
SET status = 'cancelled'
WHERE status = 'pending' 
AND expires_at < NOW();