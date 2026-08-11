/**
 * Tenant configuration. Groundwork for the SOT white-label licensing model
 * (see project_sot_white_label_licensing_model in auto-memory).
 *
 * Under the licensing model, Layer 1 methodology + Layer 2 ops system stay
 * intact (that IS the licensed IP). Only the brand shell + product wrapping
 * + coach identity + domain refs are per-tenant.
 *
 * Right now this file exists as the SINGLE-SOURCE-OF-TRUTH scaffold. Nothing
 * consumes it yet — call sites will be migrated incrementally post-launch.
 * When migrating, replace hardcoded strings with getTenant().<field>.
 *
 * Defaults = current Body Recode values so introducing this file changes
 * nothing at runtime.
 */

export type TenantConfig = {
  /** Layer 1: Brand shell — colors, name, logo, domain, email */
  brand: {
    name: string                    // "Body Recode"
    nameWithMark: string            // "Body Recode™"
    tagline: string                 // "Biological Interpretation Platform"
    logoUrlLight: string            // /logo-black.png (light-mode logo)
    logoUrlDark: string             // /logo-white.png (dark-mode logo)
    apexDomain: string              // "bodyrecode.au"
    marketingDomain: string         // "https://bodyrecode.au"
    performanceDomain: string       // "https://performance.bodyrecode.au"
    appDomain: string               // "https://app.bodyrecode.au"
    supportEmail: string            // "info@bodyrecode.au"
    replyToEmail: string            // "kade@replies.bodyrecode.au"
    fromEmail: string               // "kade@send.bodyrecode.au"
    accentColor: string             // "#1B6DFC" (Signal Blue)
  }

  /** Coach identity — the human running the business */
  coach: {
    firstName: string               // "Kade"
    fullName: string                // "Kade Dunstone"
    email: string                   // "kade@bodyrecode.au"
    adminEmail: string              // "kade@bodyrecode.au"
    photoUrl: string                // "https://bodyrecode.au/kade.jpg"
    location: string                // "Brisbane"
    credentials: string             // "Human Movement Science + Business"
    instagramHandle: string         // "@body_recode_"
    personalInstagramHandle: string // "@kade_dunstone_"
    whatsAppNumber: string          // "61400336284" (E.164 without + prefix, for wa.me links)
  }

  /** Layer 2: Product wrapping — prices, product names, offer structure */
  products: {
    scorecardName: string           // "Body State Scorecard"
    reportProductName: string       // "Body Decode Report"
    reportPrice: number             // 37
    challengeName: string           // "14-Day Body Decode Challenge"
    challengePrice: number          // 0 (FREE)
    blueprintName: string           // "6-Week Body Rewire Blueprint"
    blueprintPrice: number          // 97
    membershipName: string          // "Body Recode Membership"
    membershipPrice: number         // 49
    coachingPackage2xPrice: number  // 297 (Foundational Read)
    coachingPackagePriceLabel: string // "$297 Foundational Read"
  }

  /** Licensing context — attributes about this specific tenant */
  licence: {
    tenantId: string                // "body-recode" (the primary tenant)
    poweredBy: boolean              // false = own brand; true = "Powered by Body Recode"
    version: string                 // config version for change tracking
    /** Stripe Connect account id (acct_...) — null if not yet onboarded. When
     *  set, checkout callsites route payments to this tenant's Stripe account
     *  via Direct Charges (Connect). BR is always null — uses platform key. */
    stripeAccountId?: string | null
    /** Stripe onboarding lifecycle: 'pending' | 'active' | 'restricted' | null */
    stripeAccountStatus?: 'pending' | 'active' | 'restricted' | null
    /** Twilio Subaccount SID (AC...) - if set, SMS sends route through this
     *  subaccount instead of the platform account. Optional per-tenant
     *  extension for SOT partners who want their own AU number + billing
     *  separation. BR is always null - uses platform Twilio. */
    twilioSubaccountSid?: string | null
    /** Twilio Messaging Service SID (MG...) scoped to the subaccount. Sender pool
     *  + AU number attached to this messaging service. Required if
     *  twilioSubaccountSid is set. */
    twilioMessagingServiceSid?: string | null
    /** Kade's billing of THIS partner (as distinct from tenant billing their
     *  own clients). See the Founding Partner Agreement §6. Null for BR (no
     *  self-billing) and for non-partner tenants. */
    partnerBilling?: {
      /** Tier of the Founding Ten partnership */
      tier: 'launch' | 'studio'
      /** Stripe Customer id in Kade's Stripe account (cus_...) */
      customerId?: string | null
      /** Stripe Subscription id for the recurring platform subscription (sub_...) */
      subscriptionId?: string | null
      /** ISO date when partnership began. Used to compute the first billable month. */
      activeFrom?: string | null
      /** Founding Ten locked prices (cents, AUD) - override standard rates for life */
      lockedSetupFeeCents?: number | null       // 250000 (Launch) or 600000 (Studio)
      lockedSubscriptionCents?: number | null   // 40000 (Launch) or 60000 (Studio)
      /** Per Active Client fee cents (AUD). Default 2000 = $20. */
      perActiveClientCents?: number | null
      /** Setup fee lifecycle: 'not_invoiced' | 'invoiced' | 'paid' | null */
      setupFeeStatus?: 'not_invoiced' | 'invoiced' | 'paid' | null
    } | null

    /** Doctrine parameters (Mode A+ tuning).
     *
     *  Middle ground between Mode A (partner runs BR doctrine unchanged) and
     *  Mode B (partner injects their own method - reserved for post-Founding-Ten).
     *
     *  Partners can tune tone, add partner-specific banned phrases, substitute
     *  terminology, and append coaching-style guidance to generators.
     *
     *  What Mode A+ can NOT tune: Hard Safety Floors (RRS clamps, Fat Map
     *  limits, injury contraindications, eligibility floors). These are the
     *  platform's liability shield and remain immutable per the Founding
     *  Partner Agreement §7 and IP Licence Deed clause 4.1(h). */
    doctrineParameters?: {
      /** Tone cues appended to system prompts for client-facing content.
       *  Read by nutrition + program + check-in feedback generators.
       *  Examples: "warm and encouraging", "gentle and grounding", "direct and clinical". */
      voiceTone?: string

      /** Partner-specific banned phrases (in addition to platform-wide list).
       *  Applied to all client-facing generated content post-generation. */
      bannedPhrases?: string[]

      /** Terminology substitutions applied at generation time.
       *  Example: { "winding down": "settling" } replaces "winding down" with "settling". */
      terminologySubstitutions?: Record<string, string>

      /** Additional coaching guidance for weekly check-in feedback prompt.
       *  Partner-specific coaching philosophy that shapes weekly feedback. */
      checkinCoachingGuidance?: string

      /** Additional guidance for program generation (frequency, structure, session
       *  emphasis). NOT a safety override. */
      programGenerationGuidance?: string

      /** Additional guidance for nutrition plan generation. NOT a safety override. */
      nutritionGenerationGuidance?: string
    } | null
  }

  /** Modality — third configurability axis (see POWERED_PLATFORM_BUILD_PLAN §7) */
  modality: {
    id: 'strength' | 'yoga'         // extend as new modality packs land
    label: string                   // display label
    /** doctrine mode: 'A' = tenant runs BR doctrine branded; 'B' = injected method (post-Founding-Ten) */
    doctrineMode: 'A' | 'B'
  }
}

