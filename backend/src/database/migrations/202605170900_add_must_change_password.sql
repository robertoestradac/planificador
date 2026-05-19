-- 202605170900_add_must_change_password.sql
-- Force password rotation on first login for seeded / admin-created accounts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password TINYINT(1) NOT NULL DEFAULT 0 AFTER status;
