-- Add foreign key constraint to withdrawals table  
ALTER TABLE t_p32599880_plugin_site_developm.withdrawals
ADD CONSTRAINT withdrawals_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES t_p32599880_plugin_site_developm.users(id);

COMMENT ON CONSTRAINT withdrawals_user_id_fkey ON t_p32599880_plugin_site_developm.withdrawals IS 'Foreign key to users table';