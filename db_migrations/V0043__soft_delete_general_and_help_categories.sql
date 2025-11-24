-- Добавляем колонку removed_at для мягкого удаления категорий (если её нет)
ALTER TABLE t_p32599880_plugin_site_developm.forum_categories 
ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP;

-- Мягко удаляем категории "Общее" и "Помощь"
UPDATE t_p32599880_plugin_site_developm.forum_categories 
SET removed_at = CURRENT_TIMESTAMP
WHERE slug IN ('general', 'help');