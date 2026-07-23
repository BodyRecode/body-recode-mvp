-- Support tickets — coach-facing "Report an Issue" surface.
-- Coach files a ticket from the Support launcher; Kade works them in
-- /dashboard/support. Ticket first, assistant second (see project_support_hub
-- in auto-memory). Screenshots deferred to v2 — text-only for now.

-- ============================================================================
-- 1. TABLE
-- ============================================================================

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references auth.users(id) on delete cascade,
  category text not null check (category in ('bug', 'question', 'feature-request', 'urgent')),
  subject text not null,
  body text not null,
  page_url text,
  status text not null default 'new' check (status in ('new', 'looking', 'fixed', 'wont-fix')),
  status_note text,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. GRANTS  (explicit — see 2026-05-28_opt_in_explicit_grants.sql)
-- ============================================================================

grant select, insert, update, delete on public.support_tickets to service_role;
-- Coach-authed SSR reads: the "My tickets" page loads with the coach's
-- Supabase session cookie, so `authenticated` needs SELECT (RLS narrows to own rows).
grant select on public.support_tickets to authenticated;

-- ============================================================================
-- 3. RLS + POLICIES
-- ============================================================================

alter table support_tickets enable row level security;

drop policy if exists "service role manages support_tickets" on support_tickets;
create policy "service role manages support_tickets"
  on support_tickets
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "coaches see own tickets" on support_tickets;
create policy "coaches see own tickets"
  on support_tickets
  for select
  using (coach_id = auth.uid());

-- ============================================================================
-- 4. INDEXES + TRIGGERS
-- ============================================================================

create index if not exists support_tickets_coach_created_idx
  on support_tickets (coach_id, created_at desc);

create index if not exists support_tickets_status_created_idx
  on support_tickets (status, created_at desc);

create or replace function bump_support_tickets_updated_at()
returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_support_tickets_updated_at on support_tickets;
create trigger trg_support_tickets_updated_at
  before update on support_tickets
  for each row
  execute function bump_support_tickets_updated_at();
