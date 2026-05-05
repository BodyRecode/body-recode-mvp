-- Client Foundational Reading
--
-- Adds the client-facing version of the CFFS interpretation. Each row in the
-- existing `cffs` table can now hold both the coach-facing synthesis (the
-- existing columns) and a separately-generated client-facing reading written
-- in supportive, conservative language.
--
-- The reading is Kade-approved before it reaches the portal:
--   client_reading_generated_at  -> set when Claude returns the draft
--   client_reading_published_at  -> set when Kade clicks "Send to client"
--                                   (NULL until then; portal hides the page)

ALTER TABLE cffs
  ADD COLUMN IF NOT EXISTS cr_where_you_are TEXT,
  ADD COLUMN IF NOT EXISTS cr_what_your_body_is_telling_us TEXT,
  ADD COLUMN IF NOT EXISTS cr_what_were_focusing_on_first TEXT,
  ADD COLUMN IF NOT EXISTS cr_what_were_not_doing_yet TEXT,
  ADD COLUMN IF NOT EXISTS cr_coach_note TEXT,
  ADD COLUMN IF NOT EXISTS client_reading_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS client_reading_published_at TIMESTAMPTZ;

-- Speed up the portal lookup (clients hit by onboarding_token -> client_id)
CREATE INDEX IF NOT EXISTS cffs_client_published_idx
  ON cffs (client_id, client_reading_published_at)
  WHERE client_reading_published_at IS NOT NULL AND is_archived = false;
