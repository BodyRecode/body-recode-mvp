-- Client Program Reading
--
-- Adds a client-facing interpretation layer to each active training program,
-- mirroring the Foundational Reading pattern on the `cffs` table. The Program
-- Reading is the bridge from the foundational reading (state + drivers) to
-- the prescription (sessions, sets, reps) — written in supportive, plain
-- language and gated behind a publish step.
--
-- Five sections (parallel to the Foundational Reading):
--   pr_why_this_block                — what state we're working with this block
--   pr_what_this_program_is_doing    — design translated into outcomes, not sets/reps
--   pr_how_well_know_its_working     — block-specific success signals
--   pr_what_were_not_doing_yet       — program-level non-directives
--   pr_coach_note                    — Kade's voice on this specific block
--
-- Gating timestamps follow the Foundational Reading convention:
--   program_reading_generated_at  -> set when Claude returns the draft
--   program_reading_published_at  -> set when Kade clicks "Send to client"
--                                    (NULL until then; portal hides the card)
--
-- Run in Supabase SQL editor.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS pr_why_this_block TEXT,
  ADD COLUMN IF NOT EXISTS pr_what_this_program_is_doing TEXT,
  ADD COLUMN IF NOT EXISTS pr_how_well_know_its_working TEXT,
  ADD COLUMN IF NOT EXISTS pr_what_were_not_doing_yet TEXT,
  ADD COLUMN IF NOT EXISTS pr_coach_note TEXT,
  ADD COLUMN IF NOT EXISTS program_reading_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS program_reading_published_at TIMESTAMPTZ;

-- Speed up the portal lookup (clients hit by onboarding_token -> client_id,
-- then filter to the active program with a published reading).
CREATE INDEX IF NOT EXISTS programs_client_reading_published_idx
  ON programs (client_id, program_reading_published_at)
  WHERE program_reading_published_at IS NOT NULL AND is_active = true;
