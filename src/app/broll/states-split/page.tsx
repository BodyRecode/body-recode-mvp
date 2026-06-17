'use client'

import { Activity, Waves, XCircle } from 'lucide-react'

/**
 * B-roll canvas: States Split — Depleted vs Transitioning
 *
 * Designed to be screen-recorded as B-roll for Reel 1 (Fri 19 Jun · Coach ·
 * Perimenopause), Scene 4 Doctrine:
 *
 *   "One in Depleted with cortisol broken. One in Transitioning with cycle
 *    changes leading. A program written for the demographic doesn't fit
 *    either."
 *
 * Zone 1 only — single viewport-sized canvas. Two side-by-side state cards
 * (Depleted | Transitioning), then a generic-demographic-program strip below
 * with a strike-through visual showing it fits neither.
 *
 * URL: /broll/states-split (noindex — see /broll/layout.tsx)
 */

const DEPLETED_SIGNALS = [
  'Cortisol elevated through the day',
  'Sleep fragmented, wakes tired',
  'Fat held at the midsection',
  'Recovery debt accumulated for years',
  'Effort produces less than it used to',
]

const TRANSITIONING_SIGNALS = [
  'Cycle length shifting',
  'Sleep disrupted around ovulation',
  'Body composition changing without input change',
  'Mood, libido, focus moving with the cycle',
  'Same training producing different outcomes week to week',
]

const GENERIC_PROGRAM = [
  'Lift heavy',
  'Eat more protein',
  'Stop doing cardio',
  'Push harder',
]

export default function StatesSplitPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · DEPLETED vs TRANSITIONING SPLIT
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '72px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Soft Signal-Blue glow top-right */}
        <div style={{
          position: 'absolute', top: '-220px', right: '-220px',
          width: '640px', height: '640px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>

          {/* Eyebrow */}
          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            State, not demographic
          </p>

          {/* Title */}
          <h1 style={{
            fontSize: '64px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            Same demographic. Different states.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            Two women in perimenopause. Same age. Same training history. Reading completely differently because the state underneath is different.
          </p>

          {/* TWO STATE CARDS SIDE-BY-SIDE */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '40px',
          }}>

            {/* DEPLETED card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderTop: '4px solid #DC2626',
              borderRadius: '16px',
              padding: '32px 30px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(220, 38, 38, 0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Activity size={20} strokeWidth={2.4} color="#DC2626" />
                </div>
                <div>
                  <p style={{
                    fontSize: '11px', fontWeight: 800, color: '#DC2626',
                    letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 2px',
                  }}>
                    State · 1 of 3
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
                    Depleted
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: 700, margin: '0 0 6px' }}>
                Cortisol broken.
              </p>
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.55, margin: '0 0 20px' }}>
                Years of recovery debt. The regulatory system is reactive. Effort is no longer landing.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {DEPLETED_SIGNALS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#DC2626', marginTop: '7px', flexShrink: 0 }} />
                    <p style={{ fontSize: '13.5px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* TRANSITIONING card */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderTop: '4px solid #8b5cf6',
              borderRadius: '16px',
              padding: '32px 30px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '10px',
                  background: 'rgba(139, 92, 246, 0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Waves size={20} strokeWidth={2.4} color="#8b5cf6" />
                </div>
                <div>
                  <p style={{
                    fontSize: '11px', fontWeight: 800, color: '#8b5cf6',
                    letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 2px',
                  }}>
                    State · 2 of 3
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.02em' }}>
                    Transitioning
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '15px', color: '#1A1A1A', fontWeight: 700, margin: '0 0 6px' }}>
                Cycle changes leading.
              </p>
              <p style={{ fontSize: '14px', color: '#4A4A4A', lineHeight: 1.55, margin: '0 0 20px' }}>
                Hormonal architecture in flux. The system is not depleted — it is shifting. Same input, different output, week to week.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {TRANSITIONING_SIGNALS.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8b5cf6', marginTop: '7px', flexShrink: 0 }} />
                    <p style={{ fontSize: '13.5px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{s}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* GENERIC PROGRAM strip — strike-through visual */}
          <div style={{
            background: '#F7F7F7',
            border: '1px dashed #C8C8C8',
            borderRadius: '14px',
            padding: '24px 28px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
          }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '10px',
              background: 'rgba(122, 122, 122, 0.10)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <XCircle size={22} strokeWidth={2.4} color="#7A7A7A" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{
                fontSize: '11px', fontWeight: 800, color: '#7A7A7A',
                letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 8px',
              }}>
                Generic perimenopause program · Written for the demographic
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
                {GENERIC_PROGRAM.map((g, i) => (
                  <span key={i} style={{
                    fontSize: '15px', color: '#7A7A7A',
                    textDecoration: 'line-through',
                    textDecorationColor: '#DC2626',
                    textDecorationThickness: '2px',
                    fontWeight: 600,
                  }}>
                    {g}
                  </span>
                ))}
              </div>
              <p style={{
                fontSize: '13px', color: '#4A4A4A', fontStyle: 'italic',
                margin: '12px 0 0', lineHeight: 1.5,
              }}>
                Fits the average. Fits neither of the two women above.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  )
}
