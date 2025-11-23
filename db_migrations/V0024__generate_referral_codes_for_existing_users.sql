-- Генерация реферальных кодов для существующих пользователей
-- Используем простой подход с md5 для уникальных кодов

INSERT INTO t_p32599880_plugin_site_developm.referral_codes (user_id, code, is_active)
SELECT 
    u.id,
    UPPER(SUBSTR(MD5(u.id::TEXT || u.username || RANDOM()::TEXT), 1, 8)),
    TRUE
FROM t_p32599880_plugin_site_developm.users u
WHERE NOT EXISTS (
    SELECT 1 
    FROM t_p32599880_plugin_site_developm.referral_codes rc 
    WHERE rc.user_id = u.id
)
ON CONFLICT DO NOTHING;
