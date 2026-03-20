import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import PrintTrigger from './print-trigger'

export default async function CFFSReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: client }, { data: cffsRows }] = await Promise.all([
    supabase.from('clients').select('*').eq('id', id).maybeSingle(),
    supabase.from('cffs').select('*').eq('client_id', id).eq('is_archived', false).order('generated_at', { ascending: false }).limit(1),
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

  const generatedDate = new Date(cffs.generated_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const G = '#1A1A1A'       // Graphite Black
  const GREY = '#F5F5F5'    // Light neutral grey background
  const TEAL = '#10E1C2'    // Electric Teal accent
  const WHITE = '#FFFFFF'
  const SUBTLE = '#E8E8E8'  // Hairline border

  return (
    <>
      <PrintTrigger />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Montserrat', sans-serif; background: ${GREY}; color: ${G}; }
        @media print {
          @page { margin: 0; size: A4; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Black header band */}
      <div style={{ background: '#000000', padding: '40px 48px 44px' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-teal.png" alt="Body Recode" style={{ height: '52px', width: 'auto', display: 'block', marginBottom: '40px' }} />

        <p style={{ fontSize: '11px', fontWeight: 600, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '10px' }}>
          Coach-Facing Foundational Synthesis
        </p>
        <p style={{ fontSize: '26px', fontWeight: 800, color: WHITE, letterSpacing: '-0.01em', marginBottom: '4px' }}>
          Foundational Intake Report
        </p>
        <p style={{ fontSize: '13px', fontWeight: 400, color: '#888888', marginBottom: '36px' }}>
          Initial Pattern Interpretation · Version 1.0
        </p>

        <div style={{ display: 'flex', gap: '48px', borderTop: '1px solid #222222', paddingTop: '24px' }}>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Client</p>
            <p style={{ fontSize: '14px', fontWeight: 700, color: WHITE }}>{client.name}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Generated</p>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#cccccc' }}>{generatedDate}</p>
          </div>
          <div>
            <p style={{ fontSize: '10px', fontWeight: 600, color: '#555555', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '5px' }}>Coach</p>
            <p style={{ fontSize: '14px', fontWeight: 400, color: '#cccccc' }}>Kade Dunstone</p>
          </div>
        </div>
      </div>

      <div style={{ background: GREY, padding: '40px 48px', minHeight: '100vh' }}>

        {/* Teal rule */}
        <div style={{ height: '2px', background: TEAL, marginBottom: '36px', width: '40px' }} />

        {/* What is a CFFS */}
        <div style={{ background: WHITE, border: `1px solid ${SUBTLE}`, borderLeft: `3px solid ${TEAL}`, padding: '28px 32px', marginBottom: '32px' }}>
          <p style={{ fontSize: '10px', fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '16px' }}>What You Are Looking At</p>

          <p style={{ fontSize: '15px', fontWeight: 700, color: G, lineHeight: '1.6', marginBottom: '16px' }}>
            This document is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
          </p>

          <p style={{ fontSize: '13px', fontWeight: 400, color: '#444444', lineHeight: '1.85', marginBottom: '14px' }}>
            The Coach-Facing Foundational Synthesis (CFFS) is generated by the Body Recode™ interpretation engine following completion of the Foundational Intake. It translates 208 data points across eight signal domains into a single, coherent picture of the client&apos;s current body state — their regulatory load, recovery capacity, training exposure, stress architecture, and behavioural patterns.
          </p>

          <p style={{ fontSize: '13px', fontWeight: 400, color: '#444444', lineHeight: '1.85', marginBottom: '14px' }}>
            Nothing in this document prescribes, diagnoses, or directs. It does not evaluate effort, willpower, or intention. What it does is give you — the coach — a clear, honest starting position. One that reflects how the client&apos;s body is actually behaving right now, not how they or you might hope it is.
          </p>

          <p style={{ fontSize: '13px', fontWeight: 400, color: '#444444', lineHeight: '1.85' }}>
            Every conclusion here emerges from convergence across multiple signals, not isolated responses. Language is deliberately conservative. Where the data is ambiguous, that ambiguity is preserved. You remain the interpretive authority. This document gives you the foundation — what you build on it is yours.
          </p>
        </div>

        <div style={{ height: '1px', background: SUBTLE, marginBottom: '32px' }} />

        {/* Classification + Readiness — white panel */}
        <div style={{ background: WHITE, border: `1px solid ${SUBTLE}`, padding: '28px 32px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>

            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>Body State Classification</p>
              <p style={{ fontSize: '16px', fontWeight: 800, color: G, marginBottom: '6px' }}>{cffs.body_state_classification}</p>
              <p style={{ fontSize: '12px', fontWeight: 400, color: '#555555' }}>Resolution: <span style={{ fontWeight: 600, color: G }}>{cffs.resolution_state}</span></p>
            </div>

            <div style={{ flex: 2, borderLeft: `1px solid ${SUBTLE}`, paddingLeft: '48px' }}>
              <p style={{ fontSize: '10px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '16px' }}>Exposure Readiness</p>
              <div style={{ display: 'flex', gap: '32px' }}>
                {readinessItems.map(item => (
                  <div key={item.label}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: readinessColour[item.value] || '#9ca3af', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', fontWeight: 700, color: G }}>{item.value}</p>
                    </div>
                    <p style={{ fontSize: '10px', fontWeight: 500, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* CFFS Sections — white panels */}
        {sections.map((section, i) => (
          <div
            key={i}
            style={{ background: WHITE, border: `1px solid ${SUBTLE}`, padding: '28px 32px', marginBottom: '16px' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px' }}>
              <div style={{ width: '2px', background: TEAL, alignSelf: 'stretch', flexShrink: 0, minHeight: '100%' }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '10px', fontWeight: 700, color: '#888888', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: '10px' }}>{section.label}</p>
                <p style={{ fontSize: '13px', fontWeight: 400, color: G, lineHeight: '1.8' }}>{section.content}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: `1px solid ${SUBTLE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: '10px', fontWeight: 500, color: '#888888' }}>© Body Recode™ · www.bodyrecode.au · info@bodyrecode.au</p>
          <p style={{ fontSize: '10px', fontWeight: 500, color: '#888888' }}>Confidential — Coach Use Only</p>
        </div>

      </div>
    </>
  )
}
