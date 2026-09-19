-- Close five tables that were open to the public key.
--
-- Found 19 September 2026 while auditing access rules before adding coach
-- separation. Each of these tables carried a policy NAMED "Service role full
-- access" that was in fact granted TO public USING (true), for ALL commands.
-- The name said one thing and the rule said another, which is why it survived
-- the July audit.
--
-- Verified with the public (anon) key over the REST interface before writing
-- this: calendar_posts, membership_checkins, membership_enrollments and
-- settings all returned rows, and an UPDATE was accepted (204). The two
-- extension tables were saved only by a missing table grant, which is luck
-- rather than a policy.
--
-- membership_enrollments is the serious one: it holds email, first name,
-- pattern, Stripe subscription id, and BOTH portal access tokens.
--
-- Readers were listed before changing anything (the rule from the July audit):
--   membership_enrollments, membership_checkins, extension_*  -> server only
--   calendar_posts                                            -> two coach
--     dashboard pages read it in the browser with the coach's own session,
--     and one of them writes, so it keeps an authenticated policy
--   settings                                                  -> public read
--     is intended (marketing counters); the write side was open to any
--     signed-in user, including a client in their portal

begin;

-- 1. Server-only tables. No policy for anon or authenticated, and the table
--    grants go with them, so a mistake in a future policy cannot re-open them.

drop policy if exists "Service role full access" on membership_enrollments;
drop policy if exists "Service role full access" on membership_checkins;
drop policy if exists "Service role full access" on extension_enrollments;
drop policy if exists "Service role full access" on extension_checkins;

create policy "service role only" on membership_enrollments for all to service_role using (true) with check (true);
create policy "service role only" on membership_checkins    for all to service_role using (true) with check (true);
create policy "service role only" on extension_enrollments  for all to service_role using (true) with check (true);
create policy "service role only" on extension_checkins     for all to service_role using (true) with check (true);

revoke all on membership_enrollments from anon, authenticated;
revoke all on membership_checkins    from anon, authenticated;
revoke all on extension_enrollments  from anon, authenticated;
revoke all on extension_checkins     from anon, authenticated;

alter table membership_enrollments enable row level security;
alter table membership_checkins    enable row level security;
alter table extension_enrollments  enable row level security;
alter table extension_checkins     enable row level security;

-- 2. The content calendar. Two coach dashboard pages read it in the browser
--    and one writes to it, so it needs a policy for signed-in coaches, scoped
--    to their own rows. All 451 existing rows carry Kade's coach id, so
--    nothing disappears from his calendar. A row with no owner is treated as
--    unowned and is readable by any coach, which is what the seeding scripts
--    produce; they run as the server anyway.

drop policy if exists "Service role full access" on calendar_posts;

create policy "service role manages calendar posts"
  on calendar_posts for all to service_role using (true) with check (true);

create policy "coaches manage their own calendar posts"
  on calendar_posts for all to authenticated
  using (public.is_coach() and (coach_id = auth.uid() or coach_id is null))
  with check (public.is_coach() and (coach_id = auth.uid() or coach_id is null));

revoke all on calendar_posts from anon;

alter table calendar_posts enable row level security;

-- 3. Settings. Public read stays (a marketing counter is read before sign-in).
--    Writing was open to anyone signed in, which includes a client inside her
--    own portal, so it is now coaches only.

drop policy if exists "Authenticated write" on settings;

create policy "coaches write settings"
  on settings for all to authenticated
  using (public.is_coach())
  with check (public.is_coach());

create policy "service role manages settings"
  on settings for all to service_role using (true) with check (true);

revoke insert, update, delete, truncate on settings from anon, authenticated;
grant select on settings to anon, authenticated;

alter table settings enable row level security;

commit;
