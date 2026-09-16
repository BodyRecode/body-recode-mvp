/**
 * What a client actually pays, and which link to send them.
 *
 * Kade, 16 Sep 2026: Komang was offered three sessions a week at $205 against a
 * $225 list price, and there was no way to send it. Package links are fixed per
 * package, so Send, Copy and Schedule on her profile would all have charged
 * $225, and her profile would have shown $225 whatever she actually paid.
 *
 * This is the gap left open when the list was repriced on 26 Aug. The note from
 * that day is blunt about it: NOBODY HAS EVER PAID A LIST PRICE. Greg pays $225
 * for 3x and only looks correct because his negotiated rate happens to equal the
 * new list price. Off-platform MRR reads the package price, so any client on an
 * off-list number was reported wrong.
 *
 * One resolver, used by the profile, both send paths and the MRR sum, because
 * the failure here is not a missing feature, it is the four of them disagreeing.
 */

import { getCoachingPackage } from '@/lib/coaching-packages'

export interface ClientBillingRow {
  id: string
  package: string | null
  negotiated_weekly_price_cents?: number | null
  negotiated_stripe_link?: string | null
}

export interface ClientBilling {
  /** "In-Person 3x", plus a marker when the rate is not the list one. */
  label: string
  /** "$205/week" — what to show and what to write in an email. */
  priceLabel: string
  /** Weekly amount in dollars, or null for a non-billing package. */
  weeklyDollars: number | null
  /** The link to send, already carrying client_reference_id. Null when there is nothing to send. */
  url: string | null
  negotiated: boolean
  /** True for contra / no-charge, where no link exists by design. */
  nonBilling: boolean
  /** A negotiated price was set but its link is missing, so nothing may be sent. */
  incomplete: boolean
}

function weeklyFromPriceLabel(price: string): number | null {
  const m = price.match(/\$([\d,.]+)\s*\/\s*week/i)
  if (!m) return null
  const n = parseFloat(m[1].replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Dollars, trimmed: 205 -> "$205", 204.5 -> "$204.50". */
export function formatWeekly(dollars: number): string {
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

export function resolveClientBilling(client: ClientBillingRow): ClientBilling | null {
  const pkg = client.package ? getCoachingPackage(client.package) : null
  if (!pkg) return null

  const nonBilling = !pkg.stripe
  const cents = client.negotiated_weekly_price_cents ?? null
  const negotiated = cents != null && cents > 0
  const link = client.negotiated_stripe_link ?? null

  if (negotiated) {
    const dollars = cents! / 100
    return {
      label: `${pkg.label} (agreed rate)`,
      priceLabel: `${formatWeekly(dollars)}/week`,
      weeklyDollars: dollars,
      url: link ? withClientRef(link, client.id) : null,
      negotiated: true,
      nonBilling,
      // A price with no link is worse than no price: the profile would show
      // $205 while the only sendable link charges $225. Nothing sends.
      incomplete: !link,
    }
  }

  return {
    label: pkg.label,
    priceLabel: pkg.price,
    weeklyDollars: weeklyFromPriceLabel(pkg.price),
    url: pkg.stripe ? withClientRef(pkg.stripe, client.id) : null,
    negotiated: false,
    nonBilling,
    incomplete: false,
  }
}

function withClientRef(url: string, clientId: string): string {
  return url.includes('client_reference_id=') ? url : `${url}?client_reference_id=${clientId}`
}
