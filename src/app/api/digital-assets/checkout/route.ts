// Phase A — Digital asset checkout route.
//
// Creates a Stripe Checkout Session for a digital_asset product
// (field_guide / protocol / bolt_on_*). Cold buyers (no account) and
// existing members both flow through here.
//
// Decisions B1 + Q2 locked 2026-06-06:
//   - Email-keyed purchases (B1) — no account required
//   - Dynamic Stripe Checkout (Q2) — full control over metadata + source attribution

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'

// PLATFORM-BILLED ON PURPOSE. Digital assets are Body Recode's own IP sold
// direct by Kade, not a partner's product, so this must NOT be routed through
// tenantStripe(). See the decision matrix in src/lib/tenant-stripe.ts.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { product_id, email, source, question, constraints } = body as {
    product_id?: string
    email?: string
    source?: string
    question?: string
    constraints?: string
  }

  if (!product_id || typeof product_id !== 'string') {
    return NextResponse.json({ error: 'product_id required' }, { status: 400 })
  }
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 })
  }

  // Pre-purchase free-text input. Different engine_call values use different
  // field names so the orchestrator can dispatch cleanly: 'question' for
  // member_question, 'constraints' for member_custom_block. Both ride through
  // Stripe metadata to the webhook (lifted onto digital_asset_purchases.raw).
  const trimmedQuestion = typeof question === 'string' ? question.trim() : ''
  const trimmedConstraints = typeof constraints === 'string' ? constraints.trim() : ''
  if (trimmedQuestion.length > 1200) {
    return NextResponse.json({ error: 'Question too long (max 1200 chars)' }, { status: 400 })
  }
  if (trimmedConstraints.length > 1200) {
    return NextResponse.json({ error: 'Constraints text too long (max 1200 chars)' }, { status: 400 })
  }

  const normalisedEmail = email.toLowerCase().trim()
  const admin = createAdminClient()

  // 1. Load the product and its digital-asset metadata.
  const { data: product, error: productError } = await admin
    .from('be_products')
    .select('id, name, price, kind, stripe_product_id, stripe_price_id')
    .eq('id', product_id)
    .single()

  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 })
  }

  if (!product.kind || !['field_guide', 'protocol', 'bolt_on_ai', 'bolt_on_human', 'bolt_on_physical'].includes(product.kind)) {
    return NextResponse.json({ error: 'Product is not a digital asset' }, { status: 400 })
  }

  const { data: meta } = await admin
    .from('digital_asset_metadata')
    .select('slug, fulfilment_kind, monthly_cap, active, engine_call')
    .eq('product_id', product_id)
    .single()

  if (!meta || !meta.active) {
    return NextResponse.json({ error: 'Asset is not available for purchase' }, { status: 404 })
  }

  // Engines that capture pre-purchase input require the field to be present.
  if (meta.engine_call === 'member_question' && trimmedQuestion.length < 8) {
    return NextResponse.json({ error: 'Please write your question first (8 characters minimum)' }, { status: 400 })
  }
  if (meta.engine_call === 'member_custom_block' && trimmedConstraints.length < 12) {
    return NextResponse.json({ error: 'Please describe your constraint first (12 characters minimum)' }, { status: 400 })
  }

  // 2. Bolt-on human-touch cap enforcement (Phase D stub — present so the
  // path exists when Phase D unblocks). If a monthly cap is set, check
  // how many purchases this buyer made this calendar month.
  if (product.kind === 'bolt_on_human' && meta.monthly_cap !== null && meta.monthly_cap !== undefined) {
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)
    const { count } = await admin
      .from('digital_asset_purchases')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product_id)
      .ilike('email_at_purchase', normalisedEmail)
      .in('status', ['paid', 'fulfilled'])
      .gte('purchased_at', startOfMonth.toISOString())
    if ((count ?? 0) >= meta.monthly_cap) {
      return NextResponse.json({
        error: `Monthly cap reached (${meta.monthly_cap}). This bolt-on resets at the start of next month.`,
      }, { status: 429 })
    }
  }

  // 3. Make sure we have a Stripe Product + Price (lazy create on first sale).
  let stripeProductId = product.stripe_product_id
  if (!stripeProductId) {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      metadata: { kind: product.kind, slug: meta.slug },
    })
    stripeProductId = stripeProduct.id
    await admin.from('be_products').update({ stripe_product_id: stripeProductId }).eq('id', product_id)
  }

  let stripePriceId = product.stripe_price_id
  if (!stripePriceId) {
    const amountCents = Math.round((product.price ?? 0) * 100)
    if (amountCents <= 0) {
      return NextResponse.json({ error: 'Product price not set' }, { status: 500 })
    }
    const stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: 'aud',
    })
    stripePriceId = stripePrice.id
    await admin.from('be_products').update({ stripe_price_id: stripePriceId }).eq('id', product_id)
  }

  // 4. Create the Stripe Checkout Session.
  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: normalisedEmail,
      line_items: [{ price: stripePriceId, quantity: 1 }],
      metadata: {
        type: 'digital_asset_purchase',
        product_id,
        email: normalisedEmail,
        slug: meta.slug,
        source: source ?? 'direct',
        // Stripe metadata values cap at 500 chars; ad-detail UI caps at 480
        // as the canonical limit. Belt-and-suspenders slice here.
        ...(trimmedQuestion && { question: trimmedQuestion.slice(0, 480) }),
        ...(trimmedConstraints && { constraints: trimmedConstraints.slice(0, 480) }),
      },
      success_url: `${appUrl()}/library/pending?email=${encodeURIComponent(normalisedEmail)}&slug=${encodeURIComponent(meta.slug)}`,
      cancel_url: `${appUrl()}/`,
    })
  } catch (err) {
    console.error('[digital-assets/checkout] Stripe error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
