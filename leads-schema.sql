-- Leads table — tracks all leads through the CRM pipeline
-- Run this in your Supabase SQL Editor

create table leads (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,

  -- Contact
  name text not null,
  email text,
  phone text,

  -- Source
  source text default 'direct' check (source in (
    'quiz',
    'instagram',
    'facebook',
    'google',
    'gym_floor',
    'referral',
    'direct',
    'other'
  )),
  source_detail text, -- optional extra context e.g. "referred by John Smith"

  -- CRM Status
  status text default 'new_check_in' check (status in (
    'new_check_in',
    'report_sent',
    'cold_no_booking',
    'zoom_1_booked',
    'zoom_1_completed',
    'closed_no_show',
    'zoom_2_booked',
    'zoom_2_completed',
    'closed_declined',
    'commencement_fee_paid',
    'active_deliberate_start',
    'active_coaching'
  )),

  -- Check-in data (populated automatically for quiz leads)
  check_in_answers jsonb,

  -- Zoom scheduling
  zoom_1_date timestamptz,
  zoom_2_date timestamptz,

  -- Notes (coach notes, freeform)
  notes text,

  -- Conversion
  converted_to_client_id uuid references clients(id),
  converted_at timestamptz,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row level security
alter table leads enable row level security;

create policy "coaches manage own leads" on leads
  for all using (coach_id = auth.uid());

-- Public can insert leads (quiz submissions)
create policy "public can insert leads" on leads
  for insert with check (true);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger leads_updated_at
  before update on leads
  for each row execute function update_updated_at();
