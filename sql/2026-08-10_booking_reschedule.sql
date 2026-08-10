-- Booking reschedule support.
--
-- Why: on 2026-08-10 a Zoom 1 was created at the wrong time. Fixing it meant
-- cancelling and re-creating, because:
--   1. The Zoom meeting ID was returned by the create route but never stored,
--      so there was nothing to update or delete.
--   2. The 2h and 30min reminders are scheduled with Resend at booking time.
--      Their IDs were discarded, so the queued emails could not be cancelled
--      and would still have fired at the OLD time.
--
-- Both columns exist so a booking can be moved in place: update the Zoom
-- meeting (which preserves the join URL, so a link already sent to the lead
-- keeps working), cancel the stale reminders, and queue new ones.

alter table public.be_bookings
  add column if not exists zoom_meeting_id bigint,
  add column if not exists reminder_email_ids text[] not null default '{}';

comment on column public.be_bookings.zoom_meeting_id is
  'Zoom meeting ID. Needed to update the meeting time on reschedule (preserves the join URL) and to delete it on cancel.';

comment on column public.be_bookings.reminder_email_ids is
  'Resend IDs of the scheduled 2h/30min reminder emails. Cancelled and re-queued on reschedule, cancelled on cancel. Empty when no reminders are pending.';
