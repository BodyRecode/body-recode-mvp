-- calendar_posts gains an owner (2026-08-17).
--
-- Closes the one tenancy gap in the Operator Console. Every other console read
-- filters by coach_id; `content_context` could not, because this table had no
-- owner column. Under one coach an unscoped read returns the same rows as a
-- scoped one, so nothing was wrong in practice — it stops being the same the
-- day a second practice's posts land here, which is exactly when the console
-- is being licensed. Tracked as console-calendar-posts-tenancy in the buildout
-- manifest and closed here.
--
-- All 435 existing rows are Kade's, across three brands (body_recode 334,
-- personal_brand 73, collective 28). `brand` is a sub-axis WITHIN one coach's
-- content, not a tenancy boundary — coach_id is the tenancy boundary.

ALTER TABLE public.calendar_posts
  ADD COLUMN IF NOT EXISTS coach_id UUID;

-- Backfill every existing row to the single coach. Resolved from the clients
-- table rather than hardcoded, so this is re-runnable and cannot pin the wrong
-- id if it is ever replayed against a different database.
UPDATE public.calendar_posts
SET coach_id = (
  SELECT coach_id
  FROM public.clients
  WHERE coach_id IS NOT NULL
  GROUP BY coach_id
  ORDER BY count(*) DESC
  LIMIT 1
)
WHERE coach_id IS NULL;

-- ⚠️ SINGLE-TENANT CRUTCH — REMOVE AT TENANT #2.
--
-- Every calendar_posts insert lives in a hand-run seed script (six of them, in
-- scripts/seed-*.ts); no application route writes this table. A future seed
-- that forgets the new column would produce rows with a NULL owner, which the
-- now-scoped console read would silently skip — a post that exists but is
-- invisible is worse than an error.
--
-- The default makes the safe thing automatic while there is exactly one coach.
-- It MUST be dropped when a second practice is onboarded, because from that
-- moment "the coach with the most clients" is the wrong answer for everyone
-- else. Drop it and pass coach_id explicitly in every seed script:
--
--   ALTER TABLE public.calendar_posts ALTER COLUMN coach_id DROP DEFAULT;
DO $$
DECLARE
  solo_coach UUID;
  coach_count INT;
BEGIN
  SELECT count(DISTINCT coach_id) INTO coach_count
  FROM public.clients WHERE coach_id IS NOT NULL;

  -- Only install the crutch while the assumption behind it actually holds.
  IF coach_count = 1 THEN
    SELECT coach_id INTO solo_coach
    FROM public.clients WHERE coach_id IS NOT NULL LIMIT 1;
    EXECUTE format(
      'ALTER TABLE public.calendar_posts ALTER COLUMN coach_id SET DEFAULT %L',
      solo_coach
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS calendar_posts_coach_date_idx
  ON public.calendar_posts (coach_id, date);
