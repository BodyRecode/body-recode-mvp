-- Client Nutrition Reading
--
-- Adds a client-facing interpretation layer to each active nutrition plan,
-- mirroring the Program Reading on `programs` and the Foundational Reading
-- on `cffs`. The Nutrition Reading is the bridge from the foundational
-- reading (state + drivers) to the prescription (meals, structure, rules),
-- written in supportive, plain language and gated behind a publish step.
--
-- Five sections (parallel to the Foundational Reading and Program Reading):
--   nr_why_this_plan                 -- what state we're feeding for right now
--   nr_what_this_nutrition_is_doing  -- design translated into outcomes, not macros
--   nr_how_well_know_its_working     -- plan-specific success signals
--   nr_what_were_not_doing_yet       -- nutrition-level non-directives
--   nr_coach_note                    -- Kade's voice on this specific plan
--
-- Gating timestamps follow the Program Reading convention:
--   nutrition_reading_generated_at  -> set when Claude returns the draft
--   nutrition_reading_published_at  -> set when "Generate & Publish" runs
--                                      (NULL until then; portal hides the card)
--
-- Coach guidance + email tracking match the Program Reading pattern:
--   nr_coach_guidance                 -- standing notes applied on every regen
--   nutrition_reading_email_sent_at   -- one email per nutrition_plans row
--
-- Run in Supabase: SQL Editor -> paste -> Run.

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS nr_why_this_plan TEXT,
  ADD COLUMN IF NOT EXISTS nr_what_this_nutrition_is_doing TEXT,
  ADD COLUMN IF NOT EXISTS nr_how_well_know_its_working TEXT,
  ADD COLUMN IF NOT EXISTS nr_what_were_not_doing_yet TEXT,
  ADD COLUMN IF NOT EXISTS nr_coach_note TEXT,
  ADD COLUMN IF NOT EXISTS nr_coach_guidance TEXT,
  ADD COLUMN IF NOT EXISTS nutrition_reading_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nutrition_reading_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS nutrition_reading_email_sent_at TIMESTAMPTZ;

-- Speed up the portal lookup (clients hit by onboarding_token -> client_id,
-- then filter to the active plan with a published reading).
CREATE INDEX IF NOT EXISTS nutrition_plans_client_reading_published_idx
  ON nutrition_plans (client_id, nutrition_reading_published_at)
  WHERE nutrition_reading_published_at IS NOT NULL AND is_active = true;

COMMENT ON COLUMN nutrition_plans.nr_why_this_plan IS
  'Section 1 of the Nutrition Reading. What state we are feeding for right now, in client language.';
COMMENT ON COLUMN nutrition_plans.nr_what_this_nutrition_is_doing IS
  'Section 2. The design translated into outcomes (stabilisation, recovery support, training support) without macros or food specifics.';
COMMENT ON COLUMN nutrition_plans.nr_how_well_know_its_working IS
  'Section 3. Felt and observed signals that tell us the plan is doing its job. No weight or body-comp success criteria.';
COMMENT ON COLUMN nutrition_plans.nr_what_were_not_doing_yet IS
  'Section 4. Restraints (no calorie deficit yet, no restriction, no protocols). When mentioning fat loss, must reframe as downstream consequence.';
COMMENT ON COLUMN nutrition_plans.nr_coach_note IS
  'Section 5. Personal closing in Kade voice.';
COMMENT ON COLUMN nutrition_plans.nr_coach_guidance IS
  'Standing coach notes applied on every Generate/Regenerate. Persists across regenerations on this plan row. Steers framing within doctrine, never overrides safety.';
COMMENT ON COLUMN nutrition_plans.nutrition_reading_email_sent_at IS
  'Set the first time a Nutrition Reading is published for THIS nutrition_plans row. New plans (new rows) re-trigger one email each.';
