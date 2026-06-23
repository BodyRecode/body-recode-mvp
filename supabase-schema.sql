-- Body Recode MVP Database Schema v2
-- Run this in your Supabase SQL Editor

-- Drop existing tables
drop table if exists cfws cascade;
drop table if exists weekly_checkins cascade;
drop table if exists cffs cascade;
drop table if exists intakes cascade;
drop table if exists intake_invitations cascade;
drop table if exists clients cascade;

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Clients (coach creates these — minimal info)
create table clients (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  email text,
  created_at timestamptz default now()
);

-- Canonical identity fields (single source of truth). The client enters these
-- once in the Health Declaration (first onboarding form); the Foundational
-- Intake reads them back as a confirmation card instead of re-asking. Added
-- 2026-06-23. phone already existed for SMS reminders.
alter table clients add column if not exists phone text;
alter table clients add column if not exists date_of_birth date;
alter table clients add column if not exists emergency_contact_name text;
alter table clients add column if not exists emergency_contact_relationship text;
alter table clients add column if not exists emergency_contact_phone text;

-- Intake invitations (unique links sent to clients)
create table intake_invitations (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  token uuid default uuid_generate_v4() unique not null,
  status text default 'pending' check (status in ('pending', 'started', 'complete')),
  created_at timestamptz default now(),
  completed_at timestamptz
);

-- Intakes (submitted by client via link — responses stored as JSONB)
create table intakes (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  invitation_id uuid references intake_invitations(id),
  schema_version text default 'v2.0',
  -- Identity fields
  full_name text,
  date_of_birth text,
  gender text,
  occupation text,
  emergency_contact_name text,
  emergency_contact_phone text,
  -- All 208 diagnostic responses stored as JSONB
  fat_map_responses jsonb,        -- 25 questions, 0-4 scale
  injury_responses jsonb,         -- 25 questions, mixed
  training_responses jsonb,       -- 30 questions, 0-4 scale
  nutrition_responses jsonb,      -- 25 questions, 0-4 scale
  schedule_responses jsonb,       -- 25 questions, 0-4 scale
  sleep_responses jsonb,          -- 25 questions, 0-4 scale
  stress_responses jsonb,         -- 25 questions, 0-4 scale
  supplement_responses jsonb,     -- 25 questions, 0-4 scale
  -- Open responses
  injury_location_current text[],
  injury_location_history text[],
  injury_primary_concern text,
  injury_aggravating_movements text,
  -- Goal declaration
  primary_goal text,
  secondary_goals text[],
  desired_timeline text,
  subjective_motivator text,
  submitted_at timestamptz default now()
);

-- Coach-Facing Foundational Synthesis
create table cffs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  intake_id uuid references intakes(id),
  generated_at timestamptz default now(),
  resolution_state text default 'Fully Resolved',
  body_state_classification text check (body_state_classification in ('Remediation', 'Optimisation', 'Post-Optimisation')),
  client_context_summary text,
  primary_patterns_and_signals text,
  capacity_constraints_and_guardrails text,
  risk_flags_and_watch_items text,
  tensions_and_tradeoffs text,
  explicit_non_directives text,
  closing_interpretive_notes text,
  exposure_readiness_capacity text default 'Unknown',
  exposure_readiness_schedule text default 'Unknown',
  exposure_readiness_regulation text default 'Unknown',
  exposure_readiness_behaviour text default 'Unknown',
  reassessment_flagged boolean default false,
  is_archived boolean default false,
  superseded_by uuid references cffs(id),
  created_at timestamptz default now()
);

-- Weekly Check-ins
create table weekly_checkins (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  week_number integer not null,
  form_type text check (form_type in ('A', 'B')),
  submitted_at timestamptz default now(),
  responses jsonb
);

-- Coach-Facing Weekly Synthesis
create table cfws (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  week_number integer not null,
  generated_at timestamptz default now(),
  resolution_state text default 'Fully Resolved',
  rolling_window_weeks integer[],
  client_context_snapshot text,
  dominant_weekly_patterns text,
  weekly_capacity_constraints text,
  weekly_risk_flags text,
  weekly_tensions_tradeoffs text,
  explicit_weekly_non_directives text,
  closing_weekly_notes text,
  exposure_readiness_capacity text default 'Unknown',
  exposure_readiness_schedule text default 'Unknown',
  exposure_readiness_regulation text default 'Unknown',
  exposure_readiness_behaviour text default 'Unknown',
  reassessment_language_triggered boolean default false
);

-- Row Level Security
alter table clients enable row level security;
alter table intake_invitations enable row level security;
alter table intakes enable row level security;
alter table cffs enable row level security;
alter table weekly_checkins enable row level security;
alter table cfws enable row level security;

-- Coach policies
create policy "coaches manage own clients" on clients
  for all using (coach_id = auth.uid());

create policy "coaches manage own invitations" on intake_invitations
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

create policy "coaches see own intakes" on intakes
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

create policy "coaches see own cffs" on cffs
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

create policy "coaches see own checkins" on weekly_checkins
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

create policy "coaches see own cfws" on cfws
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

-- Public policy: clients can read their invitation by token (no auth needed)
create policy "public can read invitation by token" on intake_invitations
  for select using (true);

-- Public policy: clients can insert intake (no auth needed)
create policy "public can insert intake" on intakes
  for insert with check (true);

-- Public policy: clients can update invitation status
create policy "public can update invitation status" on intake_invitations
  for update using (true);
