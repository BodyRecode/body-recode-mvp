-- Block-end Trajectory Reading
--
-- The client-facing reading of the CFWS arc across a completed training block.
-- Where the Foundational Reading is the client analogue of the CFFS (a single
-- point-in-time synthesis) and the Program Reading interprets the prescription,
-- the Trajectory Reading is the client analogue of the CFWS read ACROSS the
-- whole block: where the client started, how their weekly signal moved, what
-- held steady, and what the block sets up next.
--
-- It is generated from every non-archived CFWS row in the block's week range,
-- plus the published Foundational Reading for voice continuity. Coach-gated
-- like the Foundational Reading: generate drafts it, publish surfaces it to the
-- portal and (first publish only) emails the client.
--
-- Stored ON the programs table because a program row IS one block. No new table,
-- so no new grants required — programs already grants service_role.
--
-- Five sections:
--   tr_where_this_block_started   — the picture at the start of the block
--   tr_how_your_signal_moved      — the trajectory across the weekly check-ins
--   tr_what_held_steady           — patterns that persisted across the block
--   tr_what_this_sets_up_next     — forward-looking, non-prescriptive
--   tr_coach_note                 — Kade's voice on the arc of this block
--
-- Gating timestamps (Foundational Reading convention):
--   trajectory_reading_generated_at  -> set when Claude returns the draft
--   trajectory_reading_published_at  -> set when Kade clicks Publish (NULL hides
--                                       the portal card)
--   trajectory_reading_email_sent_at -> set the first time THIS block's reading
--                                       is published; republish never re-emails
--   tr_coach_guidance                -> standing coach notes, applied on every
--                                       Generate / Regenerate, never overrides doctrine
--
-- Run in the Supabase SQL editor.

ALTER TABLE programs
  ADD COLUMN IF NOT EXISTS tr_where_this_block_started TEXT,
  ADD COLUMN IF NOT EXISTS tr_how_your_signal_moved TEXT,
  ADD COLUMN IF NOT EXISTS tr_what_held_steady TEXT,
  ADD COLUMN IF NOT EXISTS tr_what_this_sets_up_next TEXT,
  ADD COLUMN IF NOT EXISTS tr_coach_note TEXT,
  ADD COLUMN IF NOT EXISTS tr_coach_guidance TEXT,
  ADD COLUMN IF NOT EXISTS trajectory_reading_generated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trajectory_reading_published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trajectory_reading_email_sent_at TIMESTAMPTZ;

-- Portal lookup: client by onboarding_token -> client_id, then the active
-- program with a published trajectory reading.
CREATE INDEX IF NOT EXISTS programs_trajectory_reading_published_idx
  ON programs (client_id, trajectory_reading_published_at)
  WHERE trajectory_reading_published_at IS NOT NULL AND is_active = true;
