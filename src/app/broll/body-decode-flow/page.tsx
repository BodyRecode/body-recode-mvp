'use client'

/**
 * B-roll canvas: The Body Decode flow
 *
 * Screen-record as B-roll for the /decode landing explainer, under:
 *   "You'll answer a short set of questions... about two minutes later you'll
 *    have your report. All of it... Then over five days, one short video a day."
 *
 * REPLACES /broll/14-day-flow, which still describes the retired Challenge
 * ("fourteen days of structure... on Day 7 a Check-In... on Day 14"). Recording
 * that one would show the old product.
 *
 * ZONE 1 SHOWS A REAL QUESTION, not a list of section names. The first version
 * named the five sections as pills, which describes the product instead of
 * showing it. A stranger watching an explainer wants to see what she is
 * actually going to be asked, and "pick one of three" is the whole answer to
 * "is this going to be hard". The option copy is verbatim from the live
 * scorecard's Sleep section.
 *
 * RECORD AT 1920 x 1080 landscape. Zones are a fixed 1080px so one zone is
 * exactly one frame. Anchors #z1 #z2 #z3 restart a take at a zone.
 *
 * URL: /broll/body-decode-flow (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#4A4A4A'
const MUTED = '#7A7A7A'

// Verbatim from the live scorecard, section 02.
const SLEEP_OPTIONS = [
  [1, 'Poor quality. Waking through the night. Not rested in the morning.'],
  [2, 'Okay most nights but not consistently recovering.'],
  [3, 'Sleeping well. Waking rested. Recovery feels solid.'],
] as const

// "Which pattern is yours", NOT "which of the four". A female is hard-gated out
// of Androgen-Decline by typeFatMapProfile, so on a canvas aimed at women a
// count of four names one she cannot have. Naming the pattern without a count
// avoids the problem and leaves the four-pattern doctrine untouched.
const PARTS = [
  'Which pattern is yours',
  'Why it is happening',
  'Where you will recognise it',
  'What it is not',
  'Where to start',
]

const DAYS = [
  ['Day 1', 'Your two lowest scores'],
  ['Day 2', 'Why it is happening'],
  ['Day 3', 'Where this shows up'],
  ['Day 4', 'What this is not'],
  ['Day 5', 'What moves it'],
]

// Fixed 1080px, NOT 100vh. A recording canvas needs one zone to be exactly one
// 1920x1080 frame; 100vh is the viewport minus whatever browser chrome shows.
const zone: React.CSSProperties = {
  minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '0 120px', position: 'relative', overflow: 'hidden',
}
const eyebrow: React.CSSProperties = {
  fontSize: '20px', fontWeight: 800, color: BLUE, letterSpacing: '0.18em',
  textTransform: 'uppercase', margin: '0 0 26px',
}
const h1: React.CSSProperties = {
  fontSize: '92px', fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.0,
  color: INK, margin: '0 0 30px', maxWidth: '17ch',
}

function Glow() {
  return (
    <div aria-hidden style={{
      position: 'absolute', top: '-240px', right: '-240px', width: '660px', height: '660px',
      borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.11) 0%, transparent 66%)',
      pointerEvents: 'none',
    }} />
  )
}

export default function BodyDecodeFlowPage() {
  return (
    <div style={{ background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ZONE 1 · show the actual question */}
      <section id="z1" style={zone}>
        <Glow />
        <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <p style={eyebrow}>Step one</p>
            <h1 style={{ ...h1, fontSize: '88px', marginBottom: '26px' }}>Two minutes of questions.</h1>
            <p style={{ fontSize: '30px', color: BODY, lineHeight: 1.45, margin: 0, maxWidth: '22ch' }}>
              Five things, each scored out of three. You pick the one that sounds like you.
            </p>
          </div>

          <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '24px', padding: '44px', boxShadow: '0 24px 60px rgba(16,24,40,0.10)' }}>
            <p style={{ fontSize: '18px', fontWeight: 800, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 10px' }}>
              02 · Sleep
            </p>
            <p style={{ fontSize: '26px', color: MUTED, margin: '0 0 30px' }}>Which of these sounds like you?</p>
            <div style={{ display: 'grid', gap: '16px' }}>
              {SLEEP_OPTIONS.map(([n, t]) => (
                <div key={n} style={{
                  display: 'flex', alignItems: 'center', gap: '22px',
                  border: n === 1 ? `2.5px solid ${BLUE}` : '1.5px solid #E2E2E2',
                  background: n === 1 ? 'rgba(27,109,252,0.06)' : '#FFFFFF',
                  borderRadius: '16px', padding: '24px 28px',
                }}>
                  <span style={{
                    width: '52px', height: '52px', borderRadius: '50%', flexShrink: 0,
                    border: `2px solid ${n === 1 ? BLUE : '#D5D5D5'}`,
                    background: n === 1 ? BLUE : '#FFFFFF', color: n === 1 ? '#FFFFFF' : '#9A9A9A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '24px', fontWeight: 900,
                  }}>{n}</span>
                  <span style={{ fontSize: '24px', lineHeight: 1.35, color: INK }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ZONE 2 · the whole report, immediately */}
      <section id="z2" style={{ ...zone, background: '#F7F7F7', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <p style={eyebrow}>Step two</p>
        <h1 style={h1}>Then the whole report, straight away.</h1>
        <p style={{ fontSize: '30px', color: BODY, lineHeight: 1.45, margin: '0 0 42px' }}>
          Nothing kept back. Nothing unlocks later.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '18px' }}>
          {PARTS.map((p, i) => (
            <div key={p} style={{
              background: '#FFFFFF', border: `1.5px solid ${BLUE}`, borderRadius: '20px',
              padding: '32px 26px', minHeight: '260px', display: 'flex', flexDirection: 'column', gap: '20px',
            }}>
              <span style={{
                width: '54px', height: '54px', borderRadius: '50%', background: BLUE, color: '#FFFFFF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '25px', fontWeight: 900, flexShrink: 0,
              }}>{i + 1}</span>
              <span style={{ fontSize: '27px', fontWeight: 700, lineHeight: 1.22 }}>{p}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ZONE 3 · the five days */}
      <section id="z3" style={zone}>
        <Glow />
        <div style={{ position: 'relative' }}>
          <p style={eyebrow}>Step three</p>
          <h1 style={h1}>Then five short videos, one a day.</h1>
          <p style={{ fontSize: '30px', color: BODY, lineHeight: 1.45, margin: '0 0 44px', maxWidth: '40ch' }}>
            Walking you through it a part at a time.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '18px' }}>
            {DAYS.map(([d, t], i) => (
              <div key={d} style={{
                background: i === 0 ? 'rgba(27,109,252,0.06)' : '#FFFFFF',
                border: `1.5px solid ${i === 0 ? BLUE : '#E5E5E5'}`,
                borderRadius: '20px', padding: '32px 26px', minHeight: '220px',
              }}>
                <p style={{ fontSize: '18px', fontWeight: 800, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px' }}>{d}</p>
                <p style={{ fontSize: '27px', fontWeight: 700, lineHeight: 1.22, margin: 0 }}>{t}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '30px', fontWeight: 800, color: INK, margin: '48px 0 0' }}>
            Free. No card. Nothing to buy to get the report.
          </p>
        </div>
      </section>
    </div>
  )
}
