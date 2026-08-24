'use client'

/**
 * B-roll canvas: Same place, different cause
 *
 * Screen-record as B-roll for the /decode landing explainer, covering:
 *
 *   "What's driving it isn't the same in everyone. Three of the four common
 *    causes push fat to the same place, so where it sits tells you almost
 *    nothing on its own."
 *
 * WHY THIS IS NOT /broll/four-patterns. That canvas is "Same sessions. Four
 * prescriptions" — RIR targets, finisher rules, rest intervals. It is about
 * calibrating training, which is a Blueprint idea. The Body Decode prescribes
 * nothing, so it would be showing the wrong product.
 *
 * DOCTRINE, and it has to stay right (fat-map-profile.ts):
 *   Stress-Stored     central anterior, front of the midsection
 *   Estrogen-Shift    hips and thighs, then redistributes centrally
 *   Androgen-Decline  central, a composition shift
 *   Insulin-Drift     posterior and flank, front relatively SPARED
 * So three arrive at the middle and insulin is the one that does not. That is
 * the whole argument: the location is shared, the cause is not.
 *
 * RECORD AT 1920 x 1080, landscape. See reference_video_aspect_ratios.
 *
 * URL: /broll/same-place-different-cause (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const BODY = '#4A4A4A'
const MUTED = '#6B6B6B'

const CAUSES = [
  { name: 'Stress load', where: 'The middle', same: true, note: 'Front of the midsection, while the limbs stay lean.' },
  { name: 'Falling oestrogen', where: 'The middle', same: true, note: 'Starts on the hips and thighs, then moves in.' },
  { name: 'Falling testosterone', where: 'The middle', same: true, note: 'Central, with muscle going the other way.' },
  { name: 'Insulin', where: 'Back and sides', same: false, note: 'Lower back and love handles. The front is spared.' },
]

const zone: React.CSSProperties = {
  // Fixed 1080px, NOT 100vh. This is a recording canvas: 100vh is the browser
  // viewport minus whatever chrome is showing, so a zone would never be exactly
  // one 1920x1080 frame and the framing would shift between machines. Fixed
  // height means one zone is one frame, every time.
  minHeight: '1080px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
  padding: '80px 96px', position: 'relative', overflow: 'hidden',
}

export default function SamePlaceDifferentCausePage() {
  return (
    <div style={{ background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ZONE 1 · the claim */}
      <section id="z1" style={zone}>
        <div aria-hidden style={{
          position: 'absolute', top: '-220px', right: '-220px', width: '620px', height: '620px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.12) 0%, transparent 65%)',
        }} />
        <div style={{ position: 'relative' }}>
          <p style={{ fontSize: '19px', fontWeight: 800, color: BLUE, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 22px' }}>
            Why guessing fails
          </p>
          <h1 style={{ fontSize: '84px', fontWeight: 800, letterSpacing: '-0.038em', lineHeight: 1.02, margin: '0 0 28px', maxWidth: '18ch' }}>
            Three of the four end up in the same place.
          </h1>
          <p style={{ fontSize: '29px', color: BODY, lineHeight: 1.5, margin: 0, maxWidth: '36ch' }}>
            So where it sits tells you almost nothing about what is causing it.
          </p>
        </div>
      </section>

      {/* ZONE 2 · the four, and where each lands */}
      <section id="z2" style={{ ...zone, background: '#F7F7F7', borderTop: '1px solid #E5E5E5', borderBottom: '1px solid #E5E5E5' }}>
        <p style={{ fontSize: '19px', fontWeight: 800, color: BLUE, letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 34px' }}>
          Four common causes
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
          {CAUSES.map(c => (
            <div key={c.name} style={{
              background: '#FFFFFF',
              border: c.same ? `2px solid ${BLUE}` : '1.5px solid #D8D8D8',
              borderRadius: '18px', padding: '34px 28px', minHeight: '380px',
              display: 'flex', flexDirection: 'column',
            }}>
              <p style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 22px', lineHeight: 1.15 }}>
                {c.name}
              </p>
              <p style={{ fontSize: '20px', color: MUTED, lineHeight: 1.5, margin: '0 0 auto' }}>{c.note}</p>
              <div style={{
                marginTop: '28px', padding: '16px 20px', borderRadius: '12px',
                background: c.same ? 'rgba(27,109,252,0.09)' : '#F2F2F2',
                border: c.same ? `1.5px solid ${BLUE}` : '1.5px solid #DDDDDD',
              }}>
                <p style={{ fontSize: '15px', fontWeight: 800, color: c.same ? BLUE : MUTED, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                  Ends up
                </p>
                <p style={{ fontSize: '25px', fontWeight: 800, color: c.same ? BLUE : INK, margin: 0 }}>{c.where}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ZONE 3 · the consequence */}
      <section id="z3" style={zone}>
        <div aria-hidden style={{
          position: 'absolute', bottom: '-200px', left: '-180px', width: '520px', height: '520px',
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.09) 0%, transparent 70%)',
        }} />
        <div style={{ position: 'relative' }}>
          <h1 style={{ fontSize: '84px', fontWeight: 800, letterSpacing: '-0.038em', lineHeight: 1.02, margin: '0 0 30px', maxWidth: '19ch' }}>
            Same place. <span style={{ color: BLUE }}>Opposite fix.</span>
          </h1>
          <p style={{ fontSize: '29px', color: BODY, lineHeight: 1.5, margin: '0 0 46px', maxWidth: '40ch' }}>
            One of them needs the load taken off. One needs more food, not less. Guessing is how most plans end up aimed at the wrong thing.
          </p>
          <div style={{
            display: 'inline-block', background: 'rgba(27,109,252,0.07)',
            border: `2px solid ${BLUE}`, borderRadius: '16px', padding: '26px 36px',
          }}>
            <p style={{ fontSize: '31px', fontWeight: 800, color: INK, margin: 0 }}>
              Which is why you read first.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
