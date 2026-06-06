-- Phase A — Field Guides + Bolt Ons shared infrastructure
--
-- Decisions A1 + B1 + C3 locked 2026-06-06 in:
--   ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-06_Phase_A_Reconcile.md
--
--   A1 — Extend be_products with nullable `kind` column + create
--        digital_asset_metadata satellite table.
--   B1 — Create digital_asset_purchases with nullable client_id and
--        required email_at_purchase so cold scorecard buyers can purchase
--        without account creation.
--   C3 — Single canonical /library/{token}/{slug} reader surface where
--        token is either a membership_enrollments.token OR a
--        digital_asset_purchases.id (the route handler disambiguates).
--
-- Run in Supabase SQL editor. Safe to re-run — all guarded by
-- IF NOT EXISTS / DO blocks.
--
-- Pairs with:
--   src/lib/entitlement.ts (hasEntitlement / entitlementToken)
--   src/lib/digital-asset-emails.ts (delivery email + ascension CTA)
--   src/app/api/digital-assets/checkout/route.ts (Stripe Checkout)
--   src/app/api/webhooks/stripe/route.ts (new digital_asset_purchase branch)
--   src/app/library/[token]/page.tsx (index + reader UI)

-- ============================================================================
-- 1. be_products.kind  (extend the existing product registry)
-- ============================================================================
-- Nullable so legacy coaching rows remain valid (their kind = NULL). New
-- digital-asset rows MUST set a kind.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'be_products' AND column_name = 'kind'
  ) THEN
    ALTER TABLE be_products ADD COLUMN kind TEXT
      CHECK (kind IS NULL OR kind IN (
        'field_guide',
        'protocol',
        'bolt_on_ai',
        'bolt_on_human',
        'bolt_on_physical'
      ));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_be_products_kind
  ON be_products(kind) WHERE kind IS NOT NULL;

COMMENT ON COLUMN be_products.kind IS
  'Digital-asset product kind. NULL for legacy coaching products (their pricing/billing is shaped by `type` + `billing_interval`). One of: field_guide | protocol | bolt_on_ai | bolt_on_human | bolt_on_physical. Phase A locked 2026-06-06.';

-- ============================================================================
-- 2. digital_asset_metadata  (1:1 satellite for digital-asset rows of be_products)
-- ============================================================================

CREATE TABLE IF NOT EXISTS digital_asset_metadata (
  product_id        UUID PRIMARY KEY REFERENCES be_products(id) ON DELETE CASCADE,
  slug              TEXT NOT NULL UNIQUE,
  state_match       TEXT CHECK (state_match IS NULL OR state_match IN ('depleted','transitioning','ready')),
  pattern_match     TEXT,  -- canonical pattern slug or NULL (stress-stored | metabolic-drift | hormonal-shift | system-overload)
  source_path       TEXT NOT NULL,  -- supabase storage path for the PDF / reader content
  fulfilment_kind   TEXT NOT NULL CHECK (fulfilment_kind IN (
                      'instant_pdf',
                      'instant_engine',
                      'coach_task',
                      'shipping'
                    )),
  engine_call       TEXT CHECK (engine_call IS NULL OR engine_call IN (
                      'fat_map', 'health_markers', 'trajectory', 'cffs'
                    )),
  monthly_cap       INTEGER,   -- for human_touch bolt-ons; NULL = unlimited
  ascension_cta_path TEXT,     -- /challenge?source=... or /blueprint?source=... or /membership?source=...
  active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dam_state ON digital_asset_metadata(state_match) WHERE state_match IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dam_active ON digital_asset_metadata(active);
CREATE INDEX IF NOT EXISTS idx_dam_slug ON digital_asset_metadata(slug);

COMMENT ON TABLE digital_asset_metadata IS
  'Per-asset metadata for digital-asset rows in be_products. 1:1, joined on product_id. Carries fields that do not apply to coaching products (state matching, pattern matching, fulfilment routing). Phase A locked 2026-06-06.';
COMMENT ON COLUMN digital_asset_metadata.slug IS
  'URL slug for the asset: e.g. "depleted-field-guide". Used in /library/{token}/{slug} route. Unique across all assets.';
COMMENT ON COLUMN digital_asset_metadata.source_path IS
  'Supabase Storage path. For field_guide / protocol: PDF file in private "library-assets" bucket. Reader serves via signed URL. Members can hit the reader UI; cold buyers get the PDF emailed.';
COMMENT ON COLUMN digital_asset_metadata.fulfilment_kind IS
  'How a purchase is fulfilled: instant_pdf (email PDF on success), instant_engine (trigger engine_call generator), coach_task (stub for Phase D human-touch bolt-ons), shipping (stub for Phase E physical bolt-ons).';
COMMENT ON COLUMN digital_asset_metadata.engine_call IS
  'For bolt_on_ai products: which engine to enqueue on purchase. fat_map / health_markers / trajectory / cffs.';
COMMENT ON COLUMN digital_asset_metadata.monthly_cap IS
  'For human-touch bolt-ons: max purchases per member per calendar month. NULL = unlimited. Enforced at checkout time.';

-- ============================================================================
-- 3. digital_asset_purchases  (unified purchase log for all digital assets)
-- ============================================================================
-- B1: cold buyers (no client account) keyed off email_at_purchase. When
-- email later matches an account (e.g. Membership signup), client_id is
-- backfilled. One row per purchase.

CREATE TABLE IF NOT EXISTS digital_asset_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id           UUID REFERENCES clients(id) ON DELETE SET NULL,
  email_at_purchase   TEXT NOT NULL,
  product_id          UUID NOT NULL REFERENCES be_products(id),
  stripe_payment_id   TEXT,
  stripe_session_id   TEXT UNIQUE,
  status              TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
                        'pending',
                        'paid',
                        'fulfilled',
                        'failed',
                        'refunded'
                      )),
  source              TEXT,  -- attribution: e.g. "scorecard_depleted_secondary" / "email_descension"
  purchased_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fulfilled_at        TIMESTAMPTZ,
  output_ref          TEXT,  -- PDF download URL / engine output ID / booking link
  due_at              TIMESTAMPTZ,  -- for coach_task fulfilment SLA (Phase D)
  raw                 JSONB,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dap_email_product
  ON digital_asset_purchases(email_at_purchase, product_id);
