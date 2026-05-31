'use client'

/**
 * B-roll canvas: Funnel B - State-First Product Arc (Full Funnel)
 *
 * The full Body Recode product funnel as actually built. Sibling of
 * /broll/full-funnel-arc (4-stage horizontal arc); this version shows
 * the complete architecture including:
 *   - Multiple state-first entries via the Scorecard
 *   - The 12-Week State Program ($97) parallel to the 6-Week Blueprint
 *   - Stage 4 (1:1 Performance Coaching) as VERTICAL ascension UP
 *   - 90-Day Follow Up as any-stage-churn re-engagement side loop
 *   - Side branches: Portal (live) + Ebooks/Bolt-Ons (placeholders)
 *
 * Modeled on the Charlie Johnson / Grow Your Online Fitness Business
 * funnel diagram (reference images IMG_2065, IMG_3537, IMG_3538) but
 * rebuilt around Body Recode's state-first architecture.
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: The full funnel diagram (entry -> products -> ascension)
 *   Zone 2: Stage 4 vertical ascension spotlight (the ceiling)
 *   Zone 3: Side products and loops (12-week, 90-day, placeholders)
 *
 * Source of truth for pricing:
 *   src/app/dashboard/business/strategy/page.tsx (Stage 4 tiers)
 *   src/app/dashboard/preview/page.tsx (12-week state program)
 *   ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/Body_Recode_Funnel_Master_Map_v1.0.md
 *   (supersession banner)
 *
 * URL: /broll/funnel-b-product-arc (noindex - see /broll/layout.tsx)
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

const zone1Card = (color: string, isPlaceholder = false): React.CSSProperties => ({
  background: isPlaceholder ? '#F7F7F5' : C.bg,
  border: isPlaceholder ? '1px dashed #D4D4D4' : `1px solid ${color}40`,
  borderTop: isPlaceholder ? '1px dashed #D4D4D4' : `3px solid ${color}`,
  borderRadius: '12px',
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  minHeight: '120px',
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

export default function FunnelBProductArcPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: C.bg,
      color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 1 · THE FULL FUNNEL DIAGRAM
          ═══════════════════════════════════════════════════════════════ */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
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
          <p style={{ ...eyebrow, marginBottom: '14px', textAlign: 'center' }}>
            Funnel B · State-First Product Arc
          </p>
          <h1 style={{
            fontSize: 'clamp(36px, 4.5vw, 54px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: C.text, marginBottom: '14px', textAlign: 'center',
          }}>
            The full <span style={{ color: C.blue }}>Body Recode funnel.</span>
          </h1>
          <p style={{
            fontSize: '17px', color: C.body,
            textAlign: 'center', marginBottom: '40px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
          }}>
            One entry. Three state-matched paths. Vertical ascension into bespoke 1:1.
          </p>

          {/* Level 1 — Entry */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
            <div style={{
              background: C.text,
              color: '#FFFFFF',
              padding: '12px 28px',
              borderRadius: '10px',
              fontSize: '14px', fontWeight: 900, letterSpacing: '0.04em',
            }}>
              SCORECARD · bodyrecode.au/scorecard
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: C.grey, marginBottom: '20px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            ↓ state routes ↓
          </p>

          {/* Level 2 — State-routed products (Stage 1, 2, 3 horizontal + 12-week side path) */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '24px',
          }}>
            {/* Stage 1 — Challenge */}
            <div style={zone1Card(C.blue)}>
              <div>
                <span style={stageBadge(C.blue)}>Stage 1 · Depleted entry</span>
                <p style={cardTitle}>14-Day Body Decode Challenge</p>
                <p style={cardSub}>Free · 14 days</p>
                <p style={cardBody}>Reset the system. Read the pattern on Day 7. Body Decode Report on Day 14.</p>
              </div>
              <p style={cardPrice}>Free</p>
            </div>
            {/* Stage 2 — Blueprint */}
            <div style={zone1Card(C.blueDark)}>
              <div>
                <span style={stageBadge(C.blueDark)}>Stage 2 · Transitioning entry</span>
                <p style={cardTitle}>6-Week Body Rewire Blueprint</p>
                <p style={cardSub}>$97 · 6 weeks · pattern-specific</p>
                <p style={cardBody}>Pattern-specific training + nutrition + weekly coaching. Corrects the pattern.</p>
              </div>
              <p style={cardPrice}>$97 one-time</p>
            </div>
            {/* 12-Week State Program (parallel sidestep) */}
            <div style={zone1Card(C.amber)}>
              <div>
                <span style={stageBadge(C.amber)}>$97 Sidestep · Self-guided</span>
                <p style={cardTitle}>12-Week State Program</p>
                <p style={cardSub}>$97 · 12 weeks · state-specific</p>
                <p style={cardBody}>State-specific 12-week training + nutrition (Depleted / Transitioning / Ready). For those who don&apos;t enter via the Challenge.</p>
              </div>
              <p style={cardPrice}>$97 one-time</p>
            </div>
            {/* Stage 3 — Membership */}
            <div style={zone1Card(C.blueDeeper)}>
              <div>
                <span style={stageBadge(C.blueDeeper)}>Stage 3 · Ready entry</span>
                <p style={cardTitle}>Body Recode Membership</p>
                <p style={cardSub}>$49/wk · ongoing · Fat Map intro</p>
                <p style={cardBody}>Block by block calibration. First Fat Map exposure. Long-arc infrastructure.</p>
              </div>
              <p style={cardPrice}>$49/wk</p>
            </div>
          </div>

          {/* Convergence + Vertical ascension UP into Stage 4 */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', color: C.grey, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
              ↑ vertical ascension from any stage ↑
            </p>
            <div style={{
              background: C.blueDeepest,
              color: '#FFFFFF',
              padding: '18px 32px',
              borderRadius: '12px',
              border: `2px solid ${C.blue}`,
              boxShadow: '0 8px 24px rgba(2, 26, 77, 0.25)',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B5CFFC', margin: '0 0 6px' }}>
                Stage 4 · Ascension ceiling
              </p>
              <p style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                Online 1:1 Performance Coaching
              </p>
              <p style={{ fontSize: '13px', color: '#B5CFFC', margin: 0 }}>
                $240 commencement + $149/wk · In-person 2x ($299/wk) and 3x ($409/wk) for local clients
              </p>
            </div>
          </div>

          {/* Bottom row — Side branches and 90-day loop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '12px',
            marginTop: '24px',
          }}>
            <div style={zone1Card(C.grey, true)}>
              <div>
                <span style={{ ...stageBadge(C.grey), background: '#D4D4D4', color: C.text }}>Side product · Placeholder</span>
                <p style={cardTitle}>Ebooks</p>
                <p style={cardSub}>Not yet built</p>
                <p style={cardBody}>Standalone $10-30 educational products (state-specific reads, deep-dives on patterns).</p>
              </div>
              <p style={{ ...cardPrice, color: C.grey }}>$10-30 TBD</p>
            </div>
            <div style={zone1Card(C.grey, true)}>
              <div>
                <span style={{ ...stageBadge(C.grey), background: '#D4D4D4', color: C.text }}>Side product · Placeholder</span>
                <p style={cardTitle}>Bolt Ons</p>
                <p style={cardSub}>Not yet built</p>
                <p style={cardBody}>Add-ons inside the Membership (deep-dive modules, supplement protocols, specialty programs).</p>
              </div>
              <p style={{ ...cardPrice, color: C.grey }}>$10-100 TBD</p>
            </div>
            <div style={zone1Card(C.blue)}>
              <div>
                <span style={stageBadge(C.blue)}>Live · Member portal</span>
                <p style={cardTitle}>Portal access</p>
                <p style={cardSub}>Live · included</p>
                <p style={cardBody}>Full member portal (training, nutrition, check-ins, Fat Map). Gated by tier.</p>
              </div>
              <p style={cardPrice}>Included</p>
            </div>
            <div style={zone1Card(C.amber)}>
              <div>
                <span style={stageBadge(C.amber)}>Side loop · Any-stage churn</span>
                <p style={cardTitle}>90-Day Follow Up</p>
                <p style={cardSub}>Automated · re-engagement</p>
                <p style={cardBody}>Fires when a lead or client churns from any stage. 90-day email sequence + re-entry discount + referral incentive. Loops them back to the Scorecard.</p>
              </div>
              <p style={{ ...cardPrice, color: C.amber }}>Free · auto</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 2 · STAGE 4 VERTICAL ASCENSION SPOTLIGHT
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
            Zone 2 · The ceiling
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: C.text, marginBottom: '20px', textAlign: 'center',
          }}>
            Stage 4 is the vertical, <span style={{ color: C.blue }}>not the next step across.</span>
          </h2>
          <p style={{
            fontSize: '17px', color: C.body,
            textAlign: 'center', marginBottom: '56px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Every horizontal product is the path. 1:1 Performance Coaching is the ceiling you can reach up into from anywhere on the path.
          </p>

          {/* Three Stage 4 tiers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {/* Online 1:1 */}
            <div style={{
              background: C.bg,
              border: `2px solid ${C.blue}`,
              borderRadius: '16px',
              padding: '28px 26px',
              position: 'relative',
            }}>
              <div style={{
                position: 'absolute', top: '-12px', right: '20px',
                background: C.blue, color: '#FFFFFF',
                fontSize: '10px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '5px 12px', borderRadius: '6px',
              }}>
                Canonical ascension
              </div>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 8px' }}>
                Tier 1
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Online 1:1
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 14px' }}>
                $240 commencement + $149/wk
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.65, margin: 0 }}>
                Fully bespoke. Weekly 1:1 check-ins. Fat Map updated continuously. The default ascension path from the product ladder (Stages 1-3).
              </p>
            </div>
            {/* In-person 2x */}
            <div style={{
              background: C.bg,
              border: `1px solid ${C.blueDark}40`,
              borderRadius: '16px',
              padding: '28px 26px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDark, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 8px' }}>
                Tier 2 · Brisbane-local
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                In-person 2x
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 14px' }}>
                $240 commencement + $299/wk
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.65, margin: 0 }}>
                Two in-person sessions per week at AF Newstead. Same interpretation system, in-room contact, hands-on calibration.
              </p>
            </div>
            {/* In-person 3x */}
            <div style={{
              background: C.bg,
              border: `1px solid ${C.blueDeeper}40`,
              borderRadius: '16px',
              padding: '28px 26px',
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: C.blueDeeper, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 8px' }}>
                Tier 3 · Brisbane-local
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                In-person 3x
              </p>
              <p style={{ fontSize: '14px', fontWeight: 800, color: C.blueDark, margin: '0 0 14px' }}>
                $240 commencement + $409/wk
              </p>
              <p style={{ fontSize: '13px', color: C.body, lineHeight: 1.65, margin: 0 }}>
                Three in-person sessions per week. Highest contact tier. Recommended for clients in active progression with capacity for higher density.
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '15px', color: C.grey,
            textAlign: 'center', marginTop: '48px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            $240 one-time commencement covers the foundational read (CFFS, intake, Fat Map baseline). The weekly subscription begins after.
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          ZONE 3 · SIDE PRODUCTS AND LOOPS
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
          <p style={{ ...eyebrow, marginBottom: '16px', textAlign: 'center' }}>
            Zone 3 · The off-paths
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: C.text, marginBottom: '20px', textAlign: 'center',
          }}>
            Side products, side loops, <span style={{ color: C.blue }}>and what is still TBD.</span>
          </h2>
          <p style={{
            fontSize: '17px', color: C.body,
            textAlign: 'center', marginBottom: '56px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            The straight ascension is the main path. These are the parallel paths, the re-entry loop, and the side products that compound the model.
          </p>

          {/* 4 cards: 12-Week State Program / 90-Day Follow Up / Ebooks / Bolt Ons */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '20px',
          }}>
            {/* 12-Week State Program */}
            <div style={{
              background: C.bg,
              border: `1px solid ${C.amber}30`,
              borderLeft: `4px solid ${C.amber}`,
              borderRadius: '14px',
              padding: '24px 26px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Off-Challenge sidestep · Live
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.amber }}>$97</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                12-Week State Program
              </h3>
              <p style={{ fontSize: '14px', color: C.body, lineHeight: 1.7, margin: 0 }}>
                State-specific self-guided 12-week training + nutrition. Three variants (Depleted / Transitioning / Ready). For leads who don&apos;t enter through the Challenge but want a structured reset. Delivered at <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>app.bodyrecode.au/program/[token]</span>. Triggered as the $97 downsell from the leads dashboard.
              </p>
            </div>

            {/* 90-Day Follow Up */}
            <div style={{
              background: C.bg,
              border: `1px solid ${C.amber}30`,
              borderLeft: `4px solid ${C.amber}`,
              borderRadius: '14px',
              padding: '24px 26px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.amber, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Re-engagement loop · Live
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.amber }}>Auto</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                90-Day Follow Up
              </h3>
              <p style={{ fontSize: '14px', color: C.body, lineHeight: 1.7, margin: 0 }}>
                Triggered when a lead or client churns from any stage. 90-day email sequence + re-entry discount + referral incentive PDF. Brings cold leads and lapsed clients back to the Scorecard for re-routing.
              </p>
            </div>

            {/* Ebooks (placeholder) */}
            <div style={{
              background: '#F7F7F5',
              border: '1px dashed #D4D4D4',
              borderLeft: '4px dashed #B5B5B5',
              borderRadius: '14px',
              padding: '24px 26px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.grey, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Side product · Placeholder
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.grey }}>$10-30 TBD</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                Ebooks
              </h3>
              <p style={{ fontSize: '14px', color: C.body, lineHeight: 1.7, margin: 0 }}>
                Standalone educational products (pattern deep-dives, state-specific reads, the Fat Map primer). Not yet built. Will sit as a lower-friction tripwire than the $97 sidestep for browser-grade buyers.
              </p>
            </div>

            {/* Bolt Ons (placeholder) */}
            <div style={{
              background: '#F7F7F5',
              border: '1px dashed #D4D4D4',
              borderLeft: '4px dashed #B5B5B5',
              borderRadius: '14px',
              padding: '24px 26px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: C.grey, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Side product · Placeholder
                </span>
                <span style={{ fontSize: '12px', fontWeight: 800, color: C.grey }}>$10-100 TBD</span>
              </div>
              <h3 style={{ fontSize: '22px', fontWeight: 900, color: C.text, letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2 }}>
                Bolt Ons
              </h3>
              <p style={{ fontSize: '14px', color: C.body, lineHeight: 1.7, margin: 0 }}>
                Add-on modules sold inside the Membership (specialty programs, supplement protocols, recovery deep-dives). Not yet built. AOV lift inside the recurring tier.
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '15px', color: C.grey,
            textAlign: 'center', marginTop: '48px', fontWeight: 600, fontStyle: 'italic',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            The straight path is Scorecard → Stage 1 → Stage 2 → Stage 3, with vertical ascension into Stage 4. Everything else exists to catch buyers the straight path misses.
          </p>
        </div>
      </section>

    </div>
  )
}
