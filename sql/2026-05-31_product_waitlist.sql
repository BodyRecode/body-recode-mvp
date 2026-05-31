-- Product waitlist table for the scorecard result page "Coming soon" CTAs.
-- Captures leads who want to be notified when the Challenge / Blueprint / Membership
-- products launch. Populated from the performance.bodyrecode.au/scorecard result page
-- via POST /api/product-waitlist (admin client only).
--
-- One row per (email, product) pair. Re-clicks are idempotent.
--
-- Per feedback_supabase_explicit_grants: explicit grants required since
-- default grants were revoked 2026-05-28.

CREATE TABLE IF NOT EXISTS public.product_waitlist (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       text NOT NULL,
  first_name  text,
  body_state  text,   -- 'Depleted State' | 'Transitioning State' | 'Ready State'
  product     text NOT NULL,   -- 'challenge' | 'blueprint' | 'membership'
  source      text,
  notified_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Unique on (email, product). The API route lowercases email before insert
-- so this gives case-insensitive uniqueness in practice. Plain-column index
-- so postgrest upsert with onConflict: 'email,product' resolves correctly
-- (functional indexes don't satisfy onConflict column lookup).
CREATE UNIQUE INDEX IF NOT EXISTS product_waitlist_email_product_uidx
  ON public.product_waitlist (email, product);

CREATE INDEX IF NOT EXISTS product_waitlist_product_created_at_idx
  ON public.product_waitlist (product, created_at DESC);

CREATE INDEX IF NOT EXISTS product_waitlist_body_state_idx
  ON public.product_waitlist (body_state);

-- Explicit grants. service_role only - writes happen through admin client
-- in /api/product-waitlist; reads happen from coach dashboard (which also uses
-- admin client). Anon and authenticated have no direct access.
REVOKE ALL ON public.product_waitlist FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.product_waitlist TO service_role;
