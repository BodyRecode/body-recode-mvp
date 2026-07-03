import { brand } from "@/config/tenant";

/**
 * Shared layout for the Program Reading (standalone, premium-deliverable view).
 *
 * Used by:
 *   - /portal/[token]/program/reading        (full-screen client view)
 *
 * Editorial longform style on the locked Pure White / Graphite Black /
 * Signal Blue palette. Mirrors the Foundational Reading layout DNA so the
 * two read as a series. Narrow column, sans throughout, hairline section
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

export interface ProgramReadingData {
  pr_why_this_block: string | null
  pr_what_this_program_is_doing: string | null
  pr_how_well_know_its_working: string | null
  pr_what_were_not_doing_yet: string | null
  pr_coach_note: string | null
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  generated_at: string
  program_reading_published_at: string | null
}

export interface ProgramReadingClientMeta {
  name: string
}

const SECTIONS: Array<{ key: keyof ProgramReadingData; label: string }> = [
  { key: 'pr_why_this_block',             label: 'Why this block' },
  { key: 'pr_what_this_program_is_doing', label: 'What this program is doing' },
  { key: 'pr_how_well_know_its_working',  label: 'How we will know it is working' },
  { key: 'pr_what_were_not_doing_yet',    label: 'What we are not doing yet' },
  { key: 'pr_coach_note',                 label: 'A note from your coach' },
]

export default function ProgramReadingLayout({
  reading,
  client,
}: {
  reading: ProgramReadingData
  client: ProgramReadingClientMeta
}) {
  const generatedDate = new Date(
    reading.program_reading_published_at ?? reading.generated_at
  ).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const phaseGoal = [reading.progression_phase, reading.training_goal]
    .filter(Boolean)
    .join(' · ')

  const meta = [
    `For ${client.name}`,
    phaseGoal || null,
    generatedDate,
  ].filter(Boolean).join(' · ')

  return (
    <>
      <style>{`
        .program-reading { font-family: ${SANS_FONT}; background: ${PAPER}; color: ${INK}; min-height: 100vh; }
        .program-reading * { box-sizing: border-box; }
        .program-reading p, .program-reading h1, .program-reading h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="program-reading">
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
              Program Reading
            </p>
            <h1 style={{ fontSize: 46, fontWeight: 600, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20, textTransform: 'capitalize' }}>
              {reading.block_name}
            </h1>
            <p style={{ fontSize: 19, fontWeight: 400, color: MUTED, lineHeight: 1.5, fontStyle: 'italic' }}>
              What this block is for, and how we will read it as it unfolds.
            </p>
            <div style={{ height: 1, background: HAIRLINE, margin: '40px 0 24px' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              {meta}
            </p>
          </div>

          {/* About this reading */}
          <div style={{ marginBottom: 96, paddingLeft: 24, borderLeft: `2px solid ${TEAL}` }}>
            <p style={{ fontSize: 21, fontWeight: 400, color: INK, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 20, letterSpacing: '-0.005em' }}>
              This is the bridge from your Foundational Reading to the sessions in this block. It is the why before the what.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: MUTED, lineHeight: 1.75 }}>
              Every block is built from where your body currently is, not from a generic template. This reading explains what we are trying to shift this time, what the work will ask of you, and what we are deliberately not chasing yet. Read it once before your first session. It frames everything that follows.
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
