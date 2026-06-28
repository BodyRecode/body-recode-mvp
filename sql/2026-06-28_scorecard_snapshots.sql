-- Weekly snapshots for the CEO Dashboard / Company Scorecard.
--
-- The scorecard computes flow metrics (counts over a time window) live from
-- source tables, but the point-in-time SNAPSHOT metrics (MRR, active clients,
-- active members, check-in rate, payments overdue) have no history — you can't
-- ask "what was MRR last Monday". This table freezes every metric once a week
-- (written by the /api/cron/weekly-scorecard-pulse cron) so the weekly Pulse
-- email can report week-over-week deltas and which metrics flipped status.
--
-- One row per (week_start, metric_key). Upserted, so re-running the cron in the
-- same ISO week overwrites rather than duplicates.

-- ============================================================================
-- 1. TABLE
-- ============================================================================
create table if not exists scorecard_snapshots (
  id          uuid primary key default uuid_generate_v4(),
  week_start  date not null,             -- Monday (start of the ISO week being recorded)
  metric_key  text not null,             -- e.g. 'mrr', 'new_leads' (matches scorecard.ts keys)
  engine      text not null,             -- 'growth' | 'fulfilment' | 'cash'
  unit        text not null,             -- 'count' | 'currency' | 'percent'
  value       numeric not null,          -- the metric's value for that week
  target      numeric not null,          -- target in force when snapshotted
  status      text not null,             -- 'green' | 'yellow' | 'red'
  created_at  timestamptz not null default now(),
  unique (week_start, metric_key)
);

create index if not exists scorecard_snapshots_week_idx
  on scorecard_snapshots(week_start desc);

-- ============================================================================
-- 2. GRANTS  (REQUIRED — without these the admin client returns 42501)
-- ============================================================================
-- service_role only: written by the cron and read by the dashboard, both via
-- the admin client. Not queried by the SSR server client or the browser.
grant select, insert, update, delete on public.scorecard_snapshots to service_role;

-- ============================================================================
-- 3. RLS + POLICIES
-- ============================================================================
alter table scorecard_snapshots enable row level security;

drop policy if exists "service role manages scorecard_snapshots" on scorecard_snapshots;
create policy "service role manages scorecard_snapshots"
  on scorecard_snapshots
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
