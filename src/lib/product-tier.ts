/**
 * What a tenant can actually see and use.
 *
 * Distinct from `partnerBilling.tier` in tenant config, which is COMMERCIAL —
 * what a Collective partner pays. This is the PRODUCT tier: which layers of the
 * system they get.
 *
 *   interpret  The read, and only the read. Their clients, the intake, the
 *              foundational read, the weekly check-in, the re-read. They write
 *              their own programs. This is Body Recode sold on its own.
 *   coach      Adds Layer 2, the coaching application: programs, gym sessions,
 *              classes, recovery, and the co-pilot that drafts them.
 *   owner      Everything, including the business engine — leads, CRM, ads,
 *              campaigns, payments, analytics, the other brands. Kade only.
 *
 * WHY THIS EXISTS (2026-09-09)
 *
 * There was no product gating anywhere. A coach signing up landed in Kade's
 * entire business cockpit: his ads dashboard, his CRM, his funnel pages, his
 * booking agent, his revenue. Not a styling problem — it is the single thing
 * that made the product unshowable to anybody who is not him.
 *
 * FAIL CLOSED, deliberately. A path nobody has classified resolves to `owner`,
 * so a page added next month is invisible to a licensee until somebody decides
 * it should not be. The opposite default leaks Kade's business by omission, and
 * the omission is silent.
 */

export type ProductTier = 'interpret' | 'coach' | 'owner'

/** Ascending capability. A tenant sees everything at or below its own rank. */
const RANK: Record<ProductTier, number> = { interpret: 0, coach: 1, owner: 2 }

export function tierAllows(tenantTier: ProductTier, required: ProductTier): boolean {
  return RANK[tenantTier] >= RANK[required]
}

/**
 * Minimum tier per dashboard path. Longest matching prefix wins, so
 * '/dashboard/business/collective' beats '/dashboard/business'.
 *
 * Anything absent is `owner`. See the fail-closed note above.
 */
const ROUTE_TIERS: Array<{ prefix: string; tier: ProductTier }> = [
  // The read, and running a client through it.
  { prefix: '/dashboard/today', tier: 'interpret' },
  { prefix: '/dashboard/coaching', tier: 'interpret' },
  { prefix: '/dashboard/clients', tier: 'interpret' },
  { prefix: '/dashboard/checkins', tier: 'interpret' },
  { prefix: '/dashboard/messages', tier: 'interpret' },
  { prefix: '/dashboard/feedback', tier: 'interpret' },
  // Their own account and getting help.
  { prefix: '/dashboard/getting-started', tier: 'interpret' },
  { prefix: '/dashboard/help', tier: 'interpret' },
  { prefix: '/dashboard/support', tier: 'interpret' },
  { prefix: '/dashboard/settings', tier: 'interpret' },
  // ...but not the pages underneath it that are Kade's. Longest prefix wins, so
  // these override the line above. The settings index already hides them from
  // the nav behind an isKade check; without these entries the PAGES would still
  // have been reachable by typing the URL, which is exactly the hole nav-hiding
  // does not close.
  { prefix: '/dashboard/settings/tenants', tier: 'owner' },
  { prefix: '/dashboard/settings/tenants-health', tier: 'owner' },
  { prefix: '/dashboard/settings/partner-billing', tier: 'owner' },
  { prefix: '/dashboard/settings/platform-buildout', tier: 'owner' },
  { prefix: '/dashboard/settings/coaching-buildout', tier: 'owner' },

  // Layer 2 — the coaching application.
  { prefix: '/dashboard/programs', tier: 'coach' },
  { prefix: '/dashboard/gym-sessions', tier: 'coach' },
  { prefix: '/dashboard/group-classes', tier: 'coach' },
  { prefix: '/dashboard/recovery-regulation', tier: 'coach' },
  { prefix: '/dashboard/copilot-review', tier: 'coach' },
  { prefix: '/dashboard/copilot-guide', tier: 'coach' },

  // Everything else is Kade's business and falls through to `owner`:
  // console, leads, sources, funnel, sms, scorecard, partner-room,
  // system-health, and all of /dashboard/business.
]

/** The tier a path requires. Unclassified paths require `owner`. */
export function tierForPath(pathname: string): ProductTier {
  // '/dashboard' exactly is the Live view, which any tenant may see. Handled
  // separately because every other path also starts with it.
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'interpret'

  let best: { prefix: string; tier: ProductTier } | null = null
  for (const entry of ROUTE_TIERS) {
    if (pathname === entry.prefix || pathname.startsWith(entry.prefix + '/')) {
      if (!best || entry.prefix.length > best.prefix.length) best = entry
    }
  }
  return best?.tier ?? 'owner'
}

/** Convenience for the nav and for page guards. */
export function canAccess(tenantTier: ProductTier, pathname: string): boolean {
  return tierAllows(tenantTier, tierForPath(pathname))
}
