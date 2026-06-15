-- Weekly Check-In Feedback: in-email coach approval gate (2026-06-15)
--
-- Replaces the silent 4h auto-send with an explicit coach click. The
-- auto-response Inngest worker still drafts the response on submission,
-- still emails Kade a preview, but now nothing reaches the client until
-- Kade clicks the Approve & Send button in that email (or sends via the
-- dashboard).
--
-- Two new columns on weekly_checkin_feedback:
--   approval_token       — random UUID minted at insert, lives in the
--                          email button URL. Single-use: once email_sent_at
--                          is set, the token endpoint returns "already sent".
--   coach_approved_at    — stamped when the approval endpoint successfully
--                          sends the email. Separate from email_sent_at so
--                          we can tell "coach approved" from "dashboard
--                          Send-now" in audit. (For now they're equivalent
--                          in practice but we want the audit trail.)
--
-- No grant changes — weekly_checkin_feedback grants already cover
-- service_role for the Inngest worker + approval endpoint.

alter table weekly_checkin_feedback
  add column if not exists approval_token uuid default gen_random_uuid(),
  add column if not exists coach_approved_at timestamptz;

-- Backfill: any existing rows need a token so the email built off them
-- works. Only run for rows where the token is null.
update weekly_checkin_feedback
   set approval_token = gen_random_uuid()
 where approval_token is null;

-- Single-row lookup by token (the approval endpoint).
create unique index if not exists weekly_checkin_feedback_approval_token_idx
  on weekly_checkin_feedback (approval_token);
