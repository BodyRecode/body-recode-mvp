-- Day 0 Body Decode Intake — closes the state-capture hole for Challenge
-- enrollers who bypass the scorecard (cold-paid ads, gym-floor QR, direct).
--
-- Captures the same signals the scorecard does (5 section scores, 2
-- qualifiers, sex/age/storage/cycle) and writes them to the same
-- leads.scorecard_* columns so cold-paid enrollers unify with scorecard
-- signups in the schema.
--
-- This column just tracks completion of the intake step inside the portal.
-- Scorecard signups skip the form (leads.scorecard_profile already set) and
-- this stamp is set automatically on Day 0 portal load.

ALTER TABLE public.challenge_enrollments
  ADD COLUMN IF NOT EXISTS body_decode_intake_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN public.challenge_enrollments.body_decode_intake_completed_at IS
  'When the enroller completed (or skipped via prior scorecard) the Day 0 Body Decode Intake. Gates PAR-Q.';
