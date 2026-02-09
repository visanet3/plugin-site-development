-- Отклонение заявки на вывод #16 и возврат 100 SOL на баланс пользователя ID 194

-- Обновляем статус заявки на rejected
UPDATE t_p32599880_plugin_site_developm.withdrawals
SET 
    status = 'rejected',
    processed_at = NOW(),
    admin_comment = 'Заявка отклонена администратором. Средства возвращены на баланс.'
WHERE id = 16 AND user_id = 194 AND status = 'pending';

-- Возвращаем 100 SOL на баланс пользователя
UPDATE t_p32599880_plugin_site_developm.users
SET sol_balance = COALESCE(sol_balance, 0) + 100.00000000
WHERE id = 194;

-- Создаем транзакцию о возврате средств
INSERT INTO t_p32599880_plugin_site_developm.transactions
(user_id, amount, type, description, created_at)
VALUES
(194, 100.00, 'withdrawal_rejected', 'Возврат 100 SOL (заявка #16 отклонена администратором)', NOW());