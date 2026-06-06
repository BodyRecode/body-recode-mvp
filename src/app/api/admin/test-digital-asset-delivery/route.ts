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
import { appUrl } from '@/lib/app-url'
import { buildDigitalAssetDeliveryEmail, ascensionCtaFor, type AscensionTarget } from '@/lib/digital-asset-emails'

const LIBRARY_BUCKET = 'library-assets'

async function handle(request: NextRequest) {
  const url = new URL(request.url)
  const secret = url.searchParams.get('secret')
  const email = (url.searchParams.get('email') ?? '').toLowerCase().trim()
  const slug = url.searchParams.get('slug') ?? 'depleted-field-guide'

  if (!secret || secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
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
  const { data: purchase, error: purchaseError } = await admin
    .from('digital_asset_purchases')
    .insert({
      client_id: null,
      email_at_purchase: email,
      product_id: product.id,
      stripe_payment_id: `test-${Date.now()}`,
      stripe_session_id: `cs_test_admin_${Date.now()}`,
      status: 'paid',
      source: 'admin_test_delivery',
    })
    .select('id')
    .single()
  if (purchaseError || !purchase) {
    return NextResponse.json({ error: 'Failed to create test purchase', detail: purchaseError?.message }, { status: 500 })
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
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
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
