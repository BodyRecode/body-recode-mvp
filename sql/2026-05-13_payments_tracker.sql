-- Client Payment Tracker — Phase 1 schema
--
-- Adds the visibility layer for "is every client paying me what they should be":
--
--   1. clients.stripe_customer_id           — the missing canonical join key
--   2. be_products.category                 — stream tagging so LTV can filter to PC only
--   3. client_subscriptions                 — cached snapshot of current Stripe subscription state
--   4. payment_plans + client_payment_plan  — what each client is *supposed* to be on
--
-- Run in Supabase: SQL Editor -> paste -> Run. Safe to re-run (all CREATE statements
-- are guarded by IF NOT EXISTS / DO blocks).
--
-- Spec: ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-13_PAYMENTS_FOUNDATION.md

-- ============================================================
-- 1. clients.stripe_customer_id
-- ============================================================
-- The canonical link from a client row to its Stripe Customer record. Today the
-- link is implicit (via client_reference_id in checkout sessions and client_id
-- on be_payments). This column makes it explicit so we can query "what
-- subscriptions does this client have" in one hop.
--
-- Nullable. Populated by the backfill job (matches by email) and on every
-- relevant Stripe webhook going forward.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE clients ADD COLUMN stripe_customer_id TEXT UNIQUE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_clients_stripe_customer_id
  ON clients(stripe_customer_id);

COMMENT ON COLUMN clients.stripe_customer_id IS
  'Canonical link to Stripe Customer. Populated by reconciliation job (match by email) and Stripe webhooks. Nullable for clients who have never paid (free leads converted later).';

