-- Таблица сделок гарант-сервиса
CREATE TABLE IF NOT EXISTS escrow_deals (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER NOT NULL REFERENCES users(id),
    buyer_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    buyer_paid BOOLEAN DEFAULT FALSE,
    seller_confirmed BOOLEAN DEFAULT FALSE,
    buyer_confirmed BOOLEAN DEFAULT FALSE,
    dispute BOOLEAN DEFAULT FALSE,
    dispute_reason TEXT,
    admin_decision TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Таблица сообщений в сделках
CREATE TABLE IF NOT EXISTS escrow_messages (
    id SERIAL PRIMARY KEY,
    deal_id INTEGER NOT NULL REFERENCES escrow_deals(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    message TEXT NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_escrow_deals_seller ON escrow_deals(seller_id);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_buyer ON escrow_deals(buyer_id);
CREATE INDEX IF NOT EXISTS idx_escrow_deals_status ON escrow_deals(status);
CREATE INDEX IF NOT EXISTS idx_escrow_messages_deal ON escrow_messages(deal_id);