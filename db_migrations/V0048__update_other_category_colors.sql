-- Обновляем цвета категории "Другое" для лучшей видимости

-- Главная категория "Другое" - яркий серебристый цвет
UPDATE t_p32599880_plugin_site_developm.forum_categories 
SET color = '#e5e7eb'
WHERE slug = 'other';

-- Подкатегория "Разное" - светло-серый
UPDATE t_p32599880_plugin_site_developm.forum_categories 
SET color = '#d1d5db'
WHERE slug = 'miscellaneous';
