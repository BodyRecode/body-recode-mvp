-- Record of consent to collect health information, captured on the first
-- screen of the foundational intake (17 Sep 2026).
--
-- WHY: Australian Privacy Principle 3.3 requires consent to collect sensitive
-- information, and the regulator expects it to be specific and not bundled.
-- Holding the timestamp is what makes it provable later; a tick with no record
-- is the same as no tick.
ALTER TABLE public.intakes
  ADD COLUMN IF NOT EXISTS health_consent_at timestamptz;

COMMENT ON COLUMN public.intakes.health_consent_at IS
  'When the client ticked the health information consent box on the intake. Null for intakes submitted before 17 Sep 2026.';

-- Same record for a blood panel upload: consent is asked at the point of
-- upload, not inherited from an intake filled in months earlier.
ALTER TABLE public.blood_panels
  ADD COLUMN IF NOT EXISTS health_consent_at timestamptz;

COMMENT ON COLUMN public.blood_panels.health_consent_at IS
  'When the client ticked the consent box while uploading this panel. Null for panels uploaded before 17 Sep 2026.';
