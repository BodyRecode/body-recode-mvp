import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PrintTrigger from './print-trigger'
import { brand } from "@/config/tenant";
import { INDETERMINATE, readPatternLabel } from '@/lib/pattern-doctrine'
import { getTotalQuestions } from '@/lib/intake-questions'
import { readinessLevel } from '@/lib/readiness-levels'

const TEAL = '#0F1115'
const TEAL_HOVER = '#242932'
const INK = '#0F1115'
const WHITE = '#ffffff'
const PAGE_BG = '#FAFAF8'
const CARD_BORDER = '#E4E4E0'
const SOFT = '#F2F2EF'
const SCREEN_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

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
    { label: 'Primary Patterns and Signals', content: cffs.primary_patterns_and_signals },
    { label: 'Capacity Constraints and Guardrails', content: cffs.capacity_constraints_and_guardrails },
    { label: 'Risk Flags and Watch Items', content: cffs.risk_flags_and_watch_items },
    { label: 'Tensions and Trade-Offs', content: cffs.tensions_and_tradeoffs },
    { label: 'Explicit Non-Directives', content: cffs.explicit_non_directives },
    { label: 'Closing Interpretive Notes', content: cffs.closing_interpretive_notes },
  ]

  const readinessItems = [
    { label: 'Capacity', value: cffs.exposure_readiness_capacity },
    { label: 'Schedule', value: cffs.exposure_readiness_schedule },
    { label: 'Regulation', value: cffs.exposure_readiness_regulation },
    { label: 'Behaviour', value: cffs.exposure_readiness_behaviour },
  ]

  // THESE FOUR ARE NOT READINESS AND CARRY NO COLOUR. They were painted in the
  // Remediation and Attention colours on a document a client receives, so a red
  // block beside "Regulation" read as a verdict on the person. Named instead,
  // in the rubric's own words, with severity carried by weight.
  const levelInk = (v: string) => (readinessLevel(v).tone === 'quiet' ? '#9CA2AB' : '#0F1115')
  const levelWeight = (v: string) => (readinessLevel(v).tone === 'strong' ? 800 : 600)

  const generatedDate = new Date(cffs.generated_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <PrintTrigger
        backHref={`/dashboard/clients/${id}`}
        pdfHref={`/api/dashboard/clients/${id}/cffs-report/pdf`}
        filename={`${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cffs-report.pdf`}
      />

      <style>{`
        .cffs-report { font-family: ${SCREEN_FONT}; background: ${PAGE_BG}; color: ${INK}; min-height: 100vh; }
        .cffs-report * { box-sizing: border-box; }
        .cffs-report p, .cffs-report h1, .cffs-report h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAGE_BG} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .cffs-section { break-inside: avoid; }
        }
      `}</style>

      <div className="cffs-report">

        {/* Header bar (black) */}
        <div style={{ background: '#FFFFFF', padding: '44px 52px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt={brand().name} style={{ height: 64, width: 'auto', display: 'block', marginBottom: 44 }} />

          <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            Coach-Facing Foundational Synthesis
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>
            Foundational Intake Report
          </h1>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#6E747D', marginBottom: 44, letterSpacing: '0.02em' }}>
            Initial Pattern Interpretation · Version 1.0
          </p>

          {/* Meta strip */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #0F1115' }}>
            {[
              { label: 'Client', value: client.name, highlight: true },
              { label: 'Generated', value: generatedDate, highlight: false },
              { label: 'Coach', value: 'Kade Dunstone', highlight: false },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: i < 2 ? '20px 40px 20px 0' : '20px 0',
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? '1px solid #0F1115' : 'none',
                }}
              >
                <p style={{ fontSize: 9, fontWeight: 700, color: '#4A4F57', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 15, fontWeight: item.highlight ? 700 : 400, color: item.highlight ? WHITE : '#9CA2AB' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Teal accent bar */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_HOVER} 50%, transparent 100%)` }} />

        <div style={{ background: PAGE_BG, padding: '48px 52px 64px' }}>

          {/* About this document */}
          <div style={{ background: INK, padding: '36px 40px', marginBottom: 40, borderRadius: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
              About This Document
            </p>
            <p style={{ fontSize: 17, fontWeight: 600, color: WHITE, lineHeight: 1.55, marginBottom: 20, letterSpacing: '-0.01em' }}>
              This document is not a summary. It is a structured interpretation of how this client&apos;s system is currently organising itself.
            </p>
            <div style={{ height: 1, background: '#1A1E26', marginBottom: 20 }} />
            <p style={{ fontSize: 13, fontWeight: 400, color: '#9CA2AB', lineHeight: 1.85, marginBottom: 12 }}>
              The Coach-Facing Foundational Synthesis (CFFS) is generated by the {brand().name} interpretation engine following completion of the Foundational Intake. It translates {getTotalQuestions()} data points across eight signal domains into a single, coherent picture of the client&apos;s current readiness: their regulatory load, recovery capacity, training exposure, stress architecture, and behavioural patterns.
                                      </p>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#9CA2AB', lineHeight: 1.85, marginBottom: 12 }}>
              Nothing in this document prescribes, diagnoses, or directs. It does not evaluate effort, willpower, or intention. What it does is give you, the coach, a clear and honest starting position. One that reflects how the client&apos;s body is actually behaving right now, not how they or you might hope it is.
            </p>
            <p style={{ fontSize: 13, fontWeight: 400, color: '#9CA2AB', lineHeight: 1.85 }}>
              Every conclusion here emerges from convergence across multiple signals, not isolated responses. Language is deliberately conservative. Where the data is ambiguous, that ambiguity is preserved. You remain the interpretive authority. This document gives you the foundation. What you build on it is yours.
            </p>
          </div>

          {/* Classification + Readiness row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>

            {/* Body State Classification */}
            <div style={{ background: WHITE, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px', borderRadius: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA2AB', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 20 }}>
                Readiness
              </p>
              <p style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 12 }}>
                {cffs.body_state_classification}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 3, height: 14, background: TEAL, borderRadius: 2 }} />
                <p style={{ fontSize: 12, fontWeight: 500, color: '#6E747D' }}>
                  Resolution: <span style={{ fontWeight: 700, color: INK }}>{cffs.resolution_state}</span>
                </p>
              </div>

              {/* Pattern sits with the state because the two labels are the
                  whole read. The CFFS names one of the four canonical patterns,
                  or no clear pattern (Indeterminate, Fat Map LOCKED v2.2), and
                  must justify it against whatever the funnel read first. */}
              {cffs.pattern_classification && (
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${CARD_BORDER}` }}>
                  <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA2AB', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 10 }}>
                    Pattern Classification
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 800, color: INK, letterSpacing: '-0.02em', lineHeight: 1.2, marginBottom: 8 }}>
                    {readPatternLabel(cffs.pattern_classification)}
                  </p>
                  {cffs.pattern_confidence && cffs.pattern_classification !== INDETERMINATE && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <div style={{ width: 3, height: 14, background: TEAL, borderRadius: 2 }} />
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#6E747D' }}>
                        Confidence: <span style={{ fontWeight: 700, color: INK, textTransform: 'capitalize' }}>{cffs.pattern_confidence}</span>
                      </p>
                    </div>
                  )}
                  {cffs.pattern_rationale && (
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4A4F57', margin: 0 }}>
                      {cffs.pattern_rationale}
                    </p>
                  )}
                  {/* What would overturn this read. A read that no evidence can
                      change is not a read, it is an assumption. This is what the
                      coach checks against when new evidence arrives. */}
                  {cffs.pattern_watch_for && (
                    <div style={{ marginTop: 16, padding: '14px 16px', background: '#F2F2EF', border: '1px solid rgba(27,109,252,0.25)', borderRadius: 6 }}>
                      <p style={{ fontSize: 9, fontWeight: 700, color: '#0F1115', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 8 }}>
                        Watch for
                        {cffs.pattern_competing_read && cffs.pattern_competing_read !== 'None'
                          ? cffs.pattern_classification === INDETERMINATE
                            ? ` — leaning toward: ${cffs.pattern_competing_read}`
                            : ` — competing read: ${cffs.pattern_competing_read}`
                          : ''}
                      </p>
                      <p style={{ fontSize: 13, lineHeight: 1.7, color: '#4A4F57', margin: 0 }}>
                        {cffs.pattern_watch_for}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Exposure Readiness */}
            <div style={{ background: WHITE, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px', borderRadius: 6 }}>
              <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA2AB', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 20 }}>
                Exposure Readiness
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {readinessItems.map(item => (
                  <div
                    key={item.label}
                    style={{
                      background: SOFT,
                      padding: '14px 16px',
                      borderLeft: `3px solid ${levelInk(item.value)}`,
                      borderRadius: 4,
                    }}
                  >
                    <p style={{ fontSize: 13, fontWeight: levelWeight(item.value), color: levelInk(item.value), marginBottom: 4 }}>
                      {readinessLevel(item.value).label}
                    </p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA2AB', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Section divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0 32px' }}>
            <div style={{ width: 28, height: 3, background: TEAL, borderRadius: 2 }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: '#9CA2AB', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Interpretive Analysis
            </p>
            <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
          </div>

          {/* CFFS Sections */}
          {sections.map((section, i) => (
            <div
              key={i}
              className="cffs-section"
              style={{
                background: WHITE,
                border: `1px solid ${CARD_BORDER}`,
                marginBottom: 12,
                overflow: 'hidden',
                borderRadius: 6,
              }}
            >
              <div style={{ background: SOFT, borderBottom: `1px solid ${CARD_BORDER}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, minWidth: 22, fontFamily: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace" }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: 11, fontWeight: 700, color: INK, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {section.label}
                </p>
              </div>
              <div style={{ padding: '24px 32px' }}>
                <p style={{ fontSize: 13.5, fontWeight: 400, color: '#1A1E26', lineHeight: 1.9 }}>
                  {section.content}
                </p>
              </div>
            </div>
          ))}

          {/* Footer */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `2px solid ${INK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA2AB', letterSpacing: '0.05em' }}>
              © {brand().name} · www.bodyrecode.au · {brand().supportEmail}
                                      </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA2AB', letterSpacing: '0.05em' }}>
              Confidential. Coach Use Only.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
