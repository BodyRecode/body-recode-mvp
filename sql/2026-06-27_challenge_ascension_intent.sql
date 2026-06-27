-- Day 0 intake Part 3 qualifier 2 — forward-intent answer.
--
-- The scorecard's investment_readiness question ("how ready are you to
-- invest in 1-on-1 coaching") makes sense for cold scorecard leads who
-- haven't converted yet. It makes NO sense at Day 0 inside a free
-- Challenge — the enroller just took the free thing, asking "ready to
-- pay $240/wk?" is tonally off AND tags ~all cold-paid enrollers as
-- freebie hunters (red).
--
-- Day 0 replaces it with a forward-intent question instead:
--   "If this Challenge points at something deeper, where would you
--    want to go next?"
--   A. Want my body fully decoded — Blueprint
--   B. Want ongoing coaching rhythm — Membership
--   C. Want 1:1 work with Kade
--   D. Not sure yet, let me see what comes up
--
-- Stored on the enrolment, not on leads, so it doesn't pollute the
-- scorecard's investment_readiness semantic. leads.investment_readiness
-- stays null for Day 0 enrollers; lead_quality at Day 0 becomes
-- approach-only (single axis).

ALTER TABLE public.challenge_enrollments
  ADD COLUMN IF NOT EXISTS ascension_intent TEXT;

ALTER TABLE public.challenge_enrollments
  DROP CONSTRAINT IF EXISTS challenge_enrollments_ascension_intent_check;

ALTER TABLE public.challenge_enrollments
  ADD CONSTRAINT challenge_enrollments_ascension_intent_check
  CHECK (ascension_intent IS NULL OR ascension_intent IN ('A', 'B', 'C', 'D'));

COMMENT ON COLUMN public.challenge_enrollments.ascension_intent IS
  'Day 0 intake forward-intent answer. A=Blueprint, B=Membership, C=1:1 Coaching, D=Not sure yet. Replaces the scorecard investment_readiness question for the Challenge entry context.';
