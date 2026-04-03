import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

// Stripe only supports 'week' | 'month' — map our intervals
function stripeInterval(interval: string): { interval: Stripe.PriceCreateParams.Recurring.Interval; interval_count: number } {
  switch (interval) {
    case 'weekly': return { interval: 'week', interval_count: 1 }
    case 'fortnightly': return { interval: 'week', interval_count: 2 }
    case 'monthly': return { interval: 'month', interval_count: 1 }
    default: return { interval: 'week', interval_count: 1 }
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { product_id } = await request.json()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  // Load product
  const { data: product, error } = await supabase
    .from('be_products')
    .select('*')
    .eq('id', product_id)
    .eq('coach_id', user.id)
    .single()

  if (error || !product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

  // Return cached link if exists
  if (product.stripe_payment_link_url) {
    return NextResponse.json({ url: product.stripe_payment_link_url })
  }

  // Create Stripe Product if needed
  let stripeProductId = product.stripe_product_id
  if (!stripeProductId) {
    const stripeProduct = await stripe.products.create({
      name: product.name,
      ...(product.description ? { description: product.description } : {}),
    })
    stripeProductId = stripeProduct.id
  }

  // Create Stripe Price
  let stripePrice: Stripe.Price
  const amountCents = Math.round((product.price ?? 0) * 100)

  if (product.type === 'subscription' && product.billing_interval) {
    const rec = stripeInterval(product.billing_interval)
    stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: 'aud',
      recurring: { interval: rec.interval, interval_count: rec.interval_count },
    })
  } else {
    stripePrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: amountCents,
      currency: 'aud',
    })
  }

  // Create Stripe Payment Link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: stripePrice.id, quantity: 1 }],
    ...(product.type === 'subscription'
      ? {}
      : { after_completion: { type: 'hosted_confirmation', hosted_confirmation: { custom_message: 'Thank you — your payment has been received. The Body Recode team will be in touch shortly.' } } }),
  })

  // Save back to DB
  await supabase
    .from('be_products')
    .update({
      stripe_product_id: stripeProductId,
      stripe_price_id: stripePrice.id,
      stripe_payment_link_url: paymentLink.url,
    })
    .eq('id', product_id)

  return NextResponse.json({ url: paymentLink.url })
}
