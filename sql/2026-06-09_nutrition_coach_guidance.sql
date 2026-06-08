-- Add coach_guidance free-text steering to nutrition_plans.
--
-- Mirror of training_plans.coach_guidance shipped 2026-05-11 (per memory
-- project_program_coach_guidance). Lets the coach inject standing context
-- (travel block, dietary change mid-plan, post-illness recovery framing,
-- life event constraints) that should propagate to every Generate /
-- Regenerate on the active plan without re-encoding it into intake fields.
--
-- The prompt reads this and treats it as authoritative coach intent for
-- THIS client and THIS plan, bounded by HABNS doctrine and the validator's
-- hard floors. Authority and scope rules live in nutrition-prompt.ts under
-- "COACH GUIDANCE (CONTEXT-LEVEL OVERRIDE)".

ALTER TABLE nutrition_plans
  ADD COLUMN IF NOT EXISTS coach_guidance text;

COMMENT ON COLUMN nutrition_plans.coach_guidance IS
  'Free-text coach steering injected at generate time. Bounded by HABNS doctrine and validator hard floors. See nutrition-prompt.ts.';
