-- Weekly Check-In Auto-Response (2026-06-08)
-- Adds the columns needed to automate weekly_checkin_feedback generation +
-- scheduled email send while keeping the coach in the loop via a 4h
-- intervention window. Run in Supabase SQL editor.

-- ── Per-client opt-out flag ────────────────────────────────────────────
-- Default true so automation rolls out universally; coach flips off on the
-- client profile for any client where they want a fully manual touch.
alter table clients
  add column if not exists auto_checkin_response_enabled boolean not null default true;

-- ── Feedback row: pipeline state ───────────────────────────────────────
-- Tracks which feedback rows were auto-generated vs hand-written, and when
-- the auto-pipeline scheduled the send. The existing email_sent_at remains
-- the source of truth for "sent" status.
alter table weekly_checkin_feedback
  add column if not exists auto_generated_at timestamptz,
  add column if not exists auto_send_scheduled_at timestamptz;

-- ── Check-in: AI attempt tracking ──────────────────────────────────────
-- When the auto-response worker runs against a check-in, it stamps these
-- columns. If the generation fails (jargon leak after 3 retries, AI error,
-- etc.), the failure_reason is captured here, no feedback row is created,
-- and Today's Focus surfaces an "AI failed, manual needed" flag against
-- the check-in.
alter table weekly_checkins
  add column if not exists auto_response_attempted_at timestamptz,
  add column if not exists auto_response_failure_reason text;

-- ── Index for the auto-pending dashboard query ─────────────────────────
-- "Which feedback rows are queued for auto-send but not yet sent" so the
-- coach can scan their intervention window at a glance.
create index if not exists weekly_checkin_feedback_auto_pending_idx
  on weekly_checkin_feedback (auto_send_scheduled_at)
  where email_sent_at is null and auto_send_scheduled_at is not null;
