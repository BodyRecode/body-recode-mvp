'use client'

import { AlertTriangle, CheckCircle2, ArrowDownToLine, Activity } from 'lucide-react'

/**
 * B-roll canvas: Rhythm vs Restriction
 *
 * Designed to be screen-recorded as B-roll for the /challenge Day 5
 * Week One Progress Session video, Section 1.
 *
 * Covers the doctrinal beats:
 *
 *   "Rhythm beats restriction."
 *   "Restriction is a stress signal. Your body responds to stress by
 *    protecting itself."
 *   "Rhythm tells your nervous system you are safe. That food is coming.
 *    That sleep is consistent. That your body can let go of what it has
 *    been holding onto."
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: Reactive biology vs Regulated biology side-by-side
 *   Zone 2: The restriction trap (inputs -> stress response -> body protects)
 *   Zone 3: The rhythm response (inputs -> safety signal -> body releases)
 *
 * URL: /broll/rhythm-vs-restriction (noindex - see /broll/layout.tsx)
 */

const REACTIVE = [
  'Cortisol elevated through the day',
  'Fat held at the midsection',
  'Energy crashes mid-afternoon',
  'Sleep fragmented, wakes tired',
  'Cravings driven by stress, not hunger',
  'Body in protection mode',
]

const REGULATED = [
  'Cortisol curve recalibrating',
  'Inflammation lowering',
  'Energy steadier across the day',
  'Sleep onset easier, deeper',
  'Hunger predictable, not driven',
  'Body releasing what it was holding',
]

const RESTRICTION_INPUTS = [
  'Eat less',
  'Train harder',
  'Cut out more',
  'Push through',
  'Control everything',
]

const RHYTHM_INPUTS = [
  'Predictable meals',
  'Consistent training',
  'Calmer daily structure',
  'Regular sleep windows',
  'Less noise around food decisions',
]

