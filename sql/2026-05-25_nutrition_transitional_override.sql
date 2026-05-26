-- Nutrition Transitional Override
-- Lets a coach prescribe a sub-floor nutrition plan with documented
-- justification when a client cannot physically execute the bodyweight-
-- derived floor (chronic under-eating, post-illness recovery, medication
-- side effects, etc.). Auto-expires so plans don't drift below floor
-- without coach review.
--
-- Run in Supabase SQL editor.

alter table nutrition_plans
  add column if not exists transitional_override_active boolean default false not null,
  add column if not exists transitional_override_floor_kcal integer,
  add column if not exists transitional_override_justification text,
  add column if not exists transitional_override_expires_at timestamptz;

-- Index so the dashboard can quickly find plans with active overrides for
-- the upcoming "transitional plans expiring soon" view.
create index if not exists nutrition_plans_transitional_active_idx
  on nutrition_plans (client_id, transitional_override_expires_at)
  where transitional_override_active = true;

comment on column nutrition_plans.transitional_override_active is
  'When true, validator carb_floor / fat_floor checks are skipped and replaced with the explicit floor_kcal threshold. Required when a client cannot physically execute the bodyweight-derived nutrient floors.';
comment on column nutrition_plans.transitional_override_floor_kcal is
  'Explicit minimum daily kcal the coach has prescribed instead of the bodyweight-derived floors. Validator enforces this in place of carb/fat g/kg floors.';
comment on column nutrition_plans.transitional_override_justification is
  'Required free-text reason for the override. Documented for audit. Surfaces on the coach dashboard.';
comment on column nutrition_plans.transitional_override_expires_at is
  'Auto-set to +4 weeks from generation. After expiry, regenerate without override and apply normal bodyweight floors. Coach gets a prompt at expiry.';
