-- 2026-09-14: the Rey price test (bodyrecode.au/founding).
--
-- One row per email. A woman answers the scorecard questions plus four unscored
-- qualifying questions, sees her result, then sees the app and its price
-- ($199 a year / $29 a month). The test's pass mark is decided in advance:
--   joined / saw_price  >= 1 in 5  -> go ahead
--   joined / saw_price  <  1 in 10 -> rethink the price or the offer
-- so saw_price_at is written the moment the price is on her screen, whether or
-- not she joins. Deliberately NOT the leads table: these are not coaching leads
-- and must not enter the scorecard email sequence or the Pipeline.

create table if not exists rey_founding_interest (
  id uuid primary key default uuid_generate_v4(),
  -- Handed to the browser with her result; later responses are matched on it,
  -- so a stranger cannot mark someone else's email as joined.
  token uuid not null unique default uuid_generate_v4(),
  email text not null unique,
  first_name text,
  lead_id uuid references leads(id) on delete set null,
  source text,
  attempts integer not null default 1,

  training_status text check (training_status in ('regular', 'on_off', 'none')),
  section_scores jsonb,
  score integer,
  body_state text,
  biological_sex text check (biological_sex in ('M', 'F')),
  age_band text,
  fat_storage text,
  storage_direction text,
  cycle_status text,
  profile text,
  profile_confidence text,

  start_timing text check (start_timing in ('this_month', 'three_months', 'just_looking')),
  spent_last_year text check (spent_last_year in ('under_200', '200_1000', '1000_3000', 'over_3000')),
  train_where text check (train_where in ('gym', 'home', 'both', 'not_sure')),
  voice_coach text check (voice_coach in ('yes', 'maybe', 'no')),

  price_shown text not null default '199_year_29_month',
  saw_price_at timestamptz,
  price_reaction text check (price_reaction in ('no_brainer', 'considering', 'too_much')),
  price_reaction_at timestamptz,
  joined_at timestamptz,
  confirmation_sent_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update, delete on public.rey_founding_interest to service_role;

alter table rey_founding_interest enable row level security;

drop policy if exists "service role manages rey_founding_interest" on rey_founding_interest;
create policy "service role manages rey_founding_interest"
  on rey_founding_interest
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create index if not exists rey_founding_interest_saw_price_idx
  on rey_founding_interest (saw_price_at desc);
