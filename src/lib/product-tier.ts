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
  // Messages: OUT of the interpretation product, Kade's decision 21 Sep 2026.
  // "the coach is using this software for the read and communicates with their
  // clients how they already communicate". A second inbox a coach forgets to
  // open makes the product look broken, and every coach already has WhatsApp
  // and email with their clients.
  //
  // NOT deleted: Kade uses it with his own clients, so it stays at owner. The
  // coach's RESPONSE to a weekly check-in is a different thing and is unaffected.
  { prefix: '/dashboard/messages', tier: 'owner' },
  { prefix: '/dashboard/feedback', tier: 'interpret' },
  // Their own account and getting help.
  { prefix: '/dashboard/getting-started', tier: 'interpret' },
  { prefix: '/dashboard/help', tier: 'interpret' },
  { prefix: '/dashboard/support', tier: 'interpret' },
  { prefix: '/dashboard/settings', tier: 'interpret' },
  // Their own agreement, added 20 Sep 2026. It was missed when the agreement
  // page was built the same day and fell through to owner, which would have
  // sent a coach held at the agreement to a page they are not allowed to open.
  // Caught by listing every page against this map rather than by anyone using
  // it, which is the argument for doing that listing regularly.
  { prefix: '/dashboard/agreement', tier: 'interpret' },
  // ...but not the pages underneath it that are Kade's. Longest prefix wins, so
  // these override the line above. The settings index already hides them from
  // the nav behind an isKade check; without these entries the PAGES would still
  // have been reachable by typing the URL, which is exactly the hole nav-hiding
  // does not close.
  { prefix: '/dashboard/settings/tenants', tier: 'owner' },
  { prefix: '/dashboard/settings/tenants-health', tier: 'owner' },
  { prefix: '/dashboard/settings/partner-billing', tier: 'owner' },
  { prefix: '/dashboard/build', tier: 'owner' },
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

/**
 * Prescription, which Body Recode sold on its own does NOT include.
 *
 * Kade, 20 September 2026: *"no they should not get the generators at all
 * that's performance coaching... it's only interpretation nothing to do with
 * prescription"*.
 *
 * The line is the product. Body Recode reads a body and explains it. Deciding
 * what somebody should DO about it, the training block, the eating plan, the
 * supplements, the recovery protocols, the daily routine, the training phase,
 * is Performance Coaching, and it is the one thing the go-to-market forbids
 * selling: it turns a neutral supplier into a competitor to every platform
 * that might otherwise carry the read.
 *
 * These sit UNDER a client, so they were all granted by the blanket rule on
 * '/dashboard/clients'. The top-level Programs page was correctly hidden while
 * the tab inside her file was wide open: the door in the corridor locked and
 * the door in her room open.
 *
 * A '*' matches exactly one path segment, which is what a client id is.
 */
const PRESCRIPTION_PATTERNS: Array<{ pattern: string; tier: ProductTier }> = [
  { pattern: '/dashboard/clients/*/program', tier: 'coach' },
  { pattern: '/dashboard/clients/*/nutrition', tier: 'coach' },
  { pattern: '/dashboard/clients/*/plan', tier: 'coach' },
  { pattern: '/dashboard/clients/*/supplements', tier: 'coach' },
  { pattern: '/dashboard/clients/*/recovery', tier: 'coach' },
  { pattern: '/dashboard/clients/*/routine', tier: 'coach' },
  { pattern: '/dashboard/clients/*/train', tier: 'coach' },
  { pattern: '/dashboard/clients/*/direction', tier: 'coach' },
  { pattern: '/dashboard/clients/*/fixed-session', tier: 'coach' },
]

/** True when the path matches, allowing '*' to stand for one whole segment. */
function matchesPattern(pathname: string, pattern: string): boolean {
  const path = pathname.split('/').filter(Boolean)
  const pat = pattern.split('/').filter(Boolean)
  if (path.length < pat.length) return false
  for (let i = 0; i < pat.length; i++) {
    if (pat[i] === '*') continue
    if (pat[i] !== path[i]) return false
  }
  // Equal length is the page itself; longer means a page beneath it, such as
  // the generate and suggest screens, which are the same product decision.
  return true
}

/** The tier a path requires. Unclassified paths require `owner`. */
export function tierForPath(pathname: string): ProductTier {
  // '/dashboard' exactly is the Live view. It was interpret, meaning any coach
  // could open it, and it shows leads, recent enquiries, subscriptions and
  // payment status: a business overview, not a coaching page. Moved to owner
  // on 21 September 2026. A coach is redirected to Today, which is the page
  // written for them.
  if (pathname === '/dashboard' || pathname === '/dashboard/') return 'owner'

  // Prescription wins over the blanket clients rule, whatever the prefix
  // lengths say, because it is a product boundary rather than a route detail.
  for (const entry of PRESCRIPTION_PATTERNS) {
    if (matchesPattern(pathname, entry.pattern)) return entry.tier
  }

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
