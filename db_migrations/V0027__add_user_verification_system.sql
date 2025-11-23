-- Добавляем поле верификации к пользователям
ALTER TABLE t_p32599880_plugin_site_developm.users 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Создаем таблицу заявок на верификацию
CREATE TABLE IF NOT EXISTS t_p32599880_plugin_site_developm.verification_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE NOT NULL,
    passport_photo TEXT NOT NULL,
    selfie_photo TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    admin_comment TEXT,
    reviewed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON t_p32599880_plugin_site_developm.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON t_p32599880_plugin_site_developm.verification_requests(status);