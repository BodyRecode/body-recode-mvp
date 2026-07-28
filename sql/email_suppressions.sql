-- Email suppression list — the single source of truth for "do not send this
-- person marketing email".
--
-- Why a table keyed on the email ADDRESS rather than a flag on leads/clients:
-- the same person can exist as a lead, a challenge enrollment and a client at
-- once, and each sequence has its own eligibility check. Before this existed,
-- honouring a "STOP" meant hunting every sequence someone was in and switching
-- each off by hand — three separate tables for Nicolette Dunstone on
-- 2026-07-28, and no guarantee a fourth wasn't missed. One row here now stops
-- every marketing send to that address, whatever record it came from.
--
-- Applies to MARKETING email only. Transactional sends a person asked for
-- (Zoom confirmations and reminders, portal sign-in codes, payment receipts,
-- report delivery) deliberately bypass this list — suppressing someone's
-- booking confirmation because they left a drip sequence would be worse than
-- the problem it solves. See src/lib/marketing-email.ts.

create table if not exists email_suppressions (
  id          uuid primary key default gen_random_uuid(),
  -- Lower-cased at write time; every lookup lower-cases too, so
  -- Nic@Example.com and nic@example.com are the same person.
  email       text not null unique,
  -- 'unsubscribe_link' | 'manual' | 'reply_stop' | 'bounce' | 'complaint'
  reason      text not null default 'unsubscribe_link',
  -- Free-text context, e.g. which email they unsubscribed from.
  source      text,
  created_at  timestamptz not null default now()
);

create index if not exists email_suppressions_email_idx on email_suppressions (lower(email));

alter table email_suppressions enable row level security;

-- Read and written server-side only, through the admin client. No anon or
-- authenticated grants: the unsubscribe page is a server component and the
-- API route runs server-side, so the browser never touches this table
-- directly. service_role bypasses RLS but STILL needs the table privilege —
-- omitting this is what silently broke the Booking Agent for 10 days.
grant select, insert, update, delete on table email_suppressions to service_role;
