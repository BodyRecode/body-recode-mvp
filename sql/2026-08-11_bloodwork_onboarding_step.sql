-- Blood work as a real onboarding step.
--
-- Blood work already exists as an anytime, optional portal upload (Health
-- Markers / blood_panels). This makes it a prompted onboarding step with two
-- completion paths: the client either uploads recent results (a blood_panels
-- row exists) OR explicitly records that they will get a panel done. The
-- second path is what this column captures.
--
-- Scope of practice: the coach is a Sports Scientist, not a medical
-- practitioner. This step never forces or interprets a medical test. It only
-- ensures every new client is walked through it instead of it being buried.

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS bloodwork_arranged_at timestamptz;

COMMENT ON COLUMN clients.bloodwork_arranged_at IS
  'Set when the client acknowledges during onboarding that they will arrange a blood panel (the "I will get them done" path). NULL means not yet addressed. Uploading a blood_panels row is the other completion path. See sql/2026-08-11_bloodwork_onboarding_step.sql.';

-- Grandfather existing clients who have already started coaching: they onboarded
-- under the old flow, so the new required step must not retroactively reopen
-- their onboarding checklist or hide their portal content.
UPDATE clients
  SET bloodwork_arranged_at = now()
  WHERE coaching_started_at IS NOT NULL
    AND bloodwork_arranged_at IS NULL;
