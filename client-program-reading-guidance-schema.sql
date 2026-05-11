-- Client Program Reading — addendum: coach guidance + email tracking
--
-- Parity with the Foundational Reading. Run AFTER client-program-reading-schema.sql.
--
--   pr_coach_guidance              -> Standing coach notes applied on every
--                                     Generate / Regenerate. Persists across
--                                     regenerations. Steers framing, never
--                                     overrides doctrine.
--   program_reading_email_sent_at  -> Set the first time a Program Reading is
--                                     published for THIS program row. Regenerations
--                                     never re-email. New blocks (new program rows)
--                                     naturally re-trigger one email each.
--
-- Run in Supabase SQL editor.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS pr_coach_guidance TEXT,
  ADD COLUMN IF NOT EXISTS program_reading_email_sent_at TIMESTAMPTZ;
