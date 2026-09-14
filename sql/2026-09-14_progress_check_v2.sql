-- The near-full Progress Check (spec: 02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md).
--
-- form_version  'v1' is the 24-question form; every existing row is v1 and keeps
--               being read the old way. New rows default to 'v2'.
-- responses     (existing) now holds v2 answers keyed by INTAKE question id,
--               saved as she goes, not only on submit.
-- previous_answers  what her answers were compared against, frozen at submit,
--               so the comparison can always be reproduced exactly.
-- what_changed  her free text, asked first.
-- draft_section / last_saved_at  where she stopped, so she can come back.

alter table public.progress_checks add column if not exists form_version text not null default 'v1';
update public.progress_checks set form_version = 'v1' where form_version is distinct from 'v1';
-- The default flips to 'v2' only AFTER the v2 page and submit route are deployed
-- (sql/2026-09-14_progress_check_v2_default.sql). Flipping it first would let an
-- automatic invitation create a v2 row that the live v1 page then fills with v1 answers.
alter table public.progress_checks drop constraint if exists progress_checks_form_version_check;
alter table public.progress_checks add constraint progress_checks_form_version_check check (form_version in ('v1', 'v2'));

alter table public.progress_checks add column if not exists previous_answers jsonb;
alter table public.progress_checks add column if not exists previous_source jsonb;
alter table public.progress_checks add column if not exists what_changed text;
alter table public.progress_checks add column if not exists draft_section integer;
alter table public.progress_checks add column if not exists last_saved_at timestamptz;

-- A dispute is its own record. It NEVER changes the answer it disputes
-- (spec 3.2): the original stays on the intake exactly as given.
create table if not exists public.progress_check_disputes (
  id uuid primary key default gen_random_uuid(),
  progress_check_id uuid not null references public.progress_checks(id) on delete cascade,
  client_id uuid not null references public.clients(id) on delete cascade,
  question_id text not null,
  original_value jsonb,
  should_have_been jsonb not null,
  note text,
  created_at timestamptz not null default now(),
  unique (progress_check_id, question_id)
);

alter table public.progress_check_disputes enable row level security;
drop policy if exists "service role full access" on public.progress_check_disputes;
create policy "service role full access" on public.progress_check_disputes
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
grant select, insert, update, delete on public.progress_check_disputes to service_role;

create index if not exists progress_check_disputes_check_idx on public.progress_check_disputes (progress_check_id);
