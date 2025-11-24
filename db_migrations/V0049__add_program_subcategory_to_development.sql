-- Добавляем подкатегорию "Программа" в категорию "Разработка"

INSERT INTO t_p32599880_plugin_site_developm.forum_categories (name, slug, description, icon, color, display_order, parent_id)
VALUES 
('Программа', 'program', 'Разработка программного обеспечения', 'Package', '#06b6d4', 37, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'development'));
