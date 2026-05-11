-- Training Plan — coach guidance addendum
--
-- Standing coach guidance for the macro arc. Read on every Generate or
-- Regenerate of any program linked to this plan (via plan_blocks). Persists
-- across regenerations and across new phase generations. Used to override
-- engine-default conservatism (RPE/volume/exercise complexity floors) for
-- clients whose training age, history or context warrants a harder start
-- than the doctrine defaults produce.
--
-- Does NOT override:
--   - RRS clamps (active recovery state constraints)
--   - Fat Map Method hard limits
--   - Injury contraindications
--   - Eligibility level floors (Level 0/1/2 still suppressed)
--
-- These remain authoritative regardless of coach guidance content.
--
-- Run in Supabase SQL editor.

ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS coach_guidance TEXT;

COMMENT ON COLUMN training_plans.coach_guidance IS
  'Standing coach steering applied on every Generate/Regenerate of any program linked via plan_blocks. Overrides engine-default conservatism for RPE, volume, exercise complexity and session density. Does not override RRS, injury, or doctrine safety floors.';
