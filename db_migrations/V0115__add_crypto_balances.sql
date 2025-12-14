-- Добавление балансов для ETH, BNB, SOL, XRP, TRX

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS eth_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS bnb_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS sol_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS xrp_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

ALTER TABLE t_p32599880_plugin_site_developm.users
ADD COLUMN IF NOT EXISTS trx_balance NUMERIC(20, 8) DEFAULT 0 NOT NULL;

-- Создание индексов для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_users_eth_balance ON t_p32599880_plugin_site_developm.users(eth_balance) WHERE eth_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_bnb_balance ON t_p32599880_plugin_site_developm.users(bnb_balance) WHERE bnb_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_sol_balance ON t_p32599880_plugin_site_developm.users(sol_balance) WHERE sol_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_xrp_balance ON t_p32599880_plugin_site_developm.users(xrp_balance) WHERE xrp_balance > 0;
CREATE INDEX IF NOT EXISTS idx_users_trx_balance ON t_p32599880_plugin_site_developm.users(trx_balance) WHERE trx_balance > 0;

-- Добавление колонки crypto_symbol в withdrawals
ALTER TABLE t_p32599880_plugin_site_developm.withdrawals
ADD COLUMN IF NOT EXISTS crypto_symbol VARCHAR(10) DEFAULT 'BTC' NOT NULL;
