-- Offboarding and record retention.
--
-- Before this, ending an engagement meant setting clients.active = false, which
-- reads like the off switch and is close to a lie. It does not gate the portal,
-- and eleven of the twelve scheduled jobs that email clients ignore it entirely.
-- A coach could set that flag, believe contact had stopped, and have the system
-- keep sending check-in reminders to a client who had quit.
--
-- Nothing here deletes. Access is revoked; records are retained. Body Recode
-- holds health information and it is kept.
--
-- retain_until defaults to ended_at + RETENTION_YEARS (5, in
-- src/lib/offboard-client.ts). Worth confirming against obligations: several
-- Australian jurisdictions use SEVEN years from last service for adult health
-- records, and this system holds diagnoses, medications, blood panels and body
-- photographs. Five is a recorded business decision, not legal advice.
alter table public.clients
  add column if not exists ended_at      timestamptz,
  add column if not exists end_reason    text,
  add column if not exists end_notes     text,
  add column if not exists offboarded_by uuid,
  add column if not exists retain_until  date;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'clients_end_reason_check') then
    alter table public.clients add constraint clients_end_reason_check
      check (end_reason is null or end_reason in (
        'client_ended','coach_ended','non_payment','completed','medical',
        'moved_on','unhappy_with_service','no_contact','other'));
  end if;
end $$;

comment on column public.clients.ended_at is
  'When the engagement ended. THIS IS THE GATE: portal-guard.ts redirects a client with a non-null ended_at. Everything else in offboarding is defence in depth.';
comment on column public.clients.end_notes is
  'What actually happened, in the coach''s words. The reason code lets you count; this lets you learn.';
comment on column public.clients.retain_until is
  'Records are kept until this date. Deletion afterwards is a deliberate act, never automatic: a cron job that silently destroys health records is a worse failure than keeping them too long.';
