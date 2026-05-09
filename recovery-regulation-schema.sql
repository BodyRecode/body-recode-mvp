-- =====================================================================
-- Recovery and Regulation System — Phase 1 Schema
-- =====================================================================
-- Implements:
--   * RSIB (Recovery Signal Input Block) — 13D_13
--   * Recovery State Machine — 13D_15 hierarchy + 13D_14 routing
--   * Adjustment Audit Log — 12E_04 documentation and auditability
--
-- Doctrine sources:
--   ~/Dropbox/01_BODY_RECODE/.../12_Recovery_and_Regulation_System/
--   ~/Dropbox/01_BODY_RECODE/.../13_Applied_Execution_Playbooks/13D_*
--   ~/Dropbox/01_BODY_RECODE/.../Recovery_and_Regulation_Build_Reference_v1.0.md
--
-- All tables are additive. No existing schema is modified.
-- Run this in Supabase SQL editor.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. recovery_signal_block (RSIB) — 13D_13
-- ---------------------------------------------------------------------
-- Three-question weekly capture, submitted alongside the existing
-- weekly check-in. Feeds the recovery router.
-- ---------------------------------------------------------------------

create table if not exists public.recovery_signal_block (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  week_number integer not null,
  -- Q1 — "Overall recovery this week?" 1=Not recovering ... 5=Fully recovered
  recovery_status smallint not null check (recovery_status between 1 and 5),
  -- Q2 — "Compared to last week, how did your main sessions feel?"
  session_repeatability text not null check (session_repeatability in ('easier', 'same', 'harder')),
  -- Q3 — "How consistent was your sleep schedule this week?"
  sleep_consistency text not null check (sleep_consistency in ('consistent', 'inconsistent', 'severely_inconsistent')),
  submitted_at timestamptz not null default now(),
  -- Optional link to the weekly_checkin row that captured these answers
  weekly_checkin_id uuid references public.weekly_checkins(id) on delete set null,
  unique (client_id, week_number)
);

create index if not exists recovery_signal_block_client_week_idx
  on public.recovery_signal_block (client_id, week_number desc);

create index if not exists recovery_signal_block_submitted_idx
  on public.recovery_signal_block (submitted_at desc);


-- ---------------------------------------------------------------------
-- 2. recovery_states — Recovery State Machine (13D_15 hierarchy)
-- ---------------------------------------------------------------------
-- One ACTIVE state per client at any time (enforced by partial unique
-- index). Single dominant playbook per 13D_15 non-stacking rule.
-- ---------------------------------------------------------------------

