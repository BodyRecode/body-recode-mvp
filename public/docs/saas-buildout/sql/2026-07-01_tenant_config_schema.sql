-- Tenant Config — Phase 2 schema (DRAFT, not yet applied)
--
-- Backs the src/config/tenant.ts scaffold with a DB row per tenant. Same
-- interface, different backing: getTenant() moves from in-code static to
-- DB-backed lookup once this runs and the resolver is wired in middleware.
--
-- Under the SOT licensing model (project_sot_white_label_licensing_model in
-- auto-memory), only the brand shell + coach identity + product wrapping +
-- licence + modality vary per tenant. Layer 1/2 methodology stays intact.
--
-- Data model choice: one row per coach (coach_id primary key). This aligns
-- with the existing coach_id + RLS pattern used across every client-scoped
-- table (per project_sot_powered_platform_build_plan §3 — data layer is
-- already multi-tenant). Config values grouped into JSONB columns matching
-- the TenantConfig type: brand, coach, products, licence, modality.
--
-- JSONB (not relational columns) chosen so we can iterate the shape without
-- migrations during Phase 2. Once shape stabilises after 2-3 partners onboard,
-- can flatten to relational columns for indexed querying (e.g. "find all
-- tenants using yoga modality").
--
-- Run in Supabase: `supabase db query --linked < 2026-07-01_tenant_config_schema.sql`
-- Safe to re-run (idempotent).
--
-- Spec: ~/Dropbox/03_STUDIO_OF_TEN/00_FOUNDING_TEN/POWERED_PLATFORM_BUILD_PLAN.md §2 (Phase 2)
-- Consumers: src/config/tenant.ts (will be rewritten to read from this table)

-- ============================================================
-- 1. tenant_config table
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_config (
  coach_id      UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  brand         JSONB NOT NULL DEFAULT '{}'::jsonb,
  coach         JSONB NOT NULL DEFAULT '{}'::jsonb,
  products      JSONB NOT NULL DEFAULT '{}'::jsonb,
  licence       JSONB NOT NULL DEFAULT '{}'::jsonb,
  modality      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tenant_config IS
  'Per-tenant configuration for white-labelled SOT deployments. One row per coach. Backs src/config/tenant.ts getTenant() lookup. Shape matches TenantConfig type — brand shell, coach identity, product wrapping, licence, modality. Layer 1/2 methodology NOT stored here (stays as licensed BR IP in code).';

COMMENT ON COLUMN tenant_config.coach_id IS
  'Owner. Every client/reading/program/etc. table is coach_id-scoped via RLS. This row is the display config for that coach''s branded instance.';

COMMENT ON COLUMN tenant_config.brand IS
  'Brand shell — {name, nameWithMark, tagline, logoUrlLight, logoUrlDark, apexDomain, marketingDomain, performanceDomain, appDomain, supportEmail, replyToEmail, fromEmail, accentColor}';

COMMENT ON COLUMN tenant_config.coach IS
  'Coach identity — {firstName, fullName, email, adminEmail, photoUrl, location, credentials, instagramHandle, personalInstagramHandle}';

COMMENT ON COLUMN tenant_config.products IS
  'Product wrapping — pricing + product names. Tenant can keep BR names under licence or rename. {scorecardName, reportProductName, reportPrice, challengeName, challengePrice, blueprintName, blueprintPrice, membershipName, membershipPrice, coachingPackage2xPrice, coachingPackagePriceLabel}';

COMMENT ON COLUMN tenant_config.licence IS
  'Licensing attributes — {tenantId, poweredBy (true = show "Powered by Body Recode" attribution), version}';

COMMENT ON COLUMN tenant_config.modality IS
  'Third configurability axis (see POWERED_PLATFORM_BUILD_PLAN §7). {id: strength|yoga|..., label, doctrineMode: A (BR doctrine branded) | B (method-injected, post-founding-ten)}';

-- ============================================================
-- 2. updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION tenant_config_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tenant_config_updated_at ON tenant_config;
CREATE TRIGGER trg_tenant_config_updated_at
  BEFORE UPDATE ON tenant_config
  FOR EACH ROW EXECUTE FUNCTION tenant_config_set_updated_at();

-- ============================================================
-- 3. Row Level Security
-- ============================================================
-- Coaches can read + update their own config row. Cannot see other tenants'.
-- Service role bypasses RLS (used by resolver middleware + admin scripts).

ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_config_owner_select" ON tenant_config;
CREATE POLICY "tenant_config_owner_select" ON tenant_config
  FOR SELECT USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "tenant_config_owner_update" ON tenant_config;
CREATE POLICY "tenant_config_owner_update" ON tenant_config
  FOR UPDATE USING (coach_id = auth.uid());

-- Insert: only service_role can create rows (provisioning is a controlled
-- operation done at partner onboarding, not self-serve signup — at least
-- during Founding Ten. Reconsider for evergreen tier.)
DROP POLICY IF EXISTS "tenant_config_service_insert" ON tenant_config;
CREATE POLICY "tenant_config_service_insert" ON tenant_config
  FOR INSERT WITH CHECK (false);

-- ============================================================
-- 4. Explicit grants
-- ============================================================
-- Per feedback_supabase_explicit_grants — every new table needs explicit GRANTs.
GRANT SELECT, UPDATE ON tenant_config TO authenticated;
GRANT ALL ON tenant_config TO service_role;

-- ============================================================
-- 5. Seed Body Recode's own row
-- ============================================================
-- BR runs on the same platform — so BR itself is tenant zero. Populate on
-- migration run so getTenant() returns real config immediately, matching the
-- current src/config/tenant.ts defaults.
--
-- Kade's coach_id: the auth.users row for kade.dunstone@gmail.com. If your
-- user id differs, update the SELECT below before running.

INSERT INTO tenant_config (coach_id, brand, coach, products, licence, modality)
SELECT
  u.id,
  jsonb_build_object(
    'name', 'Body Recode',
    'nameWithMark', 'Body Recode™',
    'tagline', 'Biological Interpretation Platform',
    'logoUrlLight', '/logo-black.png',
    'logoUrlDark', '/logo-white.png',
    'apexDomain', 'bodyrecode.au',
    'marketingDomain', 'https://bodyrecode.au',
    'performanceDomain', 'https://performance.bodyrecode.au',
    'appDomain', 'https://app.bodyrecode.au',
    'supportEmail', 'info@bodyrecode.au',
    'replyToEmail', 'kade@replies.bodyrecode.au',
    'fromEmail', 'kade@send.bodyrecode.au',
    'accentColor', '#1B6DFC'
  ),
  jsonb_build_object(
    'firstName', 'Kade',
    'fullName', 'Kade Dunstone',
    'email', 'kade@bodyrecode.au',
    'adminEmail', 'kade@bodyrecode.au',
    'photoUrl', 'https://bodyrecode.au/kade.jpg',
    'location', 'Brisbane',
    'credentials', 'Human Movement Science + Business',
    'instagramHandle', '@body_recode_',
    'personalInstagramHandle', '@kade_dunstone_'
  ),
  jsonb_build_object(
    'scorecardName', 'Body State Scorecard',
    'reportProductName', 'Body Decode Report',
    'reportPrice', 37,
    'challengeName', '14-Day Body Decode Challenge',
    'challengePrice', 0,
    'blueprintName', '6-Week Body Rewire Blueprint',
    'blueprintPrice', 97,
    'membershipName', 'Body Recode Membership',
    'membershipPrice', 49,
    'coachingPackage2xPrice', 240,
    'coachingPackagePriceLabel', '$240 commencement fee'
  ),
  jsonb_build_object(
    'tenantId', 'body-recode',
    'poweredBy', false,
    'version', '2026-07-01'
  ),
  jsonb_build_object(
    'id', 'strength',
    'label', 'Strength',
    'doctrineMode', 'A'
  )
FROM auth.users u
WHERE u.email = 'kade.dunstone@gmail.com'
ON CONFLICT (coach_id) DO NOTHING;

-- ============================================================
-- 6. Verification
-- ============================================================
-- After running, this should return one row for Kade:
--
--   SELECT coach_id, brand->>'name' AS brand_name, modality->>'id' AS modality
--   FROM tenant_config;
--
-- Expected:
--   coach_id                             | brand_name  | modality
--   d5c8...                              | Body Recode | strength
