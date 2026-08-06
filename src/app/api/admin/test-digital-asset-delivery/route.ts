// Admin-only test endpoint: simulates a digital_asset_purchase webhook
// so the full delivery flow can be exercised without an actual Stripe
// payment. Use to verify the email, the signed PDF URL, and the reader
// route all work end-to-end. Creates a real digital_asset_purchases row
// so the reader URL stays valid for the buyer's normal lifetime.
//
// GET (or POST) /api/admin/test-digital-asset-delivery
//   ?secret=ADMIN_SECRET
//   &email=kade@bodyrecode.au
//   &slug=depleted-field-guide
//
// Returns JSON with the inserted purchase_id + the reader URL.

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { appUrl } from '@/lib/app-url'
import { buildDigitalAssetDeliveryEmail, ascensionCtaFor, type AscensionTarget } from '@/lib/digital-asset-emails'
import { fromCoach } from '@/lib/email-shell'
import { isCoachUser } from '@/lib/api-auth'

const LIBRARY_BUCKET = 'library-assets'

async function handle(request: NextRequest) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  const email = (url.searchParams.get('email') ?? '').toLowerCase().trim()
  const slug = url.searchParams.get('slug') ?? 'depleted-field-guide'
  // Test-only: pin the engine to a specific client's data (the email param
  // still controls who the delivery email goes to). Lets us exercise a
  // bolt_on_ai product against a real client without spamming them.
  const asClientId = url.searchParams.get('as_client_id') ?? null
  // Test-only: for member_question and member_custom_block deep-dives, the
  // buyer's free-text input is captured pre-purchase via the ad-detail form
  // and threaded through Stripe metadata to the webhook. Bypassing Stripe in
  // this test endpoint, we accept the input as a query param and write it
  // directly onto raw.{question|constraints} so the orchestrator can read it.
  const testQuestion = url.searchParams.get('question') ?? null
  const testConstraints = url.searchParams.get('constraints') ?? null
  // For weekly_pattern_report deep-dives, delivery_number controls which of
  // the 4 reports this is (used in meta line + prompt context).
  const testDeliveryNumber = url.searchParams.get('delivery_number')
    ? Number(url.searchParams.get('delivery_number'))
    : null

  // Accept either: a matching ADMIN_SECRET query param, OR an authenticated
  // Supabase session (admin coach logged into the dashboard). The latter
  // lets Kade hit this from his browser without copying the env secret.
  let authed = false
  if (secret && process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET) {
    authed = true
  } else {
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      // Signed in is not enough: portal clients hold a valid session too.
      if (await isCoachUser(user)) authed = true
    } catch {
      // ignore
    }
  }
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorised — sign in to the dashboard first, or pass ?secret=ADMIN_SECRET' }, { status: 401 })
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'email query param required' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 1. Look up the Field Guide product by slug.
  const { data: meta, error: metaError } = await admin
    .from('digital_asset_metadata')
    .select('product_id, slug, source_path, fulfilment_kind, ascension_cta_path, active')
    .eq('slug', slug)
    .maybeSingle()
  if (metaError || !meta) {
    return NextResponse.json({ error: `No active Field Guide found for slug "${slug}"`, detail: metaError?.message }, { status: 404 })
  }
  if (!meta.active) {
    return NextResponse.json({ error: 'Asset is not active' }, { status: 404 })
  }

  const { data: product, error: productError } = await admin
    .from('be_products')
    .select('id, name, kind')
    .eq('id', meta.product_id)
    .maybeSingle()
  if (productError || !product) {
    return NextResponse.json({ error: 'Product not found', detail: productError?.message }, { status: 404 })
  }

  // 2. Create the purchase row (status='paid' to mirror webhook).
  // If as_client_id is set, pin the engine to that client's data.
  const { data: purchase, error: purchaseError } = await admin
    .from('digital_asset_purchases')
    .insert({
      client_id: asClientId,
      email_at_purchase: email,
      product_id: product.id,
      stripe_payment_id: `test-${Date.now()}`,
      stripe_session_id: `cs_test_admin_${Date.now()}`,
      status: 'paid',
      source: 'admin_test_delivery',
      raw: testQuestion || testConstraints || testDeliveryNumber
        ? {
            ...(testQuestion ? { question: testQuestion } : {}),
            ...(testConstraints ? { constraints: testConstraints } : {}),
            ...(testDeliveryNumber ? { delivery_number: testDeliveryNumber } : {}),
          }
        : null,
    })
    .select('id')
    .single()
  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Failed to create test purchase', detail: purchaseError?.message }, { status: 500 })
  }

  // 2a. If this is an instant_engine product, run the orchestrator inline
  // (bypassing Inngest so the response surfaces any error immediately).
  if (meta.fulfilment_kind === 'instant_engine') {
    try {
      const { fulfilInstantEngine } = await import('@/lib/instant-engine-fulfilment')
      await fulfilInstantEngine(purchase.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      return NextResponse.json({
        error: 'instant_engine fulfilment failed',
        detail: msg,
        purchase_id: purchase.id,
      }, { status: 500 })
    }
    const { data: refetched } = await admin
      .from('digital_asset_purchases')
      .select('status, output_ref, fulfilled_at')
      .eq('id', purchase.id)
      .maybeSingle()
    return NextResponse.json({
      ok: true,
      purchase_id: purchase.id,
      product: product.name,
      email,
      fulfilment_kind: 'instant_engine',
      status: refetched?.status,
      output_ref: refetched?.output_ref,
      fulfilled_at: refetched?.fulfilled_at,
      note: 'A real digital_asset_purchases row was created. Delete it from Supabase if you want to keep prod data clean.',
    })
  }

  // 3. Sign a 24-hour PDF download URL.
  const { data: signed, error: signError } = await admin.storage
    .from(LIBRARY_BUCKET)
    .createSignedUrl(meta.source_path, 60 * 60 * 24)
  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Failed to sign PDF URL — check that the PDF exists in Storage at the expected path', detail: signError?.message, source_path: meta.source_path }, { status: 500 })
  }
  const pdfUrl = signed.signedUrl
  const readerUrl = `${appUrl()}/library/${purchase.id}/${meta.slug}`

  // 4. Send the delivery email (identical to real-purchase flow).
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = email.split('@')[0]
    const target = (meta.ascension_cta_path as AscensionTarget) || 'depleted'
    const ascension = ascensionCtaFor(target, 'admin_test')
    const built = buildDigitalAssetDeliveryEmail({
      firstName,
      productTitle: product.name,
      pdfUrl,
      readerUrl,
      ascensionCtaLabel: ascension.label,
      ascensionCtaUrl: ascension.url,
    })
    try {
      await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: `[TEST] ${built.subject}`,
        html: built.html,
      })
    } catch (e) {
      console.error('[test-digital-asset-delivery] email send error:', e)
    }
  }

  // 5. Mark the purchase fulfilled.
  await admin
    .from('digital_asset_purchases')
    .update({
      status: 'fulfilled',
      fulfilled_at: new Date().toISOString(),
      output_ref: pdfUrl,
    })
    .eq('id', purchase.id)

  return NextResponse.json({
    ok: true,
    purchase_id: purchase.id,
    product: product.name,
    email,
    pdf_url: pdfUrl,
    reader_url: readerUrl,
    note: 'A real digital_asset_purchases row was created. Delete it from Supabase if you want to keep prod data clean.',
  })
}

export const GET = handle
export const POST = handle
