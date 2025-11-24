-- Добавляем родительскую категорию "Инвестиции"
INSERT INTO t_p32599880_plugin_site_developm.forum_categories 
(name, slug, description, icon, color, display_order, parent_id)
VALUES 
('Инвестиции', 'investments', 'Обсуждение инвестиций по суммам', 'TrendingUp', '#8b5cf6', 2, NULL);

-- Добавляем подкатегории для разных сумм инвестиций
INSERT INTO t_p32599880_plugin_site_developm.forum_categories 
(name, slug, description, icon, color, display_order, parent_id)
VALUES 
('1.000$~', 'invest-1k', 'Инвестиции от 1000$', 'DollarSign', '#22c55e', 20, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('5.000$~', 'invest-5k', 'Инвестиции от 5000$', 'DollarSign', '#3b82f6', 21, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('10.000$~', 'invest-10k', 'Инвестиции от 10000$', 'DollarSign', '#06b6d4', 22, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('15.000$~', 'invest-15k', 'Инвестиции от 15000$', 'DollarSign', '#10b981', 23, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('25.000$~', 'invest-25k', 'Инвестиции от 25000$', 'DollarSign', '#f59e0b', 24, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('40.000$~', 'invest-40k', 'Инвестиции от 40000$', 'DollarSign', '#f97316', 25, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('50.000$~', 'invest-50k', 'Инвестиции от 50000$', 'DollarSign', '#ef4444', 26, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('75.000$~', 'invest-75k', 'Инвестиции от 75000$', 'DollarSign', '#ec4899', 27, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('100.000$~', 'invest-100k', 'Инвестиции от 100000$', 'DollarSign', '#a855f7', 28, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments')),
('100.000$+', 'invest-100k-plus', 'Инвестиции от 100000$ и выше', 'Gem', '#8b5cf6', 29, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'investments'));