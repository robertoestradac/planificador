-- 202605171200_add_onboarding_completed.sql
-- Tracks whether a tenant user has finished the first-login product tour.
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed TINYINT(1) NOT NULL DEFAULT 0 AFTER must_change_password;
