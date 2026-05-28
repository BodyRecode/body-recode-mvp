-- Canonical new-table template for Body Recode.
-- Copy this file and fill in the table specifics. Do NOT skip the GRANT block.
--
-- Why GRANTs are now required:
--   On 2026-05-28 we opted in to Supabase's new "explicit grants" default
--   (see 2026-05-28_opt_in_explicit_grants.sql). Without explicit grants,
--   PostgREST / the admin client will return:
--     {"code":"42501","message":"permission denied for table your_table"}
--
-- Access pattern in this codebase (so you know which roles to grant):
--   service_role   — REQUIRED on every table. The admin client (server routes,
--                    cron jobs, webhooks) reads/writes everything via this role.
--   authenticated  — only if the table is queried via the SSR server client
--                    (`lib/supabase/server.ts`) when a coach or client is
--                    logged in. Example: `leads` is read this way in
--                    src/app/dashboard/page.tsx.
--   anon           — only if unauthenticated users insert/select the table
--                    directly from the browser. Example: scorecard lead capture.
--
-- Default: service_role only. Add the other two roles only when the access
-- pattern needs them. If unsure, leave them out — failing loudly with 42501
-- is better than silently exposing the table.

-- ============================================================================
-- 1. TABLE
-- ============================================================================

create table if not exists your_table (
  id uuid primary key default uuid_generate_v4(),
  -- ... your columns ...
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. GRANTS  (REQUIRED — without these the admin client returns 42501)
-- ============================================================================

grant select, insert, update, delete on public.your_table to service_role;

-- Only uncomment the following if this table is queried via the SSR server
-- client when a coach/client is logged in:
-- grant select on public.your_table to authenticated;

-- Only uncomment the following if anonymous browser visitors insert/select
-- this table directly (e.g. public scorecard submissions):
-- grant insert on public.your_table to anon;

-- ============================================================================
-- 3. RLS + POLICIES
-- ============================================================================

alter table your_table enable row level security;

drop policy if exists "service role manages your_table" on your_table;
create policy "service role manages your_table"
  on your_table
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- 4. INDEXES + TRIGGERS  (optional)
-- ============================================================================

-- create index if not exists your_table_some_lookup_idx
--   on your_table (some_column, created_at desc);

-- create or replace function bump_your_table_updated_at()
-- returns trigger as $$
-- begin
--   new.updated_at := now();
--   return new;
-- end;
-- $$ language plpgsql;
--
-- drop trigger if exists trg_your_table_updated_at on your_table;
-- create trigger trg_your_table_updated_at
--   before update on your_table
--   for each row
--   execute function bump_your_table_updated_at();
