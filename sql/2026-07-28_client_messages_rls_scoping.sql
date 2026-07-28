-- SECURITY FIX: client_messages was readable by every authenticated user.
--
-- The original policy was:
--   for select to authenticated using (true)
--
-- Portal clients authenticate through Supabase auth, so they hold the
-- `authenticated` role. That policy therefore let any signed-in client read
-- EVERY coach<->client message in the system by querying the public REST
-- endpoint with their own session token. The app never does this, but RLS is
-- what stops someone who bypasses the app.
--
-- This was survivable while the table was effectively write-only (it held zero
-- rows and no screen read it). It stopped being survivable the moment the table
-- started carrying the whole coaching conversation.
--
-- Every other client-scoped table already had the correct pattern, e.g. cffs:
--   client_id in (select id from clients where coach_id = auth.uid())
-- client_messages was the outlier. This brings it in line and adds the
-- client-side half, since unlike cffs the client also reads this table.
--
-- Server-side reads all use the service role, which bypasses RLS, so the portal
-- and the coach inbox are unaffected. The one browser-side reader is the
-- "Awaiting reply" metric on /dashboard/today, which is a coach and is covered.

drop policy if exists "Authenticated read client_messages" on public.client_messages;

create policy "coaches read own clients messages"
  on public.client_messages
  for select
  to authenticated
  using (
    client_id in (select id from public.clients where coach_id = auth.uid())
  );

create policy "clients read own messages"
  on public.client_messages
  for select
  to authenticated
  using (
    client_id in (
      select id from public.clients
      where lower(email) = lower(auth.jwt() ->> 'email')
    )
  );

-- Writes stay service-role only: every insert/update goes through an API route
-- that does its own ownership check. No insert/update/delete policy is granted
-- to `authenticated` deliberately.
