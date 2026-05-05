-- Foundational Reading email tracking
--
-- Adds a single column to record when the "your reading is ready" email was
-- sent to the client. We use this to ensure regenerations do not re-spam the
-- client: the email fires only on the first time the reading is published.

ALTER TABLE cffs
  ADD COLUMN IF NOT EXISTS client_reading_email_sent_at TIMESTAMPTZ;
