-- Исправление проблемной заявки на вывод #15
-- Возврат 200 SOL пользователю Ермек (ID: 194)
-- Закрытие заявки со статусом rejected

-- Возвращаем 200 SOL на баланс
UPDATE t_p32599880_plugin_site_developm.users 
SET sol_balance = sol_balance + 200.00000000
WHERE id = 194;

-- Добавляем транзакцию о возврате
INSERT INTO t_p32599880_plugin_site_developm.transactions (user_id, amount, type, description)
VALUES (194, 200.00000000, 'withdrawal_rejected', 'Возврат 200 SOL (заявка #15 отклонена - техническая ошибка)');

-- Обновляем статус заявки на вывод
UPDATE t_p32599880_plugin_site_developm.withdrawals 
SET status = 'rejected',
    admin_comment = 'Техническая ошибка: попытка вывода 200 SOL. Средства возвращены на баланс.',
    processed_at = NOW()
WHERE id = 15;