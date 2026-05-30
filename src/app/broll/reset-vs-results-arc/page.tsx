'use client'

import { Layers, Activity, TrendingUp } from 'lucide-react'

/**
 * B-roll canvas: Reset vs Results Arc
 *
 * Designed to be screen-recorded as B-roll for the /challenge Day 5
 * Week One Progress Session video, Section 3.
 *
 * Covers the doctrinal beat:
 *
 *   "The 14-Day Body Decode is a reset. It is not designed to produce
 *    dramatic visible transformation in two weeks. A reset is designed
 *    to stabilise your biology. The reset clears the path. Results
 *    come from what you build on top of it."
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: The arc visual (14 Day Reset -> 6 Week Blueprint -> Long Arc)
 *   Zone 2: What a reset does (the foundation work)
 *   Zone 3: What results require (correction layered on top -> compounding)
 *
 * URL: /broll/reset-vs-results-arc (noindex - see /broll/layout.tsx)
 */

const RESET_JOBS = [
  { label: 'Cortisol curve recalibrates', tag: 'Hormones' },
  { label: 'Insulin sensitivity restores', tag: 'Hormones' },
  { label: 'Inflammation lowers', tag: 'Inflammation' },
  { label: 'Hunger signal recalibrates', tag: 'Appetite' },
  { label: 'Sleep window opens', tag: 'Recovery' },
  { label: 'Digestion calms', tag: 'Gut' },
  { label: 'Nervous system settles', tag: 'Regulation' },
]

const RESULTS_INPUTS = [
  { label: 'Pattern-specific training', detail: 'Training calibrated to your pattern, not generic load' },
  { label: 'Pattern-specific nutrition', detail: 'Carb timing and meal structure built for your biology' },
  { label: 'Weekly coaching adjustments', detail: 'The plan adapts as your data changes, not pre-set six weeks ahead' },
  { label: 'Five biology lessons', detail: 'Cortisol, insulin, testosterone, thyroid, sleep - the mechanisms behind your pattern' },
]

