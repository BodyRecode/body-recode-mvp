-- =====================================================================
-- Workout Logging — Phase A schema
-- =====================================================================
-- Implements:
--   * session_completions          — one row per (client, prescribed session, week)
--   * session_exercise_completions — one row per exercise performed (incl. substitutions)
--   * exercise_set_logs            — one row per actually-completed set
--
-- Design notes:
--   * Production stores program prescriptions inside programs.sessions JSONB
--     (not the program_sessions/session_exercises tables, which exist but are
--     empty). To stay independent of future program regenerations mid-block,
--     each session_completion captures a snapshot of the prescription at
--     logging time.
--   * Substitutions are first-class: a client can swap an exercise and the log
--     captures both what was prescribed and what was actually performed.
--   * RPE, weight, reps are numeric where possible. RPE nullable since it's
--     the only optional field per set.
--
-- Additive only. Zero changes to existing schema. Run in Supabase SQL editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. session_completions
-- ---------------------------------------------------------------------
-- One row per (client × prescribed session × calendar instance).
-- Created when the client opens the logging page; updated to status='completed'
-- when they finish. Status='abandoned' is reserved for future cleanup.
-- ---------------------------------------------------------------------

create table if not exists public.session_completions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  program_id uuid not null references public.programs(id) on delete cascade,
  -- Which session within program.sessions[] was logged. session_index is the
  -- zero-based array index; day_label and session_name are denormalised for
  -- display and to survive program regeneration.
  session_index integer not null,
  day_label text not null,
  session_name text,
  -- Which week of the block this completion represents (1, 2, 3, ...).
  week_number_in_block integer not null,
  -- Snapshot of the full session JSON at logging time. Lets us render the
  -- session as it was prescribed even if the program is later regenerated.
  prescription_snapshot jsonb not null default '{}'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'abandoned')),
  session_notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_completions_client_id_idx
  on public.session_completions (client_id, started_at desc);

create index if not exists session_completions_program_id_idx
  on public.session_completions (program_id, week_number_in_block, session_index);

create index if not exists session_completions_in_progress_idx
  on public.session_completions (client_id, started_at desc)
  where status = 'in_progress';


-- ---------------------------------------------------------------------
-- 2. session_exercise_completions
-- ---------------------------------------------------------------------
-- One row per exercise performed in a session. Captures both the prescription
-- (denormalised for historical accuracy) and any substitution made.
-- ---------------------------------------------------------------------

create table if not exists public.session_exercise_completions (
  id uuid primary key default gen_random_uuid(),
  session_completion_id uuid not null references public.session_completions(id) on delete cascade,
  -- Position within the session (preserves block ordering)
  block_label text,
  sort_order integer not null default 0,
  -- The PRESCRIBED exercise (snapshotted from programs.sessions JSON)
  prescribed_exercise_name text not null,
  prescribed_sets integer,
  prescribed_reps text,
  prescribed_rpe numeric(3,1),
  prescribed_rest text,
  prescribed_notes text,
  -- Substitution: true when client did a different exercise
  substituted boolean not null default false,
  substituted_exercise_name text,
  substitution_reason text,
  -- Client's own notes on the exercise (left/right asymmetry, soreness etc.)
  exercise_notes text,
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists session_exercise_completions_session_id_idx
  on public.session_exercise_completions (session_completion_id, sort_order);


-- ---------------------------------------------------------------------
-- 3. exercise_set_logs
-- ---------------------------------------------------------------------
-- One row per actually-performed set. logged_at gives us the live timeline
-- (gap between sets = rest taken; can be useful for adherence interpretation).
-- ---------------------------------------------------------------------

create table if not exists public.exercise_set_logs (
  id uuid primary key default gen_random_uuid(),
  session_exercise_completion_id uuid not null references public.session_exercise_completions(id) on delete cascade,
  set_number integer not null,
  -- Use kg as the system unit. UI can display lb if/when we add a per-client
  -- preference, but storage stays metric.
  weight_kg numeric(7,2),
  reps_completed integer,
  rpe numeric(3,1),
  logged_at timestamptz not null default now(),
  unique (session_exercise_completion_id, set_number)
);

create index if not exists exercise_set_logs_completion_id_idx
  on public.exercise_set_logs (session_exercise_completion_id, set_number);


-- ---------------------------------------------------------------------
-- 4. updated_at triggers
-- ---------------------------------------------------------------------

create or replace function public.touch_workout_logging_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists session_completions_touch_updated_at on public.session_completions;
create trigger session_completions_touch_updated_at
  before update on public.session_completions
  for each row execute function public.touch_workout_logging_updated_at();

drop trigger if exists session_exercise_completions_touch_updated_at on public.session_exercise_completions;
create trigger session_exercise_completions_touch_updated_at
  before update on public.session_exercise_completions
  for each row execute function public.touch_workout_logging_updated_at();


-- ---------------------------------------------------------------------
-- 5. RLS — admin-only
-- ---------------------------------------------------------------------
-- The portal logging UI submits via /api/portal/log-* routes that use the
-- admin client (token-gated, not Supabase auth). No direct portal-side
-- writes; no public read or write policies needed.
-- ---------------------------------------------------------------------

alter table public.session_completions enable row level security;
alter table public.session_exercise_completions enable row level security;
alter table public.exercise_set_logs enable row level security;


-- ---------------------------------------------------------------------
-- Done.
-- =====================================================================
