import { brand } from "@/config/tenant";

/**
 * "Your Custom Block" deep-dive layout.
 *
 * Renders the 2-week adapted training block as a clean editorial document
 * with a reading section + two week-sections (each with intent + session list)
 * + a return-to-normal block. Same DNA as MemberQuestionLayout - narrow
 * column, sans throughout, hairline section breaks - but session lists are
 * the dominant visual.
 */

const SIGNAL_BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#2B2B2B'
const MUTED = '#6B6B6B'
const SUBTLE = '#999999'
const HAIRLINE = '#E5E5E5'
const PAPER = '#FFFFFF'
const SANS_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export interface CustomBlockSessionLine {
  title: string
  focus: string
  movements: string
  notes: string
}

export interface CustomBlockLayoutData {
  constraints: string
  sections: {
    cb_reading: string
    cb_week_one_intent: string
    cb_week_one_sessions: CustomBlockSessionLine[]
    cb_week_two_intent: string
    cb_week_two_sessions: CustomBlockSessionLine[]
    cb_return_to_normal: string
  }
  memberName: string
  patternLabel: string
  blockLabel: string
  weekNumber: number
  generated_at: string
}

function SessionList({ sessions }: { sessions: CustomBlockSessionLine[] }) {
  return (
    <div className="sessions">
      {sessions.map((s, i) => (
        <div key={i} className="session">
          <div className="session-head">
            <span className="day">{`Day ${i + 1}`}</span>
            <span className="title">{s.title}</span>
          </div>
          {s.focus && <div className="session-focus"><strong>Focus.</strong> {s.focus}</div>}
          {s.movements && <div className="session-mvts"><strong>Movements.</strong> {s.movements}</div>}
          {s.notes && <div className="session-notes"><strong>Note.</strong> {s.notes}</div>}
        </div>
      ))}
    </div>
  )
}

export default function CustomBlockLayout({ data }: { data: CustomBlockLayoutData }) {
  const dateLabel = new Date(data.generated_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const meta = [
    `For ${data.memberName}`,
    `${data.patternLabel} · Block ${data.blockLabel}, Week ${data.weekNumber}`,
    dateLabel,
  ].filter(Boolean).join(' · ')

  return (
    <html lang="en" style={{ background: PAPER }}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preload" href="/logo-black.png" as="image" />
        <style>{`
          @page { size: A4; margin: 22mm 18mm 22mm 18mm; }
          html, body { margin: 0; padding: 0; background: ${PAPER}; color: ${INK}; font-family: ${SANS_FONT}; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .doc { max-width: 660px; margin: 0 auto; padding: 32px 0 48px; }
          .logo { width: 80px; height: auto; }
          .eyebrow { font-size: 11px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; text-transform: uppercase; margin: 28px 0 14px; }
          h1 { font-size: 40px; line-height: 1.1; letter-spacing: -0.025em; margin: 0 0 14px; font-weight: 800; color: ${INK}; }
          .sub { font-size: 16px; color: ${MUTED}; line-height: 1.5; margin: 0 0 26px; }
          .meta { font-size: 11px; color: ${SUBTLE}; letter-spacing: 0.12em; text-transform: uppercase; padding: 14px 0 8px; border-top: 1px solid ${HAIRLINE}; margin-bottom: 0; }
          .byline { font-size: 11px; color: ${MUTED}; letter-spacing: 0.08em; text-transform: uppercase; padding: 0 0 14px; border-bottom: 1px solid ${HAIRLINE}; margin-bottom: 36px; }
          .byline strong { color: ${INK}; font-weight: 700; letter-spacing: 0.04em; }
          .input { background: #FAFAFA; border-left: 3px solid ${SIGNAL_BLUE}; padding: 20px 24px; margin: 0 0 36px; border-radius: 0 8px 8px 0; }
          .input .label { font-size: 10px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
          .input .body { font-size: 15px; color: ${INK}; font-style: italic; line-height: 1.6; }
          .section { margin-bottom: 32px; page-break-inside: avoid; }
          .section h2 { font-size: 22px; line-height: 1.25; letter-spacing: -0.01em; margin: 0 0 12px; font-weight: 700; color: ${INK}; }
          .section h2 .num { font-size: 11px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; margin-right: 12px; vertical-align: middle; }
          .section p.intent { font-size: 15px; line-height: 1.75; color: ${BODY}; margin: 0 0 18px; }
          .sessions { display: flex; flex-direction: column; gap: 12px; }
          .session { border: 1px solid ${HAIRLINE}; border-radius: 10px; padding: 14px 16px; page-break-inside: avoid; }
          .session-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 8px; }
          .session-head .day { font-size: 10px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; text-transform: uppercase; }
          .session-head .title { font-size: 15px; font-weight: 700; color: ${INK}; }
          .session-focus, .session-mvts, .session-notes { font-size: 13.5px; color: ${BODY}; line-height: 1.6; margin: 4px 0; }
          .session strong { color: ${INK}; font-weight: 700; }
          .return { background: #F4F8FF; border: 1px solid #E2EAFD; border-radius: 10px; padding: 18px 22px; }
          .return h3 { font-size: 14px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 10px; }
          .return p { font-size: 14px; line-height: 1.7; color: ${BODY}; margin: 0; }
          .signoff { margin-top: 40px; padding-top: 24px; border-top: 1px solid ${HAIRLINE}; font-size: 13px; color: ${MUTED}; line-height: 1.7; }
          .signoff strong { color: ${INK}; font-weight: 700; }
        `}</style>
      </head>
      <body>
        <div className="doc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" className="logo" alt={brand().name} />
          <div className="eyebrow">Your Custom Block</div>
          <h1>{data.memberName}, here is your two-week block.</h1>
          <p className="sub">A pattern-aware adapted block designed around the constraint you described. Run it, then step back into your standard programme.</p>
          <div className="meta">{meta}</div>
          <div className="byline">By <strong>Kade Dunstone</strong> · Founder, {brand().name}</div>

          <div className="input">
            <div className="label">Your constraint</div>
            <div className="body">&ldquo;{data.constraints}&rdquo;</div>
          </div>

          <div className="section">
            <h2><span className="num">01</span>The reading</h2>
            {data.sections.cb_reading.split(/\n+/).map((p, i) => <p key={i} className="intent">{p}</p>)}
          </div>

          <div className="section">
            <h2><span className="num">02</span>Week One</h2>
            <p className="intent">{data.sections.cb_week_one_intent}</p>
            <SessionList sessions={data.sections.cb_week_one_sessions} />
          </div>

          <div className="section">
            <h2><span className="num">03</span>Week Two</h2>
            <p className="intent">{data.sections.cb_week_two_intent}</p>
            <SessionList sessions={data.sections.cb_week_two_sessions} />
          </div>

          <div className="section">
            <h2><span className="num">04</span>Stepping back into your normal programme</h2>
            <div className="return">
              <h3>After Day 14</h3>
              <p>{data.sections.cb_return_to_normal}</p>
            </div>
          </div>

          <div className="signoff">
            Designed by <strong>Kade Dunstone</strong>. Generated by the {brand().name} engine, the same framework Kade uses with coaching clients, formalised into a personalised block. Print this if you are travelling or off-grid. Bring observations from these two weeks into your next weekly check-in.
                                </div>
        </div>
      </body>
    </html>
  )
}
