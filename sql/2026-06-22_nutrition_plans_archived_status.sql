-- Allow `archived` on nutrition_plans.status so promoted-over plans get a
-- consistent status alongside is_active=false. Pre-2026-06-22 the promote
-- route only flipped is_active=false on the prior active plan, leaving
-- status='active'. Any query filtering by status alone (coaching-dashboard
-- rebuild-attention panel was the live victim) would then pick up the
-- archived plan and surface a stale current_direction signal indefinitely.
--
-- Programs table has the same shape; same migration on programs.status.
ALTER TABLE nutrition_plans DROP CONSTRAINT IF EXISTS nutrition_plans_status_check;
ALTER TABLE nutrition_plans ADD CONSTRAINT nutrition_plans_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

ALTER TABLE programs DROP CONSTRAINT IF EXISTS programs_status_check;
ALTER TABLE programs ADD CONSTRAINT programs_status_check
  CHECK (status IN ('draft', 'active', 'archived'));

-- Backfill: every row already is_active=false AND status='active' has been
-- superseded. Set status='archived' so the data matches the new contract.
UPDATE nutrition_plans
  SET status = 'archived'
  WHERE status = 'active' AND is_active = false;

UPDATE programs
  SET status = 'archived'
  WHERE status = 'active' AND is_active = false;
