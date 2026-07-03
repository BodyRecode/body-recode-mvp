-- Tenant Domains — Phase 2 tail-end custom domain support
--
-- Extends multi-tenant routing to arbitrary custom domains (not just
-- {tenant}.sot-platform.com subdomains). One coach can have multiple domains
-- (e.g. legacy + rebrand + regional).
--
-- Middleware fast-path: reads NEXT_PUBLIC_TENANT_DOMAIN_MAP env var (parsed
-- at module load) for O(1) sync lookup — the resolver can't do a DB call
-- because it runs synchronously in the edge middleware.
--
-- This table is the SOURCE OF TRUTH for the admin UI + audit trail. Kade
-- adds/removes rows via /dashboard/settings/tenant → domain section, and
-- gets a copy-paste env var line to update in Vercel + redeploy.
--
-- For the founding-ten scale (max 10 partners × 2-3 domains each = 30
-- entries), the env-var approach is fine. Post-Founding-Ten: switch to
-- edge-cached DB lookup at 30+ rows.
--
-- Run in Supabase: `supabase db query --linked < 2026-07-03_tenant_domains_schema.sql`
-- Safe to re-run (idempotent).

-- ============================================================
-- 1. tenant_domains table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id text NOT NULL,                    -- e.g. 'melisa' — must exist in tenant_config.licence->>tenantId
  coach_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,                -- normalized: lowercase, no protocol, no trailing slash
  is_primary boolean NOT NULL DEFAULT false,  -- one primary per tenant (used for absolute URLs in emails)
  verified_at timestamptz,                    -- set once DNS + SSL confirmed (manual for now)
  notes text,                                 -- optional: "old brand", "regional", etc.
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_domains_tenant_id_idx ON public.tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS tenant_domains_coach_id_idx ON public.tenant_domains(coach_id);

-- ============================================================
-- 2. RLS: coach can only see/edit their own domains
-- ============================================================

ALTER TABLE public.tenant_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach reads own domains" ON public.tenant_domains;
CREATE POLICY "coach reads own domains" ON public.tenant_domains
  FOR SELECT USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach inserts own domains" ON public.tenant_domains;
CREATE POLICY "coach inserts own domains" ON public.tenant_domains
  FOR INSERT WITH CHECK (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach updates own domains" ON public.tenant_domains;
CREATE POLICY "coach updates own domains" ON public.tenant_domains
  FOR UPDATE USING (coach_id = auth.uid());

DROP POLICY IF EXISTS "coach deletes own domains" ON public.tenant_domains;
CREATE POLICY "coach deletes own domains" ON public.tenant_domains
  FOR DELETE USING (coach_id = auth.uid());

-- Service role (server-side admin) bypasses RLS by default in Supabase.

-- ============================================================
-- 3. Grants
-- ============================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tenant_domains TO service_role;

-- ============================================================
-- 4. Trigger: keep updated_at fresh + enforce single primary per tenant
-- ============================================================

CREATE OR REPLACE FUNCTION public.tenant_domains_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  -- Normalize domain: strip protocol + www + trailing slash + lowercase
  NEW.domain := lower(regexp_replace(NEW.domain, '^(https?://)?(www\.)?', ''));
  NEW.domain := regexp_replace(NEW.domain, '/+$', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_domains_touch_updated_at ON public.tenant_domains;
CREATE TRIGGER tenant_domains_touch_updated_at
  BEFORE INSERT OR UPDATE ON public.tenant_domains
  FOR EACH ROW EXECUTE FUNCTION public.tenant_domains_touch_updated_at();

CREATE OR REPLACE FUNCTION public.tenant_domains_enforce_single_primary()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary THEN
    UPDATE public.tenant_domains
    SET is_primary = false
    WHERE tenant_id = NEW.tenant_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenant_domains_enforce_single_primary ON public.tenant_domains;
CREATE TRIGGER tenant_domains_enforce_single_primary
  AFTER INSERT OR UPDATE OF is_primary ON public.tenant_domains
  FOR EACH ROW WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.tenant_domains_enforce_single_primary();

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'tenant_domains schema applied. Row count: %', (SELECT count(*) FROM public.tenant_domains);
END $$;
