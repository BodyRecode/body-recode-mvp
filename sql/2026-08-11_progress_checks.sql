-- Progress Check (delta re-assessment) — Phase 1b of the Progress Read build.
--
-- The short re-assessment a client completes at a milestone (block-end / 12-week
-- cap) so the system can honestly re-score their body state. Deliberately its OWN
-- table rather than reusing intake_invitations: the kind CHECK constraint there is
-- (foundational|supplementary|reintake), and the Progress Check has its own form
-- (progress-check-questions.ts), its own storage, and must not trigger the intake
-- downstream branching. One row = one invitation + its answers.
--
-- Service-role only (server routes use the admin client, which bypasses RLS).
-- Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS progress_checks (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id    uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  token        text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'complete')),
  program_id   uuid REFERENCES programs(id) ON DELETE SET NULL,  -- the block this check belongs to, when known
  block_number int,
  responses    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz
);

ALTER TABLE progress_checks ENABLE ROW LEVEL SECURITY;
GRANT ALL ON progress_checks TO service_role;

CREATE INDEX IF NOT EXISTS progress_checks_client_idx ON progress_checks(client_id);
CREATE INDEX IF NOT EXISTS progress_checks_token_idx ON progress_checks(token);
