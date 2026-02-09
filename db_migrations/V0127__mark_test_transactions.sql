-- Добавляем флаг для тестовых транзакций
ALTER TABLE crypto_transactions 
ADD COLUMN IF NOT EXISTS is_test BOOLEAN DEFAULT FALSE;

-- Помечаем тестовые транзакции (с price=1000 или amount=0.01)
UPDATE crypto_transactions 
SET is_test = TRUE 
WHERE (price = 1000.00 OR amount = 0.01000000);