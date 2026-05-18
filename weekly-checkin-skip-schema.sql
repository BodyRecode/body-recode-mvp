-- Weekly Check-In Coach Skip
-- 2026-05-18 — adds a coach affordance to mark a check-in as "no response
-- needed" without writing feedback. Clears it from the "Unanswered check-in"
-- flag in Today's Focus and the Weekly Synthesis section's attention pill.
-- Run in Supabase SQL editor.

alter table weekly_checkins
  add column if not exists coach_skipped_at timestamptz,
  add column if not exists coach_skipped_by uuid,
  add column if not exists coach_skip_reason text;

-- Unskip = set all three back to null. The Skip button on the per-check-in
-- coach page toggles this; the feedback form treats skipped check-ins as
-- resolved without ever having a `weekly_checkin_feedback` row written.
