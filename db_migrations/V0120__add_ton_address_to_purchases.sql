-- Добавляем колонку ton_address в таблицу ton_flash_purchases
ALTER TABLE ton_flash_purchases 
ADD COLUMN ton_address VARCHAR(100) NOT NULL DEFAULT '';

-- Обновляем индекс для поиска по адресу
CREATE INDEX idx_ton_flash_purchases_ton_address ON ton_flash_purchases(ton_address);