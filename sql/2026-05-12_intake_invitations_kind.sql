-- Adds `kind` to intake_invitations to distinguish foundational intakes (the
-- 221-question form completed once at onboarding) from supplementary intakes
-- (short follow-up forms used to backfill new fields onto existing clients).
--
-- When the platform adds new intake fields (e.g. the medications question on
-- 2026-05-11 or the dietary context block on 2026-05-12), existing clients
-- can be sent a supplementary intake invitation that asks ONLY the new
-- questions and writes their answers to their existing intake row + any
-- relevant longitudinal fields on clients.
--
-- Run in Supabase: SQL Editor -> paste -> Run.

ALTER TABLE intake_invitations
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'foundational'
    CHECK (kind IN ('foundational', 'supplementary'));

COMMENT ON COLUMN intake_invitations.kind IS
  '`foundational` = the full 221-question intake at onboarding. `supplementary` = a short follow-up form that asks only fields added after the original intake. Supplementary submissions UPDATE the most recent intake row rather than inserting a new one.';
