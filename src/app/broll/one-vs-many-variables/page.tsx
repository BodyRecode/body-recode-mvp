'use client'

import { Pill, Activity, Moon, AlertCircle, ArrowRight } from 'lucide-react'

/**
 * B-roll canvas: One vs Many Variables
 *
 * Designed for Reel 2 (Tue 23 Jun · Contrarian · Slipping High Performer),
 * Scene 3 Mechanism:
 *
 *   "TRT addresses one variable. The system in front of me is usually
 *    dysregulated across many. Chronic stress. Sleep that doesn't restore.
 *    Years of recovery debt. Adding testosterone to that environment shifts
 *    one number on a blood panel. It doesn't fix the underlying state."
 *
 * Single-zone canvas. Left card: TRT (one variable). Right cluster: the
 * actual system (4+ dysregulated variables). Arrow shows TRT addressing
 * just the testosterone slot — the rest remain untouched.
 *
 * URL: /broll/one-vs-many-variables (noindex)
 */

const SYSTEM_VARIABLES = [
  { label: 'Chronic stress load', sub: 'Cortisol elevated across the day', icon: AlertCircle, colour: '#DC2626' },
  { label: 'Sleep that does not restore', sub: 'Architecture broken even at 7-8 hrs', icon: Moon, colour: '#1B6DFC' },
  { label: 'Years of recovery debt', sub: 'Carried forward without payback', icon: Activity, colour: '#B7791F' },
  { label: 'Testosterone signal', sub: 'One downstream readout', icon: Pill, colour: '#8b5cf6' },
]

export default function OneVsManyVariablesPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '72px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-220px', right: '-220px',
          width: '640px', height: '640px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>

          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            TRT vs the system
          </p>

          <h1 style={{
            fontSize: '64px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            One variable. Many dysregulated.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            Testosterone is one signal in a system running on chronic stress, broken sleep, and years of recovery debt. Adding hormonal input shifts one number on a panel. It doesn't shift the state.
          </p>

          {/* SPLIT: TRT (left) vs SYSTEM (right) */}
          <div style={{
            display: 'grid', gridTemplateColumns: '280px 60px 1fr', gap: '24px', alignItems: 'center',
          }}>

            {/* LEFT — TRT card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderTop: '4px solid #8b5cf6',
              borderRadius: '16px',
              padding: '32px 24px',
              textAlign: 'center',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '14px',
                background: 'rgba(139, 92, 246, 0.10)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Pill size={26} strokeWidth={2.4} color="#8b5cf6" />
              </div>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#8b5cf6',
                letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px',
              }}>
                Input · 1 variable
              </p>
              <p style={{ fontSize: '28px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                TRT
              </p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.55, margin: 0 }}>
                Shifts one number on a blood panel. Direct, measurable, narrow.
              </p>
            </div>

            {/* ARROW */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '50%',
                background: '#1B6DFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <ArrowRight size={24} strokeWidth={3} color="#FFFFFF" />
              </div>
            </div>

            {/* RIGHT — system grid */}
            <div>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#6B6B6B',
                letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 14px',
              }}>
                The system · dysregulated across many
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {SYSTEM_VARIABLES.map((v, i) => {
                  const Icon = v.icon
                  return (
                    <div key={i} style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderLeft: `4px solid ${v.colour}`,
                      borderRadius: '12px',
                      padding: '16px 18px',
                      display: 'flex', alignItems: 'center', gap: '14px',
                      position: 'relative',
                      opacity: v.label === 'Testosterone signal' ? 1 : 0.95,
                    }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: `${v.colour}1A`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <Icon size={18} strokeWidth={2.4} color={v.colour} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 2px', letterSpacing: '-0.005em' }}>
                          {v.label}
                        </p>
                        <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                          {v.sub}
                        </p>
                      </div>
                      {v.label === 'Testosterone signal' && (
                        <span style={{
                          position: 'absolute', top: '8px', right: '10px',
                          fontSize: '9px', fontWeight: 800, color: '#1B6DFC',
                          letterSpacing: '0.15em', textTransform: 'uppercase',
                        }}>
                          ← TRT acts here
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              <p style={{
                fontSize: '13px', color: '#4A4A4A', fontStyle: 'italic',
                margin: '16px 0 0', lineHeight: 1.55,
              }}>
                TRT shifts one of four. The other three remain the reason capacity is slipping.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
