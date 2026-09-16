-- What actually happened to an email after we handed it over.
--
-- Kimberly Hamilton's scorecard result landed in her Live.com junk folder on
-- 16 Sep 2026, and nothing in the platform knew. Resend's send() returns
-- success on ACCEPTANCE, not delivery, so every send has looked like a success
-- since the day it was built. Shelley Elley's portal email in June was the same
-- story and was also only found out by asking her.
--
-- Junk itself is never reported by anyone: no provider tells a sender their
-- mail was filed as spam. What IS reportable is bounced, complained and
-- delayed, and those are the ones that mean a person is not hearing from us.
-- This table is where they land.

create table if not exists email_delivery_events (
  id uuid primary key default gen_random_uuid(),
  -- Resend's message id, so several events join into one message's story.
  resend_email_id text,
  event_type text not null,
  to_address text,
  subject text,
  -- Resolved where we can, so a coach sees "Kim" rather than an address.
  client_id uuid references clients(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  -- Bounce reason, complaint type, whatever the provider sent.
  detail text,
  payload jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists email_delivery_events_occurred_idx on email_delivery_events (occurred_at desc);
create index if not exists email_delivery_events_type_idx on email_delivery_events (event_type, occurred_at desc);
create index if not exists email_delivery_events_address_idx on email_delivery_events (lower(to_address));
create index if not exists email_delivery_events_client_idx on email_delivery_events (client_id, occurred_at desc);
-- One row per event per message: Resend retries a webhook until it gets a 200.
create unique index if not exists email_delivery_events_unique_idx
  on email_delivery_events (resend_email_id, event_type, occurred_at);

comment on table email_delivery_events is
  'Delivery outcomes from the Resend webhook: delivered, bounced, complained, delayed. Exists because a send that returns success has only been ACCEPTED, so until 16 Sep 2026 a bounced or junked email looked identical to one that arrived.';

alter table email_delivery_events enable row level security;

-- Coach-only, same as every other operational table. The webhook writes with
-- the service role, which bypasses RLS.
drop policy if exists email_delivery_events_coach_read on email_delivery_events;
create policy email_delivery_events_coach_read on email_delivery_events
  for select using (public.is_coach());

-- Grants. Since 2026-05-28 this project opts out of default grants on new
-- public tables, so without these the service role gets 42501 and the webhook
-- silently records nothing. Found the same day this table shipped, by querying
-- it. See sql/SCHEMA_TEMPLATE.sql.
grant select, insert, update, delete on public.email_delivery_events to service_role;
-- The System Health page reads it through the SSR client as the signed-in coach,
-- filtered by the RLS policy above.
grant select on public.email_delivery_events to authenticated;