create table if not exists public.recovery_states (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  -- Which 13D playbook governs this state. Must match recovery-doctrine.ts keys.
  playbook_id text not null check (playbook_id in (
    'acute_fatigue',                -- 13D_02
    'chronic_recovery_debt',        -- 13D_03
    'ns_overload',                  -- 13D_04
    'sleep_disruption',             -- 13D_05
    'lifestyle_stress_dominant',    -- 13D_06
    'overreaching_vs_under_recovery', -- 13D_07
    'post_diet',                    -- 13D_08
    'post_competition',             -- 13D_09
    'burnout_return',               -- 13D_10
    'supportive_only'               -- 13D_12 baseline
  )),
  -- 13D_15 tier: 1=NS Overload, 2=Burnout/Chronic, 3=Sleep/Lifestyle, 4=Overreaching, 5=Post-Diet/Comp, 6=Supportive
  tier smallint not null check (tier between 1 and 6),
  status text not null default 'active' check (status in ('active', 'exited', 'escalated', 'observe_only')),
  entered_at timestamptz not null default now(),
  -- Per playbook minimum duration before any switch (13D_14 lock-in)
  min_duration_days smallint not null,
  -- Per playbook maximum duration before mandatory escalation review
  max_duration_days smallint not null,
  -- Snapshot of signals at entry (RSIB, CFWS readiness, drift conditions)
  entry_signals jsonb not null default '{}'::jsonb,
  -- Which trigger fired (e.g. "rsib_recovery_score_le_2_two_weeks", "cfws_regulation_red")
  entry_trigger text not null,
  -- Free-text routing rationale from the router
  entry_rationale text,
  -- 12E_04: what was uncertain at decision time
  uncertainties_held text,
  -- 12E_04: relief_only | validation_inferred | undetermined
  relief_vs_validation_check text check (relief_vs_validation_check in ('relief_only', 'validation_inferred', 'undetermined')),
  -- Exit criteria checks (per playbook)
  exit_criteria jsonb not null default '{}'::jsonb,
  exit_criteria_met_at timestamptz,
  exited_at timestamptz,
  exit_outcome text check (exit_outcome in ('resolved', 'escalated', 'system_review_required', 'cancelled')),
  exit_rationale text,
  -- Phase 0 observe-only: was this state activated for real or just shadow-logged?
  observe_only boolean not null default true,
  -- Audit
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Single dominant playbook per client per 13D_15 non-stacking rule.
-- Only one row with status='active' allowed per client at any time.
create unique index if not exists recovery_states_one_active_per_client_idx
  on public.recovery_states (client_id)
  where status = 'active';

create index if not exists recovery_states_client_id_idx
  on public.recovery_states (client_id, entered_at desc);

create index if not exists recovery_states_active_idx
  on public.recovery_states (status, tier)
  where status = 'active';


-- ---------------------------------------------------------------------
-- 3. recovery_adjustments — Audit Log (12E_04)
-- ---------------------------------------------------------------------
-- Every state transition writes a row capturing the 12E_04 categories:
-- what was known, uncertain, recognised, and explicitly out of scope.
-- Doctrine: "documentation records reasoning, not action."
-- ---------------------------------------------------------------------

create table if not exists public.recovery_adjustments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  -- Optional FK to the state this adjustment relates to
  recovery_state_id uuid references public.recovery_states(id) on delete set null,
  -- What kind of adjustment / event this audit row captures
  event_type text not null check (event_type in (
    'router_evaluation',      -- Router ran (observe-only or live), wrote what it would do
    'state_entered',          -- A recovery state was activated
    'state_escalated',        -- Tier escalation per 13D_15
    'state_exited',           -- State exited (resolved/escalated/etc.)
    'constraint_applied',     -- Program/nutrition gen ran constrained by active state
    'constraint_overridden',  -- Soft-gate: coach overrode a constraint with reason
    'manual_review'           -- Coach-initiated review entry
  )),
  -- The trigger or signal pattern that prompted this event
  trigger_type text,
  -- 12E_04 documentation categories
  signals_acknowledged jsonb not null default '{}'::jsonb,
  constraints_recognised jsonb not null default '{}'::jsonb,
  uncertainties_held text,
  -- 12E_03 minimum exposure window check
  exposure_window_met boolean,
  exposure_window_rationale text,
  -- 12D_03 relief vs validation discipline
  relief_vs_validation_check text check (relief_vs_validation_check in ('relief_only', 'validation_inferred', 'undetermined')),
  -- 12E_01 permissible adjustment category (only valid for constraint_applied / state_entered)
  permissible_category text check (permissible_category in ('exposure', 'timing_sequencing', 'context_environment', 'non_permissible_escalate')),
  -- Authorisation outcome
  authorisation_decision text check (authorisation_decision in ('authorised', 'observed_only', 'deferred', 'overridden_with_reason')),
  -- 12G short_arc / long_arc / both
  arc_lens text check (arc_lens in ('short', 'long', 'both')),
  -- Observe-only mode flag for Phase 0 shadow logs
  observe_only boolean not null default true,
  -- Free-text override reason for soft-gate overrides
  override_reason text,
  -- Who recorded this (null for system-generated rows)
  documented_by uuid references public.clients(id) on delete set null,
  documented_at timestamptz not null default now()
);

create index if not exists recovery_adjustments_client_id_idx
  on public.recovery_adjustments (client_id, documented_at desc);

create index if not exists recovery_adjustments_event_type_idx
  on public.recovery_adjustments (event_type, documented_at desc);

create index if not exists recovery_adjustments_state_id_idx
  on public.recovery_adjustments (recovery_state_id);


-- ---------------------------------------------------------------------
-- 4. updated_at trigger for recovery_states
-- ---------------------------------------------------------------------

create or replace function public.touch_recovery_states_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists recovery_states_touch_updated_at on public.recovery_states;
create trigger recovery_states_touch_updated_at
  before update on public.recovery_states
  for each row execute function public.touch_recovery_states_updated_at();


-- ---------------------------------------------------------------------
-- 5. RLS — admin-only (no portal-side write yet; RSIB submits via
--          submit-weekly-checkin route which uses admin client)
-- ---------------------------------------------------------------------

alter table public.recovery_signal_block enable row level security;
alter table public.recovery_states enable row level security;
alter table public.recovery_adjustments enable row level security;

-- Service-role bypass (admin client) is unrestricted by default.
-- No public read or write policies — these tables are coach/system-only.


-- ---------------------------------------------------------------------
-- Done.
-- =====================================================================
