import { brand } from "@/config/tenant";

/**
 * Shared layout for the Block-end Trajectory Reading (standalone document view).
 *
 * Used by:
 *   - /portal/[token]/program/trajectory-reading
 *
 * Same editorial DNA as the Foundational and Program Reading layouts so the
 * series reads as one. Narrow column, sans throughout, hairline section breaks.
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

export interface TrajectoryReadingData {
  tr_where_this_block_started: string | null
  tr_how_your_signal_moved: string | null
  tr_what_held_steady: string | null
  tr_what_this_sets_up_next: string | null
  tr_coach_note: string | null
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  generated_at: string
  trajectory_reading_published_at: string | null
}

export interface TrajectoryReadingClientMeta {
  name: string
}

const SECTIONS: Array<{ key: keyof TrajectoryReadingData; label: string }> = [
  { key: 'tr_where_this_block_started', label: 'Where this block started' },
  { key: 'tr_how_your_signal_moved',    label: 'How your signal moved' },
  { key: 'tr_what_held_steady',         label: 'What held steady' },
  { key: 'tr_what_this_sets_up_next',   label: 'What this sets up next' },
  { key: 'tr_coach_note',               label: 'A note from your coach' },
]

export default function TrajectoryReadingLayout({
  reading,
  client,
}: {
  reading: TrajectoryReadingData
  client: TrajectoryReadingClientMeta
}) {
  const generatedDate = new Date(
    reading.trajectory_reading_published_at ?? reading.generated_at
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
        .trajectory-reading { font-family: ${SANS_FONT}; background: ${PAPER}; color: ${INK}; min-height: 100vh; }
        .trajectory-reading * { box-sizing: border-box; }
        .trajectory-reading p, .trajectory-reading h1, .trajectory-reading h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAPER} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="trajectory-reading">
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
              Block-End Reading
            </p>
            <h1 style={{ fontSize: 46, fontWeight: 600, color: INK, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 20, textTransform: 'capitalize' }}>
              {reading.block_name}
            </h1>
            <p style={{ fontSize: 19, fontWeight: 400, color: MUTED, lineHeight: 1.5, fontStyle: 'italic' }}>
              How your body moved across this block, read as one arc.
            </p>
            <div style={{ height: 1, background: HAIRLINE, margin: '40px 0 24px' }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: SUBTLE, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
              {meta}
            </p>
          </div>

          {/* About this reading */}
          <div style={{ marginBottom: 96, paddingLeft: 24, borderLeft: `2px solid ${TEAL}` }}>
            <p style={{ fontSize: 21, fontWeight: 400, color: INK, lineHeight: 1.55, fontStyle: 'italic', marginBottom: 20, letterSpacing: '-0.005em' }}>
              This is the step back from the week-to-week. It reads every check-in across this block as a single trajectory, not one week at a time.
            </p>
            <p style={{ fontSize: 15, fontWeight: 400, color: MUTED, lineHeight: 1.75 }}>
              A single week is never the verdict. Direction held across weeks is the signal. This reading is here so you can see the shape of where you have been travelling, trust that the work compounded even on the flat weeks, and carry that into what comes next.
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
