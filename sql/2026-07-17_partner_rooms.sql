-- Partner Room: personal, tokenised access links for prospective investors/partners.
--
-- Why this exists: when Kade is talking to someone about investing in / partnering
-- on Body Recode (e.g. Zac, July 2026), he wants to hand them a private page they
-- can return to anytime — no login, no shared password. Each row here is ONE
-- guest's private door. The token IS the key: /room/<token> greets them by name
-- and lets them look back over the vision-level brief whenever they like.
--
-- One room (the /room page content), many keys (one row per guest). A guest link
-- can be revoked (revoked_at) or auto-expired (expires_at) without touching anyone
-- else's access. We stamp first_opened_at / last_seen_at / visit_count on each open
-- so Kade can see who's actually engaging.
--
-- SECURITY NOTE: a token is privacy-by-obscurity, not real auth. Keep this page
-- vision-level only. Sensitive detail (Arete regulated specifics, real numbers)
-- stays in person, never behind a forwardable link.

-- ============================================================================
-- 1. TABLE
-- ============================================================================

create table if not exists public.partner_rooms (
  id uuid primary key default uuid_generate_v4(),
  name text not null,                    -- guest's name, used for the "Welcome back, X" greeting
  company text,                          -- optional: who they're with, for Kade's own reference
  note text,                             -- optional: private note to self (how you know them, context)
  -- The key. Minted by the DB on insert so creating a guest mints their link automatically.
  token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  first_opened_at timestamptz,           -- when they first opened their room
  last_seen_at timestamptz,              -- most recent open
  visit_count integer not null default 0,
  revoked_at timestamptz,                -- set to kill this one link without affecting others
  expires_at timestamptz                 -- optional auto-close time
);

-- ============================================================================
-- 2. GRANTS  (REQUIRED — without these the admin client returns 42501)
-- ============================================================================
-- service_role only: every read/write goes through the admin client (the public
-- /room gate and the coach-authed dashboard both use createAdminClient()).

grant select, insert, update, delete on public.partner_rooms to service_role;

-- ============================================================================
-- 3. RLS + POLICIES
-- ============================================================================

alter table partner_rooms enable row level security;

drop policy if exists "service role manages partner_rooms" on partner_rooms;
create policy "service role manages partner_rooms"
  on partner_rooms
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- ============================================================================
-- 4. INDEXES
-- ============================================================================

create index if not exists partner_rooms_token_idx on public.partner_rooms (token);
create index if not exists partner_rooms_created_idx on public.partner_rooms (created_at desc);
