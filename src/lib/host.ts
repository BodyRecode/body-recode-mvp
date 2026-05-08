/**
 * Host resolution + path classification for the bodyrecode.au + performance.bodyrecode.au split.
 *
 * - `bodyrecode.au` (and www.bodyrecode.au) hosts the parent IP / B2B platform.
 * - `performance.bodyrecode.au` hosts the consumer arm: scorecard funnel, booking, portal.
 * - `localhost` and Vercel preview deploys see ALL routes (no enforcement) for dev sanity.
 *
 * Both hosts share one Next.js app. The middleware uses these helpers to redirect/rewrite.
 */

export type Surface = 'ip' | 'consumer' | 'shared' | 'unknown'

export const IP_HOSTS = new Set([
  'bodyrecode.au',
  'www.bodyrecode.au',
])

export const CONSUMER_HOSTS = new Set([
  'performance.bodyrecode.au',
])

export function resolveSurface(host: string | null | undefined): Surface {
  if (!host) return 'unknown'
  const h = host.toLowerCase().split(':')[0]
  if (IP_HOSTS.has(h)) return 'ip'
  if (CONSUMER_HOSTS.has(h)) return 'consumer'
  return 'unknown'
}

/** First path segment, lowercase, no slashes. */
export function firstSegment(pathname: string): string {
  const parts = pathname.split('/').filter(Boolean)
  return (parts[0] || '').toLowerCase()
}

/** Routes that ONLY belong on the consumer arm (performance.bodyrecode.au). */
export const CONSUMER_PREFIXES = new Set([
  'scorecard',
  'scorecard-preview',
  'book',
  'book-a-conversation',
  'buy-report',
  'get-report',
  'report',
  'report-preview',
  'challenge',
  'checkin',
  'intake',
  'orientation',
  'payment-success',
  'performance-check-in',
  'performance-check-in-quiz',
  'performance-coaching',
  'performance',
  'blueprint',
  'membership',
  'extension',
  'program',
  'baseline',
  'companion',
  'coaching-guide',
  'portal',
  'client',
  'f',
  // Legacy SEO aliases (defined in next.config.ts redirects). All map into
  // /performance-coaching/* which is consumer-side, so they belong on the
  // consumer subdomain.
  'online-performance-coaching',
  'performance-coach-brisbane',
  'online-strength-coaching',
  'strength-coach-brisbane',
  'online-fat-loss-coaching',
  'fat-loss-coach-brisbane',
  'online-personal-trainer',
  'personal-trainer-brisbane',
])

/** Routes that ONLY belong on the IP / operator surface (bodyrecode.au). */
export const IP_ONLY_PREFIXES = new Set([
  'dashboard',
  'login',
  'kade',
])

/** Routes that work on both surfaces (legal, health checks, common API). */
export const SHARED_PREFIXES = new Set([
  'privacy',
  'terms',
  'api',
])

export function isConsumerOnly(pathname: string): boolean {
  return CONSUMER_PREFIXES.has(firstSegment(pathname))
}

export function isIpOnly(pathname: string): boolean {
  return IP_ONLY_PREFIXES.has(firstSegment(pathname))
}
