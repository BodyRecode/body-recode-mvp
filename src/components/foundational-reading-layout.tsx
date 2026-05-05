/**
 * Shared layout for the Foundational Reading.
 *
 * Used by:
 *   - /dashboard/clients/[id]/foundational-reading-preview  (Kade preview)
 *   - /portal/[token]/foundational-reading                  (client view)
 *   - /api/.../foundational-reading/pdf                     (puppeteer captures preview)
 *
 * Cream-on-black premium deliverable, same DNA as the CFFS report so it reads
 * as a series. Self-contained: scopes its own font + body styles via a
 * wrapper class so it never leaks into the dashboard chrome.
 */

const TEAL = '#14b8a6'
const TEAL_HOVER = '#5eead4'
const INK = '#0f0f0f'
const WHITE = '#ffffff'
const PAGE_BG = '#fafaf7'
const CARD_BORDER = '#e7e5e0'
const SOFT = '#f5f3ee'
const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"
const SCREEN_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

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

  return (
    <>
      <style>{`
        .foundational-reading { font-family: ${SCREEN_FONT}; background: ${PAGE_BG}; color: ${INK}; min-height: 100vh; }
        .foundational-reading * { box-sizing: border-box; }
        .foundational-reading p, .foundational-reading h1, .foundational-reading h2 { margin: 0; padding: 0; }
        @media print {
          @page { margin: 0; size: A4; }
          html, body { background: ${PAGE_BG} !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .reading-section { break-inside: avoid; }
        }
      `}</style>

      <div className="foundational-reading">

        {/* Header bar */}
        <div style={{ background: '#000000', padding: '44px 52px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-teal.png"
            alt="Body Recode"
            style={{ height: 64, width: 'auto', display: 'block', marginBottom: 44 }}
          />

          <p style={{ fontSize: 10, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 12 }}>
            Foundational Reading
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 800, color: WHITE, letterSpacing: '-0.02em', lineHeight: 1.1, marginBottom: 6 }}>
            Your Starting Position
          </h1>
          <p style={{ fontSize: 12, fontWeight: 400, color: '#666666', marginBottom: 44, letterSpacing: '0.02em' }}>
            A read of how your body is currently organising itself
          </p>

          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1a1a' }}>
            {[
              { label: 'For',       value: client.name,                           highlight: true },
              { label: 'State',     value: reading.body_state_classification ?? '-', highlight: false },
              { label: 'Issued',    value: generatedDate,                         highlight: false },
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
                <p style={{ fontSize: 15, fontWeight: item.highlight ? 700 : 400, color: item.highlight ? WHITE : '#aaaaaa' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 4, background: `linear-gradient(90deg, ${TEAL} 0%, ${TEAL_HOVER} 50%, transparent 100%)` }} />

        <div style={{ background: PAGE_BG, padding: '48px 52px 64px' }}>

          {/* About this document - in the client's voice */}
          <div style={{ background: INK, padding: '36px 40px', marginBottom: 40, borderRadius: 6 }}>
            <p style={{ fontSize: 9, fontWeight: 700, color: TEAL, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 20 }}>
              About This Reading
            </p>
            <p style={{ fontSize: 17, fontWeight: 600, color: WHITE, lineHeight: 1.55, marginBottom: 20, letterSpacing: '-0.01em' }}>
              This is not a verdict. It is a read of what your body is currently doing and why we will move the way we are about to.
            </p>
            <div style={{ height: 1, background: '#222222', marginBottom: 20 }} />
            <p style={{ fontSize: 13, fontWeight: 400, color: '#a3a3a3', lineHeight: 1.85 }}>
              The intake you completed gave us a picture of how your system is currently organising itself, across energy, recovery, sleep, stress, and training response. What follows is what stood out to us: where you are, what your body is signalling, and what we are deliberately doing and not doing in response. Nothing here diagnoses or prescribes. It is the foundation we will build from together.
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
            <p style={{ fontSize: 10, fontWeight: 600, color: '#888888', letterSpacing: '0.05em' }}>
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
