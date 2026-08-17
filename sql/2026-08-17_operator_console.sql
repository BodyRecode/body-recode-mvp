-- Operator Console (Phase 6) — threads, transcript, audit trail, staged actions.
--
-- The console is a full-page chat inside the dashboard that can OPERATE the
-- business: read live data through scoped tools, and stage actions that a human
-- then confirms. Everything it does has to be answerable later — "why did my
-- client get that email?" is a support question a licensee will ask, and it is
-- expensive to reconstruct after the fact and cheap to record as it happens.
--
-- Four tables:
--   console_threads          one conversation, resumable, owned by a coach
--   console_messages         the transcript (what was asked, what was answered)
--   console_tool_calls       EVERY tool invocation, its arguments and outcome
--   console_pending_actions  anything that sends/charges/deletes, parked until
--                            a human clicks confirm
--
-- Scoping: every table carries coach_id and RLS restricts rows to that coach.
-- The routes use the service role (like the rest of the platform), so RLS here
-- is the second line, not the first — the tool layer resolves the scope
-- server-side and filters every query by it. Two independent barriers, because
-- a licensee reading another practice's data is the one failure this build
-- cannot have.

-- ── Threads ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.console_threads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id    UUID NOT NULL,
  title       TEXT NOT NULL DEFAULT 'New conversation',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS console_threads_coach_idx
  ON public.console_threads (coach_id, updated_at DESC);

-- ── Transcript ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.console_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id  UUID NOT NULL REFERENCES public.console_threads(id) ON DELETE CASCADE,
  coach_id   UUID NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  -- Compact record of which tools ran to produce this answer, so the UI can
  -- show its work without replaying the full tool_calls table.
  tool_trace JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS console_messages_thread_idx
  ON public.console_messages (thread_id, created_at);

-- ── Audit trail ──────────────────────────────────────────────────────────────
-- One row per tool invocation. `ok=false` rows are kept deliberately: a tool
-- that refused (out of scope, bad arguments) is exactly what you want to see
-- when working out why an answer was wrong.
CREATE TABLE IF NOT EXISTS public.console_tool_calls (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id   UUID REFERENCES public.console_threads(id) ON DELETE CASCADE,
  coach_id    UUID NOT NULL,
  tool_name   TEXT NOT NULL,
  arguments   JSONB NOT NULL DEFAULT '{}'::jsonb,
  ok          BOOLEAN NOT NULL DEFAULT true,
  error       TEXT,
  -- How many rows the tool returned. Not the rows themselves: the transcript
  -- already carries what the model was told, and duplicating client data into
  -- an audit table multiplies where personal information lives.
  result_count INTEGER,
  duration_ms INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS console_tool_calls_coach_idx
  ON public.console_tool_calls (coach_id, created_at DESC);
CREATE INDEX IF NOT EXISTS console_tool_calls_thread_idx
  ON public.console_tool_calls (thread_id, created_at);

-- ── Staged actions ───────────────────────────────────────────────────────────
-- Anything that sends, charges or deletes stops here and waits for a click.
-- The model can only ever reach 'pending'. Only the confirm endpoint, called
-- from a human click, moves a row to 'executed'.
CREATE TABLE IF NOT EXISTS public.console_pending_actions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id    UUID REFERENCES public.console_threads(id) ON DELETE CASCADE,
  coach_id     UUID NOT NULL,
  action_type  TEXT NOT NULL,
  -- Exactly what will run if confirmed.
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- The dry run, rendered for a human to read BEFORE deciding.
  preview      JSONB NOT NULL DEFAULT '{}'::jsonb,
  summary      TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'executed', 'cancelled', 'expired')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- A stale approval is a hazard: the preview a coach read an hour ago may no
  -- longer describe who would receive it. Confirm re-checks this.
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 minutes'),
  decided_at   TIMESTAMPTZ,
  decided_by   TEXT,
  result       JSONB
);

CREATE INDEX IF NOT EXISTS console_pending_actions_coach_idx
  ON public.console_pending_actions (coach_id, status, created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.console_threads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.console_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.console_tool_calls      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.console_pending_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS console_threads_own ON public.console_threads;
CREATE POLICY console_threads_own ON public.console_threads
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS console_messages_own ON public.console_messages;
CREATE POLICY console_messages_own ON public.console_messages
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS console_tool_calls_own ON public.console_tool_calls;
CREATE POLICY console_tool_calls_own ON public.console_tool_calls
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS console_pending_actions_own ON public.console_pending_actions;
CREATE POLICY console_pending_actions_own ON public.console_pending_actions
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- Service role is what the routes actually use (see feedback_supabase_explicit_grants).
GRANT ALL ON public.console_threads         TO service_role;
GRANT ALL ON public.console_messages        TO service_role;
GRANT ALL ON public.console_tool_calls      TO service_role;
GRANT ALL ON public.console_pending_actions TO service_role;
