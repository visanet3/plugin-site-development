-- Добавляем подкатегорию для главной категории "Другое" с уникальным именем

INSERT INTO t_p32599880_plugin_site_developm.forum_categories (name, slug, description, icon, color, display_order, parent_id)
VALUES 
('Разное', 'miscellaneous', 'Разные темы и обсуждения', 'MessageSquare', '#a1a1aa', 40, 43);
