-- Who logged the session: the client (via portal) or the coach (in person,
-- from the dashboard). Additive + safe.
ALTER TABLE public.session_completions
  ADD COLUMN IF NOT EXISTS logged_by text CHECK (logged_by IN ('client', 'coach'));