export default function ResetVsResultsArcPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · THE ARC
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

        <div style={{ position: 'relative', maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '24px', textAlign: 'center',
          }}>
            Day 5 · The arc from here
          </p>
          <h1 style={{
            fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: '#1A1A1A', marginBottom: '24px', textAlign: 'center',
          }}>
            The reset <span style={{ color: '#1B6DFC' }}>clears the path.</span>
          </h1>
          <p style={{
            fontSize: '22px', color: '#4A4A4A',
            textAlign: 'center', marginBottom: '72px',
            maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5,
          }}>
            Results come from what you build on top of it.
          </p>

          {/* The arc - 3 stages, horizontal */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0',
            alignItems: 'stretch', position: 'relative',
          }}>
            {/* Connecting line */}
            <div style={{
              position: 'absolute', top: '50%', left: '12%', right: '12%', height: '3px',
              background: 'linear-gradient(to right, #1B6DFC 0%, #1B6DFC 100%)',
              opacity: 0.25, zIndex: 0,
            }} />

            {/* Stage 1: 14-Day Reset */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(27, 109, 252, 0.25)',
              borderRadius: '18px',
              padding: '32px 28px',
              position: 'relative',
              zIndex: 1,
              margin: '0 12px',
            }}>
              <div style={{
                position: 'absolute', top: '-16px', left: '32px',
                background: '#1B6DFC', color: '#FFFFFF',
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '6px 12px',
                borderRadius: '6px',
              }}>
                Stage 1 · Now
              </div>
              <p style={{
                fontSize: '13px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                margin: '12px 0 8px',
              }}>
                14 Days · Free
              </p>
              <h3 style={{
                fontSize: '24px', fontWeight: 900, color: '#1A1A1A',
                letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 12px',
              }}>
                The reset
              </h3>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
                Lower the noise. Stabilise hormones, hunger, nervous system and digestion. Read the pattern on Day 7.
              </p>
            </div>

            {/* Stage 2: 6-Week Blueprint */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(27, 109, 252, 0.25)',
              borderRadius: '18px',
              padding: '32px 28px',
              position: 'relative',
              zIndex: 1,
              margin: '0 12px',
            }}>
              <div style={{
                position: 'absolute', top: '-16px', left: '32px',
                background: '#1056D6', color: '#FFFFFF',
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '6px 12px',
                borderRadius: '6px',
              }}>
                Stage 2 · Day 14+
              </div>
              <p style={{
                fontSize: '13px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                margin: '12px 0 8px',
              }}>
                6 Weeks · $97
              </p>
              <h3 style={{
                fontSize: '24px', fontWeight: 900, color: '#1A1A1A',
                letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 12px',
              }}>
                The correction
              </h3>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
                Pattern-specific training, nutrition and weekly coaching. By Week 6 the pattern is corrected and your body is ready to compound.
              </p>
            </div>

            {/* Stage 3: Long Arc Membership */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(27, 109, 252, 0.25)',
              borderRadius: '18px',
              padding: '32px 28px',
              position: 'relative',
              zIndex: 1,
              margin: '0 12px',
            }}>
              <div style={{
                position: 'absolute', top: '-16px', left: '32px',
                background: '#0A337A', color: '#FFFFFF',
                fontSize: '11px', fontWeight: 800, letterSpacing: '0.12em',
                textTransform: 'uppercase', padding: '6px 12px',
                borderRadius: '6px',
              }}>
                Stage 3 · Ongoing
              </div>
              <p style={{
                fontSize: '13px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.12em', textTransform: 'uppercase',
                margin: '12px 0 8px',
              }}>
                Long arc · $49/wk
              </p>
              <h3 style={{
                fontSize: '24px', fontWeight: 900, color: '#1A1A1A',
                letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 12px',
              }}>
                The compound
              </h3>
              <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.65, margin: 0 }}>
                Block by block calibration as the body shifts from Depleted to Transitioning to Ready. Months-long infrastructure for sustained change.
              </p>
            </div>
          </div>

          <p style={{
            fontSize: '17px', color: '#6B6B6B',
            textAlign: 'center', marginTop: '72px',
            maxWidth: '780px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            You do not need to think about Stage 2 or Stage 3 yet. Right now your only job is the next nine days. The arc is what comes after.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · WHAT THE RESET DOES
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
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '24px', textAlign: 'center',
          }}>
            What a reset is for
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '24px', textAlign: 'center',
          }}>
            <span style={{ color: '#1B6DFC' }}>Stabilise the biology.</span> Lower the noise.
          </h2>
          <p style={{
            fontSize: '18px', color: '#6B6B6B',
            textAlign: 'center', marginBottom: '64px',
            maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            A reset is not transformation. It is the foundation that makes transformation possible. By Day 14 these are what should have shifted underneath you.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px',
          }}>
            {RESET_JOBS.map((job, i) => (
              <div key={job.label} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: '3px solid #1B6DFC',
                borderRadius: '12px',
                padding: '24px 26px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  marginBottom: '14px',
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                    fontFamily: '"Courier New",Consolas,monospace',
                    background: 'rgba(27,109,252,0.08)',
                    padding: '4px 10px', borderRadius: '6px',
                  }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                    letterSpacing: '0.12em', textTransform: 'uppercase',
                  }}>
                    {job.tag}
                  </span>
                </div>
                <p style={{
                  fontSize: '17px', fontWeight: 700, color: '#1A1A1A',
                  margin: 0, lineHeight: 1.4,
                }}>
                  {job.label}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            background: '#FFFFFF',
            border: '1px solid rgba(27, 109, 252, 0.25)',
            borderLeft: '4px solid #1B6DFC',
            borderRadius: '12px', padding: '24px 28px',
            marginTop: '40px',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <Activity size={28} color="#1B6DFC" strokeWidth={2.2} style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{
              fontSize: '20px', fontWeight: 700, color: '#1A1A1A',
              margin: 0, lineHeight: 1.5,
            }}>
              Without this foundation, anything you layer on top works against a body still in protection mode. With it, everything works better.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · WHAT RESULTS REQUIRE
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
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '900px', height: '900px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '24px', textAlign: 'center',
          }}>
            What you build on top of the reset
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '24px', textAlign: 'center',
          }}>
            The 6-Week Body Rewire <span style={{ color: '#1B6DFC' }}>Blueprint.</span>
          </h2>
          <p style={{
            fontSize: '18px', color: '#6B6B6B',
            textAlign: 'center', marginBottom: '56px',
            maxWidth: '760px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            Reset prepares your biology. Pattern-specific correction creates your results. By Week 6 the pattern is corrected and your body is ready to compound.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '40px' }}>
            {RESULTS_INPUTS.map((input, i) => (
              <div key={input.label} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: '3px solid #1B6DFC',
                borderRadius: '14px',
                padding: '24px 28px',
                display: 'flex', alignItems: 'flex-start', gap: '20px',
              }}>
                <span style={{
                  fontSize: '13px', fontWeight: 800, color: '#FFFFFF',
                  background: '#1B6DFC',
                  fontFamily: '"Courier New",Consolas,monospace',
                  minWidth: '44px', height: '44px',
                  borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontSize: '21px', fontWeight: 800, color: '#1A1A1A',
                    margin: '0 0 6px', lineHeight: 1.3, letterSpacing: '-0.01em',
                  }}>
                    {input.label}
                  </p>
                  <p style={{
                    fontSize: '15px', color: '#4A4A4A',
                    margin: 0, lineHeight: 1.6,
                  }}>
                    {input.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{
            background: '#1A1A1A',
            borderRadius: '14px', padding: '32px 36px',
            display: 'flex', alignItems: 'center', gap: '20px',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: '-50%', right: '-50%',
              width: '600px', height: '600px', borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(27, 109, 252, 0.15) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <TrendingUp size={32} color="#1B6DFC" strokeWidth={2.2} style={{ flexShrink: 0, position: 'relative' }} />
            <p style={{
              fontSize: '22px', fontWeight: 700, color: '#FFFFFF',
              margin: 0, lineHeight: 1.4, position: 'relative',
            }}>
              Right now your only job is the next nine days. The Blueprint is what comes after.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
