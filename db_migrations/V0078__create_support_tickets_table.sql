-- Создание таблицы для тикетов поддержки
CREATE TABLE IF NOT EXISTS support_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    admin_response TEXT,
    answered_by VARCHAR(255),
    answered_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по пользователю
CREATE INDEX idx_support_tickets_user_id ON support_tickets(user_id);

-- Индекс для быстрого поиска по статусу
CREATE INDEX idx_support_tickets_status ON support_tickets(status);

-- Индекс для сортировки по дате создания
CREATE INDEX idx_support_tickets_created_at ON support_tickets(created_at DESC);