-- Обновляем роль всех тестовых пользователей (ботов) на "member" (Участник)
UPDATE users 
SET forum_role = 'member'
WHERE email LIKE '%@test.com' AND forum_role = 'new';