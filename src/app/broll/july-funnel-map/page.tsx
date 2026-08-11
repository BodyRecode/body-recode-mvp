'use client'

/**
 * B-roll canvas: July 2026 Funnel Map — Two Doors, One Room.
 *
 * Strategy/positioning reference (Kade-facing) sibling of
 * /broll/funnel-a-direct-coaching-arc and /broll/funnel-b-product-arc.
 *
 * Shows the July plan as TWO entry doors converging on 1:1 coaching:
 *   - PAID (ad spend) -> Funnel B ascension ladder:
 *       Stage 1 Free 14-Day Challenge (AI video) -> Stage 2 $97 Blueprint
 *       -> Stage 3 $49/wk Membership -> Stage 4 1:1 Coaching
 *   - ORGANIC (content) -> Funnel A: Scorecard -> Body State -> Zoom -> coaching
 *
 * Three viewport zones:
 *   Zone 1: the two-arc diagram converging at coaching
 *   Zone 2: the cash reality (where money is / isn't) + video placement
 *   Zone 3: the six numbers to track (the July baseline)
 *
 * Source docs:
 *   ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-06-12_July_Funnel_Map_v1.md
 *   memory: project_funnel_b_challenge_blueprint
 *
 * URL: /broll/july-funnel-map (noindex - see /broll/layout.tsx)
 */

const C = {
  blue: '#1B6DFC',
  blueDark: '#1056D6',
  blueDeeper: '#0A337A',
  blueDeepest: '#021A4D',
  amber: '#B7791F',
  grey: '#6B6B6B',
  text: '#1A1A1A',
  body: '#4A4A4A',
  bg: '#FFFFFF',
  bgSoft: '#FAFAFA',
  border: '#E5E5E5',
}

const eyebrow: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: C.blue,
  letterSpacing: '0.18em', textTransform: 'uppercase', textAlign: 'center', margin: '0 0 14px',
}

const ladderCard = (color: string): React.CSSProperties => ({
  background: C.bg, border: `1px solid ${color}40`, borderTop: `3px solid ${color}`,
  borderRadius: '12px', padding: '14px 18px',
})
const badge = (color: string): React.CSSProperties => ({
  display: 'inline-block', background: color, color: '#fff', fontSize: '9px', fontWeight: 800,
  letterSpacing: '0.14em', textTransform: 'uppercase', padding: '4px 8px', borderRadius: '4px', marginBottom: '8px',
})
const cTitle: React.CSSProperties = { fontSize: '16px', fontWeight: 900, color: C.text, letterSpacing: '-0.01em', margin: '0 0 3px', lineHeight: 1.2 }
const cSub: React.CSSProperties = { fontSize: '11px', fontWeight: 700, color: C.grey, letterSpacing: '0.03em', margin: 0 }
const cPrice: React.CSSProperties = { fontSize: '12px', fontWeight: 800, color: C.blueDark, margin: '6px 0 0' }
const arrow = (color: string): React.CSSProperties => ({ textAlign: 'center', fontSize: '20px', fontWeight: 800, color, lineHeight: 1, margin: '4px 0' })

const mCard = (top = C.blue): React.CSSProperties => ({
  background: C.bg, border: `1px solid ${C.border}`, borderTop: `3px solid ${top}`,
  borderRadius: '14px', padding: '22px 24px', minHeight: '150px',
})

