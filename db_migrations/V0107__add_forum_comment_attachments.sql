-- Добавление поддержки вложений к комментариям форума
ALTER TABLE forum_comments ADD COLUMN attachment_url TEXT;
ALTER TABLE forum_comments ADD COLUMN attachment_filename TEXT;
ALTER TABLE forum_comments ADD COLUMN attachment_size INTEGER;
ALTER TABLE forum_comments ADD COLUMN attachment_type TEXT;