CREATE INDEX IF NOT EXISTS idx_dap_client
  ON digital_asset_purchases(client_id) WHERE client_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dap_status
  ON digital_asset_purchases(status);
CREATE INDEX IF NOT EXISTS idx_dap_product_purchased
  ON digital_asset_purchases(product_id, purchased_at DESC);

COMMENT ON TABLE digital_asset_purchases IS
  'Unified purchase log for all digital-asset products (field_guide / protocol / bolt_on_*). Cold buyers have client_id NULL — backfilled when their email matches an account on later signup. Phase A locked 2026-06-06.';
COMMENT ON COLUMN digital_asset_purchases.email_at_purchase IS
  'Email captured at Stripe Checkout time. The primary identity for cold buyers (no clients row yet). Indexed with product_id for fast entitlement lookup.';
COMMENT ON COLUMN digital_asset_purchases.source IS
  'Where the buyer came from. Examples: scorecard_depleted_secondary | scorecard_transitioning_secondary | scorecard_ready_secondary | email_descension | bundle_buyer | member_bolt_on. Used for funnel attribution.';
COMMENT ON COLUMN digital_asset_purchases.output_ref IS
  'For instant_pdf: signed URL of the delivered PDF. For instant_engine: ID of the generated read (e.g. trajectory_readings.id). For coach_task: booking link. For shipping: tracking number.';

-- ============================================================================
-- 4. GRANTS  (required — service_role only; the admin client owns every read/write)
-- ============================================================================
-- be_products.kind change inherits the existing be_products grants — no
-- new grant needed on the parent table.
--
-- New tables (digital_asset_metadata + digital_asset_purchases): service_role
-- only. Neither table is queried directly from the browser by anon or
-- authenticated users.
--   - Coach side: admin client (service_role) via server actions.
--   - Buyer side: Stripe webhook (service_role) writes purchases; reader
--     route (server-rendered, service_role) reads metadata + checks entitlement.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_asset_metadata TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_asset_purchases TO service_role;

-- ============================================================================
-- 5. RLS  (defence in depth — service_role bypasses, all other roles denied)
-- ============================================================================

ALTER TABLE digital_asset_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE digital_asset_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service role manages digital_asset_metadata" ON digital_asset_metadata;
CREATE POLICY "service role manages digital_asset_metadata"
  ON digital_asset_metadata
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "service role manages digital_asset_purchases" ON digital_asset_purchases;
CREATE POLICY "service role manages digital_asset_purchases"
  ON digital_asset_purchases
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ============================================================================
-- 6. updated_at triggers (consistency with other Phase 1 tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION bump_digital_asset_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dam_updated_at ON digital_asset_metadata;
CREATE TRIGGER trg_dam_updated_at
  BEFORE UPDATE ON digital_asset_metadata
  FOR EACH ROW
  EXECUTE FUNCTION bump_digital_asset_metadata_updated_at();

CREATE OR REPLACE FUNCTION bump_digital_asset_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dap_updated_at ON digital_asset_purchases;
CREATE TRIGGER trg_dap_updated_at
  BEFORE UPDATE ON digital_asset_purchases
  FOR EACH ROW
  EXECUTE FUNCTION bump_digital_asset_purchases_updated_at();
