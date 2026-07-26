-- extension_enrollments table
-- 90-Day Body Rewire Extension ($197 one-time)
-- Run in Supabase SQL Editor (applied to live DB 2026-07-26)

create table if not exists extension_enrollments (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default encode(gen_random_bytes(32), 'hex'),
  email text not null,
  first_name text not null,
  phone text,
  pattern text not null default 'pending',
  pattern_source text not null default 'assessment',
  blueprint_token text references blueprint_enrollments(token) on delete set null,
  stripe_payment_intent_id text,
  current_week int not null default 1,
  purchase_date timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table extension_enrollments enable row level security;

create policy "Service role full access"
  on extension_enrollments for all
  using (true) with check (true);

create index if not exists extension_enrollments_token_idx on extension_enrollments(token);
create index if not exists extension_enrollments_email_idx on extension_enrollments(email);
create index if not exists extension_enrollments_phone_idx on extension_enrollments(phone);

-- Explicit grant required for new public tables (default grants revoked 2026-05-28).
grant select, insert, update, delete on extension_enrollments to service_role;