-- ============================================================
-- 2. be_products.category
-- ============================================================
-- Stream / business-line tag so reports can filter by which side of the
-- business a product belongs to. Today everything is sole-trader ABN, but for
-- internal management reporting we still want to know if a sale was Performance
-- Coaching vs Body Recode (scorecard / report) vs Studio of Ten vs Overhead.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'be_products' AND column_name = 'category'
  ) THEN
    ALTER TABLE be_products ADD COLUMN category TEXT
      CHECK (category IN ('performance_coaching', 'body_recode', 'studio_of_ten', 'overhead', 'other'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_be_products_category
  ON be_products(category);

COMMENT ON COLUMN be_products.category IS
  'Stream / business-line tag: performance_coaching | body_recode (scorecard, report, Blueprint, Membership) | studio_of_ten | overhead | other. Used to filter LTV and revenue reports per stream.';

-- ============================================================
-- 3. client_subscriptions
-- ============================================================
-- Cached snapshot of each client's Stripe Subscription state. Maintained by:
--   (a) webhook events (customer.subscription.created/updated/deleted,
--       invoice.payment_succeeded/payment_failed)
--   (b) the initial backfill job
--   (c) on-demand "Refresh from Stripe" button on the client detail page

CREATE TABLE IF NOT EXISTS client_subscriptions (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id                UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id   TEXT NOT NULL UNIQUE,
  stripe_customer_id       TEXT NOT NULL,
  product_id               UUID REFERENCES be_products(id) ON DELETE SET NULL,
  status                   TEXT NOT NULL CHECK (status IN (
                             'active', 'past_due', 'canceled', 'unpaid',
                             'trialing', 'incomplete', 'incomplete_expired', 'paused'
                           )),
  plan_label               TEXT,
  amount                   NUMERIC,
  currency                 TEXT DEFAULT 'aud',
  billing_interval         TEXT CHECK (billing_interval IN ('day', 'week', 'fortnight', 'month', 'year')),
  current_period_start     TIMESTAMPTZ,
  current_period_end       TIMESTAMPTZ,
  cancel_at_period_end     BOOLEAN DEFAULT FALSE,
  canceled_at              TIMESTAMPTZ,
  raw                      JSONB,
  last_synced_at           TIMESTAMPTZ DEFAULT NOW(),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_subs_client_id
  ON client_subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_client_subs_status
  ON client_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_client_subs_customer
  ON client_subscriptions(stripe_customer_id);

COMMENT ON TABLE client_subscriptions IS
  'Cached snapshot of current Stripe Subscription state per client. One row per Stripe subscription. Maintained by webhooks + on-demand refresh. Authoritative source is Stripe; this is a read cache for fast dashboard queries.';
COMMENT ON COLUMN client_subscriptions.status IS
  'Stripe subscription status: active | past_due | canceled | unpaid | trialing | incomplete | incomplete_expired | paused. Mirrors Stripe values.';
COMMENT ON COLUMN client_subscriptions.raw IS
  'Last-seen full Stripe subscription object. Kept for debugging and forward-compatibility (Stripe adds fields over time).';

-- ============================================================
-- 4. payment_plans
-- ============================================================
-- Defines what a "correctly set up" client looks like. v1 has one default plan
-- (the Hormozi commencement + weekly subscription model). Future-proofed so
-- multiple plans can coexist.

CREATE TABLE IF NOT EXISTS payment_plans (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id                      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                          TEXT NOT NULL,
  commencement_fee              NUMERIC,
  subscription_amount           NUMERIC,
  subscription_interval         TEXT CHECK (subscription_interval IN ('week', 'fortnight', 'month')),
  is_default                    BOOLEAN DEFAULT FALSE,
  notes                         TEXT,
  created_at                    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_plans_coach
  ON payment_plans(coach_id);

COMMENT ON TABLE payment_plans IS
  'Template payment plans. v1 has one default (Hormozi model). subscription_amount is nullable because real client amounts vary; populate per-client expected_subscription_amount on client_payment_plan instead.';

-- ============================================================
-- 5. client_payment_plan
-- ============================================================
-- One row per client. Links the client to a plan and records:
--   - commencement fee payment status (one-off, the $240)
--   - per-client expected subscription amount override (optional)
--   - notes specific to this client's arrangement

CREATE TABLE IF NOT EXISTS client_payment_plan (
  client_id                              UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  payment_plan_id                        UUID REFERENCES payment_plans(id) ON DELETE SET NULL,
  commencement_fee_paid_at               TIMESTAMPTZ,
  commencement_fee_stripe_payment_id     TEXT,
  expected_subscription_amount           NUMERIC,
  expected_subscription_start            DATE,
  notes                                  TEXT,
  created_at                             TIMESTAMPTZ DEFAULT NOW(),
  updated_at                             TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE client_payment_plan IS
  'Per-client payment plan assignment + state. commencement_fee_paid_at is set when the one-off fee is received. expected_subscription_amount is an optional override used for amount-mismatch flagging (v2).';

-- ============================================================
-- 6. RLS policies
-- ============================================================
-- All tables are coach-scoped. Coach can see / manage their own data.

ALTER TABLE client_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_payment_plan ENABLE ROW LEVEL SECURITY;

-- client_subscriptions: coach sees their own
DROP POLICY IF EXISTS client_subs_select_own ON client_subscriptions;
CREATE POLICY client_subs_select_own ON client_subscriptions
  FOR SELECT USING (coach_id = auth.uid());
DROP POLICY IF EXISTS client_subs_insert_own ON client_subscriptions;
CREATE POLICY client_subs_insert_own ON client_subscriptions
  FOR INSERT WITH CHECK (coach_id = auth.uid());
DROP POLICY IF EXISTS client_subs_update_own ON client_subscriptions;
CREATE POLICY client_subs_update_own ON client_subscriptions
  FOR UPDATE USING (coach_id = auth.uid());
DROP POLICY IF EXISTS client_subs_delete_own ON client_subscriptions;
CREATE POLICY client_subs_delete_own ON client_subscriptions
  FOR DELETE USING (coach_id = auth.uid());

-- payment_plans: coach manages their own
DROP POLICY IF EXISTS payment_plans_all_own ON payment_plans;
CREATE POLICY payment_plans_all_own ON payment_plans
  FOR ALL USING (coach_id = auth.uid()) WITH CHECK (coach_id = auth.uid());

-- client_payment_plan: nested via clients.coach_id
DROP POLICY IF EXISTS cpp_select_own ON client_payment_plan;
CREATE POLICY cpp_select_own ON client_payment_plan
  FOR SELECT USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );
DROP POLICY IF EXISTS cpp_insert_own ON client_payment_plan;
CREATE POLICY cpp_insert_own ON client_payment_plan
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );
DROP POLICY IF EXISTS cpp_update_own ON client_payment_plan;
CREATE POLICY cpp_update_own ON client_payment_plan
  FOR UPDATE USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );
DROP POLICY IF EXISTS cpp_delete_own ON client_payment_plan;
CREATE POLICY cpp_delete_own ON client_payment_plan
  FOR DELETE USING (
    client_id IN (SELECT id FROM clients WHERE coach_id = auth.uid())
  );

-- ============================================================
-- 7. Seed: default Hormozi payment plan for the single coach
-- ============================================================
-- Inserts one default plan row for the existing coach. Idempotent: skipped if
-- a plan with name 'Hormozi default' already exists for that coach.

DO $$
DECLARE
  v_coach_id UUID;
BEGIN
  -- Pick the first (and currently only) coach in auth.users.
  -- Single-coach platform per spec; this is safe.
  SELECT id INTO v_coach_id FROM auth.users ORDER BY created_at ASC LIMIT 1;

  IF v_coach_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM payment_plans
    WHERE coach_id = v_coach_id AND name = 'Hormozi default'
  ) THEN
    INSERT INTO payment_plans (
      coach_id, name, commencement_fee, subscription_amount,
      subscription_interval, is_default, notes
    ) VALUES (
      v_coach_id,
      'Hormozi default',
      240.00,
      NULL,                                  -- amount varies per client; left null
      'week',
      TRUE,
      'Default Performance Coaching plan: $240 commencement fee one-off + weekly recurring subscription (amount set per client).'
    );
  END IF;
END $$;
