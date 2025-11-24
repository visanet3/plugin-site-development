-- Создание реферальных кодов для существующих пользователей без кодов
-- Используем MD5 от ID пользователя + timestamp для генерации уникальных кодов

INSERT INTO t_p32599880_plugin_site_developm.referral_codes (user_id, code, is_active, created_at)
SELECT 
    u.id,
    UPPER(SUBSTRING(MD5(u.id::TEXT || EXTRACT(EPOCH FROM NOW())::TEXT || RANDOM()::TEXT) FROM 1 FOR 8)),
    TRUE,
    CURRENT_TIMESTAMP
FROM t_p32599880_plugin_site_developm.users u
LEFT JOIN t_p32599880_plugin_site_developm.referral_codes rc ON u.id = rc.user_id
WHERE rc.user_id IS NULL;