-- The Progress Read's own home (Progress Read spec v2.4, section 5): keyed to the
-- client and the date, not a training block, so a coach who writes no blocks can
-- have one. Each generation is a new row; nothing is overwritten.

create table if not exists public.progress_reads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  progress_check_id uuid references public.progress_checks(id) on delete set null,
  previous_read_kind text not null check (previous_read_kind in ('foundational', 'progress')),
  previous_read_id uuid not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  is_archived boolean not null default false,
  generated_at timestamptz not null default now(),
  published_at timestamptz,

  -- The findings a coach scans, as columns.
  previous_body_state text,
  body_state_classification text not null check (body_state_classification in ('Remediation', 'Optimisation', 'Post-Optimisation')),
  state_direction text check (state_direction in ('improved', 'held', 'declined')),
  state_clamped boolean not null default false,
  pattern_classification text check (pattern_classification is null or pattern_classification in ('Stress-Stored', 'Insulin-Drift', 'Estrogen-Shift', 'Androgen-Decline', 'Indeterminate')),
  pattern_confidence text,
  pattern_changed boolean not null default false,
  exposure_readiness_capacity text,
  exposure_readiness_schedule text,
  exposure_readiness_regulation text,
  exposure_readiness_behaviour text,

  -- The whole read: every read field for the coach, plus for_her.
  content jsonb not null,
  comparison_text text,
  photos_used integer,
  lint_findings jsonb,
  model text
);

create index if not exists progress_reads_client_idx on public.progress_reads (client_id, generated_at desc);

alter table public.progress_reads enable row level security;
drop policy if exists "service role full access" on public.progress_reads;
create policy "service role full access" on public.progress_reads
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
grant select, insert, update, delete on public.progress_reads to service_role;
