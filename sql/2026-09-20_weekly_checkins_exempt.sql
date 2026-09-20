-- A client who will not do weekly check-ins, recorded where the system can see it.
--
-- 20 September 2026. Greg has done zero weekly check-ins since April, and Kade
-- confirmed on 31 August that he will not do them. That decision has lived in
-- notes ever since, so the daily report has chased him every single day for
-- seven weeks.
--
-- That is worse than a cosmetic annoyance. A report that lists somebody who is
-- deliberately exempt trains the reader to skim it, and the day a real client
-- stops checking in, that line looks the same as the noise above it.
--
-- So the arrangement goes in the record rather than in somebody's memory. The
-- reason is required in practice, because "exempt" with no reason is how a
-- client quietly stops being coached.

alter table clients
  add column if not exists weekly_checkins_exempt boolean not null default false,
  add column if not exists weekly_checkins_exempt_reason text,
  add column if not exists weekly_checkins_exempt_at timestamptz;

comment on column clients.weekly_checkins_exempt is
  'True when this client will not complete weekly check-ins by arrangement. Excluded from the check-in chase and from the daily report. 20 Sep 2026.';

-- Greg, per Kade's decision of 31 August 2026.
update clients
set weekly_checkins_exempt = true,
    weekly_checkins_exempt_reason = 'Kade confirmed 31 Aug 2026 that he will not complete check-ins. His programming is generated with a coach override instead of waiting for a re-score.',
    weekly_checkins_exempt_at = now()
where id = '027cabc0-42ef-4b1e-b9b7-c7827ba113e1';
