/**
 * Tenant resolver — subdomain → tenant_config row → TenantConfig object.
 *
 * SCAFFOLD ONLY. Not wired into any request path yet. This file exists to
 * document + prepare Phase 2 (product-ready multi-tenancy per
 * project_sot_powered_platform_build_plan §4.2).
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CURRENT STATE (Phase 1, pre-cutover)
 * ═══════════════════════════════════════════════════════════════════════
 * - src/config/tenant.ts exports getTenant() returning a hardcoded BODY_RECODE_TENANT
 * - Every consumer reads that in-code config at build/render time
 * - Melisa's pilot runs on a separate Vercel + Supabase deploy (Shape A per
 *   MELISA_PILOT_ZERO_DEPLOYMENT_RUNBOOK.md) — her instance's tenant.ts is
 *   overridden manually at deploy time
 *
 * ═══════════════════════════════════════════════════════════════════════
 * TARGET STATE (Phase 2, post-cutover)
 * ═══════════════════════════════════════════════════════════════════════
 * - Every request enters through middleware → resolveTenant(subdomain) → sets a
 *   per-request async context
 * - getTenant() reads from that async context (via unstable_cache or
 *   AsyncLocalStorage or a headers()-based lookup)
 * - tenant_config table row keyed by coach_id (matching existing coach_id + RLS
 *   pattern per Kade's build plan §3)
 * - Cache: 60s at CDN edge + 5min in-memory per Vercel function instance
 *
 * ═══════════════════════════════════════════════════════════════════════
 * CUTOVER STEPS (execute post-launch Wk 2+)
 * ═══════════════════════════════════════════════════════════════════════
 * 1. Apply migration: sql/2026-07-01_tenant_config_schema.sql
 *    (creates tenant_config table + seeds Kade's row from auth.users email match)
 * 2. Add subdomain routing config in Vercel (each SOT tenant gets a subdomain
 *    or custom domain pointing at the same deploy)
 * 3. Wire this resolver into src/middleware.ts:
 *      const tenantId = resolveTenantIdFromHost(req.headers.host)
 *      request.headers.set('x-tenant-id', tenantId)
 * 4. Rewrite src/config/tenant.ts getTenant() to read the header:
 *      export function getTenant(): TenantConfig {
 *        const tenantId = headers().get('x-tenant-id') ?? 'body-recode'
 *        return getTenantFromCache(tenantId)  // DB-backed with cache
 *      }
 * 5. Test each SOT tenant subdomain returns their own config, not BR's
 * 6. Deploy + monitor for 24h
 *
 * ═══════════════════════════════════════════════════════════════════════
 * WHY NOT NOW
 * ═══════════════════════════════════════════════════════════════════════
 * - Adds a DB query to every page render → real perf/cost impact, needs baseline
 * - Middleware changes have blast radius across every request
 * - 12 days to BR launch (Mon 13 Jul 2026) — not the time for infra churn
 * - Melisa's pilot doesn't need it yet (Shape A separate-deploy works fine for 1)
 * - Phase 2 delivers value only when 2nd SOT partner onboards
 */

import type { TenantConfig } from '@/config/tenant'

/**
 * Given a request host, extract the tenant identifier.
 *
 * Examples:
 *   bodyrecode.au              → 'body-recode'
 *   melisa.example.com         → 'melisa'  (custom domain lookup)
 *   sarah.sot-platform.com     → 'sarah'   (subdomain lookup)
 *
 * NOT YET WIRED. Placeholder implementation always returns 'body-recode'.
 */
export function resolveTenantIdFromHost(host: string | null): string {
  if (!host) return 'body-recode'
  // Phase 2: real subdomain / custom-domain lookup vs a tenant_domains table
  // For now: always BR
  return 'body-recode'
}

/**
 * Load tenant config from the DB by tenant_id. Cache-aware.
 *
 * NOT YET IMPLEMENTED. Placeholder that would look up tenant_config table
 * and hydrate a TenantConfig object from its JSONB columns.
 */
export async function loadTenantFromDb(_tenantId: string): Promise<TenantConfig | null> {
  // Phase 2 implementation:
  //   const admin = createAdminClient()
  //   const { data } = await admin
  //     .from('tenant_config')
  //     .select('brand, coach, products, licence, modality')
  //     .eq('licence->>tenantId', tenantId)
  //     .single()
  //   if (!data) return null
  //   return {
  //     brand: data.brand,
  //     coach: data.coach,
  //     products: data.products,
  //     licence: data.licence,
  //     modality: data.modality,
  //   } as TenantConfig
  return null
}
