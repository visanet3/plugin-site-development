-- Добавление реферальной системы
-- Таблица реферальных кодов
CREATE TABLE t_p32599880_plugin_site_developm.referral_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p32599880_plugin_site_developm.users(id),
    code VARCHAR(20) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Таблица рефералов (приглашенных пользователей)
CREATE TABLE t_p32599880_plugin_site_developm.referrals (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES t_p32599880_plugin_site_developm.users(id),
    referred_user_id INTEGER NOT NULL REFERENCES t_p32599880_plugin_site_developm.users(id),
    referral_code VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    total_deposited DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    UNIQUE(referred_user_id)
);

-- Таблица истории реферальных выплат
CREATE TABLE t_p32599880_plugin_site_developm.referral_rewards (
    id SERIAL PRIMARY KEY,
    referrer_id INTEGER NOT NULL REFERENCES t_p32599880_plugin_site_developm.users(id),
    amount DECIMAL(10,2) NOT NULL,
    referrals_count INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем поле для реферального кода в таблицу users
ALTER TABLE t_p32599880_plugin_site_developm.users 
ADD COLUMN referred_by_code VARCHAR(20) NULL;

-- Индексы для производительности
CREATE INDEX idx_referral_codes_user_id ON t_p32599880_plugin_site_developm.referral_codes(user_id);
CREATE INDEX idx_referral_codes_code ON t_p32599880_plugin_site_developm.referral_codes(code);
CREATE INDEX idx_referrals_referrer_id ON t_p32599880_plugin_site_developm.referrals(referrer_id);
CREATE INDEX idx_referrals_referred_user_id ON t_p32599880_plugin_site_developm.referrals(referred_user_id);
CREATE INDEX idx_referrals_status ON t_p32599880_plugin_site_developm.referrals(status);