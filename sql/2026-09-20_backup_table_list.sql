-- The list of tables a backup must cover, answered by the database itself.
--
-- 20 September 2026. The alternative was a hand-maintained list in the backup
-- script, which fails the first time someone adds a table and forgets: the
-- backup keeps reporting success while quietly missing data. Asking the
-- database removes that failure mode entirely.
--
-- SECURITY DEFINER because information_schema is filtered by the caller's
-- rights, and the service role must see every table. It returns names only,
-- never data.

create or replace function public.backup_table_list()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(c.relname order by c.relname), '{}')
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
    and c.relkind = 'r'
$$;

revoke all on function public.backup_table_list() from public, anon, authenticated;
grant execute on function public.backup_table_list() to service_role;

comment on function public.backup_table_list() is
  'Every base table in public, for scripts/backup-database.ts. Names only. 20 Sep 2026.';

-- Found by the first backup run: _coach_migration_log had no service_role
-- grant, so the backup reported one failed table. Third table today with the
-- same fault (coach_preferences and coach_invitations were the others). The
-- backup is only worth having if it covers everything, so the grant is here
-- rather than the table being quietly skipped.
grant select on public._coach_migration_log to service_role;
