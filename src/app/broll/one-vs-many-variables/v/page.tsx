'use client'

import { Pill, Activity, Moon, AlertCircle, ArrowDown } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): One vs Many Variables
 *
 * Native vertical 1080x1920 version of /broll/one-vs-many-variables, built so
 * it fills the entire 9:16 reel frame (no landscape letterboxing / side crop).
 *
 * Used by Reel 2 (Tue 23 Jun · Contrarian · Slipping High Performer), Scene 3
 * Mechanism. Landscape split (TRT | arrow | system grid) is reflowed to a
 * vertical stack: TRT card on top → down arrow → the dysregulated system below.
 *
 * URL: /broll/one-vs-many-variables/v (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts one-vs-many-variables/v
 */

const SYSTEM_VARIABLES = [
  { label: 'Chronic stress load', sub: 'Cortisol elevated across the day', icon: AlertCircle, colour: '#DC2626' },
  { label: 'Sleep that does not restore', sub: 'Architecture broken even at 7-8 hrs', icon: Moon, colour: '#1B6DFC' },
  { label: 'Years of recovery debt', sub: 'Carried forward without payback', icon: Activity, colour: '#B7791F' },
  { label: 'Testosterone signal', sub: 'One downstream readout', icon: Pill, colour: '#8b5cf6' },
]

export default function OneVsManyVariablesVerticalPage() {
  return (
    <div style={{
      width: '1080px',
      height: '1920px',
      margin: '0 auto',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '96px 80px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      {/* Soft Signal-Blue glow top-right */}
      <div style={{
        position: 'absolute', top: '-260px', right: '-260px',
        width: '760px', height: '760px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%' }}>

        {/* Eyebrow */}
        <p style={{
          fontSize: '20px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 24px',
        }}>
          TRT vs the system
        </p>

        {/* Title */}
        <h1 style={{
          fontSize: '78px', fontWeight: 900, color: '#1A1A1A',
          letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 28px',
        }}>
          One variable.<br />Many dysregulated.
        </h1>

        <p style={{
          fontSize: '29px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 56px',
        }}>
          Testosterone is one signal in a system running on chronic stress, broken sleep, and years of recovery debt. It shifts one number on a panel. It doesn&rsquo;t shift the state.
        </p>

        {/* TRT card — top */}
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E5',
          borderTop: '6px solid #8b5cf6',
          borderRadius: '22px',
          padding: '34px 38px',
          display: 'flex', alignItems: 'center', gap: '26px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
        }}>
          <div style={{
            width: '78px', height: '78px', borderRadius: '20px',
            background: 'rgba(139, 92, 246, 0.10)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Pill size={38} strokeWidth={2.4} color="#8b5cf6" />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: '16px', fontWeight: 800, color: '#8b5cf6',
              letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 6px',
            }}>
              Input · 1 variable
            </p>
            <p style={{ fontSize: '40px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
              TRT
            </p>
            <p style={{ fontSize: '20px', color: '#4A4A4A', lineHeight: 1.5, margin: 0 }}>
              Shifts one number on a blood panel. Direct, measurable, narrow.
            </p>
          </div>
        </div>

        {/* Down arrow */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '24px 0' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            background: '#1B6DFC',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <ArrowDown size={32} strokeWidth={3} color="#FFFFFF" />
          </div>
        </div>

        {/* System label */}
        <p style={{
          fontSize: '16px', fontWeight: 800, color: '#6B6B6B',
          letterSpacing: '0.18em', textTransform: 'uppercase', margin: '0 0 20px',
        }}>
          The system · dysregulated across many
        </p>

        {/* System variables — single column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {SYSTEM_VARIABLES.map((v, i) => {
            const Icon = v.icon
            const isTesto = v.label === 'Testosterone signal'
            return (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: `6px solid ${v.colour}`,
                borderRadius: '16px',
                padding: '22px 26px',
                display: 'flex', alignItems: 'center', gap: '20px',
                position: 'relative',
              }}>
                <div style={{
                  width: '54px', height: '54px', borderRadius: '14px',
                  background: `${v.colour}1A`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={26} strokeWidth={2.4} color={v.colour} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
                    {v.label}
                  </p>
                  <p style={{ fontSize: '18px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                    {v.sub}
                  </p>
                </div>
                {isTesto && (
                  <span style={{
                    fontSize: '14px', fontWeight: 800, color: '#1B6DFC',
                    letterSpacing: '0.1em', textTransform: 'uppercase', flexShrink: 0,
                  }}>
                    ← TRT acts here
                  </span>
                )}
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <p style={{
          fontSize: '22px', color: '#4A4A4A', fontStyle: 'italic',
          margin: '40px 0 0', lineHeight: 1.5,
        }}>
          TRT shifts one of four. The other three remain the reason capacity is slipping.
        </p>

      </div>
    </div>
  )
}
