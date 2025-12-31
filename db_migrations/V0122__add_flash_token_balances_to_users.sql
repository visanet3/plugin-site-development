-- Добавление балансов Flash-токенов для пользователей
-- Критическая защита от вывода Flash-токенов как реальных средств

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS flash_btc_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS flash_usdt_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

-- Создание индексов для быстрого поиска пользователей с Flash-балансами
CREATE INDEX IF NOT EXISTS idx_users_flash_btc_balance ON t_p32599880_plugin_site_developm.users(flash_btc_balance) WHERE flash_btc_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_flash_usdt_balance ON t_p32599880_plugin_site_developm.users(flash_usdt_balance) WHERE flash_usdt_balance > 0;

-- Комментарии для документации
COMMENT ON COLUMN t_p32599880_plugin_site_developm.users.flash_btc_balance IS 'Flash BTC balance (cannot be withdrawn, only for simulated trades)';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.users.flash_usdt_balance IS 'Flash USDT balance (cannot be withdrawn, only for simulated trades)';