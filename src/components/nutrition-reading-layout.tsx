/**
 * Shared layout for the Nutrition Reading (standalone, premium-deliverable view).
 *
 * Used by:
 *   - /portal/[token]/my-plan/reading  (full-screen client view)
 *
 * Mirrors the Program Reading layout DNA so the two read as a series.
 * Cream-on-black premium document, self-contained styles via wrapper class.
 */

const TEAL = '#1B6DFC'
const TEAL_HOVER = '#5390FF'
const INK = '#0f0f0f'
const WHITE = '#ffffff'
const PAGE_BG = '#fafaf7'
const CARD_BORDER = '#e7e5e0'
const SOFT = '#f5f3ee'
const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"
const SCREEN_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export interface NutritionReadingData {
  nr_why_this_plan: string | null
  nr_what_this_nutrition_is_doing: string | null
  nr_how_well_know_its_working: string | null
  nr_what_were_not_doing_yet: string | null
  nr_coach_note: string | null
  plan_name: string
  entry_state: string | null
  pts_phase: string | null
  generated_at: string
  nutrition_reading_published_at: string | null
}

export interface NutritionReadingClientMeta {
  name: string
}

const SECTIONS: Array<{ key: keyof NutritionReadingData; label: string }> = [
  { key: 'nr_why_this_plan',                label: 'Why this plan' },
  { key: 'nr_what_this_nutrition_is_doing', label: 'What this nutrition is doing' },
  { key: 'nr_how_well_know_its_working',    label: 'How we will know it is working' },
  { key: 'nr_what_were_not_doing_yet',      label: 'What we are not doing yet' },
  { key: 'nr_coach_note',                   label: 'A note from your coach' },
]

function titleise(value: string | null): string {
  if (!value) return '-'
  return value.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function NutritionReadingLayout({
  reading,
  client,
}: {
  reading: NutritionReadingData
  client: NutritionReadingClientMeta
}) {
  const generatedDate = new Date(
    reading.nutrition_reading_published_at ?? reading.generated_at
  ).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const stateSummary = [titleise(reading.entry_state), reading.pts_phase]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <style>{`
        .nutrition-reading { font-family: ${SCREEN_FONT}; background: ${PAGE_BG}; color: ${INK}; min-height: 100vh; }
        .nutrition-reading * { box-sizing: border-box; }
        .nutrition-reading p, .nutrition-reading h1, .nutrition-reading h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAGE_BG} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="nutrition-reading">

        {/* Header bar */}
        <div style={{ background: '#000000', padding: '44px 52px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-black.png"
            alt="Body Recode"
            style={{ height: 64, width: 'auto', display: 'block', marginBottom: 44 }}
          />

          <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            Nutrition Reading
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>
            {reading.plan_name}
          </h1>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#666666', marginBottom: 44, letterSpacing: '0.02em' }}>
            What this plan is for, and how we will read it as it unfolds
          </p>

          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1a1a' }}>
            {[
              { label: 'For',    value: client.name,        highlight: true },
              { label: 'State',  value: stateSummary || '-', highlight: false },
              { label: 'Issued', value: generatedDate,       highlight: false },
            ].map((item, i, arr) => (
              <div
                key={i}
                style={{
                  padding: i < arr.length - 1 ? '20px 40px 20px 0' : '20px 0',
                  marginRight: i < arr.length - 1 ? 40 : 0,
                  borderRight: i < arr.length - 1 ? '1px solid #1a1a1a' : 'none',
                }}
              >
                <p style={{ fontSize: 9, fontWeight: 700, color: '#444444', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>
                  {item.label}
                </p>
                <p style={{ fontSize: 15, fontWeight: item.highlight ? 700 : 400, color: item.highlight ? WHITE : '#aaaaaa', textTransform: item.label === 'State' ? 'capitalize' : 'none' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_HOVER} 50%, transparent 100%)` }} />

        <div style={{ background: PAGE_BG, padding: '48px 52px 64px' }}>

          {/* About this document */}
          <div style={{ background: INK, padding: '36px 40px', marginBottom: 40, borderRadius: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
              About This Reading
            </p>
            <p style={{ fontSize: 17, fontWeight: 600, color: WHITE, lineHeight: 1.55, marginBottom: 20, letterSpacing: '-0.01em' }}>
              This is the bridge from your Foundational Reading to the meals in this plan. It is the why before the what.
            </p>
            <div style={{ height: 1, background: '#222222', marginBottom: 20 }} />
            <p style={{ fontSize: 13, fontWeight: 400, color: '#a3a3a3', lineHeight: 1.85 }}>
              Every plan is built from where your body currently is, not from a generic template. This reading explains what we are trying to support with food right now, what the plan will ask of your body, and what we are deliberately not chasing yet. Read it once before your first meal of the week. It frames everything that follows.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '0 0 32px' }}>
            <div style={{ width: 28, height: 3, background: TEAL, borderRadius: 2 }} />
            <p style={{ fontSize: 9, fontWeight: 700, color: '#aaaaaa', textTransform: 'uppercase', letterSpacing: '0.2em' }}>
              The Reading
            </p>
            <div style={{ flex: 1, height: 1, background: CARD_BORDER }} />
          </div>

          {SECTIONS.map((section, i) => {
            const content = reading[section.key] as string | null
            if (!content) return null
            return (
              <div
                key={section.key}
                className="reading-section"
                style={{
                  background: WHITE,
                  border: `1px solid ${CARD_BORDER}`,
                  marginBottom: 12,
                  overflow: 'hidden',
                  borderRadius: 6,
                }}
              >
                <div style={{ background: SOFT, borderBottom: `1px solid ${CARD_BORDER}`, padding: '16px 32px', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: TEAL, minWidth: 22, fontFamily: MONO_FONT }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <p style={{ fontSize: 11, fontWeight: 700, color: INK, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    {section.label}
                  </p>
                </div>
                <div style={{ padding: '24px 32px' }}>
                  <p style={{ fontSize: 13.5, fontWeight: 400, color: '#2a2a2a', lineHeight: 1.9, whiteSpace: 'pre-line' }}>
                    {content}
                  </p>
                </div>
              </div>
            )
          })}

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: `2px solid ${INK}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#999999', letterSpacing: '0.05em' }}>
              © Body Recode · www.bodyrecode.au
            </p>
            <p style={{ fontSize: 10, fontWeight: 600, color: '#aaaaaa', letterSpacing: '0.05em' }}>
              Issued for {client.name}
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
