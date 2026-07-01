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
    coachingPackage2xPrice: number  // 240 (commencement fee)
    coachingPackagePriceLabel: string // "$240 commencement fee"
  }

  /** Licensing context — attributes about this specific tenant */
  licence: {
    tenantId: string                // "body-recode" (the primary tenant)
    poweredBy: boolean              // false = own brand; true = "Powered by Body Recode"
    version: string                 // config version for change tracking
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
    credentials: 'Human Movement Science + Business',
    instagramHandle: '@body_recode_',
    personalInstagramHandle: '@kade_dunstone_',
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
    coachingPackage2xPrice: 240,
    coachingPackagePriceLabel: '$240 commencement fee',
  },
  licence: {
    tenantId: 'body-recode',
    poweredBy: false,
    version: '2026-07-01',
  },
  modality: {
    id: 'strength',
    label: 'Strength',
    doctrineMode: 'A',
  },
}

/**
 * Get the active tenant config. Currently returns the Body Recode tenant.
 *
 * When multi-tenancy is wired (post-launch Wk 3-4), this will:
 * - Read tenant_id from the request context (subdomain, JWT, header)
 * - Look up the tenant row in Supabase
 * - Return the parsed TenantConfig
 *
 * For now: always returns BODY_RECODE_TENANT.
 */
export function getTenant(): TenantConfig {
  return BODY_RECODE_TENANT
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
