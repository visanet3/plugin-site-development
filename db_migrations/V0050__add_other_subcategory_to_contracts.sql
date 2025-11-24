-- Добавляем подкатегорию "Другие" в категорию "Контракты"

INSERT INTO forum_categories (name, slug, description, icon, color, display_order, parent_id)
VALUES ('Другие', 'contracts-other', 'Другие типы контрактов', 'MoreHorizontal', '#71717a', 15, 18);