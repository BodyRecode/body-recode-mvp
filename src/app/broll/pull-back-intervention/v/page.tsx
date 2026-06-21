'use client'

import { Minus, Plus, RotateCcw } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): Pull Back is the Intervention
 *
 * Native vertical 1080x1920 version of /broll/pull-back-intervention, built so
 * it fills the entire 9:16 reel frame (no landscape letterbox / side crop).
 *
 * Used by Reel 4 (Tue 30 Jun · Contrarian · Stressed Executive Woman), Scene 4
 * (the intervention). The three-across landscape row is reflowed to a vertical
 * stack of three intervention cards.
 *
 * URL: /broll/pull-back-intervention/v (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts pull-back-intervention/v
 */

const INTERVENTIONS = [
  {
    op: 'REDUCE',
    icon: Minus,
    colour: '#DC2626',
    title: 'Training volume',
    body: 'Pull back the dose the body cannot absorb. Fewer sessions, lower intensity, shorter durations. Take the input load down so the regulatory system has room to come back online.',
    inverseOf: 'Add more training',
  },
  {
    op: 'INCREASE',
    icon: Plus,
    colour: '#1B6DFC',
    title: 'Recovery priority',
    body: 'Recovery moves from afterthought to centre. Sleep window protected. Stress sources removed. Active recovery built in. What used to be a buffer becomes the work.',
    inverseOf: 'Push through fatigue',
  },
  {
    op: 'RESTORE',
    icon: RotateCcw,
    colour: '#1B6DFC',
    title: 'Sleep and regulation',
    body: 'Rebuild what the system has been doing without. Consistent sleep architecture. Cortisol curve recalibrating. Nervous system tone shifting from reactive to regulated.',
    inverseOf: 'Control more, lock tighter',
  },
]

export default function PullBackInterventionVerticalPage() {
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
      padding: '80px 80px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      <div style={{
        position: 'absolute', top: '-260px', right: '-260px',
        width: '760px', height: '760px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%' }}>

        <p style={{
          fontSize: '20px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 22px',
        }}>
          The intervention
        </p>

        <h1 style={{
          fontSize: '70px', fontWeight: 900, color: '#1A1A1A',
          letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 24px',
        }}>
          Pulling back is the intervention.
        </h1>

        <p style={{
          fontSize: '28px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 44px',
        }}>
          For a body in protection mode, the move that works is the opposite of every instinct she has been acting on.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {INTERVENTIONS.map((i) => {
            const Icon = i.icon
            return (
              <div key={i.op} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: `6px solid ${i.colour}`,
                borderRadius: '18px',
                padding: '28px 32px',
                display: 'flex', gap: '24px', alignItems: 'flex-start',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: i.colour,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={34} strokeWidth={3} color="#FFFFFF" />
                </div>

                <div style={{ flex: 1 }}>
                  <span style={{
                    fontSize: '15px', fontWeight: 900, color: i.colour,
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                  }}>
                    {i.op}
                  </span>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: '#1A1A1A', margin: '4px 0 10px', letterSpacing: '-0.02em', lineHeight: 1.12 }}>
                    {i.title}
                  </p>
                  <p style={{ fontSize: '19px', color: '#3A3A3A', lineHeight: 1.5, margin: '0 0 14px' }}>
                    {i.body}
                  </p>
                  <div style={{ paddingTop: '12px', borderTop: '1px dashed #E5E5E5', display: 'flex', alignItems: 'baseline', gap: '12px' }}>
                    <span style={{
                      fontSize: '13px', fontWeight: 800, color: '#7A7A7A',
                      letterSpacing: '0.15em', textTransform: 'uppercase', flexShrink: 0,
                    }}>
                      Inverse of
                    </span>
                    <span style={{
                      fontSize: '18px', color: '#7A7A7A',
                      textDecoration: 'line-through',
                      textDecorationColor: '#DC2626',
                      textDecorationThickness: '2px',
                      fontStyle: 'italic',
                    }}>
                      {i.inverseOf}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <p style={{
          fontSize: '22px', color: '#4A4A4A', fontStyle: 'italic',
          margin: '36px 0 0', textAlign: 'center', lineHeight: 1.5,
        }}>
          Pulling back feels like giving up. It is the only thing that lets the system shift state.
        </p>

      </div>
    </div>
  )
}
