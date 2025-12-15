-- Добавление поля withdrawal_blocked для блокировки вывода средств пользователям
ALTER TABLE t_p32599880_plugin_site_developm.users 
ADD COLUMN IF NOT EXISTS withdrawal_blocked BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS withdrawal_blocked_reason TEXT,
ADD COLUMN IF NOT EXISTS withdrawal_blocked_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS withdrawal_blocked_by INTEGER;