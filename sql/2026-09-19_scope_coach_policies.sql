-- Scope the last seven policies that let ANY coach see ANY row.
--
-- 19 September 2026, finishing the coach separation work. The application
-- layer was fixed on 17 September (every dashboard page, client page and API
-- route now filters by the owning coach). These are the database rules
-- underneath, which still said "is this person a coach?" and never "is this
-- their client?".
--
-- WHY IT MATTERS: public.is_coach() is `exists (select 1 from clients where
-- coach_id = auth.uid())`, which means "do you have at least one client". The
-- moment a second coach signs in with one client of their own, they satisfy it
-- and can read every row in these tables with their own browser session.
--
-- The worst of the seven is intake_invitations, which holds the invitation
-- TOKEN. That table was closed to the public in the July audit; it stayed open
-- to any coach. Same data, same risk, one role along.
--
-- Four of these tables are read in the browser with the coach's session, so
-- they keep a policy, scoped to ownership. Three are only ever read by the
-- server, so their coach policy is dropped rather than rewritten.

begin;

-- 1. Intake invitations. Scoped through the client to the owning coach.
--    The existing "coaches manage own invitations" ALL policy is kept: it
--    already checks ownership.
drop policy if exists "coaches read intake invitations" on intake_invitations;

create policy "coaches read their own clients' invitations"
  on intake_invitations for select to authenticated
  using (client_id in (select id from public.clients where coach_id = auth.uid()));

-- 2. Coach preferences. Keyed by email, so scope on the signed-in email.
--    Was ALL to any coach, meaning one coach could read AND overwrite
--    another's co-pilot settings.
drop policy if exists "coach_preferences_coach_all" on coach_preferences;

create policy "a coach manages only their own preferences"
  on coach_preferences for all to authenticated
  using (coach_email = auth.jwt() ->> 'email')
  with check (coach_email = auth.jwt() ->> 'email');

-- 3. Feedback responses. Reached either through a client or through a lead;
--    both carry the owning coach.
drop policy if exists "coaches read feedback" on feedback_responses;

create policy "coaches read feedback for their own people"
  on feedback_responses for select to authenticated
  using (
    client_id in (select id from public.clients where coach_id = auth.uid())
    or lead_id in (select id from public.leads where coach_id = auth.uid())
  );

-- 4. Scorecard reports. No owner column of its own; the link is the email
--    address on the lead that generated it.
drop policy if exists "coaches read scorecard reports" on scorecard_reports;

create policy "coaches read scorecard reports for their own leads"
  on scorecard_reports for select to authenticated
  using (lower(email) in (select lower(email) from public.leads where coach_id = auth.uid()));

-- 5, 6, 7. Server-only tables. Every reader in the codebase uses the service
--    role, so the browser policy is removed rather than scoped. The public
--    INSERT on blueprint_checkins stays: that is the client submitting their
--    own check-in.
drop policy if exists "coaches read blueprint checkins" on blueprint_checkins;
drop policy if exists "coaches read collective applications" on collective_applications;
drop policy if exists "email_delivery_events_coach_read" on email_delivery_events;

commit;

-- Found while testing the above: the server has no grant on coach_preferences,
-- so the co-pilot "how I want you to work" preferences have never saved. The
-- route reads and writes with the service role, which held only REFERENCES,
-- TRIGGER and TRUNCATE. Reading returned nothing and saving returned a 500,
-- which is why the table is empty. Pre-existing, unrelated to the scoping.
grant select, insert, update, delete on coach_preferences to service_role;
