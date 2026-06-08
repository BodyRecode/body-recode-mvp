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
// shows the pack cover thumbnail + tagline and links through to
// /store/{slug} (the actual ad page) where the checkout happens.

import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { BOLT_ON_AD_COPY } from '@/lib/bolt-on-ad-copy'

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
  cover_signed_url: string | null
  tagline: string | null
}

const KIND_TO_LABEL: Record<string, string> = {
  'protocol': 'Protocol Packs',
  'bolt_on_ai': 'AI Deep-Dives',
  'bolt_on_human': 'Coach Touchpoints',
  'bolt_on_physical': 'Physical Products',
}

async function memberHasClient(email: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id')
    .ilike('email', email)
    .maybeSingle()
  return !!client
}

async function loadBoltOns(memberEmail: string): Promise<StoreProduct[]> {
  const admin = createAdminClient()
  const isCoachingClient = await memberHasClient(memberEmail)
  // AI Deep-Dives require a coaching clients row (their engines read CFFS/CFWS/programs).
  // Filter the kinds we query for accordingly.
  const visibleKinds = isCoachingClient
    ? ['protocol', 'bolt_on_ai', 'bolt_on_human', 'bolt_on_physical']
    : ['protocol', 'bolt_on_human', 'bolt_on_physical']

  const { data: products } = await admin
    .from('be_products')
    .select('id, name, description, price, kind, digital_asset_metadata!inner(slug, active)')
    .in('kind', visibleKinds)
  if (!products) return []

  const enriched = await Promise.all(products.map(async p => {
    const meta = Array.isArray(p.digital_asset_metadata) ? p.digital_asset_metadata[0] : p.digital_asset_metadata
    if (!meta || !meta.active) return null
    const copy = BOLT_ON_AD_COPY[meta.slug]
    let coverSigned: string | null = null
    if (copy?.cover_path) {
      const { data } = await admin.storage
        .from('library-assets')
        .createSignedUrl(copy.cover_path, 60 * 60 * 24)
      coverSigned = data?.signedUrl ?? null
    }
    return {
      id: p.id,
      name: p.name,
      description: p.description ?? null,
      price: Number(p.price) || 0,
      kind: p.kind,
      slug: meta.slug,
      category_label: KIND_TO_LABEL[p.kind] ?? 'Other',
      cover_signed_url: coverSigned,
      tagline: copy?.tagline ?? null,
    } as StoreProduct
  }))
  return enriched.filter((x): x is StoreProduct => x !== null)
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

  const products = await loadBoltOns(member.email)
  const grouped = products.reduce<Record<string, StoreProduct[]>>((acc, p) => {
    if (!acc[p.category_label]) acc[p.category_label] = []
    acc[p.category_label].push(p)
    return acc
  }, {})
  const ORDER = ['Protocol Packs', 'AI Deep-Dives', 'Coach Touchpoints', 'Physical Products']

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href={`/library/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Back to library
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href={`/membership/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
              Membership home →
            </Link>
            <img src="https://bodyrecode.au/logo-black.png" width="140" alt="Body Recode" style={{ display: 'block' }} />
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '52px 24px 24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Members only  ·  Bolt-on store
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#1A1A1A', marginBottom: '14px' }}>
          Add to your <span style={{ color: '#1B6DFC' }}>Membership.</span>
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, marginBottom: '40px' }}>
          Hi {member.first_name}. These are à-la-carte add-ons available to active members. Tap any pack to read what is inside.
        </p>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px 80px' }}>
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
            <div key={group} style={{ marginBottom: '52px' }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '18px' }}>
                {group}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {items.map(p => (
                  <Link
                    key={p.id}
                    href={`/library/${token}/store/${p.slug}`}
                    style={{
                      display: 'block',
                      background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '14px',
                      overflow: 'hidden', textDecoration: 'none', color: 'inherit',
                    }}
                  >
                    <div style={{
                      width: '100%', aspectRatio: '1 / 1.414',
                      background: '#FAFAFA',
                      borderBottom: '1px solid #E5E5E5',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      overflow: 'hidden',
                    }}>
                      {p.cover_signed_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.cover_signed_url} alt={`${p.name} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#888', letterSpacing: '0.12em', textTransform: 'uppercase' }}>{p.name}</span>
                      )}
                    </div>
                    <div style={{ padding: '20px 22px 22px' }}>
                      <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', margin: 0, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                        {p.name}
                      </p>
                      {p.tagline && (
                        <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.55, margin: '8px 0 0' }}>
                          {p.tagline}
                        </p>
                      )}
                      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginTop: '16px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.02em' }}>
                          ${p.price.toFixed(0)}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                          Read more →
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
