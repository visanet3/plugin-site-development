-- Таблица для логирования событий безопасности и DDoS активности
CREATE TABLE IF NOT EXISTS t_p32599880_plugin_site_developm.security_logs (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    client_key VARCHAR(255) NOT NULL,
    reason TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_security_logs_client ON t_p32599880_plugin_site_developm.security_logs(client_key);
CREATE INDEX IF NOT EXISTS idx_security_logs_created ON t_p32599880_plugin_site_developm.security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON t_p32599880_plugin_site_developm.security_logs(event_type);

COMMENT ON TABLE t_p32599880_plugin_site_developm.security_logs IS 'Логи событий безопасности и подозрительной активности';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.security_logs.event_type IS 'Тип события (rate_limit_violation, suspicious_activity и т.д.)';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.security_logs.client_key IS 'Уникальный ключ клиента (IP:hash)';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.security_logs.reason IS 'Причина/описание события';
COMMENT ON COLUMN t_p32599880_plugin_site_developm.security_logs.user_agent IS 'User-Agent клиента';
