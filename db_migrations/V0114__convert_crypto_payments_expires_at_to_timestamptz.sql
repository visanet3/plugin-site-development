-- Изменение типа expires_at на TIMESTAMPTZ для корректного сравнения времени
ALTER TABLE crypto_payments 
ALTER COLUMN expires_at TYPE TIMESTAMPTZ USING expires_at AT TIME ZONE 'UTC';