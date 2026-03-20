-- Program & Exercise Library Schema
-- Run this in Supabase SQL editor

-- IEEP tracking on clients
alter table clients
  add column if not exists ieep_complete boolean default false,
  add column if not exists program_created_at timestamptz;

-- Exercise library (global, not per-client)
create table if not exists exercises (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  movement_pattern text not null check (movement_pattern in (
    'Squat', 'Hinge', 'Lunge', 'Push', 'Pull', 'Carry', 'Rotate', 'Locomotion', 'Accessory'
  )),
  equipment text, -- e.g. Barbell, Dumbbell, Cable, Bodyweight, Machine, Kettlebell
  description text,
  coaching_notes text,
  video_url text,
  contraindications text,
  fatigue_cost text check (fatigue_cost in ('Low', 'Moderate', 'High')),
  phase_relevance text[], -- e.g. ['Remediation', 'Optimisation', 'Post-Optimisation']
  is_archived boolean default false,
  created_at timestamptz default now()
);

-- Training programs (one active program per client at a time)
create table if not exists programs (
  id uuid primary key default uuid_generate_v4(),
  client_id uuid references clients(id) on delete cascade,
  name text not null default 'Training Program',
  is_active boolean default true,
  created_at timestamptz default now(),
  notes text
);

-- Sessions within a program
create table if not exists program_sessions (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references programs(id) on delete cascade,
  week_number integer not null default 1,
  day_label text not null, -- e.g. 'Monday', 'Day 1', 'Session A'
  session_name text, -- e.g. 'Lower Body', 'Full Body A'
  skeleton_type text check (skeleton_type in (
    'Open Set', 'Fixed Set', 'Hybrid', 'Distributed Practice',
    'Skill Practice', 'Repeated Exposure', 'Timed Block',
    'Sequential Time Block', 'Exposure Window'
  )),
  notes text,
  sort_order integer default 0
);

-- Exercises within a session
create table if not exists session_exercises (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid references program_sessions(id) on delete cascade,
  exercise_id uuid references exercises(id),
  block_label text, -- e.g. 'A1', 'B', 'C2'
  sets integer,
  reps text, -- text to allow ranges like '8-10' or '5'
  rpe text, -- e.g. '7', '7-8', 'RPE 8'
  tempo text, -- e.g. '3010', 'Controlled'
  rest_seconds integer,
  notes text,
  sort_order integer default 0
);

-- RLS
alter table exercises enable row level security;
alter table programs enable row level security;
alter table program_sessions enable row level security;
alter table session_exercises enable row level security;

-- Exercises: any authenticated coach can read, coaches manage
create policy "coaches read exercises" on exercises
  for select using (auth.role() = 'authenticated');

create policy "coaches manage exercises" on exercises
  for all using (auth.role() = 'authenticated');

-- Programs: coaches see own clients' programs
create policy "coaches manage programs" on programs
  for all using (
    client_id in (select id from clients where coach_id = auth.uid())
  );

create policy "coaches manage sessions" on program_sessions
  for all using (
    program_id in (
      select p.id from programs p
      join clients c on p.client_id = c.id
      where c.coach_id = auth.uid()
    )
  );

create policy "coaches manage session exercises" on session_exercises
  for all using (
    session_id in (
      select ps.id from program_sessions ps
      join programs p on ps.program_id = p.id
      join clients c on p.client_id = c.id
      where c.coach_id = auth.uid()
    )
  );
