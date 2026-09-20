-- Capture the shape of the database, because it is not in git.
--
-- 20 September 2026. The database backup built this morning saves every row.
-- It was described, including by me, as a complete recovery story on the
-- grounds that "the schema lives in sql/". It does not. Six of the core tables
-- (clients, intakes, cffs, weekly_checkins, baselines, leads) have NO CREATE
-- TABLE anywhere in the repository: they were made through the Supabase
-- interface over eighteen months and never written down.
--
-- So until now we had the data and nowhere to put it back.
--
-- pg_dump would be more faithful and needs the database password, which we do
-- not hold. Postgres can describe itself, so this asks it to: columns with
-- their types and defaults, primary and foreign keys, unique and check
-- constraints, indexes, row level security policies, and functions. Written
-- into every backup beside the rows.
--
-- SECURITY DEFINER because the catalogue is filtered by the caller's rights.
-- It returns structure, never a single row of anybody's data.

create or replace function public.schema_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'taken_at', now(),
    'tables', (
      select coalesce(jsonb_agg(t order by t->>'table'), '[]'::jsonb) from (
        select jsonb_build_object(
          'table', c.relname,
          'columns', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'name', a.attname,
              'type', format_type(a.atttypid, a.atttypmod),
              'not_null', a.attnotnull,
              'default', pg_get_expr(d.adbin, d.adrelid)
            ) order by a.attnum), '[]'::jsonb)
            from pg_attribute a
            left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
            where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
          ),
          'constraints', (
            select coalesce(jsonb_agg(jsonb_build_object(
              'name', con.conname,
              'definition', pg_get_constraintdef(con.oid)
            ) order by con.conname), '[]'::jsonb)
            from pg_constraint con where con.conrelid = c.oid
          ),
          'indexes', (
            select coalesce(jsonb_agg(pg_get_indexdef(i.indexrelid) order by i.indexrelid), '[]'::jsonb)
            from pg_index i where i.indrelid = c.oid
          ),
          'rls_enabled', c.relrowsecurity
        ) as t
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public' and c.relkind = 'r'
      ) x
    ),
    'policies', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'table', tablename, 'name', policyname, 'command', cmd,
        'roles', roles::text, 'using', qual, 'with_check', with_check
      ) order by tablename, policyname), '[]'::jsonb)
      from pg_policies where schemaname = 'public'
    ),
    'functions', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', p.proname, 'definition', pg_get_functiondef(p.oid)
      ) order by p.proname), '[]'::jsonb)
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.prokind = 'f'
    )
  )
$$;

revoke all on function public.schema_snapshot() from public, anon, authenticated;
grant execute on function public.schema_snapshot() to service_role;

comment on function public.schema_snapshot() is
  'The shape of the database: columns, constraints, indexes, policies, functions. Structure only, never data. Written into every backup because the core tables have no CREATE TABLE in git. 20 Sep 2026.';
