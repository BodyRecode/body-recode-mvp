import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PrintTrigger from '../cffs-report/print-trigger'
import { brand } from "@/config/tenant";

const TEAL = '#1B6DFC'
const TEAL_HOVER = '#5390FF'
const INK = '#0f0f0f'
const WHITE = '#ffffff'
const PAGE_BG = '#fafaf7'
const CARD_BORDER = '#E8EAEE'
const SOFT = '#f5f3ee'
const SCREEN_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export default async function CFWSReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: client }, { data: cfwsRows }] = await Promise.all([
    admin.from('clients').select('*').eq('id', id).maybeSingle(),
    admin.from('cfws').select('*').eq('client_id', id).order('week_number', { ascending: false }).limit(1),
  ])

  const cfws = cfwsRows?.[0] ?? null

  if (!client || !cfws) notFound()

  const sections = [
    { label: 'Context Snapshot', content: cfws.client_context_snapshot },
    { label: 'Dominant Weekly Patterns', content: cfws.dominant_weekly_patterns },
    { label: 'Capacity Constraints', content: cfws.weekly_capacity_constraints },
    { label: 'Risk Flags', content: cfws.weekly_risk_flags },
    { label: 'Tensions and Trade-Offs', content: cfws.weekly_tensions_tradeoffs },
    { label: 'Explicit Non-Directives', content: cfws.explicit_weekly_non_directives },
    { label: 'Closing Notes', content: cfws.closing_weekly_notes },
  ].filter(s => s.content)

  const readinessItems = [
    { label: 'Capacity', value: cfws.exposure_readiness_capacity },
    { label: 'Schedule', value: cfws.exposure_readiness_schedule },
    { label: 'Regulation', value: cfws.exposure_readiness_regulation },
    { label: 'Behaviour', value: cfws.exposure_readiness_behaviour },
  ]

  const readinessColour: Record<string, string> = {
    Green: '#1056D6',
    Amber: '#d97706',
    Red: '#dc2626',
    Unknown: '#9ca3af',
  }
  const readinessBg: Record<string, string> = {
    Green: '#f0fdfa',
    Amber: '#fffbeb',
    Red: '#fef2f2',
    Unknown: '#f9fafb',
  }

  const generatedDate = new Date(cfws.generated_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <>
      <PrintTrigger
        backHref={`/dashboard/clients/${id}`}
        pdfHref={`/api/dashboard/clients/${id}/cfws-report/pdf`}
        filename={`${client.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-cfws-week-${cfws.week_number}.pdf`}
      />

      <style>{`
        .cfws-report { font-family: ${SCREEN_FONT}; background: ${PAGE_BG}; color: ${INK}; min-height: 100vh; }
        .cfws-report * { box-sizing: border-box; }
        .cfws-report p, .cfws-report h1, .cfws-report h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAGE_BG} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .cfws-section { break-inside: avoid; }
        }
      `}</style>

      <div className="cfws-report">

        <div style={{ background: '#FFFFFF', padding: '44px 52px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" alt={brand().name} style={{ height: 64, width: 'auto', display: 'block', marginBottom: 44 }} />

          <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            Coach-Facing Weekly Synthesis
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>
            Weekly Pattern Report
          </h1>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#666666', marginBottom: 44, letterSpacing: '0.02em' }}>
            Week {cfws.week_number} Pattern Interpretation · Version 1.0
          </p>

          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1a1a' }}>
            {[
              { label: 'Client', value: client.name, highlight: true },
              { label: 'Week', value: `Week ${cfws.week_number}`, highlight: false },
              { label: 'Generated', value: generatedDate, highlight: false },
            ].map((item, i) => (
              <div
                key={i}
                style={{
                  padding: i < 2 ? '20px 40px 20px 0' : '20px 0',
                  marginRight: i < 2 ? 40 : 0,
                  borderRight: i < 2 ? '1px solid #1a1a1a' : 'none',
                }}
              >
                <p style={{ fontSize: 9, fontWeight: 700, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 15, fontWeight: item.highlight ? 700 : 400, color: item.highlight ? WHITE : '#aaaaaa' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_HOVER} 50%, transparent 100%)` }} />

        <div style={{ background: PAGE_BG, padding: '48px 52px 64px' }}>

          <div style={{ background: INK, padding: '36px 40px', marginBottom: 40, borderRadius: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
              About This Document
            </p>
            <p style={{ fontSize: 17, fontWeight: 600, color: WHITE, lineHeight: 1.55, marginBottom: 20, letterSpacing: '-0.01em' }}>
              This is a structured interpretation of how this week unfolded for the client and what their system is signalling now.
            </p>
            <div style={{ height: 1, background: '#222222', marginBottom: 20 }} />
            <p style={{ fontSize: 13, fontWeight: 400, color: '#a3a3a3', lineHeight: 1.85 }}>
              The Coach-Facing Weekly Synthesis (CFWS) is generated by the {brand().name} interpretation engine after a complete weekly check-in pair (Form A and Form B). It surfaces the dominant patterns, capacity constraints, and tensions present in the week, along with where the client&apos;s system is currently positioned for further training exposure.
                                      </p>
          </div>

          {/* Exposure Readiness */}
          <div style={{ background: WHITE, border: `1px solid ${CARD_BORDER}`, padding: '32px 36px', marginBottom: 16, borderRadius: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: '#98A0AD', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 20 }}>
              Exposure Readiness
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {readinessItems.map(item => (
                <div
                  key={item.label}
                  style={{
                    background: readinessBg[item.value] || SOFT,
                    padding: '14px 16px',
                    borderLeft: `3px solid ${readinessColour[item.value] || '#9ca3af'}`,
                    borderRadius: 4,
                  }}
                >
                  <p style={{ fontSize: 13, fontWeight: 800, color: readinessColour[item.value] || '#9ca3af', marginBottom: 4 }}>
                    {item.value}
                  </p>
                  <p style={{ fontSize: 10, fontWeight: 600, color: '#98A0AD', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '40px 0 32px' }}>
            <div style={{ width: 28, height: 3, background: TEAL, borderRadius: 2 }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              Weekly Pattern Analysis
            </p>
            <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
          </div>

          {sections.map((section, i) => (
            <div
              key={i}
              className="cfws-section"
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
                <p style={{ fontSize: 13.5, fontWeight: 400, color: '#2a2a2a', lineHeight: 1.9 }}>
                  {section.content}
                </p>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `2px solid ${INK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#98A0AD', letterSpacing: '0.05em' }}>
              © {brand().name} · www.bodyrecode.au · {brand().supportEmail}
                                      </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.05em' }}>
              Confidential. Coach Use Only.
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
