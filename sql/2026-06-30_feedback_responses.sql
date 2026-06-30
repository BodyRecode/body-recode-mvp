-- Stage-keyed feedback responses + permission-to-publish tracking.
--
-- One row per feedback capture event. Stage (scorecard / challenge / blueprint /
-- membership / coaching / churn) categorises the funnel position; `moment` is
-- the specific event within that stage (e.g. 'day14_report', 'scorecard_result',
-- 'day21_email_nps').
--
-- Permission flow is two-step:
--   1. Capture (status=pending) at the in-context moment
--   2. ~24h later, consent email fires with quote preview + accept/deny link
--   3. status moves to granted/denied; only granted records are publishable
--
-- See `project_feedback_system` (auto-memory) for the strategy.

CREATE TABLE IF NOT EXISTS public.feedback_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Source identifiers (zero or more set, depending on stage)
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  challenge_enrollment_id uuid REFERENCES public.challenge_enrollments(id) ON DELETE SET NULL,

  -- Categorisation
  stage text NOT NULL CHECK (stage IN ('scorecard','challenge','blueprint','membership','coaching','churn')),
  moment text NOT NULL,

  -- Capture fields (any subset depending on moment)
  accuracy_score smallint CHECK (accuracy_score BETWEEN 1 AND 5),
  nps_score smallint CHECK (nps_score BETWEEN 0 AND 10),
  response_text text,

  -- Display info for publishing (snapshotted at capture time)
  first_name text,
  last_initial text,

  -- Permission state machine
  permission_status text NOT NULL DEFAULT 'pending' CHECK (permission_status IN ('pending','requested','granted','denied','withdrawn')),
  permission_token text UNIQUE, -- one-time link token for the consent email
  permission_requested_at timestamptz,
  permission_granted_at timestamptz,
  permission_denied_at timestamptz,
  publish_as text CHECK (publish_as IN ('first_name','first_last_initial','anonymous')) DEFAULT 'first_last_initial',

  -- Coach workflow
  coach_seen_at timestamptz,
  coach_seen_by uuid REFERENCES auth.users(id),
  coach_notes text,
  testimonial_published_at timestamptz,
  testimonial_published_in text, -- e.g. 'site_homepage', 'IG_story', 'scorecard_result_page'

  -- Signal classification (coach-tagged or AI-tagged later)
  sentiment text CHECK (sentiment IN ('positive','neutral','negative')),
  churn_risk boolean NOT NULL DEFAULT false,

  -- Provenance
  source text, -- e.g. 'scorecard_result_inline', 'challenge_portal_day14', 'day21_email'
  user_agent text,
  ip_hash text -- sha-256 of IP, no raw IP stored
);

-- Indexes for the dashboard queries (triage by stage / unseen / churn-risk)
CREATE INDEX IF NOT EXISTS idx_feedback_responses_stage_created ON public.feedback_responses (stage, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_unseen ON public.feedback_responses (coach_seen_at) WHERE coach_seen_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_responses_churn_risk ON public.feedback_responses (churn_risk, created_at DESC) WHERE churn_risk = true;
CREATE INDEX IF NOT EXISTS idx_feedback_responses_publishable ON public.feedback_responses (permission_status, testimonial_published_at) WHERE permission_status = 'granted' AND testimonial_published_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_feedback_responses_permission_token ON public.feedback_responses (permission_token) WHERE permission_token IS NOT NULL;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.feedback_responses_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_feedback_responses_updated_at ON public.feedback_responses;
CREATE TRIGGER trg_feedback_responses_updated_at
  BEFORE UPDATE ON public.feedback_responses
  FOR EACH ROW EXECUTE FUNCTION public.feedback_responses_set_updated_at();

-- Grants per feedback_supabase_explicit_grants
ALTER TABLE public.feedback_responses ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE ON public.feedback_responses TO service_role;
GRANT SELECT ON public.feedback_responses TO authenticated;
-- anon can INSERT (public moments like scorecard accuracy); RLS policy gates writes
GRANT INSERT ON public.feedback_responses TO anon;

-- RLS policies
DROP POLICY IF EXISTS "anon can submit feedback" ON public.feedback_responses;
CREATE POLICY "anon can submit feedback" ON public.feedback_responses
  FOR INSERT TO anon
  WITH CHECK (true); -- inserts open; reads gated

DROP POLICY IF EXISTS "authenticated can read all feedback" ON public.feedback_responses;
CREATE POLICY "authenticated can read all feedback" ON public.feedback_responses
  FOR SELECT TO authenticated
  USING (true); -- coach-side reads (coach is the only authenticated user)

DROP POLICY IF EXISTS "service_role has full access" ON public.feedback_responses;
CREATE POLICY "service_role has full access" ON public.feedback_responses
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Sanity check
SELECT COUNT(*) AS rows, COUNT(DISTINCT stage) AS distinct_stages FROM public.feedback_responses;
