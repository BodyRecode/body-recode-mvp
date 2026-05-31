'use client'

/**
 * B-roll canvas: Full Body Recode Funnel Arc
 *
 * Visual reference for the full four-stage Body Recode funnel.
 * Stage 1 (14-Day Challenge, Free) -> Stage 2 (6-Week Blueprint, $97)
 * -> Stage 3 (Membership, $49/wk) -> Stage 4 (1:1 Performance Coaching,
 * $195-$295/wk). Stage 5 (90-Day Re-Engagement) sits as the side loop.
 *
 * Designed in the same visual language as /broll/reset-vs-results-arc
 * so the two read as a paired set: the 3-stage Day-5 arc and the
 * 4-stage full-funnel arc.
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: The forward funnel - 4 stages laid out horizontally with
 *           connecting arc, prices, durations and one-line position.
 *   Zone 2: What each stage delivers - comparison grid across the 4
 *           stages showing purpose, deliverables, personalisation level
 *           and Fat Map presence.
 *   Zone 3: The transformation arc - the Awareness -> Structure ->
 *           Pattern Recognition -> Diagnosis -> Personalisation ->
 *           Transformation journey mapped to which stage delivers each.
 *
 * Source of truth for funnel architecture:
 *   ~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/Body_Recode_Funnel_Master_Map_v1.0.md
 *   (with the 2026-05-27 Architecture Supersession section applied for
 *   current pricing and state-first positioning).
 *
 * URL: /broll/full-funnel-arc (noindex - see /broll/layout.tsx)
 */

const STAGES = [
  {
    n: 1,
    timing: 'Stage 1 · Free entry',
    badgeColor: '#1B6DFC',
    duration: '14 Days',
    price: 'Free',
    name: 'The reset',
    product: '14-Day Body Decode Challenge',
    body: 'Lower the noise. Stabilise hormones, hunger, nervous system and digestion. Read the pattern on Day 7. Body Decode Report delivered Day 14.',
    state: 'Depleted',
  },
  {
    n: 2,
    timing: 'Stage 2 · Day 14+',
    badgeColor: '#1056D6',
    duration: '6 Weeks',
    price: '$97',
    name: 'The correction',
    product: '6-Week Body Rewire Blueprint',
    body: 'Pattern-specific training, nutrition and weekly coaching. By Week 6 the pattern is corrected and the body is ready to compound.',
    state: 'Depleted -> Transitioning',
  },
  {
    n: 3,
    timing: 'Stage 3 · Ongoing',
    badgeColor: '#0A337A',
    duration: 'Long arc',
    price: '$49/wk',
    name: 'The compound',
    product: 'Body Recode Membership',
    body: 'Block by block calibration. Fat Map Method introduced for the first time. Months-long infrastructure for sustained change.',
    state: 'Transitioning -> Ready',
  },
  {
    n: 4,
    timing: 'Stage 4 · Ascension',
    badgeColor: '#021A4D',
    duration: '$240 + ongoing',
    price: '$149/wk',
    name: 'The bespoke',
    product: 'Online 1:1 Performance Coaching',
    body: 'Fully custom plans, weekly check-ins, ongoing biofeedback review and adjustments. Fat Map updated continuously. $240 commencement covers the foundational read. In-person 2x ($299/wk) and 3x ($409/wk) available for local clients.',
    state: 'Ready',
  },
]

const COMPARISON_ROWS: { label: string; values: [string, string, string, string] }[] = [
  { label: 'Purpose',           values: ['Stabilise biology', 'Correct the pattern', 'Compound long-term', 'Fully personalise'] },
  { label: 'Time horizon',      values: ['14 days', '6 weeks', 'Months', 'Months to years'] },
  { label: 'Personalisation',   values: ['None', 'Pattern-specific structure', 'Pattern + Fat Map', 'Fully bespoke'] },
  { label: 'Fat Map presence',  values: ['Not introduced', 'Not introduced', 'First introduction', 'Used intensively'] },
  { label: 'Coaching contact',  values: ['Automated only', 'Weekly feedback', 'Group + monthly review', 'Weekly 1:1 check-ins'] },
  { label: 'Conversion',        values: ['~50% landing', '~3.5% from Stage 1', 'Upsell from Stage 2', 'Application-gated'] },
]

