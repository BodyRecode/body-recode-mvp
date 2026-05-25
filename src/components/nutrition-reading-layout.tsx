/**
 * Shared layout for the Nutrition Reading (standalone, premium-deliverable view).
 *
 * Used by:
 *   - /portal/[token]/my-plan/reading  (full-screen client view)
 *
 * Editorial longform style on the locked Pure White / Graphite Black /
 * Signal Blue palette. Mirrors the Program Reading layout DNA so the two
 * read as a series. Narrow column, Source Serif body, hairline section
 * breaks instead of cards.
 */

const TEAL = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#2B2B2B'
const MUTED = '#6B6B6B'
const SUBTLE = '#999999'
const HAIRLINE = '#E5E5E5'
const PAPER = '#FFFFFF'
const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"
const SANS_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"
const SERIF_FONT = "var(--font-serif), 'Iowan Old Style', 'Source Serif Pro', Charter, 'Apple Garamond', Baskerville, 'Times New Roman', serif"

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
  if (!value) return ''
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

  const meta = [
    `For ${client.name}`,
    stateSummary || null,
    generatedDate,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        .nutrition-reading { font-family: ${SANS_FONT}; background: ${PAPER}; color: ${INK}; min-height: 100vh; }
        .nutrition-reading * { box-sizing: border-box; }
        .nutrition-reading p, .nutrition-reading h1, .nutrition-reading h2 { margin: 0; padding: 0; }
        .nr-prose { font-family: ${SERIF_FONT}; font-feature-settings: 'liga' 1, 'kern' 1; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="nutrition-reading">
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '96px 32px 120px' }}>

          {/* Masthead */}
          <div style={{ marginBottom: 88 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-black.png"
              alt="Body Recode"
              style={{ height: 28, width: 'auto', display: 'block', marginBottom: 56 }}
            />
            <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.24em', marginBottom: 24 }}>
              Nutrition Reading
            </p>
            <h1 className="nr-prose" style={{ fontSize: 46, fontWeight: 600, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20 }}>
              {reading.plan_name}
            </h1>
            <p className="nr-prose" style={{ fontSize: 19, fontWeight: 400, color: MUTED, lineHeight: 1.5, fontStyle: 'italic' }}>
              What this plan is for, and how we will read it as it unfolds.
            </p>
            <div style={{ height: 1, background: HAIRLINE, margin: '40px 0 24px' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              {meta}
            </p>
          </div>

          {/* About this reading */}
          <div style={{ marginBottom: 96, paddingLeft: 24, borderLeft: `2px solid ${TEAL}` }}>
            <p className="nr-prose" style={{ fontSize: 21, fontWeight: 400, color: INK, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 20, letterSpacing: '-0.005em' }}>
              This is the bridge from your Foundational Reading to the meals in this plan. It is the why before the what.
            </p>
            <p className="nr-prose" style={{ fontSize: 15, fontWeight: 400, color: MUTED, lineHeight: 1.75 }}>
              Every plan is built from where your body currently is, not from a generic template. This reading explains what we are trying to support with food right now, what the plan will ask of your body, and what we are deliberately not chasing yet. Read it once before your first meal of the week. It frames everything that follows.
            </p>
          </div>

          {/* The Reading */}
          {SECTIONS.map((section, i) => {
            const content = reading[section.key] as string | null
            if (!content) return null
            return (
              <div
                key={section.key}
                className="reading-section"
                style={{ marginBottom: 72 }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 18, marginBottom: 28 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: TEAL, fontFamily: MONO_FONT, letterSpacing: '0.04em' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2 className="nr-prose" style={{ fontSize: 26, fontWeight: 600, color: INK, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                    {section.label}
                  </h2>
                </div>
                <p className="nr-prose" style={{ fontSize: 17, fontWeight: 400, color: BODY, lineHeight: 1.75, whiteSpace: 'pre-line', letterSpacing: '-0.003em' }}>
                  {content}
                </p>
              </div>
            )
          })}

          {/* Colophon */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${HAIRLINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, letterSpacing: '0.06em' }}>
              © Body Recode · www.bodyrecode.au
            </p>
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, letterSpacing: '0.06em' }}>
              Issued for {client.name}
            </p>
          </div>

        </div>
      </div>
    </>
  )
}
