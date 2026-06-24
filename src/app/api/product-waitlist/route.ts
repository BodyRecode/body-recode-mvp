// Product waitlist signup endpoint. Called from the performance.bodyrecode.au
// scorecard result page when a lead clicks "Join the waitlist" on one of the
// three Coming Soon product CTAs (Challenge / Blueprint / Membership).
//
// Idempotent on (email, product) - re-clicks return success without
// duplicate inserts.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireMetaCapiEvent, extractClientContext } from '@/lib/meta-capi'

type Product = 'challenge' | 'blueprint' | 'membership' | 'extension'

const ALLOWED_PRODUCTS: Product[] = ['challenge', 'blueprint', 'membership', 'extension']

// CORS: performance.bodyrecode.au and localhost (dev). Matches the pattern
// already used by /api/scorecard/submit and /api/scorecard-report/checkout.
const ALLOWED_ORIGINS = new Set([
  'https://performance.bodyrecode.au',
  'http://localhost:3000',
  'http://localhost:3001',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : 'https://performance.bodyrecode.au'
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
}

export async function OPTIONS(req: Request) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) })
}

export async function POST(req: Request) {
  const headers = corsHeaders(req.headers.get('origin'))

  let body: {
    email?: string
    first_name?: string
    last_name?: string
    phone?: string
    gender?: string
    body_state?: string
    product?: string
    source?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers })
  }

  const email = (body.email ?? '').trim().toLowerCase()
  const product = (body.product ?? '').trim() as Product
  const first_name = body.first_name?.trim() || null
  const last_name = body.last_name?.trim() || null
  const phone = body.phone?.trim() || null
  const gender = ['male', 'female', 'prefer_not_to_say'].includes((body.gender ?? '').trim())
    ? (body.gender ?? '').trim()
    : null
  const body_state = body.body_state?.trim() || null
  const source = body.source?.trim() || null

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400, headers })
  }
  if (!ALLOWED_PRODUCTS.includes(product)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400, headers })
  }

  const admin = createAdminClient()

  // Upsert on (email, product) - the unique index makes this idempotent.
  // If the row already exists, the conflict-on-do-nothing behavior keeps the
  // original first_name / body_state / source from the first signup.
  const { error } = await admin
    .from('product_waitlist')
    .upsert(
      { email, first_name, last_name, phone, gender, body_state, product, source },
      { onConflict: 'email,product', ignoreDuplicates: true },
    )

  if (error) {
    console.error('[product-waitlist] insert error', error)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500, headers })
  }

  // Fire Meta CAPI Lead event server-side. Waitlist signup = strong intent
  // signal (visitor saw the product LP + handed over email). Until the
  // Challenge / Blueprint / Membership signup forms go live, waitlist is
  // the closest cold-funnel conversion event we can optimise on.
  // Non-blocking so any CAPI failure cannot break the waitlist response.
  try {
    const { clientIp, clientUserAgent } = extractClientContext(req)
    await fireMetaCapiEvent({
      eventName: 'Lead',
      eventSourceUrl: `https://bodyrecode.au/${product}`,
      actionSource: 'website',
      userData: {
        email,
        firstName: first_name || undefined,
        lastName: last_name || undefined,
        phone: phone || undefined,
        country: 'AU',
        clientIp,
        clientUserAgent,
      },
      customData: {
        content_name: `waitlist_${product}`,
        content_category: body_state || 'unknown_state',
        source: source || 'unknown_source',
      },
    })
  } catch (capiErr) {
    console.error('[product-waitlist] CAPI fire threw (non-fatal):', capiErr)
  }

  return NextResponse.json({ ok: true, product }, { status: 200, headers })
}