const ARC_STEPS = [
  { stage: 1, label: 'Awareness',           detail: 'Body responds to structure for the first time. Trust forms.' },
  { stage: 1, label: 'Structure',           detail: 'Simple repeatable rhythm replaces the chaos. Symptoms soften.' },
  { stage: 2, label: 'Pattern Recognition', detail: 'The pattern is named. The mechanism underneath becomes visible.' },
  { stage: 3, label: 'Diagnosis',           detail: 'Fat Map Method formally introduced. The system-level read.' },
  { stage: 3, label: 'Personalisation',     detail: 'Block by block calibration. The plan adapts as the body shifts.' },
  { stage: 4, label: 'Transformation',      detail: 'Fully bespoke. Real-time biofeedback. The elite-tier outcome.' },
]

export default function FullFunnelArcPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · THE FORWARD FUNNEL
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
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
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '24px', textAlign: 'center',
          }}>
            The Body Recode Funnel · Full Arc
          </p>
          <h1 style={{
            fontSize: 'clamp(40px, 5vw, 60px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: '#1A1A1A', marginBottom: '24px', textAlign: 'center',
          }}>
            Four stages. <span style={{ color: '#1B6DFC' }}>One arc.</span>
          </h1>
          <p style={{
            fontSize: '20px', color: '#4A4A4A',
            textAlign: 'center', marginBottom: '72px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
          }}>
            From free entry through to fully bespoke 1:1 coaching. The arc is sequenced. Each stage earns the next.
          </p>

          {/* The 4 stages, horizontal */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0',
            alignItems: 'stretch', position: 'relative',
          }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: '50%', left: '8%', right: '8%', height: '3px',
              background: 'linear-gradient(to right, #1B6DFC 0%, #1056D6 33%, #0A337A 66%, #021A4D 100%)',
              opacity: 0.3, zIndex: 0,
            }} />

            {STAGES.map((s) => (
              <div key={s.n} style={{
                background: '#FFFFFF',
                border: `1px solid ${s.badgeColor}40`,
                borderRadius: '18px',
                padding: '32px 24px',
                position: 'relative',
                zIndex: 1,
                margin: '0 10px',
                display: 'flex',
                flexDirection: 'column',
              }}>
                <div style={{
                  position: 'absolute', top: '-16px', left: '24px',
                  background: s.badgeColor, color: '#FFFFFF',
                  fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
                  textTransform: 'uppercase', padding: '6px 12px',
                  borderRadius: '6px',
                }}>
                  {s.timing}
                </div>
                <p style={{
                  fontSize: '13px', fontWeight: 800, color: '#1056D6',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  margin: '14px 0 8px',
                }}>
                  {s.duration} · {s.price}
                </p>
                <h3 style={{
                  fontSize: '22px', fontWeight: 900, color: '#1A1A1A',
                  letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 6px',
                }}>
                  {s.name}
                </h3>
                <p style={{
                  fontSize: '12px', fontWeight: 700, color: '#6B6B6B',
                  letterSpacing: '0.04em', margin: '0 0 14px',
                }}>
                  {s.product}
                </p>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.65, margin: '0 0 16px', flex: 1 }}>
                  {s.body}
                </p>
                <div style={{
                  borderTop: '1px solid #F0F0F0', paddingTop: '12px',
                  fontSize: '11px', fontWeight: 700, color: '#6B6B6B',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  State: <span style={{ color: s.badgeColor }}>{s.state}</span>
                </div>
              </div>
            ))}
          </div>

          <p style={{
            fontSize: '15px', color: '#6B6B6B',
            textAlign: 'center', marginTop: '72px',
            maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Stage 5 (90-Day Re-Engagement) is the side loop. It reactivates anyone who exits the arc at any stage and brings them back to entry.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · WHAT EACH STAGE DELIVERS
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        background: '#FAFAFA',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '1380px', margin: '0 auto', width: '100%' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '16px', textAlign: 'center',
          }}>
            Zone 2 · The comparison
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '48px', textAlign: 'center',
          }}>
            What each stage <span style={{ color: '#1B6DFC' }}>actually does.</span>
          </h2>

          {/* Header row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '200px repeat(4, 1fr)',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div />
            {STAGES.map(s => (
              <div key={s.n} style={{
                background: s.badgeColor, color: '#FFFFFF',
                padding: '14px 18px', borderRadius: '10px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 4px', opacity: 0.85 }}>
                  Stage {s.n}
                </p>
                <p style={{ fontSize: '15px', fontWeight: 800, margin: 0, letterSpacing: '-0.01em' }}>
                  {s.name}
                </p>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {COMPARISON_ROWS.map((row, i) => (
            <div key={row.label} style={{
              display: 'grid',
              gridTemplateColumns: '200px repeat(4, 1fr)',
              gap: '12px',
              marginBottom: '8px',
            }}>
              <div style={{
                background: '#FFFFFF', border: '1px solid #E5E5E5',
                padding: '16px 18px', borderRadius: '10px',
                display: 'flex', alignItems: 'center',
              }}>
                <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '0.02em', margin: 0 }}>
                  {row.label}
                </p>
              </div>
              {row.values.map((v, j) => (
                <div key={j} style={{
                  background: '#FFFFFF', border: '1px solid #E5E5E5',
                  padding: '16px 18px', borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
          ))}

          <p style={{
            fontSize: '15px', color: '#6B6B6B',
            textAlign: 'center', marginTop: '40px',
            maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            The Fat Map Method is the premium personalisation engine. It is intentionally withheld until Stage 3 to protect its value and ensure clients are ready to receive it.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · THE TRANSFORMATION ARC
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Subtle blue glow at top */}
        <div style={{
          position: 'absolute', top: '-220px', left: '50%', transform: 'translateX(-50%)',
          width: '720px', height: '720px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '16px', textAlign: 'center',
          }}>
            Zone 3 · The transformation arc
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 4.5vw, 52px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '24px', textAlign: 'center',
          }}>
            Awareness <span style={{ color: '#1B6DFC' }}>to Transformation.</span>
          </h2>
          <p style={{
            fontSize: '17px', color: '#4A4A4A',
            textAlign: 'center', marginBottom: '56px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Each step in the journey lives inside a specific stage. The sequencing is deliberate. Skip steps and the foundation underneath cracks.
          </p>

          {/* Six steps in two rows of three */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '20px',
          }}>
            {ARC_STEPS.map((step, i) => {
              const stage = STAGES.find(s => s.n === step.stage)!
              return (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: `1px solid ${stage.badgeColor}30`,
                  borderLeft: `4px solid ${stage.badgeColor}`,
                  borderRadius: '14px',
                  padding: '24px 26px',
                  position: 'relative',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '12px',
                  }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#6B6B6B',
                      letterSpacing: '0.12em', textTransform: 'uppercase',
                    }}>
                      Step {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: stage.badgeColor,
                      background: `${stage.badgeColor}15`,
                      padding: '4px 10px', borderRadius: '6px',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      Stage {step.stage}
                    </span>
                  </div>
                  <h3 style={{
                    fontSize: '22px', fontWeight: 900, color: '#1A1A1A',
                    letterSpacing: '-0.02em', margin: '0 0 10px', lineHeight: 1.2,
                  }}>
                    {step.label}
                  </h3>
                  <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.65, margin: 0 }}>
                    {step.detail}
                  </p>
                </div>
              )
            })}
          </div>

          <p style={{
            fontSize: '17px', color: '#6B6B6B',
            textAlign: 'center', marginTop: '56px',
            maxWidth: '820px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
            fontWeight: 600, fontStyle: 'italic',
          }}>
            Awareness -&gt; Structure -&gt; Pattern Recognition -&gt; Diagnosis -&gt; Personalisation -&gt; Transformation
          </p>
        </div>
      </section>

    </div>
  )
}
