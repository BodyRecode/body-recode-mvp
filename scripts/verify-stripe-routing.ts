/**
 * Prove the Stripe Connect refactor is a no-op for Body Recode.
 *
 * Every payment path in the platform now goes through tenantStripe(). That is
 * a large blast radius for a change nobody can safely test by taking real
 * money, so the safety property has to be asserted rather than assumed:
 *
 *   For a tenant with no Connect account, tenantStripe() must return
 *   `opts: undefined`, which makes every refactored call byte-identical to
 *   `stripe.x(params)` as it was before.
 *
 * If this fails, payments are routing somewhere new. Do not deploy.
 *
 * Run: npx tsx --env-file=.env.local scripts/verify-stripe-routing.ts
 */

import { tenantStripe, tenantStripeContext, isStripeConnectActive } from '../src/lib/tenant-stripe'
import { getTenant } from '../src/config/tenant'

let failures = 0

function check(label: string, pass: boolean, detail = '') {
  console.log(`${pass ? '✓' : '✗'} ${label}${detail ? `  ${detail}` : ''}`)
  if (!pass) failures++
}

const tenant = getTenant()
console.log(`Tenant resolved: ${tenant.brand.name}\n`)

// 1. BR has no Connect account. If this ever becomes non-null by accident,
//    every checkout in the platform starts charging a connected account.
const acct = tenant.licence.stripeAccountId ?? null
check('Body Recode has no Connect account', acct === null, `stripeAccountId=${acct}`)

// 2. The context reports platform.
const ctx = tenantStripeContext()
check('context routes to platform', ctx.platform === true)

// 3. THE ONE THAT MATTERS. opts must be undefined, because `create(params,
//    undefined)` is identical to `create(params)`. Anything else — even an
//    empty object — is a different call to Stripe.
const { opts, routedTo } = tenantStripe()
check('opts is undefined (calls unchanged)', opts === undefined, `opts=${JSON.stringify(opts)}`)
check('routedTo is "platform"', routedTo === 'platform', routedTo)

// 4. Connect is not active, so nothing should try Direct Charges.
check('Connect reports inactive', isStripeConnectActive() === false)

// 5. The client itself is real, so a missing secret key surfaces here rather
//    than at the first customer checkout.
const { stripe } = tenantStripe()
check('Stripe client constructed', typeof stripe.checkout?.sessions?.create === 'function')

console.log(
  failures === 0
    ? '\nSAFE: every payment path behaves exactly as before for Body Recode.'
    : `\n${failures} FAILURE(S) — payments may be misrouted. Do not deploy.`,
)
process.exit(failures === 0 ? 0 : 1)
