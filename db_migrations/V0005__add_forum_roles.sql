ALTER TABLE users ADD COLUMN forum_role VARCHAR(20) DEFAULT 'new';

CREATE INDEX idx_users_forum_role ON users(forum_role);

UPDATE users SET forum_role = 'new' WHERE forum_role IS NULL;