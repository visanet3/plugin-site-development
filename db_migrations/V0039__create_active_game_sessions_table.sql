-- Создание таблицы для сохранения активных игровых сессий
CREATE TABLE IF NOT EXISTS t_p32599880_plugin_site_developm.active_game_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    game_type VARCHAR(50) NOT NULL,
    bet_amount DECIMAL(15,2) NOT NULL,
    game_state JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours'),
    CONSTRAINT unique_user_game UNIQUE (user_id, game_type)
);

CREATE INDEX IF NOT EXISTS idx_active_game_sessions_user_id ON t_p32599880_plugin_site_developm.active_game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_game_sessions_expires_at ON t_p32599880_plugin_site_developm.active_game_sessions(expires_at);