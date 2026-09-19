-- Generation failures, recorded and alertable.
--
-- 19 September 2026. Today the nutrition engine writes validator telemetry and
-- the program, routine and reading generators write nothing at all, and NONE of
-- it raises an alert. A real 422 to the coach on 8 September sat in a table
-- nobody reads. With Kade's own clients that is survivable, because he is the
-- one clicking Generate and he sees the error. With another coach's clients,
-- a failure they see and he does not is how a pilot dies quietly.
--
-- One row per failure a coach actually saw. Not a log of everything: retries
-- that succeeded are not failures, and recording them would bury the ones that
-- matter.

create table if not exists generation_failures (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  -- Who was affected. coach_id is who clicked, client_id is whose plan it was.
  coach_id uuid references auth.users(id),
  client_id uuid references clients(id) on delete set null,
  -- Which generator: nutrition | program | routine | reading_foundational |
  -- reading_nutrition | reading_program | reading_trajectory | copilot
  surface text not null,
  -- Short machine reason: validation_exhausted | safety_gate | ai_error |
  -- parse_failure | truncated | unknown
  reason text not null,
  -- What the coach was told, so the alert can quote it back.
  detail text,
  attempts integer,
  -- Issue codes where the surface has them, so a pattern is visible.
  codes text[],
  alerted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists generation_failures_occurred_idx on generation_failures (occurred_at desc);
create index if not exists generation_failures_coach_idx on generation_failures (coach_id, occurred_at desc);

alter table generation_failures enable row level security;

drop policy if exists "service role only" on generation_failures;
create policy "service role only" on generation_failures
  for all to service_role using (true) with check (true);

revoke all on generation_failures from anon, authenticated;
-- The grant that a new table does NOT inherit. Missing it fails silently in a
-- route that swallows errors, which is how coach_preferences went unwritable
-- for months and how coach_invitations failed on its first test run.
grant select, insert, update, delete on generation_failures to service_role;

comment on table generation_failures is
  'One row per generation failure a coach actually saw. Read by the daily health check and the failure alert. 19 Sep 2026.';
