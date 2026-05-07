-- Body Recode Business Engine Schema
-- Layer 3: Business Engine + Central Control Hub
-- Run this in Supabase SQL Editor AFTER supabase-schema.sql and leads-schema.sql
-- All tables prefixed be_ (business engine)

-- ============================================================
-- 1. PIPELINES
-- ============================================================

create table if not exists be_pipelines (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table if not exists be_pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid references be_pipelines(id) on delete cascade,
  name text not null,
  position integer not null,
  created_at timestamptz default now()
);

-- Opportunities: a lead or client's position in a pipeline
create table if not exists be_opportunities (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  pipeline_id uuid references be_pipelines(id) on delete cascade,
  stage_id uuid references be_pipeline_stages(id) on delete set null,
  value numeric,
  status text default 'open' check (status in ('open', 'won', 'lost')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint opportunity_has_contact check (lead_id is not null or client_id is not null)
);

-- ============================================================
-- 2. TAGS
-- ============================================================

create table if not exists be_tags (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  color text default '#6366f1',
  created_at timestamptz default now(),
  unique (coach_id, name)
);

create table if not exists be_lead_tags (
  lead_id uuid references leads(id) on delete cascade,
  tag_id uuid references be_tags(id) on delete cascade,
  tagged_at timestamptz default now(),
  primary key (lead_id, tag_id)
);

-- ============================================================
-- 3. UNIFIED INBOX — CONVERSATIONS + MESSAGES
-- ============================================================

create table if not exists be_conversations (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  last_message_at timestamptz,
  is_read boolean default true,
  created_at timestamptz default now(),
  constraint conversation_has_contact check (lead_id is not null or client_id is not null)
);

create table if not exists be_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid references be_conversations(id) on delete cascade,
  channel text not null check (channel in ('sms', 'email', 'facebook', 'instagram', 'whatsapp')),
  direction text not null check (direction in ('inbound', 'outbound')),
  content text not null,
  status text default 'sent' check (status in ('sent', 'delivered', 'read', 'failed')),
  sent_at timestamptz default now()
);

-- ============================================================
-- 4. AUTOMATION ENGINE — WORKFLOWS
-- ============================================================

