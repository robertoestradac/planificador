-- 202605180900_add_admin_assigned_method.sql
-- Add 'admin_assigned' to the payments method ENUM for credits assigned by admin.
ALTER TABLE payments MODIFY COLUMN method ENUM('bank_transfer','payment_link','admin_assigned') NOT NULL DEFAULT 'bank_transfer';

-- Fix existing payments with empty method (from before this migration)
UPDATE payments SET method = 'admin_assigned' WHERE method = '' OR method IS NULL;

-- Fix NULL created_at on existing payments
UPDATE payments SET created_at = confirmed_at WHERE created_at IS NULL AND confirmed_at IS NOT NULL;
UPDATE payments SET created_at = NOW() WHERE created_at IS NULL;
