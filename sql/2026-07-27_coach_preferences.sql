-- Coach Co-Pilot Phase 8 — coach-style memory.
-- A small, coach-owned free-text note the co-pilot reads as SOFT guidance
-- (never overrides readiness gates / phase order / safety). Keyed by coach
-- email (the co-pilot identifies coaches via isCoachEmail). Coach-scoped from
-- day one so it rides into white-label.
create table if not exists public.coach_preferences (
  coach_email text primary key,
  preferences text not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.coach_preferences enable row level security;

-- Co-pilot routes use the service role (bypasses RLS). This policy simply keeps
-- portal clients (also `authenticated`) from ever reading coach data.
drop policy if exists coach_preferences_coach_all on public.coach_preferences;
create policy coach_preferences_coach_all on public.coach_preferences
  for all to authenticated using (public.is_coach()) with check (public.is_coach());

grant select, insert, update on public.coach_preferences to authenticated;
