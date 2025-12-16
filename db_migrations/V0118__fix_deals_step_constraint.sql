-- Расширяем список допустимых значений для step в таблице deals
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_step_check;

ALTER TABLE deals ADD CONSTRAINT deals_step_check 
CHECK (step IN ('waiting_buyer', 'buyer_payment', 'buyer_paid', 'seller_sending', 'seller_sent', 'buyer_confirming', 'completed', 'dispute'));
