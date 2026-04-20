-- membership_enrollments table
-- Run this in Supabase SQL Editor

create table if not exists membership_enrollments (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  email text not null,
  first_name text not null,
  pattern text not null default 'pending',
  pattern_source text not null default 'assessment',
  blueprint_token text references blueprint_enrollments(token) on delete set null,
  stripe_subscription_id text,
  current_block text not null default 'A',
  current_week int not null default 1,
  joined_at timestamptz not null default now(),
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

-- RLS
alter table membership_enrollments enable row level security;

create policy "Service role full access"
  on membership_enrollments
  for all
  using (true)
  with check (true);

-- Index for token lookups
create index if not exists membership_enrollments_token_idx on membership_enrollments(token);
create index if not exists membership_enrollments_email_idx on membership_enrollments(email);
create index if not exists membership_enrollments_blueprint_token_idx on membership_enrollments(blueprint_token);
