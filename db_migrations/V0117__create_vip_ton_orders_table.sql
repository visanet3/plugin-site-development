-- Создание таблицы для заявок на покупку VIP через TON
CREATE TABLE IF NOT EXISTS t_p32599880_plugin_site_developm.vip_ton_orders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username VARCHAR(255),
    amount_ton NUMERIC(10, 2) NOT NULL,
    ton_wallet_address VARCHAR(255) DEFAULT 'UQCF1nZKca68-nGFl7z8CRDMiG5XeiwAf7LKvBu-dA2icqDl',
    status VARCHAR(50) DEFAULT 'pending',
    vip_duration_days INTEGER DEFAULT 30,
    user_transaction_hash VARCHAR(255),
    admin_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES t_p32599880_plugin_site_developm.users(id)
);

CREATE INDEX IF NOT EXISTS idx_vip_ton_orders_user_id ON t_p32599880_plugin_site_developm.vip_ton_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_vip_ton_orders_status ON t_p32599880_plugin_site_developm.vip_ton_orders(status);