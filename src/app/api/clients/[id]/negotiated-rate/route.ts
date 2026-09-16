/**
 * Set or clear a client's negotiated weekly rate.
 *
 * POST { weeklyDollars: 205 }  → creates a Stripe price and payment link at that
 *                                amount, against the SAME product as the
 *                                client's package so reporting stays continuous,
 *                                and records both on the client.
 * DELETE                       → back to the package list price and link.
 *
 * The link is created here rather than by hand in Stripe because a rate without
 * a link is the dangerous state: the profile would say $205 while the only
 * sendable link charges $225.
 */

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { getCoachingPackage } from '@/lib/coaching-packages'
import { formatWeekly } from '@/lib/client-billing'

async function requireCoach() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Unauthorised' }, { status: 401 }) }
  if (!isCoachEmail((user.email ?? '').toLowerCase())) {
    return { error: NextResponse.json({ error: 'Coach only' }, { status: 403 }) }
  }
  return { error: null }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCoach()
  if (auth.error) return auth.error

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const weeklyDollars = Number((body as { weeklyDollars?: unknown }).weeklyDollars)

  if (!Number.isFinite(weeklyDollars) || weeklyDollars <= 0) {
    return NextResponse.json({ error: 'Enter a weekly amount in dollars.' }, { status: 400 })
  }
  // Cents, not dollars, so $204.50 survives. Refuse fractions of a cent.
  const cents = Math.round(weeklyDollars * 100)
  if (Math.abs(weeklyDollars * 100 - cents) > 0.001) {
    return NextResponse.json({ error: 'Use whole cents, for example 205 or 204.50.' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data: client } = await admin.from('clients').select('id, name, package').eq('id', id).maybeSingle()
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const pkg = client.package ? getCoachingPackage(client.package) : null
  if (!pkg) return NextResponse.json({ error: 'Set the client\'s package first, so the rate has a package to vary from.' }, { status: 400 })
  if (!pkg.stripe) {
    return NextResponse.json({ error: `${pkg.label} does not bill, so there is no rate to negotiate.` }, { status: 400 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

  // The product behind the package's own link, so a negotiated client's
  // payments report alongside everyone else on that package.
  let productId: string
  try {
    const linkId = pkg.stripe.split('/').pop()!
    const links = await stripe.paymentLinks.list({ limit: 100 })
    const match = links.data.find(l => l.url.endsWith(linkId))
    if (!match) throw new Error('package link not found in Stripe')
    const items = await stripe.paymentLinks.listLineItems(match.id, { limit: 1 })
    productId = String(items.data[0]?.price?.product ?? '')
    if (!productId) throw new Error('package link has no product')
  } catch (e) {
    return NextResponse.json({ error: `Could not find the Stripe product for ${pkg.label}: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
  }

  try {
    // Reuse an identical price if one already exists, so repeated saves and a
    // second client on the same agreed rate do not litter the product.
    const existing = await stripe.prices.list({ product: productId, active: true, limit: 100 })
    const price = existing.data.find(p => p.unit_amount === cents && p.recurring?.interval === 'week' && p.currency === 'aud')
      ?? await stripe.prices.create({
        product: productId,
        currency: 'aud',
        unit_amount: cents,
        recurring: { interval: 'week' },
        nickname: `${pkg.label}, agreed rate ${formatWeekly(cents / 100)}/wk`,
      })

    const link = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      // GST is off across the account, Kade's call 26 Aug 2026.
      automatic_tax: { enabled: false },
      metadata: { client_id: id, negotiated_rate: 'true', package: client.package ?? '' },
      subscription_data: { metadata: { client_id: id } },
    })

    const { error } = await admin.from('clients').update({
      negotiated_weekly_price_cents: cents,
      negotiated_stripe_link: link.url,
      negotiated_rate_set_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true, weeklyDollars: cents / 100, url: link.url })
  } catch (e) {
    return NextResponse.json({ error: `Stripe refused: ${e instanceof Error ? e.message : String(e)}` }, { status: 502 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCoach()
  if (auth.error) return auth.error

  const { id } = await params
  const admin = createAdminClient()
  // The Stripe link is left alone deliberately: an existing subscription keeps
  // billing at the rate it was created with, and deactivating it here would not
  // change that, only make the audit trail harder to follow.
  const { error } = await admin.from('clients').update({
    negotiated_weekly_price_cents: null,
    negotiated_stripe_link: null,
    negotiated_rate_set_at: null,
  }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