create table if not exists be_workflows (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  trigger_type text not null check (trigger_type in (
    'form_submitted',
    'tag_added',
    'booking_created',
    'payment_completed',
    'pipeline_stage_changed',
    'lead_created'
  )),
  trigger_config jsonb default '{}',
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists be_workflow_steps (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references be_workflows(id) on delete cascade,
  position integer not null,
  type text not null check (type in ('action', 'wait', 'condition')),
  action_type text check (action_type in (
    'send_sms',
    'send_email',
    'add_tag',
    'remove_tag',
    'move_pipeline_stage',
    'notify_coach',
    'trigger_intake',
    'create_booking'
  )),
  config jsonb default '{}',
  created_at timestamptz default now()
);

-- Execution log: one row per workflow run per contact
create table if not exists be_workflow_executions (
  id uuid primary key default uuid_generate_v4(),
  workflow_id uuid references be_workflows(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  status text default 'running' check (status in ('running', 'completed', 'failed', 'paused', 'cancelled')),
  current_step integer default 0,
  started_at timestamptz default now(),
  completed_at timestamptz,
  error_message text
);

-- ============================================================
-- 5. FUNNELS + FORMS
-- ============================================================

create table if not exists be_funnels (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  slug text unique,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists be_funnel_pages (
  id uuid primary key default uuid_generate_v4(),
  funnel_id uuid references be_funnels(id) on delete cascade,
  position integer not null,
  type text not null check (type in ('landing', 'form', 'checkout')),
  title text,
  content jsonb default '{}',
  created_at timestamptz default now()
);

create table if not exists be_forms (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  fields jsonb default '[]',
  on_submit_actions jsonb default '[]',
  created_at timestamptz default now()
);

create table if not exists be_form_submissions (
  id uuid primary key default uuid_generate_v4(),
  form_id uuid references be_forms(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  responses jsonb not null,
  submitted_at timestamptz default now()
);

-- ============================================================
-- 6. BOOKINGS
-- ============================================================

create table if not exists be_bookings (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  type text not null check (type in ('zoom1', 'zoom2', 'other')),
  scheduled_at timestamptz not null,
  duration_minutes integer default 60,
  status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_link text,
  notes text,
  created_at timestamptz default now(),
  constraint booking_has_contact check (lead_id is not null or client_id is not null)
);

-- ============================================================
-- 7. PRODUCTS + PAYMENTS
-- ============================================================

create table if not exists be_products (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  price numeric not null,
  type text not null check (type in ('one_time', 'subscription')),
  billing_interval text check (billing_interval in ('weekly', 'fortnightly', 'monthly')),
  stripe_price_id text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists be_payments (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  product_id uuid references be_products(id) on delete set null,
  amount numeric not null,
  status text default 'pending' check (status in ('pending', 'paid', 'failed', 'refunded')),
  stripe_payment_id text,
  stripe_subscription_id text,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================================
-- 8. CAMPAIGNS
-- ============================================================

create table if not exists be_campaigns (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  type text not null check (type in ('email', 'sms', 'social')),
  subject text,
  content text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  status text default 'draft' check (status in ('draft', 'scheduled', 'active', 'completed', 'cancelled')),
  recipient_filter jsonb default '{}',
  recipient_count integer default 0,
  created_at timestamptz default now()
);

-- ============================================================
-- 9. AD CAMPAIGNS (tracking only — no ad manager)
-- ============================================================

create table if not exists be_ad_campaigns (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  platform text not null check (platform in ('meta', 'google')),
  name text not null,
  external_id text,
  spend numeric default 0,
  leads_count integer default 0,
  cost_per_lead numeric generated always as (
    case when leads_count > 0 then spend / leads_count else null end
  ) stored,
  date_from date,
  date_to date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- (update_updated_at function already exists from leads-schema.sql)
-- ============================================================

create trigger be_opportunities_updated_at
  before update on be_opportunities
  for each row execute function update_updated_at();

create trigger be_ad_campaigns_updated_at
  before update on be_ad_campaigns
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table be_pipelines enable row level security;
alter table be_pipeline_stages enable row level security;
alter table be_opportunities enable row level security;
alter table be_tags enable row level security;
alter table be_lead_tags enable row level security;
alter table be_conversations enable row level security;
alter table be_messages enable row level security;
alter table be_workflows enable row level security;
alter table be_workflow_steps enable row level security;
alter table be_workflow_executions enable row level security;
alter table be_funnels enable row level security;
alter table be_funnel_pages enable row level security;
alter table be_forms enable row level security;
alter table be_form_submissions enable row level security;
alter table be_bookings enable row level security;
alter table be_products enable row level security;
alter table be_payments enable row level security;
alter table be_campaigns enable row level security;
alter table be_ad_campaigns enable row level security;

-- Policies: coaches manage their own data
create policy "coaches manage pipelines" on be_pipelines
  for all using (coach_id = auth.uid());

create policy "coaches manage pipeline stages" on be_pipeline_stages
  for all using (
    pipeline_id in (select id from be_pipelines where coach_id = auth.uid())
  );

create policy "coaches manage opportunities" on be_opportunities
  for all using (coach_id = auth.uid());

create policy "coaches manage tags" on be_tags
  for all using (coach_id = auth.uid());

create policy "coaches manage lead tags" on be_lead_tags
  for all using (
    lead_id in (select id from leads where coach_id = auth.uid())
  );

create policy "coaches manage conversations" on be_conversations
  for all using (coach_id = auth.uid());

create policy "coaches manage messages" on be_messages
  for all using (
    conversation_id in (select id from be_conversations where coach_id = auth.uid())
  );

create policy "coaches manage workflows" on be_workflows
  for all using (coach_id = auth.uid());

create policy "coaches manage workflow steps" on be_workflow_steps
  for all using (
    workflow_id in (select id from be_workflows where coach_id = auth.uid())
  );

create policy "coaches manage workflow executions" on be_workflow_executions
  for all using (
    workflow_id in (select id from be_workflows where coach_id = auth.uid())
  );

create policy "coaches manage funnels" on be_funnels
  for all using (coach_id = auth.uid());

create policy "coaches manage funnel pages" on be_funnel_pages
  for all using (
    funnel_id in (select id from be_funnels where coach_id = auth.uid())
  );

create policy "coaches manage forms" on be_forms
  for all using (coach_id = auth.uid());

create policy "coaches manage form submissions" on be_form_submissions
  for all using (
    form_id in (select id from be_forms where coach_id = auth.uid())
  );

create policy "public can submit forms" on be_form_submissions
  for insert with check (true);

create policy "coaches manage bookings" on be_bookings
  for all using (coach_id = auth.uid());

create policy "coaches manage products" on be_products
  for all using (coach_id = auth.uid());

create policy "coaches manage payments" on be_payments
  for all using (coach_id = auth.uid());

create policy "coaches manage campaigns" on be_campaigns
  for all using (coach_id = auth.uid());

create policy "coaches manage ad campaigns" on be_ad_campaigns
  for all using (coach_id = auth.uid());

-- ============================================================
-- SEED: DEFAULT PIPELINE
-- (run manually with your coach_id after running schema)
-- ============================================================

-- insert into be_pipelines (coach_id, name, is_default)
-- values ('<your-coach-id>', 'Performance Coaching', true);

-- insert into be_pipeline_stages (pipeline_id, name, position) values
--   ('<pipeline-id>', 'New Lead', 1),
--   ('<pipeline-id>', 'Report Sent', 2),
--   ('<pipeline-id>', 'Zoom 1 Booked', 3),
--   ('<pipeline-id>', 'Zoom 1 Completed', 4),
--   ('<pipeline-id>', 'Zoom 2 Booked', 5),
--   ('<pipeline-id>', 'Zoom 2 Completed', 6),
--   ('<pipeline-id>', 'Commencement Fee Paid', 7),
--   ('<pipeline-id>', 'Active Client', 8);

-- ============================================================
-- SEED: DEFAULT PRODUCTS
-- (run manually with your coach_id)
-- ============================================================

-- insert into be_products (coach_id, name, price, type) values
--   ('<your-coach-id>', 'Coaching Commencement Fee', 497, 'one_time'),
--   ('<your-coach-id>', 'Weekly Coaching 2x', 200, 'subscription'),
--   ('<your-coach-id>', 'Weekly Coaching 3x', 280, 'subscription');
