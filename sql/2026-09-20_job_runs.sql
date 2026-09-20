-- Background jobs, recorded so a silent death is visible.
--
-- 20 September 2026. Nineteen scheduled jobs and twenty-six background
-- functions run this business: check-in windows open and close, session
-- reminders go out, subscriptions send, blocks end, the weekly scorecard
-- freezes. NONE of them records that it ran, and none of them raises anything
-- when it fails.
--
-- Two different failures, and the second is the dangerous one:
--   1. A job runs and throws. Nobody hears it.
--   2. A job stops being scheduled at all. Nobody hears THAT either, and there
--      is no error anywhere to find later, because nothing ran.
--
-- The weekly synthesis once went quiet after a model change and was found by
-- a person noticing, not by the system. One row per run makes both visible:
-- a failed run alerts immediately, and a job that has not run inside its own
-- window is reported by the daily health check.

create table if not exists job_runs (
  id uuid primary key default gen_random_uuid(),
  -- The job's own name, matching the key in JOB_SCHEDULES.
  job text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  -- ok | failed
  status text not null default 'ok',
  -- Milliseconds, so a job that is slowly getting worse is visible before it
  -- starts timing out.
  duration_ms integer,
  -- What the job did, when it can say: emails sent, clients swept, rows moved.
  -- Free-form because every job counts something different.
  summary jsonb,
  -- The failure, when there is one.
  error text,
  alerted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists job_runs_job_started_idx on job_runs (job, started_at desc);
create index if not exists job_runs_started_idx on job_runs (started_at desc);
create index if not exists job_runs_failed_idx on job_runs (started_at desc) where status = 'failed';

alter table job_runs enable row level security;

drop policy if exists "service role only" on job_runs;
create policy "service role only" on job_runs
  for all to service_role using (true) with check (true);

revoke all on job_runs from anon, authenticated;
-- The grant a new table does NOT inherit. Missing it fails silently in any
-- route that swallows errors, which is how coach_preferences went unwritable
-- for months and how coach_invitations failed on its first test run.
grant select, insert, update, delete on job_runs to service_role;

comment on table job_runs is
  'One row per background job run. A failed run alerts immediately; a job that has not run inside its window is reported by the daily health check. 20 Sep 2026.';
