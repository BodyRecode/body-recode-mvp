// Per-pack ad detail page.
//
// Route: /library/{member_token}/store/{slug}
//   - Member-gated. Non-members get the same upgrade prompt as the store index.
//   - Displays the cover hero, ad copy from BOLT_ON_AD_COPY, format card, and
//     a single Add-to-Membership button that POSTs to /api/digital-assets/checkout.
//
// Cover convention: library-assets/<source_path_dir>/<slug-versioned>-cover.png
// (kept in BOLT_ON_AD_COPY.cover_path so we can deviate per pack if needed).

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import BoltOnCheckoutButton from '../checkout-button'
import InputBuy from './input-buy'

// Per-engine_call input config for engines that capture a free-text payload
// pre-purchase. Other engine_call values use the simple BoltOnCheckoutButton.
const INPUT_BUY_CONFIG: Record<string, {
  label: string
  placeholder: string
  buttonLabel: string
  fieldName: 'question' | 'constraints'
}> = {
  member_question: {
    label: 'Your question',
    placeholder: 'What is actually going on with your body right now? Be specific - the more concrete your question, the sharper the response.',
    buttonLabel: 'Ask Kade',
    fieldName: 'question',
  },
  member_custom_block: {
    label: 'Your constraint',
    placeholder: 'Describe the situation. What changes for the next two weeks? Travel and where? Injury and which joint? Less time and how much? List everything that matters - the block adapts to what you write.',
    buttonLabel: 'Generate my block',
    fieldName: 'constraints',
  },
}
import { BOLT_ON_AD_COPY } from '@/lib/bolt-on-ad-copy'
import { logoUrl } from '@/config/tenant'

type Member = { token: string; first_name: string; email: string }

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

type PackProduct = {
  id: string
  name: string
  price: number
  kind: string
  slug: string
  engine_call: string | null
}

async function loadPack(slug: string): Promise<PackProduct | null> {
  const admin = createAdminClient()
  const { data: meta } = await admin
    .from('digital_asset_metadata')
    .select('slug, product_id, active, engine_call')
    .eq('slug', slug)
    .maybeSingle()
  if (!meta || !meta.active) return null
  const { data: product } = await admin
    .from('be_products')
    .select('id, name, price, kind')
    .eq('id', meta.product_id)
    .maybeSingle()
  if (!product) return null
  return {
    id: product.id,
    name: product.name,
    price: Number(product.price) || 0,
    kind: product.kind,
    slug: meta.slug,
    engine_call: meta.engine_call ?? null,
  }
}

// engine_calls whose engines read coaching-only tables. Members without a
// coaching clients row can't buy these.
const COACHING_ONLY_ENGINE_CALLS = new Set(['trajectory', 'cffs', 'fat_map', 'health_markers'])

async function signCover(coverPath: string): Promise<string | null> {
  const admin = createAdminClient()
  const { data, error } = await admin.storage
    .from('library-assets')
    .createSignedUrl(coverPath, 60 * 60 * 24)
  if (error) return null
  return data.signedUrl
}

function UpgradePrompt() {
  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '20px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '88px 24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
          Members only
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 38px)', fontWeight: 900, letterSpacing: '-0.025em', lineHeight: 1.1, color: '#1A1A1A', marginBottom: '18px' }}>
          Bolt-ons unlock inside Membership.
        </h1>
        <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', margin: '0 auto 24px' }} />
        <Link
          href="/membership?source=bolt_on_detail_locked"
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

