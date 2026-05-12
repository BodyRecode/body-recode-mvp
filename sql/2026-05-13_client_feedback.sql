-- Client Feedback
--
-- A persistent feedback channel for clients to share thoughts on the portal,
-- coaching experience, feature requests, or bugs. Surfaced via a portal page
-- at /portal/[token]/feedback and via a reusable footer block appended to
-- every broadcast email going forward.
--
-- Each submission emails the coach (Kade) via the standard coach notification
-- template. Acknowledgement columns are present so a future coach dashboard
-- view can triage; not yet UI-built.
--
-- Run in Supabase: SQL Editor -> paste -> Run.

CREATE TABLE IF NOT EXISTS client_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  category        TEXT NOT NULL CHECK (category IN ('portal_experience', 'coaching_experience', 'feature_request', 'bug', 'other')),
  body            TEXT NOT NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS client_feedback_submitted_idx
  ON client_feedback (submitted_at DESC);

CREATE INDEX IF NOT EXISTS client_feedback_unacknowledged_idx
  ON client_feedback (submitted_at DESC)
  WHERE acknowledged_at IS NULL;

COMMENT ON TABLE client_feedback IS
  'Client-submitted feedback on the platform, coaching experience, feature requests, or bugs. One row per submission. Coach is emailed on insert.';
COMMENT ON COLUMN client_feedback.category IS
  'portal_experience | coaching_experience | feature_request | bug | other';
COMMENT ON COLUMN client_feedback.body IS
  'Free-text content from the client. No length limit at the DB layer; the form caps at ~2000 chars client-side.';
COMMENT ON COLUMN client_feedback.acknowledged_at IS
  'Set by the coach when the feedback has been read / actioned. Null = inbox. Reserved for a future coach feedback view.';
