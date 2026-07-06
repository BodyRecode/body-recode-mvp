-- Add 'reintake' to the intake_invitations.kind CHECK constraint so the
-- new Re-intake button can insert invitations that route through different
-- downstream copy (email, coach notification, portal card) without
-- overloading the first-time onboarding path.
--
-- Existing values remain valid:
--   foundational  — first-time onboarding intake
--   supplementary — 9-question follow-up for dietary + medications backfill
-- New value:
--   reintake      — full 221-question intake taken by an existing client
--                   for reassessment (block-end, life-context shift, post-
--                   travel, etc). Same form as foundational; different
--                   downstream framing.

ALTER TABLE intake_invitations DROP CONSTRAINT IF EXISTS intake_invitations_kind_check;
ALTER TABLE intake_invitations
  ADD CONSTRAINT intake_invitations_kind_check
  CHECK (kind = ANY (ARRAY['foundational'::text, 'supplementary'::text, 'reintake'::text]));