export default async function BoltOnDetailPage({ params }: { params: Promise<{ token: string; slug: string }> }) {
  const { token, slug } = await params
  const member = await resolveMember(token)
  if (!member) return <UpgradePrompt />

  const pack = await loadPack(slug)
  const copy = BOLT_ON_AD_COPY[slug]
  if (!pack || !copy) return notFound()

  // Some AI Deep-Dives require a coaching clients row (their engines read
  // CFFS/CFWS/programs). The Membership-tier engine ('member_question') is
  // open to any active member. A direct visit to /store/{ai-slug} from an
  // ineligible member 404s rather than letting them buy a product the engine
  // cannot fulfil.
  if (
    pack.kind === 'bolt_on_ai'
    && pack.engine_call
    && COACHING_ONLY_ENGINE_CALLS.has(pack.engine_call)
  ) {
    const admin = createAdminClient()
    const { data: client } = await admin
      .from('clients')
      .select('id')
      .ilike('email', member.email)
      .maybeSingle()
    if (!client) return notFound()
  }

  const coverSigned = await signCover(copy.cover_path)

  return (
    <div style={{
      minHeight: '100vh', background: '#FFFFFF', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Top nav */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <Link href={`/library/${token}/store`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
            ← Bolt-on store
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <Link href={`/membership/${token}`} style={{ fontSize: '13px', color: '#1B6DFC', textDecoration: 'none', fontWeight: 600 }}>
              Membership home →
            </Link>
            <img src={logoUrl()} width="140" alt="Body Recode" style={{ display: 'block' }} />
          </div>
        </div>
      </div>

      {/* Hero: cover left, headline right */}
      <div style={{
        maxWidth: '1100px', margin: '0 auto',
        padding: '56px 24px 32px',
        display: 'grid',
        gridTemplateColumns: 'minmax(280px, 380px) 1fr',
        gap: '56px',
        alignItems: 'start',
      }}>
        {/* Cover */}
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '1 / 1.414',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 16px 40px rgba(27,109,252,0.10), 0 2px 8px rgba(0,0,0,0.06)',
          background: '#FAFAFA',
          border: '1px solid #E5E5E5',
        }}>
          {coverSigned && (
            // signed URL on a private bucket; refreshes per request server-side
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSigned} alt={`${pack.name} cover`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          )}
        </div>

        {/* Hero text */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            {pack.kind === 'bolt_on_ai' ? 'AI Deep-Dive' : pack.kind === 'protocol' ? 'Protocol Pack' : pack.kind === 'bolt_on_human' ? 'Coach Touchpoint' : 'Bolt-on'}  ·  Members only
          </p>
          <h1 style={{ fontSize: 'clamp(32px, 4.4vw, 46px)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: '#1A1A1A', marginBottom: '14px' }}>
            {copy.hero_headline}
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
          <p style={{ fontSize: '17px', color: '#3A3A3A', lineHeight: 1.7, marginBottom: '32px' }}>
            {copy.hero_sub}
          </p>

          {/* Price + Add — engines that capture pre-purchase input use InputBuy */}
          {pack.engine_call && INPUT_BUY_CONFIG[pack.engine_call] ? (
            <div style={{
              padding: '24px 26px',
              background: '#FAFAFA',
              border: '1px solid #E5E5E5',
              borderRadius: '14px',
            }}>
              <InputBuy
                productId={pack.id}
                email={member.email}
                source={`bolt_on_detail_${pack.kind}_${pack.slug}`}
                price={pack.price}
                inputLabel={INPUT_BUY_CONFIG[pack.engine_call].label}
                inputPlaceholder={INPUT_BUY_CONFIG[pack.engine_call].placeholder}
                buttonLabel={INPUT_BUY_CONFIG[pack.engine_call].buttonLabel}
                fieldName={INPUT_BUY_CONFIG[pack.engine_call].fieldName}
              />
            </div>
          ) : (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '20px',
              padding: '20px 24px',
              background: '#FAFAFA',
              border: '1px solid #E5E5E5',
              borderRadius: '14px',
            }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#888888', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  {pack.name}
                </p>
                <p style={{ fontSize: '28px', fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
                  ${pack.price.toFixed(0)}
                  <span style={{ fontSize: '14px', fontWeight: 600, color: '#888888', marginLeft: '10px' }}>one-time</span>
                </p>
              </div>
              <BoltOnCheckoutButton
                productId={pack.id}
                email={member.email}
                source={`bolt_on_detail_${pack.kind}_${pack.slug}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Body grid: Who it is for / What is inside / Format */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px 100px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {/* Who this is for */}
          <section style={{
            background: '#FFFFFF', border: '1px solid #E5E5E5',
            borderRadius: '14px', padding: '28px 28px 24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Who this is for
            </p>
            <p style={{ fontSize: '14px', color: '#888888', marginBottom: '18px', lineHeight: 1.6 }}>
              Run the reset if any two or more of these are true.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {copy.who_its_for.map((line, i) => (
                <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '8px 0', borderTop: i === 0 ? 'none' : '1px solid #F0F0F0' }}>
                  <span style={{ flexShrink: 0, width: '6px', height: '6px', borderRadius: '50%', background: '#1B6DFC', marginTop: '9px' }} />
                  <span style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.6 }}>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* What's inside */}
          <section style={{
            background: '#FFFFFF', border: '1px solid #E5E5E5',
            borderRadius: '14px', padding: '28px 28px 24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              What is inside
            </p>
            <p style={{ fontSize: '14px', color: '#888888', marginBottom: '18px', lineHeight: 1.6 }}>
              Short, prescriptive, repeatable.
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {copy.whats_inside.map((line, i) => (
                <li key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', padding: '10px 0', borderTop: i === 0 ? 'none' : '1px solid #F0F0F0' }}>
                  <span style={{ flexShrink: 0, fontSize: '11px', fontWeight: 800, color: '#1B6DFC', width: '20px', textAlign: 'right', marginTop: '4px', letterSpacing: '-0.02em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.6 }}>{line}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Format card */}
          <section style={{
            background: '#FAFAFA', border: '1px solid #E5E5E5',
            borderRadius: '14px', padding: '28px 28px 24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Format
            </p>
            <p style={{ fontSize: '14px', color: '#888888', marginBottom: '18px', lineHeight: 1.6 }}>
              You know what you are getting.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
              {copy.format.map((row, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                  padding: '12px 0',
                  borderTop: i === 0 ? 'none' : '1px solid #E5E5E5',
                }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#888888', letterSpacing: '0.10em', textTransform: 'uppercase' }}>
                    {row.label}
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Second Add CTA below the fold */}
        <div style={{
          marginTop: '40px',
          background: '#1A1A1A', color: '#FFFFFF',
          borderRadius: '14px', padding: '32px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px',
        }}>
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              Ready to run the reset?
            </p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
              Add {pack.name} to your library — ${pack.price.toFixed(0)} one-time.
            </p>
          </div>
          <BoltOnCheckoutButton
            productId={pack.id}
            email={member.email}
            source={`bolt_on_detail_${pack.kind}_${pack.slug}_footer`}
          />
        </div>
      </div>
    </div>
  )
}
