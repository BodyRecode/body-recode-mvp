import { brand } from "@/config/tenant";

/**
 * Shared layout for the Foundational Reading.
 *
 * Used by:
 *   - /dashboard/clients/[id]/foundational-reading-preview  (Kade preview)
 *   - /portal/[token]/foundational-reading                  (client view)
 *   - /api/.../foundational-reading/pdf                     (puppeteer captures preview)
 *
 * Editorial longform style on the locked Pure White / Graphite Black /
 * Signal Blue palette. Reads as a letter from coach to client: narrow
 * column, generous whitespace, sans throughout, hairline section breaks
 * instead of cards. Same DNA as the Program and Nutrition readings so
 * they read as a series.
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

export interface ReadingData {
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  body_state_classification: string | null
  generated_at: string
  client_reading_published_at: string | null
}

export interface ClientMeta {
  name: string
}

const SECTIONS: Array<{ key: keyof ReadingData; label: string }> = [
  { key: 'cr_where_you_are',                label: 'Where you are right now' },
  { key: 'cr_what_your_body_is_telling_us', label: 'What your body is telling us' },
  { key: 'cr_what_were_focusing_on_first',  label: 'What we are focusing on first' },
  { key: 'cr_what_were_not_doing_yet',      label: 'What we are not doing yet' },
  { key: 'cr_coach_note',                   label: 'A note from your coach' },
]

export default function ReadingLayout({
  reading,
  client,
}: {
  reading: ReadingData
  client: ClientMeta
}) {
  const generatedDate = new Date(
    reading.client_reading_published_at ?? reading.generated_at
  ).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const meta = [
    `For ${client.name}`,
    reading.body_state_classification,
    generatedDate,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        .foundational-reading { font-family: ${SANS_FONT}; background: ${PAPER}; color: ${INK}; min-height: 100vh; }
        .foundational-reading * { box-sizing: border-box; }
        .foundational-reading p, .foundational-reading h1, .foundational-reading h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="foundational-reading">
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '96px 32px 120px' }}>

          {/* Masthead */}
          <div style={{ marginBottom: 88 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-black.png"
              alt={brand().name}
              style={{ height: 28, width: 'auto', display: 'block', marginBottom: 56 }}
            />
            <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.24em', marginBottom: 24 }}>
              Foundational Reading
            </p>
            <h1 style={{ fontSize: 46, fontWeight: 600, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20 }}>
              Your Starting Position
            </h1>
            <p style={{ fontSize: 19, fontWeight: 400, color: MUTED, lineHeight: 1.5, fontStyle: 'italic' }}>
              A read of how your body is currently organising itself.
            </p>
            <div style={{ height: 1, background: HAIRLINE, margin: '40px 0 24px' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              {meta}
            </p>
          </div>

          {/* About this reading — italic blockquote, not a card */}
          <div style={{ marginBottom: 96, paddingLeft: 24, borderLeft: `2px solid ${TEAL}` }}>
            <p style={{ fontSize: 21, fontWeight: 400, color: INK, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 20, letterSpacing: '-0.005em' }}>
              This is not a verdict. It is a read of what your body is currently doing and why we will move the way we are about to.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: MUTED, lineHeight: 1.75 }}>
              The intake you completed gave us a picture of how your system is currently organising itself, across energy, recovery, sleep, stress, and training response. What follows is what stood out to us: where you are, what your body is signalling, and what we are deliberately doing and not doing in response. Nothing here diagnoses or prescribes. It is the foundation we will build from together.
            </p>
          </div>

          {/* The Reading — section list */}
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
                  <h2 style={{ fontSize: 26, fontWeight: 600, color: INK, letterSpacing: '-0.015em', lineHeight: 1.25 }}>
                    {section.label}
                  </h2>
                </div>
                <p style={{ fontSize: 17, fontWeight: 400, color: BODY, lineHeight: 1.75, whiteSpace: 'pre-line', letterSpacing: '-0.003em' }}>
                  {content}
                </p>
              </div>
            )
          })}

          {/* Colophon */}
          <div style={{ marginTop: 32, paddingTop: 32, borderTop: `1px solid ${HAIRLINE}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, letterSpacing: '0.06em' }}>
              © {brand().name} · www.bodyrecode.au
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
