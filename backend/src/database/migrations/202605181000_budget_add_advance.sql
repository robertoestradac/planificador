-- 202605181000_budget_add_advance.sql
-- Add advance_amount column and rename logic:
-- estimated_cost is removed from UI (kept in DB for backwards compat)
-- actual_cost = costo total del servicio
-- advance_amount = anticipo pagado
-- remaining = actual_cost - advance_amount (calculated)
ALTER TABLE plan_budget_items ADD COLUMN IF NOT EXISTS advance_amount DECIMAL(12,2) NULL AFTER actual_cost;