export default function RhythmVsRestrictionPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · REACTIVE BIOLOGY vs REGULATED BIOLOGY
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
        {/* subtle radial glows */}
        <div style={{
          position: 'absolute', top: '-160px', left: '-160px',
          width: '480px', height: '480px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '-160px', right: '-160px',
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
            Day 5 · Where your biology was, where it is going
          </p>
          <h1 style={{
            fontSize: 'clamp(40px, 5.5vw, 64px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.05,
            color: '#1A1A1A', marginBottom: '64px', textAlign: 'center',
          }}>
            Reactive biology vs <span style={{ color: '#1B6DFC' }}>Regulated biology</span>
          </h1>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px',
            alignItems: 'stretch',
          }}>
            {/* Reactive (Left, red-amber) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderTop: '4px solid #DC2626',
              borderRadius: '18px',
              padding: '40px 36px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <AlertTriangle size={24} color="#DC2626" strokeWidth={2.2} />
                <p style={{
                  fontSize: '12px', fontWeight: 800, color: '#DC2626',
                  letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0,
                }}>
                  Before Day 1
                </p>
              </div>
              <h2 style={{
                fontSize: '32px', fontWeight: 900, color: '#1A1A1A',
                letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 28px',
              }}>
                Reactive biology
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {REACTIVE.map((item, i) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#DC2626',
                      fontFamily: '"Courier New",Consolas,monospace',
                      minWidth: '24px', paddingTop: '4px',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: '17px', color: '#3A3A3A', margin: 0, lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Regulated (Right, Signal Blue) */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid rgba(27, 109, 252, 0.3)',
              borderTop: '4px solid #1B6DFC',
              borderRadius: '18px',
              padding: '40px 36px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <Activity size={24} color="#1B6DFC" strokeWidth={2.2} />
                <p style={{
                  fontSize: '12px', fontWeight: 800, color: '#1056D6',
                  letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0,
                }}>
                  Day 5 onward
                </p>
              </div>
              <h2 style={{
                fontSize: '32px', fontWeight: 900, color: '#1A1A1A',
                letterSpacing: '-0.025em', lineHeight: 1.15, margin: '0 0 28px',
              }}>
                Regulated biology
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {REGULATED.map((item, i) => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                      fontFamily: '"Courier New",Consolas,monospace',
                      minWidth: '24px', paddingTop: '4px',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: '17px', color: '#3A3A3A', margin: 0, lineHeight: 1.55 }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <p style={{
            fontSize: '17px', color: '#6B6B6B',
            textAlign: 'center', marginTop: '48px',
            maxWidth: '720px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.65,
          }}>
            This shift is not random. It is the result of rhythm. The work you have done across the first five days has moved your body from one state to the other.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · THE RESTRICTION TRAP
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
            fontSize: '13px', fontWeight: 700, color: '#DC2626',
            letterSpacing: '0.18em', textTransform: 'uppercase',
            marginBottom: '24px', textAlign: 'center',
          }}>
            The trap most people fall into
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '64px', textAlign: 'center',
          }}>
            Restriction is a <span style={{ color: '#DC2626' }}>stress signal.</span>
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '40px',
            alignItems: 'center', marginBottom: '48px',
          }}>
            {/* Restriction inputs */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E5E5',
              borderRadius: '14px', padding: '32px 28px',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#DC2626',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px',
              }}>
                Inputs the body reads as threat
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {RESTRICTION_INPUTS.map(item => (
                  <p key={item} style={{
                    fontSize: '18px', fontWeight: 700, color: '#1A1A1A',
                    margin: 0, padding: '8px 0',
                    borderBottom: '1px solid #F0F0F0',
                  }}>
                    {item}.
                  </p>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <ArrowDownToLine size={48} color="#DC2626" strokeWidth={2} style={{ transform: 'rotate(-90deg)' }} />
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#DC2626',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0,
              }}>
                Body responds
              </p>
            </div>

            {/* Response */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.04) 0%, rgba(220, 38, 38, 0.10) 100%)',
              border: '1px solid rgba(220, 38, 38, 0.25)',
              borderRadius: '14px', padding: '32px 28px',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#DC2626',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px',
              }}>
                The body protects itself
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Stores fat', 'Disrupts hunger', 'Flattens energy', 'Breaks down muscle', 'Elevates cortisol'].map(item => (
                  <p key={item} style={{
                    fontSize: '18px', fontWeight: 700, color: '#1A1A1A',
                    margin: 0, padding: '8px 0',
                    borderBottom: '1px solid rgba(220, 38, 38, 0.12)',
                  }}>
                    {item}.
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '1px solid rgba(220, 38, 38, 0.25)',
            borderLeft: '4px solid #DC2626',
            borderRadius: '12px', padding: '24px 28px',
          }}>
            <p style={{
              fontSize: '20px', fontWeight: 700, color: '#1A1A1A',
              margin: 0, lineHeight: 1.5, textAlign: 'center',
            }}>
              Restriction does not fix a stressed body. It deepens the stress.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · THE RHYTHM RESPONSE
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
        {/* Signal Blue radial glow */}
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
            The opposite move
          </p>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 56px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.1,
            color: '#1A1A1A', marginBottom: '64px', textAlign: 'center',
          }}>
            Rhythm is a <span style={{ color: '#1B6DFC' }}>safety signal.</span>
          </h2>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '40px',
            alignItems: 'center', marginBottom: '48px',
          }}>
            {/* Rhythm inputs */}
            <div style={{
              background: '#FFFFFF', border: '1px solid #E5E5E5',
              borderRadius: '14px', padding: '32px 28px',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px',
              }}>
                Inputs the body reads as safe
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {RHYTHM_INPUTS.map(item => (
                  <p key={item} style={{
                    fontSize: '18px', fontWeight: 700, color: '#1A1A1A',
                    margin: 0, padding: '8px 0',
                    borderBottom: '1px solid #F0F0F0',
                  }}>
                    {item}.
                  </p>
                ))}
              </div>
            </div>

            {/* Arrow */}
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px',
            }}>
              <ArrowDownToLine size={48} color="#1B6DFC" strokeWidth={2} style={{ transform: 'rotate(-90deg)' }} />
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: 0,
              }}>
                Body responds
              </p>
            </div>

            {/* Release */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(27, 109, 252, 0.04) 0%, rgba(27, 109, 252, 0.12) 100%)',
              border: '1px solid rgba(27, 109, 252, 0.3)',
              borderRadius: '14px', padding: '32px 28px',
            }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#1056D6',
                letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 16px',
              }}>
                The body lets go
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {['Releases held fat', 'Steadies hunger', 'Restores energy', 'Repairs and rebuilds', 'Lowers cortisol load'].map(item => (
                  <p key={item} style={{
                    fontSize: '18px', fontWeight: 700, color: '#1A1A1A',
                    margin: 0, padding: '8px 0',
                    borderBottom: '1px solid rgba(27, 109, 252, 0.15)',
                  }}>
                    {item}.
                  </p>
                ))}
              </div>
            </div>
          </div>

          <div style={{
            background: '#FFFFFF', border: '1px solid rgba(27, 109, 252, 0.3)',
            borderLeft: '4px solid #1B6DFC',
            borderRadius: '12px', padding: '24px 28px',
            display: 'flex', alignItems: 'flex-start', gap: '16px',
          }}>
            <CheckCircle2 size={28} color="#1B6DFC" strokeWidth={2.2} style={{ marginTop: '2px', flexShrink: 0 }} />
            <p style={{
              fontSize: '20px', fontWeight: 700, color: '#1A1A1A',
              margin: 0, lineHeight: 1.5,
            }}>
              This week you gave your body rhythm. That is why the signals are changing.
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}
