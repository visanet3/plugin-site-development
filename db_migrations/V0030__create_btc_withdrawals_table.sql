-- Create withdrawals table for BTC withdrawals
CREATE TABLE IF NOT EXISTS t_p32599880_plugin_site_developm.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    amount DECIMAL(18, 8) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'BTC',
    address TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    admin_comment TEXT
);

CREATE INDEX idx_withdrawals_user_id ON t_p32599880_plugin_site_developm.withdrawals(user_id);
CREATE INDEX idx_withdrawals_status ON t_p32599880_plugin_site_developm.withdrawals(status);

COMMENT ON TABLE t_p32599880_plugin_site_developm.withdrawals IS 'BTC withdrawal requests';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.withdrawals.status IS 'pending, completed, rejected';
