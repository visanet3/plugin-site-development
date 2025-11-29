CREATE TABLE IF NOT EXISTS forum_attachments (
    id SERIAL PRIMARY KEY,
    file_data TEXT NOT NULL,
    filename TEXT NOT NULL,
    content_type TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forum_attachments_created_at ON forum_attachments(created_at);
