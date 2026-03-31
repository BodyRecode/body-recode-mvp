import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PrintTrigger from './print-trigger'

export default async function CFFSReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: client }, { data: cffsRows }] = await Promise.all([
    admin.from('clients').select('*').eq('id', id).maybeSingle(),
    admin.from('cffs').select('*').eq('client_id', id).eq('is_archived', false).order('generated_at', { ascending: false }).limit(1),
  ])

  const cffs = cffsRows?.[0] ?? null

  if (!client || !cffs) notFound()

  const sections = [
    { label: 'Client Context Summary', content: cffs.client_context_summary },
    { label: 'Primary Patterns & Signals', content: cffs.primary_patterns_and_signals },
    { label: 'Capacity Constraints & Guardrails', content: cffs.capacity_constraints_and_guardrails },
    { label: 'Risk Flags & Watch Items', content: cffs.risk_flags_and_watch_items },
    { label: 'Tensions & Trade-Offs', content: cffs.tensions_and_tradeoffs },
    { label: 'Explicit Non-Directives', content: cffs.explicit_non_directives },
    { label: 'Closing Interpretive Notes', content: cffs.closing_interpretive_notes },
  ]

  const readinessItems = [
    { label: 'Capacity', value: cffs.exposure_readiness_capacity },
    { label: 'Schedule', value: cffs.exposure_readiness_schedule },
    { label: 'Regulation', value: cffs.exposure_readiness_regulation },
    { label: 'Behaviour', value: cffs.exposure_readiness_behaviour },
  ]

  const readinessColour: Record<string, string> = {
    Green: '#16a34a',
    Amber: '#d97706',
    Red: '#dc2626',
    Unknown: '#9ca3af',
  }

  const readinessBg: Record<string, string> = {
    Green: '#f0fdf4',
    Amber: '#fffbeb',
    Red: '#fef2f2',
    Unknown: '#f9fafb',
  }

  const generatedDate = new Date(cffs.generated_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const G = '#0f0f0f'
  const TEAL = '#10E1C2'
  const WHITE = '#FFFFFF'
  const PAGE_BG = '#f2f2f0'
  const CARD_BORDER = '#e2e2e0'

  return (
    <>
      <PrintTrigger />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; background: ${PAGE_BG}; color: ${G}; }
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Header — full black */}
      <div style={{ background: '#000000', padding: '44px 52px 0' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-teal.png" alt="Body Recode" style={{ height: '48px', width: 'auto', display: 'block', marginBottom: '48px' }} />

        <p style={{ fontSize: '10px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '12px' }}>
          Coach-Facing Foundational Synthesis
        </p>
        <h1 style={{ fontSize: '36px', fontWeight: 900, color: WHITE, letterSpacing: '-0.02em', lineHeight: '1.1', marginBottom: '6px' }}>
          Foundational Intake Report
        </h1>
        <p style={{ fontSize: '12px', fontWeight: 400, color: '#666666', marginBottom: '44px', letterSpacing: '0.02em' }}>
          Initial Pattern Interpretation · Version 1.0
        </p>

        {/* Meta strip */}
        <div style={{ display: 'flex', gap: '0', borderTop: '1px solid #1a1a1a' }}>
          {[
            { label: 'Client', value: client.name, highlight: true },
            { label: 'Generated', value: generatedDate, highlight: false },
            { label: 'Coach', value: 'Kade Dunstone', highlight: false },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 40px 20px 0', marginRight: '40px', borderRight: i < 2 ? '1px solid #1a1a1a' : 'none', paddingRight: i < 2 ? '40px' : '0' }}>
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '6px' }}>{item.label}</p>
              <p style={{ fontSize: '15px', fontWeight: item.highlight ? 700 : 400, color: item.highlight ? WHITE : '#aaaaaa' }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Teal accent bar */}
      <div style={{ height: '4px', background: `linear-gradient(90deg, ${TEAL} 0%, #0ecfb2 50%, transparent 100%)` }} />

      <div style={{ background: PAGE_BG, padding: '48px 52px 64px' }}>

        {/* About this document */}
        <div style={{ background: G, padding: '36px 40px', marginBottom: '40px' }}>
          <p style={{ fontSize: '9px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '20px' }}>
            About This Document
          </p>
          <p style={{ fontSize: '17px', fontWeight: 700, color: WHITE, lineHeight: '1.55', marginBottom: '20px', letterSpacing: '-0.01em' }}>
            This document is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
          </p>
          <div style={{ height: '1px', background: '#222222', marginBottom: '20px' }} />
          <p style={{ fontSize: '13px', fontWeight: 400, color: '#888888', lineHeight: '1.9', marginBottom: '12px' }}>
            The Coach-Facing Foundational Synthesis (CFFS) is generated by the Body Recode™ interpretation engine following completion of the Foundational Intake. It translates 208 data points across eight signal domains into a single, coherent picture of the client&apos;s current body state — their regulatory load, recovery capacity, training exposure, stress architecture, and behavioural patterns.
          </p>
          <p style={{ fontSize: '13px', fontWeight: 400, color: '#888888', lineHeight: '1.9', marginBottom: '12px' }}>
            Nothing in this document prescribes, diagnoses, or directs. It does not evaluate effort, willpower, or intention. What it does is give you — the coach — a clear, honest starting position. One that reflects how the client&apos;s body is actually behaving right now, not how they or you might hope it is.
          </p>
          <p style={{ fontSize: '13px', fontWeight: 400, color: '#888888', lineHeight: '1.9' }}>
            Every conclusion here emerges from convergence across multiple signals, not isolated responses. Language is deliberately conservative. Where the data is ambiguous, that ambiguity is preserved. You remain the interpretive authority. This document gives you the foundation — what you build on it is yours.
          </p>
        </div>

        {/* Classification + Readiness row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>

          {/* Body State Classification */}
          <div style={{ background: WHITE, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '20px' }}>
              Body State Classification
            </p>
            <p style={{ fontSize: '22px', fontWeight: 800, color: G, letterSpacing: '-0.02em', lineHeight: '1.2', marginBottom: '12px' }}>
              {cffs.body_state_classification}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '3px', height: '14px', background: TEAL }} />
              <p style={{ fontSize: '12px', fontWeight: 500, color: '#666666' }}>
                Resolution: <span style={{ fontWeight: 700, color: G }}>{cffs.resolution_state}</span>
              </p>
            </div>
          </div>

          {/* Exposure Readiness */}
          <div style={{ background: WHITE, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px' }}>
            <p style={{ fontSize: '9px', fontWeight: 700, color: '#999999', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: '20px' }}>
              Exposure Readiness
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {readinessItems.map(item => (
                <div key={item.label} style={{ background: readinessBg[item.value] || '#f9fafb', padding: '14px 16px', borderLeft: `3px solid ${readinessColour[item.value] || '#9ca3af'}` }}>
                  <p style={{ fontSize: '13px', fontWeight: 800, color: readinessColour[item.value] || '#9ca3af', marginBottom: '4px' }}>{item.value}</p>
                  <p style={{ fontSize: '10px', fontWeight: 600, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{item.label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Section divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '40px 0 32px' }}>
          <div style={{ width: '28px', height: '3px', background: TEAL }} />
          <p style={{ fontSize: '9px', fontWeight: 700, color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.2em' }}>Interpretive Analysis</p>
          <div style={{ flex: 1, height: '1px', background: CARD_BORDER }} />
        </div>

        {/* CFFS Sections */}
        {sections.map((section, i) => (
          <div
            key={i}
            style={{
              background: WHITE,
              border: `1px solid ${CARD_BORDER}`,
              marginBottom: '12px',
              overflow: 'hidden',
            }}
          >
            {/* Section header bar */}
            <div style={{ background: '#fafaf9', borderBottom: `1px solid ${CARD_BORDER}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: TEAL, minWidth: '22px' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '11px', fontWeight: 700, color: G, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {section.label}
              </p>
            </div>
            {/* Section body */}
            <div style={{ padding: '24px 32px' }}>
              <p style={{ fontSize: '13.5px', fontWeight: 400, color: '#2a2a2a', lineHeight: '1.9' }}>
                {section.content}
              </p>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: '48px', paddingTop: '24px', borderTop: `2px solid ${G}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#888888', letterSpacing: '0.05em' }}>
            © Body Recode™ · www.bodyrecode.au · info@bodyrecode.au
          </p>
          <p style={{ fontSize: '10px', fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.05em' }}>
            Confidential — Coach Use Only
          </p>
        </div>

      </div>
    </>
  )
}
