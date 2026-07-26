-- extension_checkins table
-- Weekly check-in for the 90-Day Body Rewire Extension (weeks 1-12).
-- Mirrors membership_checkins, but week_number is the TRUE 1-12 Extension week
-- (the portal reuses the Membership UI which is block-relative 1-6; the true
-- week is passed through so weeks 2 and 8 don't collide on the unique index).
-- Run in Supabase SQL Editor (applied to live DB 2026-07-26)

create table if not exists extension_checkins (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references extension_enrollments(id) on delete cascade,
  week_number int not null check (week_number between 1 and 12),
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

alter table extension_checkins enable row level security;

create policy "Service role full access"
  on extension_checkins for all
  using (true) with check (true);

create index if not exists extension_checkins_enrollment_idx on extension_checkins(enrollment_id);

-- Explicit grant required for new public tables (default grants revoked 2026-05-28).
grant select, insert, update, delete on extension_checkins to service_role;
