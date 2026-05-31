'use client'

/**
 * B-roll canvas: Funnel A - Direct Coaching Arc (Scorecard -> 1:1)
 *
 * The high-intent Body Recode funnel where a lead enters via the
 * Scorecard, optionally buys the $37 Body Decode Report, takes a
 * Zoom 1 sales call, and either commences ($240 + weekly subscription)
 * or declines (3-email re-engagement + $97 12-Week State Program
 * downsell).
 *
 * Partner of /broll/funnel-b-product-arc which covers the product
 * ladder (Challenge -> Blueprint -> Membership) path. Funnel A is the
 * 1:1 direct path. Both funnels converge at Stage 4 coaching ascension
 * but enter via different doors and serve different intent levels.
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: The full Funnel A diagram. Scorecard at left, horizontal
 *           flow Scorecard -> $37 Report -> Zoom invite -> Zoom call ->
 *           Commencement, with Stage 4 subscription tiers UP from
 *           Commencement and the Decline branch DOWN from Zoom call
 *           (3-email re-engagement -> $97 12-Week State Program).
 *   Zone 2: Zoom 1 Call Companion 4-stage breakdown (Listen + Pitch)
 *           and the Path A/B/C decision matrix.
 *   Zone 3: The three coaching subscription tiers + the LTV path
 *           (commencement fee + weekly + 3x upgrade).
 *
 * Source of truth:
 *   src/app/dashboard/help/page.tsx (Sections 1, 2)
 *   src/app/dashboard/business/strategy/page.tsx (Stage 4 tiers)
 *   ~/.claude/projects/-Users-kadedunstone/memory/project_hormozi_money_model.md
 *
 * URL: /broll/funnel-a-direct-coaching-arc (noindex)
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
  borderSoft: '#F0F0F0',
}

const eyebrow: React.CSSProperties = {
  fontSize: '13px', fontWeight: 700, color: C.blue,
  letterSpacing: '0.18em', textTransform: 'uppercase',
}

const CARD_MIN_HEIGHT = '140px'

const zone1Card = (color: string, isPlaceholder = false): React.CSSProperties => ({
  background: isPlaceholder ? '#F7F7F5' : C.bg,
  border: isPlaceholder ? '1px dashed #D4D4D4' : `1px solid ${color}40`,
  borderTop: isPlaceholder ? '1px dashed #D4D4D4' : `3px solid ${color}`,
  borderRadius: '12px',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: CARD_MIN_HEIGHT,
  height: '100%',
  boxSizing: 'border-box',
})

const stageBadge = (color: string): React.CSSProperties => ({
  display: 'inline-block',
  background: color,
  color: '#FFFFFF',
  fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  padding: '4px 8px', borderRadius: '4px',
  marginBottom: '8px',
})

const cardTitle: React.CSSProperties = {
  fontSize: '15px', fontWeight: 900, color: C.text,
  letterSpacing: '-0.01em', margin: '0 0 4px', lineHeight: 1.25,
}

const cardSub: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: C.grey,
  letterSpacing: '0.04em', margin: '0 0 8px',
}

const cardBody: React.CSSProperties = {
  fontSize: '12px', color: C.body, lineHeight: 1.5, margin: 0,
}

const cardPrice: React.CSSProperties = {
  fontSize: '12px', fontWeight: 800, color: C.blueDark,
  letterSpacing: '0.04em', marginTop: '8px',
}

export default function FunnelADirectCoachingArcPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 1 · THE FUNNEL A FLOW
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '40px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Signal Blue radial glows */}
        <div style={{
          position: 'absolute', top: '-180px', right: '-180px',
          width: '560px', height: '560px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-180px', left: '-180px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1480px', margin: '0 auto', width: '100%' }}>
          <p style={{ ...eyebrow, marginBottom: '10px', textAlign: 'center' }}>
            Funnel A · Direct Coaching Arc
          </p>
          <h1 style={{
            fontSize: 'clamp(32px, 4vw, 46px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: C.text, marginBottom: '10px', textAlign: 'center',
          }}>
            Scorecard to <span style={{ color: C.blue }}>1:1 coaching.</span>
          </h1>
          <p style={{
            fontSize: '15px', color: C.body,
            textAlign: 'center', marginBottom: '20px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
          }}>
            High-intent path. One Zoom call. Three decision paths out. Recovery branch for the no.
          </p>

          {/*
            Funnel A layout (9-col x 7-row grid):

              Row 1: . . . . . . . . [Stage 4 subscription tiers]   ← UP from Commencement
              Row 2: . . . . . . . .         ↑
              Row 3: [Scorecard] → [$37 Report] → [Zoom invite] → [Zoom call] → [Commencement]
              Row 4: . . . . . . .           ↓ . .                 ← DECLINED (Path A)
              Row 5: . . . . . . . [3-email re-engagement] . .
              Row 6: . . . . . . .           ↓ . .
              Row 7: . . . . . . . [$97 12-Week State Program] . .
          */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 32px 1fr 32px 1fr 32px 1fr 32px 1fr',
            gridTemplateRows: `${CARD_MIN_HEIGHT} 26px ${CARD_MIN_HEIGHT} 26px ${CARD_MIN_HEIGHT} 26px ${CARD_MIN_HEIGHT}`,
            gap: '10px',
            alignItems: 'stretch',
          }}>
            {/* Row 1 — Stage 4 subscription tiers ceiling card, col 9 (above Commencement) */}
            <div style={{ gridColumn: '9 / 10', gridRow: '1 / 2' }}>
              <div style={{
                background: C.blueDeepest,
                color: '#FFFFFF',
                padding: '16px 18px',
                borderRadius: '12px',
                border: `2px solid ${C.blue}`,
                textAlign: 'center',
                minHeight: CARD_MIN_HEIGHT,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B5CFFC', margin: '0 0 6px' }}>
                  Coaching · Weekly subscription
                </p>
                <p style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                  Online · In-person 2x · 3x
                </p>
                <p style={{ fontSize: '11px', color: '#B5CFFC', margin: 0, lineHeight: 1.45 }}>
                  $149/wk online · $299/wk 2x · $409/wk 3x
                </p>
              </div>
            </div>

            {/* Row 2 — UP arrow from Commencement to Coaching tiers, col 9 */}
            <div style={{ gridColumn: '9 / 10', gridRow: '2 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>↑</span>
            </div>

            {/* Row 3 — Main horizontal funnel: Scorecard → $37 Report → Zoom invite → Zoom call → Commencement */}
            {/* Scorecard (col 1) */}
            <div style={{ gridColumn: '1 / 2', gridRow: '3 / 4' }}>
              <div style={{
                background: C.text,
                color: '#FFFFFF',
                padding: '16px 18px',
                borderRadius: '12px',
                textAlign: 'center',
                minHeight: CARD_MIN_HEIGHT,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                boxSizing: 'border-box',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999999', margin: '0 0 6px' }}>
                  Entry
                </p>
                <p style={{ fontSize: '17px', fontWeight: 900, margin: '0 0 6px', letterSpacing: '0.04em' }}>
                  SCORECARD
                </p>
                <p style={{ fontSize: '10px', color: '#999999', margin: 0 }}>
                  bodyrecode.au/scorecard
                </p>
              </div>
            </div>
            {/* → arrow col 2 */}
            <div style={{ gridColumn: '2 / 3', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
            </div>
            {/* $37 Body Decode Report (col 3) */}
            <div style={{ gridColumn: '3 / 4', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blue)}>
                <div>
                  <span style={stageBadge(C.blue)}>Upsell · Optional</span>
                  <p style={cardTitle}>$37 Body Decode Report</p>
                  <p style={cardSub}>Immediate post-scorecard</p>
                  <p style={cardBody}>Section-by-section interpretation, state-specific stop/start lists, book a call CTA.</p>
                </div>
                <p style={cardPrice}>$37 one-time</p>
              </div>
            </div>
            {/* → arrow col 4 */}
            <div style={{ gridColumn: '4 / 5', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
            </div>
            {/* Zoom 1 invite (col 5) */}
            <div style={{ gridColumn: '5 / 6', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blueDark)}>
                <div>
                  <span style={stageBadge(C.blueDark)}>Lead nurture</span>
                  <p style={cardTitle}>Zoom 1 invite</p>
                  <p style={cardSub}>2-email follow-up sequence</p>
                  <p style={cardBody}>Discovery call booked via Calendly. Free 15 min. Orientation Guide as pre-call material.</p>
                </div>
                <p style={cardPrice}>Free</p>
              </div>
            </div>
            {/* → arrow col 6 */}
            <div style={{ gridColumn: '6 / 7', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
            </div>
            {/* Zoom 1 call (col 7) */}
            <div style={{ gridColumn: '7 / 8', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blueDeeper)}>
                <div>
                  <span style={stageBadge(C.blueDeeper)}>Conversion</span>
                  <p style={cardTitle}>Zoom 1 sales call</p>
                  <p style={cardSub}>4-stage Call Companion</p>
                  <p style={cardBody}>Listen (Recap + Hot Spot) then Pitch (System + Offer). 3 paths out: A Declined / B Needs Time / C Proceeding.</p>
                </div>
                <p style={cardPrice}>Free</p>
              </div>
            </div>
            {/* → arrow col 8 (Path C — Proceeding) */}
            <div style={{ gridColumn: '8 / 9', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
              <span style={{ fontSize: '8px', color: C.blue, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Path C</span>
            </div>
            {/* Commencement Fee $240 (col 9) */}
            <div style={{ gridColumn: '9 / 10', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blueDeepest)}>
                <div>
                  <span style={{ ...stageBadge(C.blueDeepest), background: C.blueDeepest }}>Front-end $</span>
                  <p style={cardTitle}>Commencement Fee</p>
                  <p style={cardSub}>$240 one-time · Foundational read</p>
                  <p style={cardBody}>Covers CFFS intake, Fat Map baseline, system setup. Stripe checkout link.</p>
                </div>
                <p style={cardPrice}>$240</p>
              </div>
            </div>

            {/* Row 4 — DOWN arrow from Zoom 1 call (col 7) — Path A Declined */}
            <div style={{ gridColumn: '7 / 8', gridRow: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <span style={{ fontSize: '22px', color: C.amber, fontWeight: 800 }}>↓</span>
              <span style={{ fontSize: '8px', color: C.amber, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: '2px' }}>Path A · Declined</span>
            </div>

            {/* Row 5 — 3-email re-engagement (col 7) */}
            <div style={{ gridColumn: '7 / 8', gridRow: '5 / 6' }}>
              <div style={zone1Card(C.amber)}>
                <div>
                  <span style={stageBadge(C.amber)}>Re-engagement · Auto</span>
                  <p style={cardTitle}>3-email follow-up sequence</p>
                  <p style={cardSub}>Day 1 · Day 5 · Day 12</p>
                  <p style={cardBody}>Fires when coach clicks &quot;Send declined follow-up&quot; on the Zoom companion. Soft return-to-conversation path.</p>
                </div>
                <p style={{ ...cardPrice, color: C.amber }}>Free · auto</p>
              </div>
            </div>

            {/* Row 6 — DOWN arrow from 3-email to 12-Week, col 7 */}
            <div style={{ gridColumn: '7 / 8', gridRow: '6 / 7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.amber, fontWeight: 800 }}>↓</span>
            </div>

            {/* Row 7 — $97 12-Week State Program (col 7) */}
            <div style={{ gridColumn: '7 / 8', gridRow: '7 / 8' }}>
              <div style={zone1Card(C.amber)}>
                <div>
                  <span style={stageBadge(C.amber)}>Decline downsell · Live</span>
                  <p style={cardTitle}>$97 12-Week State Program</p>
                  <p style={cardSub}>State-specific · self-guided</p>
                  <p style={cardBody}>Fires alongside the 3-email sequence. State-tailored 12-week training + nutrition delivered at app.bodyrecode.au/program/[token].</p>
                </div>
                <p style={{ ...cardPrice, color: C.amber }}>$97 one-time</p>
              </div>
            </div>
          </div>

          {/* Reading guide under the diagram (compact, Path A/B/C detail lives in Zone 2) */}
          <p style={{
            fontSize: '12px', color: C.grey,
            textAlign: 'center', marginTop: '16px',
            maxWidth: '1100px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.55,
          }}>
            <strong style={{ color: C.amber }}>Path A (Declined)</strong> drops the decline branch ·
            <strong style={{ color: C.grey }}> Path B (Needs Time)</strong> = manual follow-up, not drawn ·
            <strong style={{ color: C.blue }}> Path C (Proceeding)</strong> = forward arrow into Commencement.
            Full path detail in Zone 2.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 2 · ZOOM 1 CALL COMPANION
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        background: C.bgSoft,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <p style={{ ...eyebrow, marginBottom: '16px', textAlign: 'center' }}>
            Zone 2 · The Zoom 1 conversion mechanic
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: C.text, marginBottom: '16px', textAlign: 'center',
          }}>
            Listen first. <span style={{ color: C.blue }}>Pitch second.</span>
          </h2>
          <p style={{
            fontSize: '17px', color: C.body,
            textAlign: 'center', marginBottom: '40px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            4-stage Call Companion. The first half builds trust by reading their actual scorecard back and surfacing the hot spot. The second half ties the system to their specific thing and closes.
          </p>

          {/* 4 stages in a 4-col grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            marginBottom: '28px',
          }}>
            <div style={{
              background: C.bg, border: `1px solid ${C.blue}40`, borderLeft: `4px solid ${C.blue}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: C.blue, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Listen · Stage 1
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Recap
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.6, margin: 0 }}>
                Walk the lead through their actual scorecard. Score, body state, per-section breakdown. Capture training context (Active / Returning / New).
              </p>
            </div>
            <div style={{
              background: C.bg, border: `1px solid ${C.blue}40`, borderLeft: `4px solid ${C.blue}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: C.blue, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Listen · Stage 2
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Conversation + Hot Spot
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.6, margin: 0 }}>
                Build the picture with context questions (Energy / Sleep / Stress / Training), then push to the emotional hot spot. Specific. Vulnerable. In their words.
              </p>
            </div>
            <div style={{
              background: C.bg, border: `1px solid ${C.blueDark}40`, borderLeft: `4px solid ${C.blueDark}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Pitch · Stage 3
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Tie hot spot to system
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.6, margin: 0 }}>
                4 system cards (Intake → CFFS → Execution → Continuous Loop), each anchored back to the hot spot from Stage 2.
              </p>
            </div>
            <div style={{
              background: C.bg, border: `1px solid ${C.blueDark}40`, borderLeft: `4px solid ${C.blueDark}`,
              borderRadius: '12px', padding: '18px 20px',
            }}>
              <p style={{ fontSize: '9px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Pitch · Stage 4
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                Offer + Packages + Decision
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.6, margin: 0 }}>
                State what is included. Three packages at standard rates. Pause after stating price. Decision panel: Path A / B / C.
              </p>
            </div>
          </div>

          {/* 3 Decision Paths */}
          <p style={{
            fontSize: '11px', fontWeight: 800, color: C.grey,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            textAlign: 'center', marginBottom: '14px',
          }}>
            Three paths out of the call
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '14px',
          }}>
            <div style={{
              background: C.bg, border: `1px solid ${C.amber}40`, borderLeft: `4px solid ${C.amber}`,
              borderRadius: '12px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Path A
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 6px' }}>
                Declined
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Closes status to Closed Declined. Triggers the 3-email re-engagement and the $97 12-Week State Program downsell.
              </p>
            </div>
            <div style={{
              background: C.bg, border: `1px solid ${C.grey}40`, borderLeft: `4px solid ${C.grey}`,
              borderRadius: '12px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.grey, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Path B
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 6px' }}>
                Needs Time
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Status to Zoom Completed. Manual follow-up. No automation. Lead stays warm in the pipeline.
              </p>
            </div>
            <div style={{
              background: C.bg, border: `1px solid ${C.blue}40`, borderLeft: `4px solid ${C.blue}`,
              borderRadius: '12px', padding: '16px 18px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blue, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
                Path C
              </p>
              <p style={{ fontSize: '17px', fontWeight: 900, color: C.text, margin: '0 0 6px' }}>
                Proceeding
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Pathway selector (Full Rate / Online), then commencement fee link can be sent immediately. Moves into onboarding.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 3 · COACHING SUBSCRIPTION TIERS + LTV PATH
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-220px', left: '50%', transform: 'translateX(-50%)',
          width: '720px', height: '720px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          {/* Cross-reference banner: Funnel A converges with Funnel B here */}
          <div style={{
            background: `${C.blue}10`, border: `1px solid ${C.blue}40`,
            borderRadius: '10px', padding: '10px 18px',
            margin: '0 auto 28px', maxWidth: '900px', textAlign: 'center',
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', marginRight: '8px' }}>
              Funnels converge here
            </span>
            <span style={{ fontSize: '13px', color: C.body, lineHeight: 1.55 }}>
              This is the same destination as <strong style={{ color: C.text }}>Stage 4 in /broll/funnel-b-product-arc</strong>. Both funnels end up at 1:1 Performance Coaching; they enter through different doors.
            </span>
          </div>

          <p style={{ ...eyebrow, marginBottom: '16px', textAlign: 'center' }}>
            Zone 3 · The back-end
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: C.text, marginBottom: '20px', textAlign: 'center',
          }}>
            Commencement opens it. <span style={{ color: C.blue }}>Subscription compounds it.</span>
          </h2>
          <p style={{
            fontSize: '17px', color: C.body,
            textAlign: 'center', marginBottom: '48px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            $240 one-time covers the foundational read. Weekly subscription begins after. LTV grows on the 3x upgrade.
          </p>

          {/* 4 cards: Commencement + 3 tiers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
            marginBottom: '32px',
          }}>
            {/* Commencement */}
            <div style={{
              background: C.bg, border: `2px solid ${C.blueDeepest}`,
              borderRadius: '14px', padding: '24px 22px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDeepest, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Front-end
              </p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Commencement
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDeepest, margin: '0 0 10px' }}>
                $240 one-time
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Foundational read (CFFS intake, Fat Map baseline). Stripe checkout. Sent in Path C of the Zoom call.
              </p>
            </div>
            {/* Online 1:1 — canonical */}
            <div style={{
              background: C.bg, border: `2px solid ${C.blue}`,
              borderRadius: '14px', padding: '24px 22px', position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-12px', right: '14px',
                background: C.blue, color: '#FFFFFF',
                fontSize: '9px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '4px 10px', borderRadius: '5px',
              }}>
                Lead with 2x
              </div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Tier · Online
              </p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Online 1:1
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 10px' }}>
                $149/wk
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Weekly 1:1 check-ins. Fully bespoke programming. Default for non-Brisbane clients.
              </p>
            </div>
            {/* In-person 2x */}
            <div style={{
              background: C.bg, border: `1px solid ${C.blueDark}40`,
              borderRadius: '14px', padding: '24px 22px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Tier · Brisbane
              </p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                In-person 2x
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 10px' }}>
                $299/wk
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Two sessions/wk at AF Newstead. Lead with this in the Zoom call offer.
              </p>
            </div>
            {/* In-person 3x */}
            <div style={{
              background: C.bg, border: `1px solid ${C.blueDeeper}40`,
              borderRadius: '14px', padding: '24px 22px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDeeper, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px' }}>
                Tier · Brisbane
              </p>
              <p style={{ fontSize: '22px', fontWeight: 900, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                In-person 3x
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 10px' }}>
                $409/wk
              </p>
              <p style={{ fontSize: '12px', color: C.body, lineHeight: 1.55, margin: 0 }}>
                Three sessions/wk. LTV upsell from 2x via coach-assessed check-ins.
              </p>
            </div>
          </div>

          {/* LTV upsell callout */}
          <div style={{
            background: C.bg, border: `1px solid ${C.amber}30`, borderLeft: `4px solid ${C.amber}`,
            borderRadius: '14px', padding: '20px 24px',
          }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
              LTV path · 3x upgrade
            </p>
            <p style={{ fontSize: '14px', color: C.body, lineHeight: 1.7, margin: 0 }}>
              Coach-assessed during weekly check-ins. Move from 2x to 3x ($299 → $409/wk) when the client&apos;s capacity supports higher density. Same interpretation system, more training contact, faster compounding. The 3x upgrade is the single biggest LTV lever in Funnel A.
            </p>
          </div>

          <p style={{
            fontSize: '13px', color: C.grey,
            textAlign: 'center', marginTop: '32px', fontStyle: 'italic',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Coach-assessed 1x + self-led at $199/wk also exists for the rare returning-trainer profile with proven self-discipline. Not part of the standard offer stack.
          </p>
        </div>
      </section>

    </div>
  )
}
