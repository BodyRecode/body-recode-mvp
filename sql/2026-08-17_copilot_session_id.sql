-- Co-pilot chat sessions (2026-08-17).
--
-- The client-scoped co-pilot used to reload EVERY message ever exchanged about a
-- client each time the coach opened the bubble, and replayed the most recent 24 of
-- them to the model. So an old conversation both cluttered the panel and shaped
-- answers to unrelated new questions.
--
-- Opening the panel now starts a fresh session. Rows are NOT deleted — they stay
-- for the flagged-exchanges review page (/dashboard/copilot-review) and as an
-- audit trail; they're just scoped to the session they belong to.
--
-- Pre-existing rows keep session_id NULL, which no live session can match, so
-- they are simply never replayed.

ALTER TABLE public.copilot_messages
  ADD COLUMN IF NOT EXISTS session_id TEXT;

CREATE INDEX IF NOT EXISTS copilot_messages_client_session_idx
  ON public.copilot_messages (client_id, session_id, created_at);
