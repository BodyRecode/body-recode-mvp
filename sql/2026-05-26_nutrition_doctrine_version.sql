-- Add doctrine_version to nutrition_plans so plans are tagged with the
-- NUTRITION_DOCTRINE_VERSION constant value at generation time.
--
-- Coach view diffs against the current constant to prompt regeneration when
-- stale. Plans inserted BEFORE this migration runs have doctrine_version
-- null; those are grandfathered (the coach view treats null as "version
-- unknown, assume current" and does not show a stale-doctrine hint).
--
-- Run in Supabase SQL editor.

alter table nutrition_plans
  add column if not exists doctrine_version text;

create index if not exists nutrition_plans_doctrine_version_idx
  on nutrition_plans (doctrine_version, generated_at desc);

comment on column nutrition_plans.doctrine_version is
  'The NUTRITION_DOCTRINE_VERSION constant value at generation time. Coach view diffs against the current constant to prompt regeneration when stale. Null for plans generated before this migration ran.';
