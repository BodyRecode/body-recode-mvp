-- Everything we hold about one person, found by asking the database.
--
-- 20 September 2026. The pilot agreement drafted this morning promises a coach
-- two things: an export of their clients' information in a readable format
-- within 30 days, and deletion from the live system within 30 days. Neither
-- could be honoured.
--
-- The export that exists covers SEVEN tables. Forty-nine tables hold a client
-- reference. And there is no delete at all: removing one lead earlier today
-- took an hour of hand-written queries across every table in the database,
-- which is not a process anybody can promise a coach in a contract.
--
-- The failure to avoid is a hand-maintained list of tables. That is exactly how
-- the seven-table export came to be: it was right on the day it was written and
-- has been wrong ever since. So the list is asked of the database, the same way
-- the backup does it, and a table added next year is covered without anybody
-- remembering.

-- ── Which tables hold this person's information ──────────────────────────
--
-- Two levels, which is what the data actually looks like:
--   1. Tables with a foreign key straight to clients (49 of them today).
--   2. Tables hanging off one of those and having no client link of their own,
--      such as the completions that hang off a programme, or the feedback that
--      hangs off a check-in.
--
-- SECURITY DEFINER because the catalogue is filtered by the caller's rights.
-- It returns table and column NAMES only, never a row of anybody's data.

drop function if exists public.client_data_columns();

create or replace function public.client_data_columns()
returns table (table_name text, column_name text, parent_table text, level integer)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with direct as (
    select
      c.relname::text as table_name,
      a.attname::text as column_name,
      p.relname::text as parent_table
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_class p on p.oid = con.confrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(con.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
    where con.contype = 'f'
      and n.nspname = 'public'
      and p.relname = 'clients'
  ),
  second as (
    select
      c.relname::text as table_name,
      a.attname::text as column_name,
      p.relname::text as parent_table
    from pg_constraint con
    join pg_class c on c.oid = con.conrelid
    join pg_class p on p.oid = con.confrelid
    join pg_namespace n on n.oid = c.relnamespace
    join unnest(con.conkey) with ordinality as k(attnum, ord) on true
    join pg_attribute a on a.attrelid = c.oid and a.attnum = k.attnum
    where con.contype = 'f'
      and n.nspname = 'public'
      and p.relname in (select table_name from direct)
      and c.relname not in (select table_name from direct)
      and c.relname <> 'clients'
  )
  select table_name, column_name, parent_table, 1 from direct
  union all
  select table_name, column_name, parent_table, 2 from second
$$;

revoke all on function public.client_data_columns() from public, anon, authenticated;
grant execute on function public.client_data_columns() to service_role;

comment on function public.client_data_columns() is
  'Every table and column holding a reference to a client, one and two hops out. Names only. 20 Sep 2026.';

-- ── The record of what was asked for and what was done ───────────────────
--
-- Required in practice rather than in principle: under the Privacy Act, being
-- able to SHOW that a request was honoured is most of the obligation. A
-- deletion nobody recorded is indistinguishable from a deletion that never
-- happened.

create table if not exists client_data_requests (
  id uuid primary key default gen_random_uuid(),
  -- The client is kept by id and by a copy of their name and email, because
  -- after a deletion the client row is gone and the record must still say who
  -- it was about.
  client_id uuid,
  client_name text not null,
  client_email text,
  -- Who asked: the coach, on behalf of their client.
  requested_by uuid references auth.users(id),
  -- export | delete
  kind text not null,
  requested_at timestamptz not null default now(),
  completed_at timestamptz,
  -- What was actually touched, table by table, so the record can answer
  -- "prove it" rather than "trust me".
  tables_touched jsonb,
  rows_affected integer,
  files_affected integer,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists client_data_requests_client_idx on client_data_requests (client_id, requested_at desc);
create index if not exists client_data_requests_requested_idx on client_data_requests (requested_at desc);

alter table client_data_requests enable row level security;

drop policy if exists "service role only" on client_data_requests;
create policy "service role only" on client_data_requests
  for all to service_role using (true) with check (true);

revoke all on client_data_requests from anon, authenticated;
-- The grant a new table does NOT inherit. Missing it fails silently in any
-- route that swallows errors.
grant select, insert, update, delete on client_data_requests to service_role;

comment on table client_data_requests is
  'One row per export or deletion request, with what it touched. Survives the deletion it records. 20 Sep 2026.';

-- ── Her uploaded files, found the same way ───────────────────────────────
--
-- Added an hour after the rest, because the first version carried a
-- hand-written list of bucket names and every one of them was wrong. It
-- reported zero files for a client who has photographs and blood documents in
-- storage, and it reported that as success.
--
-- The same lesson as the table list, learned twice in one file: ask, do not
-- remember. Files are stored under a path containing the client's id, so
-- matching on the id finds them in any bucket, including one created later.

create or replace function public.client_storage_objects(p_client_id uuid)
returns table (bucket_id text, object_name text)
language sql
stable
security definer
set search_path = storage, public, pg_catalog
as $$
  select o.bucket_id::text, o.name::text
  from storage.objects o
  where o.name like '%' || p_client_id::text || '%'
  order by o.bucket_id, o.name
$$;

revoke all on function public.client_storage_objects(uuid) from public, anon, authenticated;
grant execute on function public.client_storage_objects(uuid) to service_role;

comment on function public.client_storage_objects(uuid) is
  'Every stored file whose path carries this client id, in any bucket. 20 Sep 2026.';
