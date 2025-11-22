ALTER TABLE users ADD COLUMN last_seen_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX idx_users_last_seen_at ON users(last_seen_at);

UPDATE users SET last_seen_at = CURRENT_TIMESTAMP WHERE last_seen_at IS NULL;