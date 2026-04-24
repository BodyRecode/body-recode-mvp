-- membership_enrollments table
-- Run this in Supabase SQL Editor

create table if not exists membership_enrollments (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  email text not null,
  first_name text not null,
  pattern text not null default 'pending',
  pattern_source text not null default 'assessment',
  blueprint_token text references blueprint_enrollments(token) on delete set null,
  stripe_subscription_id text,
  current_block text not null default 'A',
  current_week int not null default 1,
  joined_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table membership_enrollments enable row level security;

create policy "Service role full access"
  on membership_enrollments
  for all
  using (true)
  with check (true);

-- Index for token lookups
create index if not exists membership_enrollments_token_idx on membership_enrollments(token);
create index if not exists membership_enrollments_email_idx on membership_enrollments(email);
create index if not exists membership_enrollments_blueprint_token_idx on membership_enrollments(blueprint_token);

-- membership_checkins table
create table if not exists membership_checkins (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references membership_enrollments(id) on delete cascade,
  week_number int not null,
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
  unique(enrollment_id, week_number)
);

alter table membership_checkins enable row level security;

create policy "Service role full access"
  on membership_checkins
  for all
  using (true)
  with check (true);

create index if not exists membership_checkins_enrollment_idx on membership_checkins(enrollment_id);
