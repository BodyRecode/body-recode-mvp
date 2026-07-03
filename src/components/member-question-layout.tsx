import { brand } from "@/config/tenant";

/**
 * Member-question deep-dive layout.
 *
 * Editorial single-document layout used both:
 *   - in the puppeteer-rendered PDF deliverable
 *   - (optional future) inline in the portal reader
 *
 * Same editorial DNA as TrajectoryReadingLayout: narrow column, sans
 * throughout, hairline section breaks, "FOR {FIRST_NAME} · {DATE}" meta.
 * The difference: the member's question is shown as the hero quote.
 */

const SIGNAL_BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#2B2B2B'
const MUTED = '#6B6B6B'
const SUBTLE = '#999999'
const HAIRLINE = '#E5E5E5'
const PAPER = '#FFFFFF'
const SANS_FONT = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif"

export interface MemberQuestionLayoutData {
  question: string
  sections: {
    mq_what_youre_asking: string
    mq_what_the_data_says: string
    mq_body_recode_reading: string
    mq_this_week: string
  }
  memberName: string
  patternLabel: string
  blockLabel: string
  weekNumber: number
  generated_at: string
}

const SECTIONS: Array<{ key: keyof MemberQuestionLayoutData['sections']; label: string }> = [
  { key: 'mq_what_youre_asking', label: 'What you are actually asking' },
  { key: 'mq_what_the_data_says', label: 'What the data says' },
  { key: 'mq_body_recode_reading', label: 'The Body Recode reading' },
  { key: 'mq_this_week', label: 'This week, do this' },
]

export default function MemberQuestionLayout({ data }: { data: MemberQuestionLayoutData }) {
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
          .doc { max-width: 640px; margin: 0 auto; padding: 32px 0 48px; }
          .logo { width: 80px; height: auto; }
          .eyebrow { font-size: 11px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; text-transform: uppercase; margin: 28px 0 14px; }
          h1 { font-size: 40px; line-height: 1.1; letter-spacing: -0.025em; margin: 0 0 14px; font-weight: 800; color: ${INK}; }
          .sub { font-size: 16px; color: ${MUTED}; line-height: 1.5; margin: 0 0 26px; }
          .meta { font-size: 11px; color: ${SUBTLE}; letter-spacing: 0.12em; text-transform: uppercase; padding: 14px 0 8px; border-top: 1px solid ${HAIRLINE}; margin-bottom: 0; }
          .byline { font-size: 11px; color: ${MUTED}; letter-spacing: 0.08em; text-transform: uppercase; padding: 0 0 14px; border-bottom: 1px solid ${HAIRLINE}; margin-bottom: 36px; }
          .byline strong { color: ${INK}; font-weight: 700; letter-spacing: 0.04em; }
          .question { background: #FAFAFA; border-left: 3px solid ${SIGNAL_BLUE}; padding: 20px 24px; margin: 0 0 36px; border-radius: 0 8px 8px 0; }
          .question .label { font-size: 10px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; text-transform: uppercase; margin-bottom: 8px; }
          .question .body { font-size: 16px; color: ${INK}; font-style: italic; line-height: 1.6; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section .num { display: inline-block; font-size: 11px; font-weight: 700; color: ${SIGNAL_BLUE}; letter-spacing: 0.14em; margin-right: 12px; vertical-align: top; }
          .section h2 { display: inline-block; font-size: 20px; line-height: 1.3; letter-spacing: -0.01em; margin: 0 0 14px; font-weight: 700; color: ${INK}; }
          .section p { font-size: 15px; line-height: 1.75; color: ${BODY}; margin: 0 0 14px; }
          .signoff { margin-top: 40px; padding-top: 24px; border-top: 1px solid ${HAIRLINE}; font-size: 13px; color: ${MUTED}; line-height: 1.7; }
          .signoff strong { color: ${INK}; font-weight: 700; }
        `}</style>
      </head>
      <body>
        <div className="doc">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-black.png" className="logo" alt={brand().name} />
          <div className="eyebrow">A Question for Kade</div>
          <h1>{data.memberName}, this is what I would tell you.</h1>
          <p className="sub">A personalised reading against your pattern, your last four weeks of check-ins, and the {brand().name} framework.</p>
          <div className="meta">{meta}</div>
          <div className="byline">By <strong>Kade Dunstone</strong> · Founder, {brand().name}</div>
          <div className="question">
            <div className="label">You asked</div>
            <div className="body">&ldquo;{data.question}&rdquo;</div>
          </div>
          {SECTIONS.map((s, i) => (
            <div key={s.key} className="section">
              <div>
                <span className="num">{String(i + 1).padStart(2, '0')}</span>
                <h2>{s.label}</h2>
              </div>
              {data.sections[s.key].split(/\n+/).map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          ))}
          <div className="signoff">
            Designed by <strong>Kade Dunstone</strong>. Generated by the {brand().name} engine — the same framework Kade uses with coaching clients, formalised into a personalised reading. The interpretation is the framework. The response is your situation read through it. Re-read it once or twice. Bring observations into your next weekly check-in.
                                </div>
        </div>
      </body>
    </html>
  )
}
