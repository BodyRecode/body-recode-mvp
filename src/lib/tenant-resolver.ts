/**
 * Tenant resolver — subdomain → tenant_config row → TenantConfig object.
 *
 * WIRED as of 2026-07-02. Phase 2 execution:
 * - tenant_config table applied (sql/2026-07-01_tenant_config_schema.sql)
 * - Body Recode row seeded (tenant_id = 'body-recode')
 * - resolveTenantIdFromHost() detects subdomain
 * - loadTenantFromDb() hydrates TenantConfig from JSONB columns
 * - In-memory cache (5 min per Vercel function instance)
 *
 * SAFETY: getTenant() in src/config/tenant.ts falls back to the hardcoded
 * BODY_RECODE_TENANT if DB lookup fails or returns null. So even if this
 * resolver breaks, BR keeps rendering with correct values.
 *
 * Feature-flagged via NEXT_PUBLIC_TENANT_DB_ENABLED. Defaults to OFF.
 * When OFF, getTenant() uses the in-code config only (Phase 1 behaviour).
 * When ON, getTenant() checks DB → falls back to in-code on error.
 */

import type { TenantConfig } from '@/config/tenant'
import { createAdminClient } from '@/lib/supabase/admin'

/** Cache: tenantId → { config, expiresAt } */
type CacheEntry = { config: TenantConfig; expiresAt: number }
const cache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 5 * 60 * 1000  // 5 minutes

/**
 * Given a request host, extract the tenant identifier.
 *
 * Rules (ordered):
 *   bodyrecode.au            → 'body-recode' (primary BR domain)
 *   www.bodyrecode.au        → 'body-recode'
 *   performance.bodyrecode.au → 'body-recode' (BR product subdomain)
 *   app.bodyrecode.au        → 'body-recode' (BR app subdomain)
 *   *.sot-platform.com       → subdomain slug (e.g. 'melisa' for melisa.sot-platform.com)
 *   custom-domain.com        → looked up in a tenant_domains table (not yet built)
 *   unknown                  → 'body-recode' (safe default)
 *
 * Called from middleware. Returns synchronously; no DB hit.
 */
export function resolveTenantIdFromHost(host: string | null): string {
  if (!host) return 'body-recode'

  const cleanHost = host.toLowerCase().replace(/:\d+$/, '')  // strip port

  // BR canonical domains → body-recode tenant
  if (
    cleanHost === 'bodyrecode.au' ||
    cleanHost === 'www.bodyrecode.au' ||
    cleanHost.endsWith('.bodyrecode.au') ||
    cleanHost === 'localhost' ||
    cleanHost.endsWith('.vercel.app')  // preview deploys
  ) {
    return 'body-recode'
  }

  // SOT tenant subdomain: {tenant}.sot-platform.com or similar future scheme
  // For now, extract the first subdomain label as the tenant id
  const parts = cleanHost.split('.')
  if (parts.length >= 3) {
    return parts[0]  // e.g. 'melisa' from 'melisa.sot-platform.com'
  }

  // Custom domain: would look up tenant_domains table here (post-Melisa work)
  return 'body-recode'
}

/**
 * Load tenant config from the DB by tenant_id. In-memory cached (5 min TTL).
 *
 * Returns null on any error (DB unreachable, row not found, malformed JSONB).
 * Callers must fall back to in-code defaults on null.
 */
export async function loadTenantFromDb(tenantId: string): Promise<TenantConfig | null> {
  // Cache hit
  const now = Date.now()
  const cached = cache.get(tenantId)
  if (cached && cached.expiresAt > now) {
    return cached.config
  }

  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('tenant_config')
      .select('brand, coach, products, licence, modality')
      .eq('licence->>tenantId', tenantId)
      .maybeSingle()

    if (error || !data) {
      return null
    }

    const config: TenantConfig = {
      brand: data.brand as TenantConfig['brand'],
      coach: data.coach as TenantConfig['coach'],
      products: data.products as TenantConfig['products'],
      licence: data.licence as TenantConfig['licence'],
      modality: data.modality as TenantConfig['modality'],
    }

    cache.set(tenantId, { config, expiresAt: now + CACHE_TTL_MS })
    return config
  } catch {
    // Never let a DB blip break rendering. Fall back to in-code default.
    return null
  }
}

/**
 * Clear the tenant config cache. Call after updating a tenant's config
 * via admin UI to force fresh reads.
 */
export function invalidateTenantCache(tenantId?: string): void {
  if (tenantId) {
    cache.delete(tenantId)
  } else {
    cache.clear()
  }
}
