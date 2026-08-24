'use client'

/**
 * B-roll canvas: Same place, different cause
 *
 * Screen-record as B-roll for the /decode landing explainer, under:
 *   "Two of the three common causes push fat to the same place, so where it
 *    sits tells you almost nothing on its own."
 *
 * THREE CAUSES, AND NO COUNT STATED. Corrected 24 Aug 2026 after Kade asked
 * why testosterone was on a canvas aimed at women.
 *
 *   Androgen-Decline is MALE-ONLY. typeFatMapProfile hard-gates it: a female is
 *   remapped to Estrogen-Shift or Stress-Stored and can never be typed
 *   Androgen-Decline. It is also 0 of 27 in the profile data. So on a page that
 *   says "for women whose bodies have stopped responding" it was showing her a
 *   cause she cannot have.
 *
 *   For a woman there are three: stress load, falling oestrogen, insulin. Two
 *   arrive at the middle; insulin does not. The Fat Map is still four patterns,
 *   that is doctrine and unchanged.
 *
 *   THE HEADLINE STATES NO RATIO, deliberately. "Three of the four" is true of
 *   the MODEL and is what the ads in market and every other asset say. "Two of
 *   the three" is true of WHAT SHE CAN BE. Both are true at different scopes,
 *   so any number here contradicts something. The argument never needed one:
 *   different causes, same place, is the whole point. Do not add a count back.
 *
 * NO BODY DIAGRAM, deliberately. Marks, arrows and circles never go on a
 * woman's body in Body Recode creative; they go on data. So the argument is
 * made by GROUPING causes under their destination rather than pointing at
 * anatomy. It also reads faster, which is what cutaway footage needs.
 *
 * RECORD AT 1920 x 1080 landscape. Zones are a fixed 1080px so one zone is
 * exactly one frame. Anchors #z1 #z2 #z3 restart a take at a zone.
 *
 * URL: /broll/same-place-different-cause (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#4A4A4A'
const MUTED = '#7A7A7A'

const MIDDLE = [
  { name: 'Stress load', note: 'Front of the midsection, while the limbs stay lean.' },
  { name: 'Falling oestrogen', note: 'Starts on the hips and thighs, then moves in.' },
]
const ELSEWHERE = { name: 'Insulin', note: 'Lower back and love handles. The front is spared.' }

// Fixed 1080px, NOT 100vh. This is a recording canvas: 100vh is the viewport
// minus whatever browser chrome is showing, so a zone would never be exactly
// one 1920x1080 frame and framing would shift between machines.
const zone: React.CSSProperties = {
  minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '0 120px', position: 'relative', overflow: 'hidden',
}

function Glow({ side = 'right' }: { side?: 'right' | 'left' }) {
  return (
    <div aria-hidden style={{
      position: 'absolute',
      top: side === 'right' ? '-240px' : 'auto',
      bottom: side === 'left' ? '-240px' : 'auto',
      right: side === 'right' ? '-240px' : 'auto',
      left: side === 'left' ? '-200px' : 'auto',
      width: '660px', height: '660px', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(27,109,252,0.11) 0%, transparent 66%)',
      pointerEvents: 'none',
    }} />
  )
}

export default function SamePlaceDifferentCausePage() {
  return (
    <div style={{ background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ZONE 1 · the claim and nothing else. Cutaway footage has about two
          seconds to be read, so this zone is one sentence. */}
      <section id="z1" style={zone}>
        <Glow />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '20px', fontWeight: 800, color: BLUE, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 30px' }}>
            Why guessing fails
          </p>
          <h1 style={{ fontSize: '104px', fontWeight: 800, letterSpacing: '-0.042em', lineHeight: 0.98, margin: 0, maxWidth: '13ch' }}>
            Different causes.<br /><span style={{ color: BLUE }}>Same place</span>.
          </h1>
        </div>
      </section>

      {/* ZONE 2 · grouped by DESTINATION, not four equal cards. The asymmetry
          IS the argument, so the layout shows it before anybody reads a word:
          a wide bucket holding two, a narrow quiet one holding one. */}
      <section id="z2" style={{ ...zone, background: '#F7F7F7', borderTop: '1px solid #E8E8E8', borderBottom: '1px solid #E8E8E8' }}>
        <p style={{ fontSize: '20px', fontWeight: 800, color: BLUE, letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 40px' }}>
          Where each one ends up
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'stretch' }}>
          <div style={{ border: `3px solid ${BLUE}`, borderRadius: '26px', background: 'rgba(27,109,252,0.05)', padding: '44px' }}>
            <p style={{ fontSize: '58px', fontWeight: 800, color: BLUE, letterSpacing: '-0.03em', margin: '0 0 34px' }}>
              The middle
            </p>
            <div style={{ display: 'grid', gap: '18px' }}>
              {MIDDLE.map(c => (
                <div key={c.name} style={{ background: '#FFFFFF', border: '1px solid #E0E6F2', borderRadius: '16px', padding: '28px 32px' }}>
                  <p style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px' }}>{c.name}</p>
                  <p style={{ fontSize: '22px', color: MUTED, lineHeight: 1.45, margin: 0 }}>{c.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ border: '2px solid #DCDCDC', borderRadius: '26px', background: '#FFFFFF', padding: '44px 36px' }}>
            <p style={{ fontSize: '58px', fontWeight: 800, color: '#9A9A9A', letterSpacing: '-0.03em', margin: '0 0 34px', lineHeight: 1 }}>
              Back and sides
            </p>
            <div style={{ background: '#FAFAFA', border: '1px solid #E8E8E8', borderRadius: '16px', padding: '28px 30px' }}>
              <p style={{ fontSize: '34px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 10px' }}>{ELSEWHERE.name}</p>
              <p style={{ fontSize: '22px', color: MUTED, lineHeight: 1.45, margin: 0 }}>{ELSEWHERE.note}</p>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '28px', color: BODY, margin: '38px 0 0', maxWidth: '56ch' }}>
          Two different causes, the same place on the body. You cannot tell them apart by looking.
        </p>
      </section>

      {/* ZONE 3 · the consequence */}
      <section id="z3" style={zone}>
        <Glow side="left" />
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '104px', fontWeight: 800, letterSpacing: '-0.042em', lineHeight: 0.98, margin: '0 0 44px', maxWidth: '15ch' }}>
            Same place.<br /><span style={{ color: BLUE }}>Opposite fix.</span>
          </h1>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', maxWidth: '1180px', marginBottom: '44px' }}>
            <div style={{ background: '#FFFFFF', border: `2px solid ${BLUE}`, borderRadius: '20px', padding: '32px 36px' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>One of them</p>
              <p style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1.25, margin: 0 }}>Needs the load taken off.</p>
            </div>
            <div style={{ background: '#FFFFFF', border: `2px solid ${BLUE}`, borderRadius: '20px', padding: '32px 36px' }}>
              <p style={{ fontSize: '17px', fontWeight: 800, color: BLUE, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>The other</p>
              <p style={{ fontSize: '34px', fontWeight: 700, lineHeight: 1.25, margin: 0 }}>Needs more food, not less.</p>
            </div>
          </div>
          <p style={{ fontSize: '34px', fontWeight: 800, color: INK, margin: 0 }}>
            Which is why you read first.
          </p>
        </div>
      </section>
    </div>
  )
}
