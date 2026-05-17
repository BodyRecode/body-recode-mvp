-- Weekly Check-In Coach Feedback
-- 2026-05-18 — adds coach-side feedback on each weekly check-in.
-- Run in Supabase SQL editor.

create table if not exists weekly_checkin_feedback (
  id uuid primary key default uuid_generate_v4(),
  weekly_checkin_id uuid not null references weekly_checkins(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  -- Supabase auth user id of the coach who wrote it. No FK because there is
  -- no `coaches` table — the coach is the dashboard-authed Supabase user.
  coach_id uuid,
  -- The three doctrine fields: interpretation (what the coach sees in the
  -- signal), reframe (optional — used when the client is misreading their own
  -- pattern, e.g. bloating vs weight gain), next_focus (one thing for the
  -- client to hold this week).
  interpretation text not null,
  reframe text,
  next_focus text not null,
  email_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (weekly_checkin_id)
);

create index if not exists weekly_checkin_feedback_client_idx
  on weekly_checkin_feedback (client_id, created_at desc);

alter table weekly_checkin_feedback enable row level security;

-- Service role only. All reads/writes happen via the admin client in
-- server routes (coach dashboard + portal pages), so no anon-role policy.
create policy if not exists "service role manages weekly_checkin_feedback"
  on weekly_checkin_feedback
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Auto-bump updated_at on edit so the coach can see when they last revised
-- the feedback (useful when re-sending the email).
create or replace function bump_weekly_checkin_feedback_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_weekly_checkin_feedback_updated_at on weekly_checkin_feedback;
create trigger trg_weekly_checkin_feedback_updated_at
  before update on weekly_checkin_feedback
  for each row
  execute function bump_weekly_checkin_feedback_updated_at();