export default function JulyFunnelMapPage() {
  return (
    <div style={{ minHeight: '100vh', background: C.bg, color: C.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── ZONE 1 · THE TWO-ARC DIAGRAM ───────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-180px', right: '-180px', width: '560px', height: '560px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-180px', left: '-180px', width: '480px', height: '480px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <p style={eyebrow}>July 2026 · Funnel Map</p>
          <h1 style={{ fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.05, textAlign: 'center', margin: '0 0 14px' }}>
            One door in. <span style={{ color: C.blue }}>One ceiling.</span>
          </h1>
          <p style={{ fontSize: '17px', color: C.body, textAlign: 'center', margin: '0 auto 28px', maxWidth: '820px', lineHeight: 1.5 }}>
            The scorecard routes each lead into the ladder by state. From there they climb the ladder — or ascend straight to 1:1 coaching, the ceiling reachable from any stage.
          </p>

          {/* entry chips → scorecard */}
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', maxWidth: '620px', margin: '0 auto' }}>
            <div style={{ flex: 1, background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '13px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 2px' }}>Paid · Ads</p>
              <p style={{ fontSize: '11px', color: C.grey, margin: 0 }}>Meta / Instagram</p>
            </div>
            <div style={{ flex: 1, background: C.bgSoft, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '13px', textAlign: 'center' }}>
              <p style={{ fontSize: '14px', fontWeight: 900, margin: '0 0 2px' }}>Organic · IG ladder</p>
              <p style={{ fontSize: '11px', color: C.grey, margin: 0 }}>5x per week</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', maxWidth: '620px', margin: '0 auto' }}>
            <div style={arrow(C.grey)}>↓</div><div style={arrow(C.grey)}>↓</div>
          </div>

          {/* the one front door */}
          <div style={{ background: C.text, color: '#fff', borderRadius: '13px', padding: '18px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#999', margin: '0 0 5px' }}>The one front door · free · 2 minutes</p>
            <p style={{ fontSize: '20px', fontWeight: 900, letterSpacing: '0.04em', margin: '0 0 4px' }}>SCORECARD</p>
            <p style={{ fontSize: '11px', color: '#999', margin: 0 }}>reads your state + routes you into the ladder</p>
          </div>

          <div style={arrow(C.blue)}>↓</div>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey, margin: '0 0 10px' }}>Enter by state · climb the ladder →</p>

          {/* the ladder: 3 stages with → progression */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 26px 1fr 26px 1fr', alignItems: 'center', gap: '8px', maxWidth: '980px', margin: '0 auto' }}>
            <div style={ladderCard('#DC2626')}>
              <span style={badge('#DC2626')}>If Depleted</span>
              <p style={cTitle}>Stage 1 · Free Challenge</p>
              <p style={cSub}>14 days · pattern revealed</p>
              <p style={{ ...cPrice, color: '#DC2626' }}>Free</p>
            </div>
            <div style={{ ...arrow(C.blue), margin: 0 }}>→</div>
            <div style={ladderCard(C.amber)}>
              <span style={badge(C.amber)}>If Transitioning</span>
              <p style={cTitle}>Stage 2 · Blueprint</p>
              <p style={cSub}>6 weeks · pattern-specific</p>
              <p style={{ ...cPrice, color: C.amber }}>$97</p>
            </div>
            <div style={{ ...arrow(C.blue), margin: 0 }}>→</div>
            <div style={ladderCard(C.blue)}>
              <span style={badge(C.blue)}>If Ready</span>
              <p style={cTitle}>Stage 3 · Membership</p>
              <p style={cSub}>Fat Map · recurring</p>
              <p style={cPrice}>$49/wk</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 26px 1fr 26px 1fr', maxWidth: '980px', margin: '4px auto 0' }}>
            <div style={{ ...arrow(C.blueDeepest), margin: 0 }}>↓</div><div></div><div style={{ ...arrow(C.blueDeepest), margin: 0 }}>↓</div><div></div><div style={{ ...arrow(C.blueDeepest), margin: 0 }}>↓</div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.blueDeepest, margin: '2px 0 6px' }}>↑ Ascend to coaching from any stage</p>

          <div style={{ background: C.blueDeepest, border: `2px solid ${C.blue}`, color: '#fff', borderRadius: '13px', padding: '18px', textAlign: 'center', maxWidth: '640px', margin: '0 auto' }}>
            <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B5CFFC', margin: '0 0 5px' }}>Stage 4 · the ceiling</p>
            <p style={{ fontSize: '19px', fontWeight: 900, margin: '0 0 5px' }}>1:1 Performance Coaching</p>
            <p style={{ fontSize: '11px', color: '#B5CFFC', margin: 0 }}>$297 Foundational Read + $149/wk online · $299/wk 2x · $409/wk 3x</p>
          </div>

          <p style={{ fontSize: '13px', color: C.grey, textAlign: 'center', margin: '28px auto 0', maxWidth: '900px', lineHeight: 1.6 }}>
            <strong style={{ color: C.text }}>Read it:</strong> one front door (the scorecard) reads state and routes each lead into the ladder — Depleted → Challenge, Transitioning → Blueprint, Ready → Membership. From their entry rung they can <strong style={{ color: C.text }}>climb the ladder (→)</strong> or <strong style={{ color: C.text }}>ascend straight to 1:1 coaching from any stage</strong> — coaching is the ceiling, not just the last step. (Funnel B is pre-launch — the scorecard captures the waitlist for each; live path today is the $37 report + a free call.)
          </p>
        </div>
      </section>

      {/* ── ZONE 2 · THE CASH REALITY ──────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', background: C.bgSoft, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <p style={eyebrow}>Zone 2 · The cash reality</p>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, textAlign: 'center', margin: '0 0 18px' }}>
            The Challenge earns nothing. <span style={{ color: C.blue }}>The Blueprint earns first.</span>
          </h2>
          <p style={{ fontSize: '17px', color: C.body, textAlign: 'center', margin: '0 auto 48px', maxWidth: '820px', lineHeight: 1.5 }}>
            Where the money is, and where it isn&apos;t. The free top of funnel is the warm-up; the cash is downstream.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '18px' }}>
            <div style={mCard()}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Stage 1 · Challenge</p>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 10px' }}>$0</p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.55, margin: 0 }}>Free. Pure lead + 14-day warm-up. Ad spend is sunk here until later.</p>
            </div>
            <div style={mCard(C.amber)}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: C.amber, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Stage 2 · Blueprint</p>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 10px' }}>$97 · first cash</p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.55, margin: 0 }}>Lands Day 14+ for converters only. Small ticket, so it needs volume.</p>
            </div>
            <div style={mCard()}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Stage 3 · Membership</p>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 10px' }}>$49/wk</p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.55, margin: 0 }}>Recurring. Lower commitment than coaching; monetises the non-ascenders.</p>
            </div>
            <div style={mCard()}>
              <p style={{ fontSize: '12px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>Stage 4 · Coaching</p>
              <p style={{ fontSize: '26px', fontWeight: 900, margin: '0 0 10px' }}>Real revenue</p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.55, margin: 0 }}>$297 + $149–409/wk. The ceiling both funnels reach. Makes the ad maths work.</p>
            </div>
          </div>

          <div style={{ background: '#FEF6E7', border: '1px solid #F0DCB4', borderRadius: '10px', padding: '14px 22px', margin: '24px auto 0', maxWidth: '960px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: '8px' }}>Rent reality</span>
            <span style={{ fontSize: '14px', color: C.body, lineHeight: 1.55 }}>Ads → free Challenge builds <strong style={{ color: C.text }}>next month&apos;s pipeline, not this month&apos;s rent.</strong> Rent cash comes from selling the Blueprint + coaching to warm / existing pipeline who skip the 14-day warm-up.</span>
          </div>
          <div style={{ background: '#EFF6FF', border: '1px solid #B5CFFC', borderRadius: '10px', padding: '14px 22px', margin: '16px auto 0', maxWidth: '960px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: '8px' }}>Where the video sits</span>
            <span style={{ fontSize: '14px', color: C.body, lineHeight: 1.55 }}><strong style={{ color: C.text }}>Primary:</strong> the free Challenge landing page (the cold paid entry). <strong style={{ color: C.text }}>Secondary (later):</strong> the Blueprint page to lift the $97 take-rate. Promote the Challenge first.</span>
          </div>
        </div>
      </section>

      {/* ── ZONE 3 · SIX NUMBERS ───────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-220px', left: '50%', transform: 'translateX(-50%)', width: '720px', height: '720px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: '1080px', margin: '0 auto', width: '100%' }}>
          <p style={eyebrow}>Zone 3 · What to track</p>
          <h2 style={{ fontSize: 'clamp(34px, 4vw, 50px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.1, textAlign: 'center', margin: '0 0 18px' }}>
            Six numbers decide <span style={{ color: C.blue }}>if the engine pays for itself.</span>
          </h2>
          <p style={{ fontSize: '17px', color: C.body, textAlign: 'center', margin: '0 auto 48px', maxWidth: '820px', lineHeight: 1.5 }}>
            Track the chain weekly, from scorecard completion through to coaching. This is the July baseline.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px' }}>
            {[
              ['1 · Traffic → Scorecard', 'Cost per completion', 'Your top KPI. Every click should finish the 2-min scorecard. Set a ceiling.', C.blue],
              ['2 · Scorecard → product', '% Depleted → Challenge', 'State mix + routing. Most land Depleted, so most route to the Challenge.', C.blue],
              ['3 · Engagement', 'Day 7 completion', 'The warm-up is working if a healthy share reach Day 7.', C.blue],
              ['4 · Trust peak', 'Day 14 views', 'Drop-off here means the 14-day experience is leaking.', C.blue],
              ['5 · Monetisation', 'Blueprint take-rate', 'The number that decides if ads self-liquidate.', C.amber],
              ['6 · Ascension', 'Membership → coaching', 'Stage 3 to Stage 4. Where LTV and the ad maths actually close.', C.blue],
            ].map(([n, t, b, top]) => (
              <div key={n} style={mCard(top as string)}>
                <p style={{ fontSize: '12px', fontWeight: 800, color: top === C.amber ? C.amber : C.blueDark, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 8px' }}>{n}</p>
                <p style={{ fontSize: '18px', fontWeight: 900, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{t}</p>
                <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.55, margin: 0 }}>{b}</p>
              </div>
            ))}
          </div>

          <div style={{ background: C.blueDeepest, border: `2px solid ${C.blue}`, borderRadius: '12px', padding: '16px 24px', margin: '28px auto 0', maxWidth: '960px', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#B5CFFC', letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: '8px' }}>Self-liquidation test</span>
            <span style={{ fontSize: '14px', color: '#fff', lineHeight: 1.55 }}>(Blueprint take-rate × $97) + (coaching conversion × coaching value) <strong>≥ cost per signup</strong> → the engine pays for itself, scale spend. If not, fix the earliest broken step before adding budget.</span>
          </div>
          <p style={{ fontSize: '15px', color: C.grey, textAlign: 'center', margin: '32px auto 0', maxWidth: '820px', lineHeight: 1.6, fontStyle: 'italic' }}>
            Fix the earliest broken step first. A leak upstream makes everything downstream look worse than it is.
          </p>
        </div>
      </section>

    </div>
  )
}