/**
 * The Body Recode tenant config — used for the primary BR deployment.
 * SOT clients will have their own tenant config in a per-tenant DB row.
 */
const BODY_RECODE_TENANT: TenantConfig = {
  brand: {
    name: 'Body Recode',
    nameWithMark: 'Body Recode™',
    tagline: 'Biological Interpretation Platform',
    logoUrlLight: '/logo-black.png',
    logoUrlDark: '/logo-white.png',
    apexDomain: 'bodyrecode.au',
    marketingDomain: 'https://bodyrecode.au',
    performanceDomain: 'https://performance.bodyrecode.au',
    appDomain: 'https://app.bodyrecode.au',
    supportEmail: 'info@bodyrecode.au',
    replyToEmail: 'kade@replies.bodyrecode.au',
    fromEmail: 'kade@send.bodyrecode.au',
    accentColor: '#1B6DFC',
  },
  coach: {
    firstName: 'Kade',
    fullName: 'Kade Dunstone',
    email: 'kade@bodyrecode.au',
    adminEmail: 'kade@bodyrecode.au',
    photoUrl: 'https://bodyrecode.au/kade.jpg',
    location: 'Brisbane',
    credentials: 'Sports Scientist · Business Entrepreneur · Body Recode Founder',
    instagramHandle: '@body_recode_',
    personalInstagramHandle: '@kade_dunstone_',
    whatsAppNumber: '61400336284',
  },
  products: {
    scorecardName: 'Body State Scorecard',
    reportProductName: 'Body Decode Report',
    reportPrice: 37,
    challengeName: '14-Day Body Decode Challenge',
    challengePrice: 0,
    blueprintName: '6-Week Body Rewire Blueprint',
    blueprintPrice: 97,
    membershipName: 'Body Recode Membership',
    membershipPrice: 49,
    coachingPackage2xPrice: 297,
    coachingPackagePriceLabel: '$297 Foundational Read',
  },
  licence: {
    tenantId: 'body-recode',
    poweredBy: false,
    version: '2026-07-01',
    stripeAccountId: null,
    stripeAccountStatus: null,
    twilioSubaccountSid: null,
    twilioMessagingServiceSid: null,
    partnerBilling: null,
    doctrineParameters: null,
  },
  modality: {
    id: 'strength',
    label: 'Strength',
    doctrineMode: 'A',
  },
}

