CREATE TABLE t_p32599880_plugin_site_developm.banned_ips (
  id SERIAL PRIMARY KEY,
  ip_address VARCHAR(45) NOT NULL UNIQUE,
  reason TEXT,
  banned_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);