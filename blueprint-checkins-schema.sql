-- Blueprint Check-In Table
-- Run in Supabase SQL editor

create table if not exists blueprint_checkins (
  id uuid primary key default uuid_generate_v4(),
  enrollment_id uuid not null references blueprint_enrollments(id) on delete cascade,
  week_number int not null check (week_number between 1 and 6),
  -- 8 biological markers, each rated 1-5
  energy_levels int not null check (energy_levels between 1 and 5),
  morning_energy int not null check (morning_energy between 1 and 5),
  sleep_quality int not null check (sleep_quality between 1 and 5),
  afternoon_crash int not null check (afternoon_crash between 1 and 5),
  hunger_cravings int not null check (hunger_cravings between 1 and 5),
  training_recovery int not null check (training_recovery between 1 and 5),
  mood_stability int not null check (mood_stability between 1 and 5),
  physical_changes int not null check (physical_changes between 1 and 5),
  notes text,
  submitted_at timestamptz not null default now(),
  unique (enrollment_id, week_number)
);

-- Allow public insert (token-gated via API route, no RLS needed at DB level)
alter table blueprint_checkins enable row level security;

create policy "allow insert blueprint checkins" on blueprint_checkins
  for insert with check (true);

create policy "allow select own blueprint checkins" on blueprint_checkins
  for select using (true);
