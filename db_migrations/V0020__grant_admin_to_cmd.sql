-- Grant admin role to user CMD
UPDATE t_p32599880_plugin_site_developm.users 
SET role = 'admin' 
WHERE username = 'CMD';
