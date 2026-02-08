-- Разблокировка всех пользователей
UPDATE users 
SET is_blocked = false, 
    block_reason = NULL, 
    blocked_at = NULL, 
    blocked_by = NULL
WHERE is_blocked = true;