-- 2026-07-21: Add draft column for LLM-generated daily routines.
--
-- Draft/live split matches the pattern used by training_plans and
-- nutrition plans: LLM writes to _draft, coach reviews on the routine
-- editor, publish moves _draft -> daily_routine and clears _draft.
--
-- daily_routine_draft: same JSONB shape as daily_routine
-- daily_routine_generated_at: when the draft was last generated
-- daily_routine_generation_rationale: coach-facing "why this fits" note
--   returned by the LLM alongside the sequences, shown in the editor
--   but not on the client portal.

ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS daily_routine_draft JSONB NULL,
  ADD COLUMN IF NOT EXISTS daily_routine_generated_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS daily_routine_generation_rationale TEXT NULL;

COMMENT ON COLUMN public.clients.daily_routine_draft IS
  'LLM-generated draft awaiting coach review. Same JSONB shape as daily_routine. Cleared on publish.';
COMMENT ON COLUMN public.clients.daily_routine_generated_at IS
  'Timestamp of the last LLM generation. Used to show staleness in the coach editor.';
COMMENT ON COLUMN public.clients.daily_routine_generation_rationale IS
  'Coach-facing rationale for why the LLM chose these steps for this client. Not shown on client portal.';
