-- Client freeze: temporary pause of a coaching engagement.
--
-- Sits alongside offboarding (2026-08-01_offboarding_and_retention.sql). Same
-- effective lockout, none of the finality. Freeze does not rotate the portal
-- token, does not record an end reason, does not set a retention date, and is
-- reversed with a single click that clears frozen_at. Use when a client is
-- taking a break (holiday, saving up, injury recovery) and expects to return.
--
-- The gate model matches ended_at: portal-guard.ts and every client-facing cron
-- read this column and stop contact when it is not null. See
-- contactable-clients.ts for the shared predicate that every cron must use.
alter table public.clients
  add column if not exists frozen_at    timestamptz,
  add column if not exists frozen_by    uuid,
  add column if not exists freeze_notes text;

comment on column public.clients.frozen_at is
  'When the engagement was paused. A SECOND GATE alongside ended_at: portal-guard.ts and every client-facing cron treat a non-null frozen_at as "no contact until unfrozen". Unlike offboarding, freeze is fully reversible: setting frozen_at to null restores everything without reissuing a token.';
comment on column public.clients.freeze_notes is
  'Why the freeze, in the coach''s words. Often: "saving up", "on holiday", "surgery recovery, back in Feb".';

create index if not exists clients_frozen_at_idx on public.clients (frozen_at) where frozen_at is not null;