/**
 * Get the active tenant config.
 *
 * Behavior:
 *   - NEXT_PUBLIC_TENANT_DB_ENABLED != 'true' (default): returns BODY_RECODE_TENANT
 *     (Phase 1 in-code config, unchanged from before Phase 2 wiring).
 *   - NEXT_PUBLIC_TENANT_DB_ENABLED == 'true': returns cached DB config if warm,
 *     else returns BODY_RECODE_TENANT as safe fallback.
 *
 * Must be synchronous — 260+ consumers expect sync access. Cache warming
 * happens via prefetchTenant() called from root layout server component.
 * If cache is cold on first request, returns hardcoded default. This is
 * safe for BR (DB row = hardcoded values) but tenant-inaccurate for first
 * request from a non-BR tenant. Second request onwards is correct.
 */
export function getTenant(): TenantConfig {
  if (process.env.NEXT_PUBLIC_TENANT_DB_ENABLED === 'true') {
    if (cachedTenant && cachedTenant.expiresAt > Date.now()) {
      return cachedTenant.config
    }
  }
  return BODY_RECODE_TENANT
}

// ─── Cache machinery for DB-backed getTenant() ───────────────────────────
// Module-level cache: 5 min TTL per Vercel function instance. Populated by
// prefetchTenant() which is called from the root layout server component
// (so it runs once per SSR request, before any getTenant() call fires).

let cachedTenant: { config: TenantConfig; expiresAt: number } | null = null
const TENANT_CACHE_TTL_MS = 5 * 60 * 1000

/**
 * Prefetch and cache the tenant config from the DB. No-op if:
 *   - Feature flag NEXT_PUBLIC_TENANT_DB_ENABLED is not 'true'
 *   - Cache is still warm (within TTL)
 *   - DB lookup fails (silent — falls back to in-code default at read time)
 *
 * Call once per SSR request from a server component (typically root layout).
 * Safe to call multiple times; only fetches when cache is cold.
 */
export async function prefetchTenant(tenantId: string): Promise<void> {
  if (process.env.NEXT_PUBLIC_TENANT_DB_ENABLED !== 'true') return
  if (cachedTenant && cachedTenant.expiresAt > Date.now() && cachedTenant.config.licence.tenantId === tenantId) return

  try {
    // Dynamic import to avoid pulling the resolver into every consumer
    const { loadTenantFromDb } = await import('@/lib/tenant-resolver')
    const loaded = await loadTenantFromDb(tenantId)
    if (loaded) {
      cachedTenant = { config: loaded, expiresAt: Date.now() + TENANT_CACHE_TTL_MS }
    }
  } catch {
    // Never let a DB blip crash rendering. getTenant() falls back to in-code.
  }
}

/** Test helper: clear the module-level cache. */
export function _resetTenantCache(): void {
  cachedTenant = null
}

/** Convenience helper: get a brand field */
export function brand(): TenantConfig['brand'] {
  return getTenant().brand
}

/** Convenience helper: get a coach field */
export function coach(): TenantConfig['coach'] {
  return getTenant().coach
}

/** Convenience helper: get a product field */
export function products(): TenantConfig['products'] {
  return getTenant().products
}

/** Absolute logo URL for the current tenant. Use in <img src={logoUrl()}> or email HTML. */
export function logoUrl(variant: 'light' | 'dark' = 'light'): string {
  const t = brand()
  return `${t.marketingDomain}${variant === 'dark' ? t.logoUrlDark : t.logoUrlLight}`
}
