-- Weekly Check-In Window Override (per client)
-- 2026-05-27 — adds a coach affordance to reopen the check-in window for a
-- single client outside the standard Fri 6pm – Sun 6:30pm Brisbane window.
-- Standard window stays the default for everyone; override only fires when
-- this column is set to a future timestamp.
-- Run in Supabase SQL editor.

alter table clients
  add column if not exists checkin_window_override_until timestamptz;

-- Immediately reopen Ruby-Cate's window through tomorrow end-of-day Brisbane
-- so she can complete tonight without time pressure. This single UPDATE is
-- the "tonight" fix; future reopens will go through the coach button shipped
-- alongside this column.
update clients
  set checkin_window_override_until = (date_trunc('day', now() at time zone 'Australia/Brisbane') + interval '2 days') at time zone 'Australia/Brisbane'
  where id = '2bcadf85-98a2-432b-b72d-58fe05348145';
