// Library index for the entitlement holder.
//
// `token` can be either:
//   - a membership_enrollments.token (member: lists the whole library)
//   - a digital_asset_purchases.id   (cold buyer: shows their one asset)
//
// Decisions C3 + Q1 locked 2026-06-06: this is the single canonical
// library surface. Reader content is served from Supabase Storage via
// signed URL by /library/[token]/[slug].

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type LibraryItem = {
  slug: string
  title: string
  state_match: string | null
  kind: string | null
}

async function resolveTokenContext(token: string): Promise<
  | { kind: 'member'; firstName: string; assets: LibraryItem[] }
  | { kind: 'purchase'; firstName: string; assets: LibraryItem[] }
  | null
> {
  const admin = createAdminClient()

  // Try membership first.
  const { data: member } = await admin
    .from('membership_enrollments')
    .select('first_name, email, cancelled_at')
    .eq('token', token)
    .maybeSingle()

  if (member && !member.cancelled_at) {
    // Active member: field_guides are included with Membership (always shown).
    // Protocols + AI deep-dives are PAID bolt-ons (only shown after the
    // member has a fulfilled digital_asset_purchases row for that product).
    const { data: products } = await admin
      .from('be_products')
      .select('id, name, kind, digital_asset_metadata!inner(slug, state_match, active)')
      .in('kind', ['field_guide', 'protocol', 'bolt_on_ai'])

    // Pull the member's purchased product_ids so we can filter bolt-ons.
    const { data: purchases } = await admin
      .from('digital_asset_purchases')
      .select('product_id, status')
      .eq('email_at_purchase', member.email.toLowerCase())
      .in('status', ['paid', 'fulfilled'])
    const purchasedIds = new Set((purchases ?? []).map(p => p.product_id))

    const assets: LibraryItem[] = (products ?? [])
      .map(p => {
        const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
        if (!meta || !meta.active) return null
        // Field Guides are member-entitled by default.
        // Bolt-on kinds gate on purchase.
        const isBoltOn = p.kind === 'protocol' || p.kind === 'bolt_on_ai'
        if (isBoltOn && !purchasedIds.has(p.id)) return null
        return { slug: meta.slug, title: p.name, state_match: meta.state_match, kind: p.kind }
      })
      .filter((x): x is LibraryItem => x !== null)
    return { kind: 'member', firstName: member.first_name ?? 'there', assets }
  }

  // Otherwise treat token as a purchase id.
  const { data: purchase } = await admin
    .from('digital_asset_purchases')
    .select('email_at_purchase, status, product_id')
    .eq('id', token)
    .maybeSingle()

  if (purchase && ['paid', 'fulfilled'].includes(purchase.status)) {
    const { data: product } = await admin
      .from('be_products')
      .select('name, kind, digital_asset_metadata!inner(slug, state_match)')
      .eq('id', purchase.product_id)
      .maybeSingle()
    if (!product) return null
    const meta = Array.isArray(product.digital_asset_metadata) ? product.digital_asset_metadata[0] : product.digital_asset_metadata
    if (!meta) return null
    return {
      kind: 'purchase',
      firstName: purchase.email_at_purchase.split('@')[0],
      assets: [{ slug: meta.slug, title: product.name, state_match: meta.state_match, kind: product.kind }],
    }
  }

  return null
}

export default async function LibraryIndexPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const context = await resolveTokenContext(token)
  if (!context) return notFound()

  const heading = context.kind === 'member'
    ? 'Your Body Recode Library.'
    : 'Your purchase.'
  const subtitle = context.kind === 'member'
    ? 'Every Field Guide is included with your Membership. Bolt-ons you have purchased land here too.'
    : 'Your delivery is ready below.'

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        borderBottom: '1px solid #E5E5E5',
        padding: '20px 24px',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {context.kind === 'member' && (
        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '14px 24px 0', textAlign: 'right' }}>
          <Link href={`/library/${token}/store`} style={{
            fontSize: '12px', fontWeight: 700, color: '#1B6DFC',
            textDecoration: 'none', letterSpacing: '0.06em',
          }}>
            Bolt-on store  →
          </Link>
        </div>
      )}

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 24px 24px' }}>
        <p style={{
          fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: '14px',
        }}>
          Body Recode Library
        </p>
        <h1 style={{
          fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.1,
          color: '#1A1A1A', marginBottom: '14px',
        }}>
          {heading.split(' ').slice(0, -1).join(' ')} <span style={{ color: '#1B6DFC' }}>{heading.split(' ').slice(-1)[0]}</span>
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '36px' }}>
          {subtitle}
        </p>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px 80px' }}>
        {context.assets.length === 0 && (
          <div style={{
            background: '#FAFAFA',
            border: '1px solid #E5E5E5',
            borderRadius: '14px',
            padding: '36px 28px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '15px', color: '#4A4A4A', margin: 0 }}>
              No Field Guides published yet. Check back soon.
            </p>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
          {context.assets.map(asset => (
            <Link
              key={asset.slug}
              href={`/library/${token}/${asset.slug}`}
              style={{
                display: 'block',
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderRadius: '14px',
                padding: '22px 24px',
                textDecoration: 'none',
                color: 'inherit',
              }}
            >
              <p style={{
                fontSize: '11px', fontWeight: 700, color: '#1B6DFC',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                margin: '0 0 8px',
              }}>
                {asset.kind === 'field_guide' ? 'Field Guide' : 'Protocol Pack'}
                {asset.state_match ? ` · ${asset.state_match}` : ''}
              </p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
                {asset.title} →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
