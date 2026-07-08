-- Collective Fit Scorecard applications.
-- Prospective coaches applying to join The Body Recode Collective. Distinct from
-- `leads` (consumer coaching prospects) — these are B2B partner applicants.

create table if not exists collective_applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  -- identity
  name text not null,
  business_name text,
  email text not null,
  phone text,
  website text,
  heard_from text,
  -- practice
  modality text,            -- strength | yoga | pilates | other
  one_liner text,
  method_clarity text,      -- documented | in_head | figuring_out
  track_record text,
  -- audience & setup
  audience text,            -- engaged | building | not_yet
  audience_size text,       -- under_500 | 500_5k | 5k_plus
  current_setup text[],
  whats_broken text,
  -- readiness
  timeline text,            -- now | few_months | exploring
  mindset text,             -- ownership | cheap_tool
  -- scoring + pipeline
  answers jsonb not null default '{}'::jsonb,
  tier text,                -- ready | building | not_yet
  dimension_scores jsonb,   -- { method, audience, modality, readiness }
  status text not null default 'new',  -- new | contacted | booked | admitted | declined
  notes text
);

create index if not exists collective_applications_created_idx on collective_applications (created_at desc);
create index if not exists collective_applications_tier_idx on collective_applications (tier);

-- Explicit grants (every new table needs them).
grant select, insert, update, delete on collective_applications to service_role;
grant select, update on collective_applications to authenticated;

alter table collective_applications enable row level security;

-- Writes happen via the service-role admin client (public /collective submit).
-- Dashboard reads/updates happen as the authenticated coach.
drop policy if exists "authenticated read collective_applications" on collective_applications;
create policy "authenticated read collective_applications"
  on collective_applications for select to authenticated using (true);

drop policy if exists "authenticated update collective_applications" on collective_applications;
create policy "authenticated update collective_applications"
  on collective_applications for update to authenticated using (true) with check (true);
