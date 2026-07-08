// Product waitlist signup endpoint. Called from the performance.bodyrecode.au
// scorecard result page when a lead clicks "Join the waitlist" on one of the
// three Coming Soon product CTAs (Challenge / Blueprint / Membership).
//
// Idempotent on (email, product) - re-clicks return success without
// duplicate inserts.

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { fireMetaCapiEvent, extractClientContext } from '@/lib/meta-capi'
import { inngest } from '@/lib/inngest'
import { persistSmsOptIn } from '@/lib/speed-to-lead-sms'
import { getDefaultCoachId } from '@/lib/default-coach'
import { brand } from "@/config/tenant";
import { sendProductWaitlistWelcomeEmail, sendCoachWaitlistNotification, type WaitlistProduct } from '@/lib/product-waitlist-welcome-email'

type Product = 'challenge' | 'blueprint' | 'membership' | 'extension'

const ALLOWED_PRODUCTS: Product[] = ['challenge', 'blueprint', 'membership', 'extension']

// CORS: performance.bodyrecode.au and localhost (dev). Matches the pattern
// already used by /api/scorecard/submit and /api/scorecard-report/checkout.
const ALLOWED_ORIGINS = new Set([
  brand().performanceDomain,
  'http://localhost:3000',
  'http://localhost:3001',
])

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.has(origin) ? origin : brand().performanceDomain
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
    sms_opt_in?: boolean
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
  const sms_opt_in = body.sms_opt_in === true

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Valid email is required' }, { status: 400, headers })
  }
  if (!ALLOWED_PRODUCTS.includes(product)) {
    return NextResponse.json({ error: 'Invalid product' }, { status: 400, headers })
  }

  const admin = createAdminClient()

  // Explicit new-vs-existing check so we only fire welcome + coach-notify
  // emails on the FIRST join. Re-clicks (same email, same product) return
  // 200 but skip the send path.
  const { data: existingRow } = await admin
    .from('product_waitlist')
    .select('id')
    .eq('email', email)
    .eq('product', product)
    .maybeSingle()

  const isNewRow = !existingRow

  if (isNewRow) {
    const { error } = await admin
      .from('product_waitlist')
      .insert({ email, first_name, last_name, phone, gender, body_state, product, source })

    if (error) {
      console.error('[product-waitlist] insert error', error)
      return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500, headers })
    }
  }

  // Welcome + coach-notify emails. Only fire on NEW row (not on re-clicks)
  // and only for the three consumer products (skip 'extension' which is an
  // internal signup path). Silent-fail so waitlist response never depends
  // on email pipeline health.
  const EMAIL_PRODUCTS: Product[] = ['challenge', 'blueprint', 'membership']
  if (isNewRow && EMAIL_PRODUCTS.includes(product)) {
    try {
      await sendProductWaitlistWelcomeEmail({
        to: email,
        firstName: first_name,
        product: product as WaitlistProduct,
      })
    } catch (err) {
      console.error('[product-waitlist] welcome email failed (non-fatal):', err)
    }
    try {
      await sendCoachWaitlistNotification({
        email,
        firstName: first_name,
        lastName: last_name,
        phone,
        gender,
        bodyState: body_state,
        product: product as WaitlistProduct,
        source,
        smsOptIn: sms_opt_in,
      })
    } catch (err) {
      console.error('[product-waitlist] coach notify failed (non-fatal):', err)
    }
  }

  // Speed-to-lead SMS path. Silent-fail - waitlist success never depends on
  // the SMS pipeline. Only runs when opt-in is ticked + phone is present.
  if (sms_opt_in && phone) {
    try {
      // Find-or-create a lead row so persistSmsOptIn + Inngest have something
      // to attach to. Upsert on email; the leads table doesn't have a
      // unique index on email so we do the check-then-insert manually.
      const { data: existingLead } = await admin
        .from('leads')
        .select('id')
        .eq('email', email)
        .maybeSingle()

      let leadId: string | null = existingLead?.id ?? null

      if (!leadId) {
        const coachId = await getDefaultCoachId(admin)
        const fullName = [first_name, last_name].filter(Boolean).join(' ').trim() || null
        const { data: inserted, error: leadErr } = await admin
          .from('leads')
          .insert({
            coach_id: coachId,
            email,
            name: fullName,
            phone,
            gender,
            source: source ?? `waitlist_${product}`,
          })
          .select('id')
          .single()
        if (leadErr) throw leadErr
        leadId = inserted.id
      } else if (phone) {
        // Update phone if changed / previously null
        await admin.from('leads').update({ phone }).eq('id', leadId)
      }

      if (leadId) {
        await persistSmsOptIn(leadId, phone)
        await inngest.send({
          name: 'waitlist/joined',
          data: {
            leadId,
            product,
            productName: product === 'challenge' ? '14-Day Body Decode'
              : product === 'blueprint' ? '6-Week Body Rewire Blueprint'
              : product === 'membership' ? 'Body Recode Membership'
              : 'Body Recode',
          },
        })
      }
    } catch (smsErr) {
      console.error('[product-waitlist] SMS opt-in / speed-to-lead failed (non-fatal):', smsErr)
    }
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
      eventSourceUrl: `${brand().marketingDomain}/${product}`,
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
