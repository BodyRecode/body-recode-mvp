/**
 * Stripe Connect webhook — events about PARTNER accounts, not Kade's.
 *
 * Separate from /api/webhooks/stripe deliberately. That endpoint handles the
 * platform account: Kade's own Challenge, reports, coaching payments. This one
 * handles events Stripe sends about connected accounts, and they arrive with a
 * different signing secret and an `event.account` field naming whose account it
 * happened on.
 *
 * Mixing them into one endpoint would mean a single signature secret guarding
 * two trust domains and a handler that has to remember which account each event
 * belongs to. Keeping them apart makes "whose money is this?" a property of the
 * URL rather than a branch inside a function.
 *
 * Two jobs:
 *
 * 1. **Keep account status honest.** A partner completes Connect onboarding and
 *    Stripe later decides they are restricted, or they finish verification days
 *    afterwards. Without this, tenant_config keeps saying whatever it said at
 *    onboarding, and the platform would keep sending clients to a checkout that
 *    cannot accept money.
 *
 * 2. **Record what each client actually paid.** The commercial terms are 15% of
 *    what an active client pays the coach. The existing counts table answers how
 *    MANY clients were active; fifteen percent of a headcount is not a number.
 *    These charge events are what make the fee verifiable instead of an honesty
 *    system, and they are the reason Direct Charges were chosen over the partner
 *    billing separately.
 *
 * SETUP (Kade, in the Stripe dashboard): add an endpoint at
 * <app>/api/webhooks/stripe/connect, tick "Listen to events on connected
 * accounts", subscribe to account.updated and charge.succeeded, and put its
 * signing secret in STRIPE_CONNECT_WEBHOOK_SECRET. It is a DIFFERENT secret
 * from STRIPE_WEBHOOK_SECRET; using the platform one here fails every signature.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export const maxDuration = 60

function monthStart(unixSeconds: number): string {
  const d = new Date(unixSeconds * 1000)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-01`
}

export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET
  const sig = request.headers.get('stripe-signature')

  if (!secret) {
    // Loud, not silent: an unconfigured Connect webhook means partner revenue
    // is going unrecorded, which is invisible until someone is invoiced wrongly.
    console.error('[stripe/connect] STRIPE_CONNECT_WEBHOOK_SECRET is not set — partner charges are NOT being recorded.')
    return NextResponse.json({ error: 'Connect webhook not configured' }, { status: 500 })
  }
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  const body = await request.text()
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret)
  } catch (err) {
    console.error('[stripe/connect] signature verification failed:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Every Connect event names the account it happened on. Without it we cannot
  // attribute anything, and guessing would attribute a partner's revenue to
  // whoever happens to be first in the table.
  const account = event.account
  if (!account) {
    console.warn(`[stripe/connect] ${event.type} arrived with no event.account — ignoring.`)
    return NextResponse.json({ received: true, ignored: 'no account' })
  }

  const admin = createAdminClient()

  // Resolve the tenant from the connected account id stored in their licence.
  const { data: tenantRow } = await admin
    .from('tenant_config')
    .select('coach_id, licence')
    .eq('licence->>stripeAccountId', account)
    .maybeSingle()

  const tenantId = (tenantRow?.coach_id as string | undefined) ?? null

  try {
    switch (event.type) {
      case 'account.updated': {
        const acct = event.data.object as Stripe.Account
        // Stripe's own words for "can this account actually take money".
        // charges_enabled is the one that matters; details_submitted only says
        // they finished the form.
        const status = acct.charges_enabled
          ? 'active'
          : acct.details_submitted
            ? 'restricted'
            : 'pending'

        if (!tenantRow) {
          console.warn(`[stripe/connect] account.updated for unknown account ${account} — no tenant_config row.`)
          break
        }

        const licence = { ...(tenantRow.licence as Record<string, unknown>), stripeAccountStatus: status }
        const { error } = await admin
          .from('tenant_config')
          .update({ licence, updated_at: new Date().toISOString() })
          .eq('coach_id', tenantId)

        if (error) console.error('[stripe/connect] failed to update licence status:', error.message)
        else console.log(`[stripe/connect] ${account} → ${status}`)
        break
      }

      case 'charge.succeeded': {
        const charge = event.data.object as Stripe.Charge
        if (charge.refunded) break

        // onConflict on charge_id: Stripe retries, and billing a partner twice
        // for one payment is the worst thing this table could do.
        const { error } = await admin
          .from('partner_charges')
          .upsert({
            tenant_id: tenantId,
            connected_account: account,
            charge_id: charge.id,
            amount_cents: charge.amount,
            currency: charge.currency,
            customer_email: charge.billing_details?.email ?? charge.receipt_email ?? null,
            month_start: monthStart(charge.created),
            livemode: event.livemode,
          }, { onConflict: 'charge_id', ignoreDuplicates: true })

        if (error) console.error('[stripe/connect] failed to record charge:', error.message)
        break
      }

      default:
        // Everything else is subscribed-to noise. Acknowledge so Stripe stops
        // retrying rather than treating an unhandled type as a failure.
        break
    }
  } catch (err) {
    console.error('[stripe/connect] handler threw:', err instanceof Error ? err.message : err)
    // 500 so Stripe retries. Losing a charge event loses billable revenue.
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
