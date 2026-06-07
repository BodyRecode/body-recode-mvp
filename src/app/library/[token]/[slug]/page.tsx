// Library reader for a specific Field Guide / protocol pack.
//
// Token disambiguation:
//   - membership_enrollments.token  → active member, has access to all field_guide + protocol
//   - digital_asset_purchases.id    → cold buyer, has access only to their one purchased asset
//
// On match, generates a signed Supabase Storage URL for the PDF and
// embeds it inline (browser PDF viewer). Single-page UX — no separate
// download click required.

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

const LIBRARY_BUCKET = 'library-assets'

async function resolveAccess(
  token: string,
  slug: string,
): Promise<{ pdfUrl: string; title: string; firstName: string; backHref: string; isMember: boolean } | null> {
  const admin = createAdminClient()

  // 1. Load the asset by slug so we know what file we are serving.
  const { data: meta } = await admin
    .from('digital_asset_metadata')
    .select('product_id, source_path, active')
    .eq('slug', slug)
    .maybeSingle()
  if (!meta || !meta.active) return null

  const { data: product } = await admin
    .from('be_products')
    .select('name, kind')
    .eq('id', meta.product_id)
    .maybeSingle()
  if (!product) return null

  // 2. Try membership token first.
  const { data: member } = await admin
    .from('membership_enrollments')
    .select('first_name, email, cancelled_at')
    .eq('token', token)
    .maybeSingle()

  if (member && !member.cancelled_at) {
    const isLibraryAsset = product.kind === 'field_guide' || product.kind === 'protocol'
    if (!isLibraryAsset) return null
    // Active member: signed URL.
    const { data: signed } = await admin.storage
      .from(LIBRARY_BUCKET)
      .createSignedUrl(meta.source_path, 60 * 60 * 24)
    if (!signed?.signedUrl) return null
    return {
      pdfUrl: signed.signedUrl,
      title: product.name,
      firstName: member.first_name ?? 'there',
      backHref: `/library/${token}`,
      isMember: true,
    }
  }

  // 3. Otherwise treat as a digital_asset_purchases.id.
  const { data: purchase } = await admin
    .from('digital_asset_purchases')
    .select('email_at_purchase, product_id, status')
    .eq('id', token)
    .maybeSingle()

  if (purchase && ['paid', 'fulfilled'].includes(purchase.status) && purchase.product_id === meta.product_id) {
    const { data: signed } = await admin.storage
      .from(LIBRARY_BUCKET)
      .createSignedUrl(meta.source_path, 60 * 60 * 24)
    if (!signed?.signedUrl) return null
    return {
      pdfUrl: signed.signedUrl,
      title: product.name,
      firstName: purchase.email_at_purchase.split('@')[0],
      backHref: `/library/${token}`,
      isMember: false,
    }
  }

  return null
}

export default async function LibraryReaderPage({
  params,
}: {
  params: Promise<{ token: string; slug: string }>
}) {
  const { token, slug } = await params
  const access = await resolveAccess(token, slug)
  if (!access) return notFound()

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FAFAFA',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        borderBottom: '1px solid #E5E5E5',
        background: '#FFFFFF',
        padding: '14px 24px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href={access.backHref} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to library
          </Link>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0 }}>
            {access.title}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {access.isMember && (
              <Link href={`/membership/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
                Membership home →
              </Link>
            )}
            <a
              href={access.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}
            >
              Download PDF ↗
            </a>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px 24px 40px' }}>
        <iframe
          src={access.pdfUrl}
          style={{
            width: '100%',
            height: '85vh',
            border: '1px solid #E5E5E5',
            borderRadius: '12px',
            background: '#FFFFFF',
          }}
          title={access.title}
        />
      </div>
    </div>
  )
}
