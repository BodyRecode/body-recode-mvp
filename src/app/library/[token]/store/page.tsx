// Member-gated bolt-on store.
//
// Plan §3.1 (locked 2026-06-06): Bolt-ons are members-only. The store
// surface is visible only to active-subscription members.
//
// Route: /library/{token}/store
//   - if token is an active membership_enrollments.token: render the catalog
//   - otherwise: render the upgrade-prompt state
//
// Lists every active product with kind IN ('protocol', 'bolt_on_ai',
// 'bolt_on_human', 'bolt_on_physical'), grouped by category. Each card
// has a checkout button that POSTs to /api/digital-assets/checkout.
//
// Delivery uses the same Stripe webhook fulfilment paths as Field Guides.

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BoltOnCheckoutButton from './checkout-button'

type Member = {
  token: string
  first_name: string
  email: string
}

async function resolveMember(token: string): Promise<Member | null> {
  const admin = createAdminClient()
  const { data: member } = await admin
    .from('membership_enrollments')
    .select('token, first_name, email, cancelled_at')
    .eq('token', token)
    .maybeSingle()
  if (member && !member.cancelled_at) {
    return { token: member.token, first_name: member.first_name ?? 'there', email: member.email }
  }
  return null
}

type StoreProduct = {
  id: string
  name: string
  description: string | null
  price: number
  kind: string
  slug: string
  category_label: string
}

const KIND_TO_LABEL: Record<string, string> = {
  'protocol': 'Protocol Packs',
  'bolt_on_ai': 'AI Deep-Dives',
  'bolt_on_human': 'Coach Touchpoints',
  'bolt_on_physical': 'Physical Products',
}

async function loadBoltOns(): Promise<StoreProduct[]> {
  const admin = createAdminClient()
  const { data: products } = await admin
    .from('be_products')
    .select('id, name, description, price, kind, digital_asset_metadata!inner(slug, active)')
    .in('kind', ['protocol', 'bolt_on_ai', 'bolt_on_human', 'bolt_on_physical'])
  if (!products) return []
  return products
    .map(p => {
      const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
      if (!meta || !meta.active) return null
      return {
        id: p.id,
        name: p.name,
        description: p.description ?? null,
        price: Number(p.price) || 0,
        kind: p.kind,
        slug: meta.slug,
        category_label: KIND_TO_LABEL[p.kind] ?? 'Other',
      } as StoreProduct
    })
    .filter((x): x is StoreProduct => x !== null)
}

function UpgradePrompt() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '20px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <img src="https://bodyrecode.au/logo-black.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '88px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Members only
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#1A1A1A', marginBottom: '18px' }}>
          The bolt-on store unlocks inside Membership.
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', margin: '0 auto 24px' }} />
        <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '32px' }}>
          Protocol packs and AI deep-dives are members-only à-la-carte add-ons. They unlock the moment you join the Body Recode Membership at $49 per week.
        </p>
        <Link
          href="/membership?source=bolt_on_store_locked"
          style={{
            display: 'inline-block', padding: '14px 24px',
            background: '#1B6DFC', color: '#FFFFFF',
            fontSize: '14px', fontWeight: 800,
            borderRadius: '10px', textDecoration: 'none',
          }}
        >
          Join the Membership →
        </Link>
      </div>
    </div>
  )
}

export default async function BoltOnStorePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const member = await resolveMember(token)
  if (!member) return <UpgradePrompt />

  const products = await loadBoltOns()
  const grouped = products.reduce<Record<string, StoreProduct[]>>((acc, p) => {
    if (!acc[p.category_label]) acc[p.category_label] = []
    acc[p.category_label].push(p)
    return acc
  }, {})
  // Stable group order matching the inventory order
  const ORDER = ['Protocol Packs', 'AI Deep-Dives', 'Coach Touchpoints', 'Physical Products']

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href={`/library/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to library
          </Link>
          <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '52px 24px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Members only  ·  Bolt-on store
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#1A1A1A', marginBottom: '14px' }}>
          Add to your <span style={{ color: '#1B6DFC' }}>Membership.</span>
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
          Hi {member.first_name}. These are à-la-carte add-ons available to active members. Each is instantly delivered to your inbox and added to your library.
        </p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px 80px' }}>
        {products.length === 0 && (
          <div style={{ background: '#FAFAFA', border: '1px solid #E5E5E5', borderRadius: '14px', padding: '36px 28px', textAlign: 'center' }}>
            <p style={{ fontSize: '15px', color: '#4A4A4A', margin: 0 }}>
              No bolt-ons published yet. Check back soon.
            </p>
          </div>
        )}

        {ORDER.map(group => {
          const items = grouped[group]
          if (!items || items.length === 0) return null
          return (
            <div key={group} style={{ marginBottom: '48px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
                {group}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                {items.map(p => (
                  <div key={p.id} style={{
                    background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
                    padding: '22px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '200px',
                  }}>
                    <div>
                      <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                        {p.name}
                      </p>
                      {p.description && (
                        <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, margin: '10px 0 0' }}>
                          {p.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '18px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: '#1A1A1A' }}>
                        ${p.price.toFixed(0)}
                      </span>
                      <BoltOnCheckoutButton
                        productId={p.id}
                        email={member.email}
                        source={`bolt_on_store_${p.kind}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
