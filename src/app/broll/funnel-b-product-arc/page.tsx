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
            textAlign: 'center', marginBottom: '32px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
          }}>
            Scorecard at entry. Five stages of ascension. Side branches feed the model.
          </p>

          {/*
            5-column × 7-row grid representing the funnel architecture:

              Row 1: . . . . [Stage 4 ascension] .
              Row 2: . . . .       ↑              .
              Row 3: [Scorecard] → [Stage 1] → [Stage 2] → [Stage 3] → [Bolt Ons]
              Row 4: . .          .         ↓        ↓     .
              Row 5: . .          .   [90 Day FU]  [Ebooks] .
              Row 6: . .          .         .        ↓     .
              Row 7: . .          .         .   [Socials] .

            Columns: Scorecard | Stage 1 | Stage 2 | Stage 3 | Bolt Ons
            Stage 4 ascension is UP from Stage 3 only (not from any stage).
            90-Day Follow Up branches DOWN from Stage 2 (Blueprint).
            Ebooks → Socials chain branches DOWN from Stage 3 (Membership).
            Bolt Ons sits to the RIGHT of Stage 3.
          */}
          <div style={{
            display: 'grid',
            // 9 columns: alternating card (1fr) / arrow gutter (32px) / card / ...
            gridTemplateColumns: '1.1fr 32px 1fr 32px 1.1fr 32px 1.1fr 32px 0.9fr',
            gridTemplateRows: 'auto 30px auto 30px auto 30px auto',
            gap: '12px',
            alignItems: 'stretch',
          }}>
            {/* Row 1 — Stage 4 ascension card, col 7 (above Stage 3) */}
            <div style={{ gridColumn: '7 / 8', gridRow: '1 / 2' }}>
              <div style={{
                background: C.blueDeepest,
                color: '#FFFFFF',
                padding: '16px 18px',
                borderRadius: '12px',
                border: `2px solid ${C.blue}`,
                boxShadow: '0 8px 24px rgba(2, 26, 77, 0.25)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.16em', textTransform: 'uppercase', color: '#B5CFFC', margin: '0 0 4px' }}>
                  Stage 4 · Ascension ceiling
                </p>
                <p style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                  Online 1:1 Performance Coaching
                </p>
                <p style={{ fontSize: '11px', color: '#B5CFFC', margin: 0, lineHeight: 1.4 }}>
                  $240 commencement + $149/wk · In-person 2x $299/wk · 3x $409/wk
                </p>
              </div>
            </div>

            {/* Row 2 — UP arrow from Stage 3 to Stage 4, col 7 */}
            <div style={{ gridColumn: '7 / 8', gridRow: '2 / 3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>↑</span>
            </div>

            {/* Row 3 — Main horizontal funnel with → arrows in cols 2, 4, 6, 8 */}
            {/* Scorecard (col 1) */}
            <div style={{ gridColumn: '1 / 2', gridRow: '3 / 4' }}>
              <div style={{
                background: C.text,
                color: '#FFFFFF',
                padding: '16px 18px',
                borderRadius: '12px',
                textAlign: 'center',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}>
                <p style={{ fontSize: '9px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#999999', margin: '0 0 6px' }}>
                  Entry
                </p>
                <p style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 4px' }}>
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
            {/* Stage 1 (col 3) */}
            <div style={{ gridColumn: '3 / 4', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blue)}>
                <div>
                  <span style={stageBadge(C.blue)}>Stage 1</span>
                  <p style={cardTitle}>14-Day Body Decode Challenge</p>
                  <p style={cardSub}>Free · 14 days</p>
                </div>
                <p style={cardPrice}>Free</p>
              </div>
            </div>
            {/* → arrow col 4 */}
            <div style={{ gridColumn: '4 / 5', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
            </div>
            {/* Stage 2 (col 5) */}
            <div style={{ gridColumn: '5 / 6', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blueDark)}>
                <div>
                  <span style={stageBadge(C.blueDark)}>Stage 2</span>
                  <p style={cardTitle}>6-Week Body Rewire Blueprint</p>
                  <p style={cardSub}>$97 · pattern-specific</p>
                </div>
                <p style={cardPrice}>$97 one-time</p>
              </div>
            </div>
            {/* → arrow col 6 */}
            <div style={{ gridColumn: '6 / 7', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.blue, fontWeight: 800 }}>→</span>
            </div>
            {/* Stage 3 (col 7) */}
            <div style={{ gridColumn: '7 / 8', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.blueDeeper)}>
                <div>
                  <span style={stageBadge(C.blueDeeper)}>Stage 3</span>
                  <p style={cardTitle}>Body Recode Membership</p>
                  <p style={cardSub}>$49/wk · Fat Map intro</p>
                </div>
                <p style={cardPrice}>$49/wk</p>
              </div>
            </div>
            {/* → arrow col 8 */}
            <div style={{ gridColumn: '8 / 9', gridRow: '3 / 4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.grey, fontWeight: 800 }}>→</span>
            </div>
            {/* Bolt Ons (col 9, RIGHT of Stage 3) */}
            <div style={{ gridColumn: '9 / 10', gridRow: '3 / 4' }}>
              <div style={zone1Card(C.grey, true)}>
                <div>
                  <span style={{ ...stageBadge(C.grey), background: '#D4D4D4', color: C.text }}>Side · Placeholder</span>
                  <p style={cardTitle}>Bolt Ons</p>
                  <p style={cardSub}>Not yet built</p>
                  <p style={cardBody}>Add-on modules inside the Membership.</p>
                </div>
                <p style={{ ...cardPrice, color: C.grey }}>$10-100 TBD</p>
              </div>
            </div>

            {/* Row 4 — DOWN arrows from Stage 2 (col 5) and Stage 3 (col 7) */}
            <div style={{ gridColumn: '5 / 6', gridRow: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.amber, fontWeight: 800 }}>↓</span>
            </div>
            <div style={{ gridColumn: '7 / 8', gridRow: '4 / 5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.grey, fontWeight: 800 }}>↓</span>
            </div>

            {/* Row 5 — 90-Day FU (col 5) + Ebooks (col 7) */}
            <div style={{ gridColumn: '5 / 6', gridRow: '5 / 6' }}>
              <div style={zone1Card(C.amber)}>
                <div>
                  <span style={stageBadge(C.amber)}>Re-engagement loop</span>
                  <p style={cardTitle}>90-Day Follow Up</p>
                  <p style={cardSub}>Automated · churn re-entry</p>
                  <p style={cardBody}>Fires when a lead exits the Blueprint without ascending. 90-day email sequence + re-entry discount + referral incentive.</p>
                </div>
                <p style={{ ...cardPrice, color: C.amber }}>Free · auto</p>
              </div>
            </div>
            <div style={{ gridColumn: '7 / 8', gridRow: '5 / 6' }}>
              <div style={zone1Card(C.grey, true)}>
                <div>
                  <span style={{ ...stageBadge(C.grey), background: '#D4D4D4', color: C.text }}>Side · Placeholder</span>
                  <p style={cardTitle}>Ebooks</p>
                  <p style={cardSub}>Not yet built</p>
                  <p style={cardBody}>Standalone $10-30 educational products. Pattern deep-dives, state-specific reads, Fat Map primer.</p>
                </div>
                <p style={{ ...cardPrice, color: C.grey }}>$10-30 TBD</p>
              </div>
            </div>

            {/* Row 6 — DOWN arrow from Ebooks to Socials, col 7 */}
            <div style={{ gridColumn: '7 / 8', gridRow: '6 / 7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '22px', color: C.grey, fontWeight: 800 }}>↓</span>
            </div>

            {/* Row 7 — Socials (under Ebooks) with IG + LinkedIn icons, col 7 */}
            <div style={{ gridColumn: '7 / 8', gridRow: '7 / 8' }}>
              <div style={{
                background: C.bg,
                border: `1px solid ${C.blue}40`,
                borderTop: `3px solid ${C.blue}`,
                borderRadius: '12px',
                padding: '14px 18px',
                textAlign: 'center',
              }}>
                <span style={stageBadge(C.blue)}>Distribution</span>
                <p style={{ ...cardTitle, marginBottom: '10px' }}>Socials</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '6px' }}>
                  {/* Instagram */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: 'linear-gradient(135deg, #FED373, #F2725D, #D62D80, #872D9A)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0-2.2C8.7 0 8.3 0 7.1.1 5.8.1 5 .3 4.2.6c-.8.3-1.5.7-2.2 1.4C1.3 2.7.9 3.4.6 4.2.3 5 .1 5.8.1 7.1 0 8.3 0 8.7 0 12s0 3.7.1 4.9c.1 1.3.2 2.1.5 2.9.3.8.7 1.5 1.4 2.2.7.7 1.4 1.1 2.2 1.4.8.3 1.6.5 2.9.5 1.3.1 1.7.1 4.9.1s3.7 0 4.9-.1c1.3-.1 2.1-.2 2.9-.5.8-.3 1.5-.7 2.2-1.4.7-.7 1.1-1.4 1.4-2.2.3-.8.5-1.6.5-2.9.1-1.3.1-1.7.1-4.9s0-3.7-.1-4.9c-.1-1.3-.2-2.1-.5-2.9-.3-.8-.7-1.5-1.4-2.2C21.3.9 20.6.5 19.8.2 19 0 18.2-.1 16.9-.1 15.7 0 15.3 0 12 0z"/>
                      <path d="M12 5.8c-3.4 0-6.2 2.8-6.2 6.2s2.8 6.2 6.2 6.2 6.2-2.8 6.2-6.2-2.8-6.2-6.2-6.2zm0 10.3c-2.3 0-4.1-1.8-4.1-4.1s1.8-4.1 4.1-4.1 4.1 1.8 4.1 4.1-1.8 4.1-4.1 4.1zM18.4 4.2c-.8 0-1.5.7-1.5 1.5s.7 1.5 1.5 1.5 1.5-.7 1.5-1.5-.6-1.5-1.5-1.5z"/>
                    </svg>
                  </div>
                  {/* LinkedIn */}
                  <div style={{
                    width: '38px', height: '38px', borderRadius: '10px',
                    background: '#0A66C2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="#FFFFFF">
                      <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19a.66.66 0 000 .14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z"/>
                    </svg>
                  </div>
                </div>
                <p style={{ fontSize: '10px', color: C.grey, margin: '8px 0 0', letterSpacing: '0.04em' }}>
                  Instagram · LinkedIn
                </p>
              </div>
            </div>
          </div>

          {/* Reading guide under the diagram */}
          <p style={{
            fontSize: '13px', color: C.grey,
            textAlign: 'center', marginTop: '32px',
            maxWidth: '900px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            <strong style={{ color: C.text }}>Read the diagram:</strong> main flow is left-to-right Scorecard → Stage 1 → Stage 2 → Stage 3.
            Stage 4 ascends UP from Stage 3 only. Bolt Ons live to the right of Stage 3.
            90-Day Follow Up drops down from Stage 2 (Blueprint). Ebooks drop down from Stage 3 then down again to Socials (Instagram and LinkedIn distribution).
          </p>
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
