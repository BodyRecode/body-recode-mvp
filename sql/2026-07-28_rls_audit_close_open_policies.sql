-- RLS audit: close the remaining `using (true)` SELECT policies.
--
-- Found while fixing client_messages. Seven other tables had a SELECT policy
-- with qual = true, meaning every row was readable by any signed-in user (and
-- for the `public` ones, by anyone with the anon key at all).
--
-- Portal clients hold the `authenticated` role, so "authenticated using(true)"
-- means a client could read the whole table.
--
-- Verified before touching anything: every reader of these tables is either a
-- server component using the service role (which bypasses RLS entirely) or a
-- coach-only dashboard. The "public can read X by token" policies are
-- vestigial: those token pages all moved to the admin client, and the policies
-- never actually filtered by token anyway — they exposed every row.
--
-- LEFT OPEN DELIBERATELY:
--   settings          — holds founder_spots_remaining, genuinely public marketing data
--   be_availability   — public booking availability, needs anon read

-- A coach is anyone who owns at least one client row. SECURITY DEFINER so the
-- lookup is not itself filtered by the clients table's own RLS policy.
create or replace function public.is_coach()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
as $$
  select exists (select 1 from public.clients where coach_id = auth.uid());
$$;

revoke all on function public.is_coach() from public;
grant execute on function public.is_coach() to authenticated;

-- 1. client_communications — every email and SMS sent to every client, with
--    addresses and phone numbers. Scoped to the owning coach.
drop policy if exists "Authenticated read client_communications" on public.client_communications;
create policy "coaches read own clients communications"
  on public.client_communications for select to authenticated
  using (client_id in (select id from public.clients where coach_id = auth.uid()));

-- 2. feedback_responses — candid client feedback, NPS, churn risk, sentiment.
--    Read from two browser-side coach dashboards (today, feedback), so it
--    needs a policy rather than service-role-only. Rows can originate from a
--    lead or a challenge enrolment with no client_id, so this gates on "is a
--    coach at all" rather than per-client ownership.
drop policy if exists "authenticated can read all feedback" on public.feedback_responses;
create policy "coaches read feedback"
  on public.feedback_responses for select to authenticated
  using (public.is_coach());

-- 3. collective_applications — applicant names, emails, fit tiers. No reader
--    outside the service role.
drop policy if exists "authenticated read collective_applications" on public.collective_applications;
create policy "coaches read collective applications"
  on public.collective_applications for select to authenticated
  using (public.is_coach());

-- 4. intake_invitations — invitation TOKENS. Leaking these is the worst of the
--    set: a token is the only thing standing between a stranger and someone's
--    intake form. Read browser-side by /dashboard/clients/new (coach).
drop policy if exists "public can read invitation by token" on public.intake_invitations;
create policy "coaches read intake invitations"
  on public.intake_invitations for select to authenticated
  using (public.is_coach());

-- 5. scorecard_reports — lead scorecard results. All readers use the service
--    role; the /report/[token] page is server-side admin.
drop policy if exists "public can read own report by token" on public.scorecard_reports;
create policy "coaches read scorecard reports"
  on public.scorecard_reports for select to authenticated
  using (public.is_coach());

-- 6. blueprint_checkins — the policy was literally named "allow select own
--    blueprint checkins" but had qual = true, so it selected everyone's. Only
--    reader is the funnel dashboard on the service role.
drop policy if exists "allow select own blueprint checkins" on public.blueprint_checkins;
create policy "coaches read blueprint checkins"
  on public.blueprint_checkins for select to authenticated
  using (public.is_coach());
