-- A coach accepts their agreement in the app, the way a client already does.
--
-- 20 September 2026. A client never signs anything on paper: they read the
-- coaching agreement in their portal, type their full name, and the system
-- records who accepted and when. A coach, until now, got an invitation link,
-- set a password, and was in. Nothing recorded that they had agreed to
-- anything.
--
-- That matters more for a coach than for a client, because the coach agreement
-- is the document carrying the referral obligation, the screening obligation
-- and the insurance requirement. A copy of it signed on paper and filed in a
-- folder is a record outside the system, which is the category we are already
-- trying to shrink.
--
-- One row per acceptance rather than a column on the coach, because a coach
-- who accepted version 1 and later accepts version 2 has done two separate
-- things and the first does not stop being true.

create table if not exists coach_agreements (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  -- Which agreement, and which version of it. 'pilot' today; a commercial
  -- licence later will be its own kind rather than a new version of this one.
  agreement_kind text not null default 'pilot',
  version text not null,
  accepted_at timestamptz not null default now(),
  -- What they typed, not what we already knew. A name typed by the person is
  -- the acceptance; a name we filled in for them is not.
  accepted_name text not null,
  -- Recorded because an electronic acceptance is worth more with them than
  -- without, and because a dispute about whether somebody accepted is decided
  -- on this kind of detail.
  ip_address text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists coach_agreements_coach_idx on coach_agreements (coach_id, accepted_at desc);
create unique index if not exists coach_agreements_one_per_version
  on coach_agreements (coach_id, agreement_kind, version);

alter table coach_agreements enable row level security;

-- A coach may read their own acceptances and nothing else. They may not write
-- one directly: acceptance is recorded by the server, so a row cannot be
-- created by anything other than the act of accepting.
drop policy if exists "coach reads own acceptances" on coach_agreements;
create policy "coach reads own acceptances" on coach_agreements
  for select to authenticated using (coach_id = auth.uid());

drop policy if exists "service role writes" on coach_agreements;
create policy "service role writes" on coach_agreements
  for all to service_role using (true) with check (true);

revoke all on coach_agreements from anon;
grant select on coach_agreements to authenticated;
-- The grant a new table does NOT inherit. Missing it fails silently in any
-- route that swallows errors, which is how coach_preferences went unwritable
-- for months and how coach_invitations failed on its first test run.
grant select, insert, update, delete on coach_agreements to service_role;

comment on table coach_agreements is
  'One row per agreement a coach has accepted in the app. Read by the agreement gate. 20 Sep 2026.';
