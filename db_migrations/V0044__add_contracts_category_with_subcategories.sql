-- Добавляем родительскую категорию "Контракты"
INSERT INTO t_p32599880_plugin_site_developm.forum_categories 
(name, slug, description, icon, color, display_order, parent_id)
VALUES 
('Контракты', 'contracts', 'Обсуждение контрактов различных блокчейнов', 'FileCode', '#10b981', 1, NULL);

-- Добавляем подкатегории для разных блокчейнов
INSERT INTO t_p32599880_plugin_site_developm.forum_categories 
(name, slug, description, icon, color, display_order, parent_id)
VALUES 
('TRON', 'tron', 'Контракты TRON', 'Network', '#ff0013', 10, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'contracts')),
('ETH', 'eth', 'Контракты Ethereum', 'Hexagon', '#627eea', 11, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'contracts')),
('SOL', 'sol', 'Контракты Solana', 'Zap', '#14f195', 12, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'contracts')),
('FTM', 'ftm', 'Контракты Fantom', 'Ghost', '#1969ff', 13, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'contracts')),
('BNB', 'bnb', 'Контракты BNB Chain', 'Coins', '#f3ba2f', 14, (SELECT id FROM t_p32599880_plugin_site_developm.forum_categories WHERE slug = 'contracts'));