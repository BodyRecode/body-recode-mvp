// State-matched $19 Field Guide landing page.
//
// Plan §6.3 + Q3 locked 2026-06-06: the standalone $19 Guide is the
// descension / exit-intent / email-follow-up offer for people who did
// NOT buy the Report+Guide bundle ($37) on the scorecard result page.
//
// Route: /field-guide/depleted | /field-guide/transitioning | /field-guide/ready
// Query: ?email= (optional, pre-fills the email input)
// Source attribution: ?source= (e.g. "email_descension_day8" / "exit_intent_challenge")
//
// If the matching Guide product has not been authored/seeded yet (no
// be_products row with kind='field_guide' + matching state_match), the
// page shows a "coming soon" state.

import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import FieldGuideCheckoutForm from './checkout-form'
import { logoUrl } from '@/config/tenant'

const STATE_LABELS: Record<string, { title: string; subtitle: string; bodyLine: string }> = {
  depleted: {
    title: 'The Depleted Field Guide.',
    subtitle: 'Why a clean diet and hard training stopped working.',
    bodyLine: 'A 44-page state-matched playbook for adults whose body state has gone Depleted. What is happening biologically. Why standard moves make it worse. The first four moves to bring the load down.',
  },
  transitioning: {
    title: 'The Transitioning Field Guide.',
    subtitle: 'Your pattern is identified. Here is the corrective sequence before it slips back.',
    bodyLine: 'A 44-page state-matched playbook for adults whose body state has reached Transitioning. What this state means. Why the next 90 days matter. The corrective sequence that locks the progress in.',
  },
  ready: {
    title: 'The Ready Field Guide.',
    subtitle: 'You respond now. Here is how to compound it instead of losing it again.',
    bodyLine: 'A 44-page state-matched playbook for adults whose body state has reached Ready. Why you respond now. The compounding rules. How to stay Ready instead of slipping back.',
  },
}

export default async function FieldGuideLandingPage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string }>
  searchParams: Promise<{ email?: string; source?: string }>
}) {
  const { state } = await params
  const { email, source } = await searchParams

  if (!['depleted', 'transitioning', 'ready'].includes(state)) return notFound()

  const copy = STATE_LABELS[state]

  // Look up the active Field Guide product for this state. Split into two
  // queries: nested-foreign-table filter via Supabase REST is fragile for
  // 1:1 PK-as-FK relationships, so we find the metadata row first then
  // fetch the product by its product_id.
  const admin = createAdminClient()
  const { data: meta } = await admin
    .from('digital_asset_metadata')
    .select('product_id, slug')
    .eq('state_match', state)
    .eq('active', true)
    .maybeSingle()

  let productId: string | null = null
  let productPrice = 19
  if (meta?.product_id) {
    const { data: product } = await admin
      .from('be_products')
      .select('id, name, price, kind')
      .eq('id', meta.product_id)
      .eq('kind', 'field_guide')
      .maybeSingle()
    if (product) {
      productId = product.id
      productPrice = Number(product.price) || 19
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #E5E5E5', padding: '18px 24px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <img src={logoUrl()} width="160" alt="Body Recode" style={{ display: 'block' }} />
        </div>
      </div>

      {/* Hero */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.18) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '720px', margin: '0 auto', padding: '52px 24px 24px', position: 'relative' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: '14px' }}>
            Body Recode Field Guide · {state.charAt(0).toUpperCase() + state.slice(1)} state
          </p>
          <h1 style={{
            fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 900,
            letterSpacing: '-0.035em', margin: '0 0 12px', color: '#1A1A1A', lineHeight: 1.05,
          }}>
            {copy.title}
          </h1>
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '20px' }} />
          <p style={{ fontSize: '17px', color: '#4A4A4A', margin: '0 0 14px', lineHeight: 1.55 }}>
            {copy.subtitle}
          </p>
        </div>
      </div>

      {/* Body copy */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '8px 24px 32px' }}>
        <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.75, marginBottom: '32px' }}>
          {copy.bodyLine}
        </p>

        {/* What's inside card */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderRadius: '14px',
          padding: '24px 26px',
          marginBottom: '32px',
        }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
            What is inside
          </p>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              'What your state actually means biologically',
              'Why what you have been doing has stopped working',
              'The first four moves to bring the load down',
              'What this Guide cannot do — and what the next rung is',
            ].map(line => (
              <li key={line} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#1B6DFC', flexShrink: 0, marginTop: '9px' }} />
                <span style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.65 }}>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Pricing + checkout */}
        {productId ? (
          <FieldGuideCheckoutForm
            productId={productId}
            price={productPrice}
            initialEmail={email ?? ''}
            source={source ?? `field_guide_${state}_direct`}
            state={state}
          />
        ) : (
          <div style={{
            background: '#FAFAFA',
            border: '1px dashed #D4D4D4',
            borderRadius: '14px',
            padding: '24px 26px',
            textAlign: 'center',
          }}>
            <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.6 }}>
              The {state.charAt(0).toUpperCase() + state.slice(1)} Field Guide is coming soon. Drop your email to <strong>kade@bodyrecode.au</strong> and I will send it the moment it lands.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #E5E5E5', padding: '24px', marginTop: '40px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: '#999999' }}>
          <span>Body Recode · bodyrecode.au</span>
          <span>Read once. Reference often.</span>
        </div>
      </div>
    </div>
  )
}
