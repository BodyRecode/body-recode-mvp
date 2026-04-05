-- Body Recode Content Engine Schema
-- Layer 3 Extension: Content Creation + Distribution Engine
-- Run this in Supabase SQL Editor
-- All tables prefixed be_content_

-- ============================================================
-- 1. HOOKS
-- ============================================================

create table if not exists be_content_hooks (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  hook_text text not null,
  category text not null default 'problem_aware',
  -- categories: problem_aware, solution_aware, unaware, contrarian, curiosity, authority
  performance_score integer default 0,
  -- 0 = unscored, 1 = losing, 2 = neutral, 3 = winning
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 2. MESSAGE BLOCKS
-- ============================================================

create table if not exists be_content_messages (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  message_text text not null,
  type text not null default 'education',
  -- types: education, myth_busting, story, system_explanation, authority
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 3. CTAs
-- ============================================================

create table if not exists be_content_ctas (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  cta_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 4. CAMPAIGNS
-- ============================================================

create table if not exists be_content_campaigns (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  name text not null,
  target_audience text,
  funnel_id uuid references be_funnels(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- 5. GENERATED OUTPUTS
-- ============================================================

create table if not exists be_content_outputs (
  id uuid primary key default uuid_generate_v4(),
  coach_id uuid references auth.users(id) on delete cascade,
  hook_id uuid references be_content_hooks(id) on delete set null,
  message_id uuid references be_content_messages(id) on delete set null,
  cta_id uuid references be_content_ctas(id) on delete set null,
  campaign_id uuid references be_content_campaigns(id) on delete set null,
  platform text not null default 'meta',
  -- platforms: meta, instagram, tiktok, email, landing_page
  content_text text not null,
  status text not null default 'draft',
  -- statuses: draft, approved, deployed, winning, removed
  -- Reel generation (ElevenLabs + HeyGen)
  heygen_video_id text,
  video_status text,
  -- video_status: rendering, ready, failed
  video_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

create trigger set_updated_at_be_content_hooks
  before update on be_content_hooks
  for each row execute function update_updated_at();

create trigger set_updated_at_be_content_messages
  before update on be_content_messages
  for each row execute function update_updated_at();

create trigger set_updated_at_be_content_ctas
  before update on be_content_ctas
  for each row execute function update_updated_at();

create trigger set_updated_at_be_content_campaigns
  before update on be_content_campaigns
  for each row execute function update_updated_at();

create trigger set_updated_at_be_content_outputs
  before update on be_content_outputs
  for each row execute function update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table be_content_hooks enable row level security;
alter table be_content_messages enable row level security;
alter table be_content_ctas enable row level security;
alter table be_content_campaigns enable row level security;
alter table be_content_outputs enable row level security;

create policy "coaches manage own hooks"
  on be_content_hooks for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage own messages"
  on be_content_messages for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage own ctas"
  on be_content_ctas for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage own campaigns"
  on be_content_campaigns for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());

create policy "coaches manage own outputs"
  on be_content_outputs for all
  using (coach_id = auth.uid())
  with check (coach_id = auth.uid());
