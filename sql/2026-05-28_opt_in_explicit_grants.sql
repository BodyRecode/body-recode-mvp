-- Opt in early to Supabase's new "explicit grants" default behaviour.
-- See: https://github.com/orgs/supabase/discussions/45329
--
-- Background:
--   On Oct 30, 2026, Supabase will stop auto-granting select/insert/update/delete
--   to anon, authenticated, and service_role on new tables in the public schema.
--   Existing tables keep their grants — they're unaffected.
--   The trap is: any new table you create after Oct 30 will silently 401 on
--   *every* role (including service_role / the admin client) until you add
--   an explicit GRANT.
--
-- Running this script today flips Body Recode to the new behaviour immediately,
-- so we develop the habit now instead of getting bitten in November.
--
-- AFTER RUNNING THIS:
--   Every new schema file must include explicit GRANT statements.
--   Use schema-template.sql in this folder as the canonical pattern.
--
-- TO ROLL BACK (if something breaks):
--   See "I opted in on an existing project, created new tables, and my app is
--   broken. How do I roll back?" in the changelog post.

-- Stop Postgres from granting default privileges on future objects in public.
alter default privileges for role postgres in schema public
  revoke select, insert, update, delete on tables from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke usage, select on sequences from anon, authenticated, service_role;
