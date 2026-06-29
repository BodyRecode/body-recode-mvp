-- Wave-tiered founding-member cap for the Funnel B Challenge launch.
--
-- Tracks which "wave" of capped openings a given enrolment came in on.
-- Wave 1 = founding 50 (Mon 13 Jul launch week). Wave 2 = +25 spots after
-- Wave 1 fills. Wave 3 = +25 more. Wave 4+ = evergreen, no cap.
--
-- Rationale: real urgency via honest wave caps (not fake scarcity on an
-- unlimited free product). Public commitment is only to the CURRENT wave;
-- next wave only announced if current one actually fills.
--
-- See:
--   - project_funnel_b_wave_cap_strategy (auto-memory)
--   - Feature Registry: "Wave-Tiered Founding Member Cap 2026-06-29"
--   - SaaS build folder: 2026-06-29_Wave_Tiered_Cap_Strategy.md

ALTER TABLE public.challenge_enrollments
ADD COLUMN IF NOT EXISTS wave INTEGER NOT NULL DEFAULT 1;

-- Backfill any existing rows to wave=1 (default handles new inserts).
UPDATE public.challenge_enrollments SET wave = 1 WHERE wave IS NULL;

-- Index for fast cap-check queries on /api/challenge/enroll
CREATE INDEX IF NOT EXISTS idx_challenge_enrollments_wave_status
  ON public.challenge_enrollments (wave, status);

-- Sanity check
SELECT wave, COUNT(*) AS enrolments FROM public.challenge_enrollments GROUP BY wave ORDER BY wave;
