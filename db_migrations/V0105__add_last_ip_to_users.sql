-- Add last_ip column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_ip VARCHAR(45);