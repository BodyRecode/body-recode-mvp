export type CoachingPackageValue =
  | 'online'
  | '1x'
  | '2x'
  | '3x'
  | 'online_launch'
  | '1x_launch'
  | '2x_launch'
  | '3x_launch'
  | 'contra'
  | 'no_charge'

export interface CoachingPackage {
  value: CoachingPackageValue
  label: string
  price: string
  /** Stripe payment link. Empty string for non-billing packages (contra/comp),
   *  and for a repriced package whose new link has not been created yet. */
  stripe: string
  tier: 'standard' | 'launch' | 'comp'
  format: 'online' | 'in_person'
  sessionsPerWeek: number
  /** Set while a package has been repriced but its new Stripe payment link does
   *  not exist yet. Suppresses Send / Copy / Schedule, because a live button
   *  under a new label would charge the OLD amount. Cleared 26 Aug 2026 once
   *  the four new links were created; keep the flag for the next reprice. */
  linkPending?: boolean
  /** Grandfathered. Existing clients keep it; it is not offered to anyone new. */
  retired?: boolean
}

/**
 * Repriced 26 Aug 2026, off what clients have ACTUALLY paid rather than off
 * the old list, because the old list never once transacted.
 *
 * Nobody had ever paid a list price. Every paying client was on the 50% launch
 * rate or a negotiated one, and the launch rate ran for the DURATION of the
 * engagement, so it never ended. Per session, what people really pay is
 * remarkably consistent: Greg $75, Samantha $75, Razia $68, Cristobal $99.50.
 * At $299/week, two sessions read as $150 each next to a trainer in the same
 * building charging a third of that. The launch rate was the market price. So
 * the list came down to meet it instead of being discounted to it.
 *
 *   online $149 -> $69   1x $199 -> $139   2x $299 -> $189   3x $409 -> $225
 *
 * 3x is $225 because that is exactly what Greg already pays for 3x. A new
 * client should not pay more than the longest-standing one for the same thing,
 * and it makes 3x the obvious value on the sheet, which is where the business
 * wants people anyway.
 *
 * Online has never produced a dollar at any price, so there was nothing to
 * defend. Its floor is the $49/week Membership.
 *
 * The four links below were created 26 Aug 2026 against the SAME Stripe
 * products as the old prices, so reporting stays continuous. Automatic tax was
 * mirrored from each product's previous link rather than normalised: it is ON
 * for online and 3x, OFF for 1x and 2x. That inconsistency predates the
 * reprice and is an accounting decision, not a code one.
 *
 * The launch entries stay so the clients on them keep their rate and can still
 * be billed. `retired` keeps them off the list offered to anyone new.
 */
export const COACHING_PACKAGES: CoachingPackage[] = [
  { value: 'online',         label: 'Online',                   price: '$69/week',    stripe: 'https://buy.stripe.com/4gM00lengftI6IDdRJ5ZC0c', tier: 'standard', format: 'online',    sessionsPerWeek: 0 },
  { value: '1x',             label: 'In-Person 1x + self-led',  price: '$139/week',   stripe: 'https://buy.stripe.com/5kQ8wR92W0yO0kf14X5ZC0d', tier: 'standard', format: 'in_person', sessionsPerWeek: 1 },
  { value: '2x',             label: 'In-Person 2x',             price: '$189/week',   stripe: 'https://buy.stripe.com/28E9AV2Ey3L01ojaFx5ZC0e', tier: 'standard', format: 'in_person', sessionsPerWeek: 2 },
  { value: '3x',             label: 'In-Person 3x',             price: '$225/week',   stripe: 'https://buy.stripe.com/00w14p5QKa9od719Bt5ZC0f', tier: 'standard', format: 'in_person', sessionsPerWeek: 3 },
  { value: 'online_launch',  label: 'Online (Launch)',          price: '$74.50/week', stripe: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04', tier: 'launch',   format: 'online',    sessionsPerWeek: 0, retired: true },
  { value: '1x_launch',      label: 'In-Person 1x + self-led (Launch)', price: '$99.50/week', stripe: 'https://buy.stripe.com/bJefZj0wqdlA3wrbJB5ZC0b', tier: 'launch',   format: 'in_person', sessionsPerWeek: 1, retired: true },
  { value: '2x_launch',      label: 'In-Person 2x (Launch)',    price: '$149.50/week',stripe: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05', tier: 'launch',   format: 'in_person', sessionsPerWeek: 2, retired: true },
  { value: '3x_launch',      label: 'In-Person 3x (Launch)',    price: '$204.50/week',stripe: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06', tier: 'launch',   format: 'in_person', sessionsPerWeek: 3, retired: true },
  // Non-billing arrangements. Stripe link empty so the Send / Copy / Schedule
  // controls in PackageManager are suppressed for these. Both excluded from
  // every filter helper below (ONLINE/IN_PERSON/N-session), so they sit
  // outside the upgrade-eligibility and format-filtering paths.
  { value: 'contra',         label: 'Contra (trade)',           price: 'No charge',   stripe: '', tier: 'comp', format: 'in_person', sessionsPerWeek: 0 },
  { value: 'no_charge',      label: 'No-charge / comp',         price: 'No charge',   stripe: '', tier: 'comp', format: 'in_person', sessionsPerWeek: 0 },
]

/**
 * Packages that don't generate revenue (contra deals, comps, founding-friend
 * arrangements). The Payments indicator and Today's Focus skip these clients
 * entirely so they don't trip "commencement missing" or "no Stripe customer"
 * flags — there is no expectation of billing in the first place.
 */
export const NON_BILLING_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.tier === 'comp').map(p => p.value)

export function isNonBillingPackage(value: string | null | undefined): boolean {
  return !!value && (NON_BILLING_PACKAGE_VALUES as string[]).includes(value)
}

const BY_VALUE: Record<string, CoachingPackage> = Object.fromEntries(
  COACHING_PACKAGES.map(p => [p.value, p])
)

export function getCoachingPackage(value: string | null | undefined): CoachingPackage | null {
  if (!value) return null
  return BY_VALUE[value] ?? null
}

export const ONLINE_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.format === 'online').map(p => p.value)

export const IN_PERSON_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.format === 'in_person').map(p => p.value)

export const ONE_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 1).map(p => p.value)

export const TWO_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 2).map(p => p.value)

export const THREE_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 3).map(p => p.value)
