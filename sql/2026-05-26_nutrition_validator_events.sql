-- Per-attempt validator telemetry. One row per call to validateNutritionPlan
-- inside the generate route — typically 3-4 rows per request (parallel
-- Haiku attempts plus an optional Sonnet escalation). Used to monitor rule
-- fire rates over time and detect doctrine regressions ("rule X started
-- firing 60% the day after we shipped v2026-05-25").
--
-- Write-only from src/lib/nutrition-telemetry.ts (fire-and-forget; failures
-- never block plan generation). Read by the dashboard panel under
-- /dashboard/system-health/nutrition-engine.
--
-- Run in Supabase SQL editor.

create table if not exists nutrition_validator_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),
  client_id uuid references clients(id) on delete cascade,
  doctrine_version text,

  -- One row per attempt; ok=true means issues is empty.
  attempt_tier text not null check (attempt_tier in ('haiku', 'sonnet')),
  attempt_index integer,                                  -- 0..2 for parallel haiku, null for sonnet
  ok boolean not null,
  issue_codes text[] not null default '{}',               -- e.g. ['PROTEIN_ANCHOR_MISMATCH']

  -- Prescription inputs captured at validation time. Denormalised so the
  -- dashboard doesn't need to join — telemetry table is write-heavy and
  -- read-cold, the duplication is cheap.
  entry_state text,
  protein_anchor_g integer,
  meal_frequency integer,
  carb_demand_level text,
  has_stimulant boolean,
  has_glp1 boolean,
  has_serotonergic boolean,
  transitional_override_active boolean,

  -- Final outcome of the whole request (set only on the last event of
  -- a given request_id).
  final_outcome text check (final_outcome in (
    'passed_first_haiku',
    'passed_haiku_retry',
    'sonnet_escalation_succeeded',
    'sonnet_escalation_failed',
    'returned_422_to_coach'
  )),
  request_id uuid                                         -- shared across events in one request
);

create index if not exists nutrition_validator_events_occurred_idx
  on nutrition_validator_events (occurred_at desc);
create index if not exists nutrition_validator_events_doctrine_idx
  on nutrition_validator_events (doctrine_version, occurred_at desc);
create index if not exists nutrition_validator_events_client_idx
  on nutrition_validator_events (client_id, occurred_at desc);

comment on table nutrition_validator_events is
  'Per-attempt validator outcomes. Write-only from generate-nutrition route. Read by /dashboard/system-health/nutrition-engine for rule fire-rate analysis.';
