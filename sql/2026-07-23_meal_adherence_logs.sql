-- Daily meal-adherence logging (2026-07-23)
-- ---------------------------------------------------------------------
-- Clients (and the coach on their behalf) log each prescribed meal per day
-- as ate / swapped / skipped, plus an optional daily hunger + satisfaction
-- signal and note. Mirrors the workout-logging model: a per-day row snapshots
-- the plan's `meals` at log time (the meals array has no stable uuid, so the
-- snapshot preserves history if the plan is later re-edited), and one entry
-- row per meal keyed on meal_number.
--
-- On-brand: adherence + appetite signals, NOT calorie counting. Complements
-- the WEEKLY nutrition_reviews (which owns current_direction / last_review_at);
-- this is the DAILY granularity the weekly review can aggregate over.
--
-- Written via the admin client from token-gated portal routes + cookie-gated
-- coach routes (like workout logging), so RLS is admin-only and grants go to
-- service_role only.
--
-- Idempotent — safe to re-run. Apply in the Supabase SQL editor (or via
-- `supabase db query --linked`).
-- ---------------------------------------------------------------------

-- ---------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------

create table if not exists public.meal_adherence_days (
  id                    uuid primary key default gen_random_uuid(),
  client_id             uuid not null references public.clients(id) on delete cascade,
  nutrition_plan_id     uuid not null references public.nutrition_plans(id) on delete cascade,
  log_date              date not null,
  -- Snapshot of nutrition_plans.meals at the moment the day was first opened,
  -- so re-editing the plan later never rewrites what was logged.
  prescription_snapshot jsonb not null default '[]'::jsonb,
  hunger_signal         text,          -- optional daily read: 'low' | 'steady' | 'high'
  satisfaction_signal   text,          -- optional daily read: 'unsatisfied' | 'ok' | 'satisfied'
  overall_note          text,
  status                text not null default 'in_progress'
                        check (status in ('in_progress', 'logged')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (client_id, nutrition_plan_id, log_date)
);

create table if not exists public.meal_adherence_entries (
  id                    uuid primary key default gen_random_uuid(),
  meal_adherence_day_id uuid not null references public.meal_adherence_days(id) on delete cascade,
  meal_number           integer not null,   -- the plan meal's stable logical id
  meal_name             text,               -- denormalised snapshot of the meal name
  sort_order            integer not null default 0,
  outcome               text check (outcome in ('ate', 'swapped', 'skipped')),
  note                  text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (meal_adherence_day_id, meal_number)
);

-- ---------------------------------------------------------------------
-- 2. Grants (explicit-grants model — service_role only; admin-client writes)
-- ---------------------------------------------------------------------

grant select, insert, update, delete on public.meal_adherence_days to service_role;
grant select, insert, update, delete on public.meal_adherence_entries to service_role;

-- ---------------------------------------------------------------------
-- 3. RLS — admin-only (no direct portal/browser writes)
-- ---------------------------------------------------------------------

alter table public.meal_adherence_days enable row level security;
alter table public.meal_adherence_entries enable row level security;

drop policy if exists "service role manages meal_adherence_days" on public.meal_adherence_days;
create policy "service role manages meal_adherence_days" on public.meal_adherence_days
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

drop policy if exists "service role manages meal_adherence_entries" on public.meal_adherence_entries;
create policy "service role manages meal_adherence_entries" on public.meal_adherence_entries
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');

-- ---------------------------------------------------------------------
-- 4. Indexes
-- ---------------------------------------------------------------------

create index if not exists meal_adherence_days_client_id_idx on public.meal_adherence_days (client_id);
create index if not exists meal_adherence_days_plan_id_idx on public.meal_adherence_days (nutrition_plan_id);
create index if not exists meal_adherence_days_client_date_idx on public.meal_adherence_days (client_id, log_date desc);
create index if not exists meal_adherence_entries_day_id_idx on public.meal_adherence_entries (meal_adherence_day_id);

-- ---------------------------------------------------------------------
-- 5. updated_at triggers
-- ---------------------------------------------------------------------

create or replace function public.touch_meal_adherence_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists meal_adherence_days_touch_updated_at on public.meal_adherence_days;
create trigger meal_adherence_days_touch_updated_at
  before update on public.meal_adherence_days
  for each row execute function public.touch_meal_adherence_updated_at();

drop trigger if exists meal_adherence_entries_touch_updated_at on public.meal_adherence_entries;
create trigger meal_adherence_entries_touch_updated_at
  before update on public.meal_adherence_entries
  for each row execute function public.touch_meal_adherence_updated_at();
