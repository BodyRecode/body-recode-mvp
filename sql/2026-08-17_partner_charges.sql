-- Revenue actually collected by a partner, per charge (2026-08-17).
--
-- The commercial terms are "15% of what each active client pays the coach".
-- The existing partner_active_client_counts table answers HOW MANY clients were
-- active, which is a headcount, not an amount. Fifteen percent of a headcount is
-- not a number. This table records what each client actually paid, which is the
-- only way the fee is verifiable rather than an honesty system.
--
-- Rows arrive from the Connect webhook (/api/webhooks/stripe/connect) as charges
-- succeed on the partner's own Stripe account. Kade never sees their bank
-- account; he sees the events Stripe sends about charges made through the
-- platform, which is the whole point of Direct Charges via Connect.

CREATE TABLE IF NOT EXISTS public.partner_charges (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The tenant's coach_id, resolved from the connected account at write time so
  -- later queries do not have to join through tenant_config.
  tenant_id          UUID,
  -- Stripe's connected account id (acct_...). Kept even when tenant_id could not
  -- be resolved, so an unmatched charge is recoverable rather than lost.
  connected_account  TEXT NOT NULL,
  charge_id          TEXT NOT NULL UNIQUE,
  amount_cents       INTEGER NOT NULL,
  currency           TEXT NOT NULL DEFAULT 'aud',
  -- Who paid. Used to attribute revenue to a client for the per-client fee.
  customer_email     TEXT,
  -- Denormalised for billing queries, which are always "what did this partner
  -- collect in this month".
  month_start        DATE NOT NULL,
  livemode           BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- charge_id is UNIQUE above: Stripe retries webhooks, and billing a partner
-- twice for one payment is the worst failure this table can have.
CREATE INDEX IF NOT EXISTS partner_charges_tenant_month_idx
  ON public.partner_charges (tenant_id, month_start);
CREATE INDEX IF NOT EXISTS partner_charges_account_idx
  ON public.partner_charges (connected_account, month_start);

ALTER TABLE public.partner_charges ENABLE ROW LEVEL SECURITY;

-- A partner may read their own charges; nobody may read another's. Kade reaches
-- these through the service role, as with the rest of the platform.
DROP POLICY IF EXISTS partner_charges_own ON public.partner_charges;
CREATE POLICY partner_charges_own ON public.partner_charges
  FOR SELECT USING (tenant_id = auth.uid());

GRANT ALL ON public.partner_charges TO service_role;
