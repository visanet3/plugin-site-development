-- Add check constraints to withdrawals table
ALTER TABLE t_p32599880_plugin_site_developm.withdrawals 
DROP CONSTRAINT IF EXISTS withdrawals_amount_check;

ALTER TABLE t_p32599880_plugin_site_developm.withdrawals 
ADD CONSTRAINT withdrawals_amount_check CHECK (amount > 0);

ALTER TABLE t_p32599880_plugin_site_developm.withdrawals 
DROP CONSTRAINT IF EXISTS withdrawals_status_check;

ALTER TABLE t_p32599880_plugin_site_developm.withdrawals 
ADD CONSTRAINT withdrawals_status_check CHECK (status IN ('pending', 'completed', 'rejected'));

COMMENT ON CONSTRAINT withdrawals_amount_check ON t_p32599880_plugin_site_developm.withdrawals IS 'Amount must be positive';
COMMENT ON CONSTRAINT withdrawals_status_check ON t_p32599880_plugin_site_developm.withdrawals IS 'Status must be pending, completed, or rejected';