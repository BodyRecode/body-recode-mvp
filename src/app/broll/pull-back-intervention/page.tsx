'use client'

import { Minus, Plus, RotateCcw } from 'lucide-react'

/**
 * B-roll canvas: Pull Back is the Intervention
 *
 * Designed for Reel 4 (Tue 30 Jun · Contrarian · Stressed Executive Woman),
 * Scene 4 Intervention:
 *
 *   "The intervention that actually works is the opposite. Reduce training
 *    volume. Increase recovery priority. Restore the sleep and regulation
 *    the body has been doing without."
 *
 * Single-zone canvas. Three intervention cards (REDUCE / INCREASE /
 * RESTORE), each paired with a clear signed icon. Bottom strip shows the
 * inverse of every instinct she has been acting on.
 *
 * URL: /broll/pull-back-intervention (noindex)
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

export default function PullBackInterventionPage() {
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
            The intervention
          </p>

          <h1 style={{
            fontSize: '64px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            Pulling back is the intervention.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            For a body in protection mode, the move that works is the opposite of every instinct she has been acting on.
          </p>

          {/* THREE INTERVENTION CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '32px' }}>
            {INTERVENTIONS.map((i) => {
              const Icon = i.icon
              return (
                <div key={i.op} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderTop: `4px solid ${i.colour}`,
                  borderRadius: '16px',
                  padding: '28px 24px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '12px',
                      background: i.colour,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={26} strokeWidth={3} color="#FFFFFF" />
                    </div>
                    <span style={{
                      fontSize: '13px', fontWeight: 900, color: i.colour,
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                    }}>
                      {i.op}
                    </span>
                  </div>

                  <p style={{ fontSize: '22px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 12px', letterSpacing: '-0.015em', lineHeight: 1.15 }}>
                    {i.title}
                  </p>

                  <p style={{ fontSize: '13.5px', color: '#3A3A3A', lineHeight: 1.6, margin: '0 0 18px' }}>
                    {i.body}
                  </p>

                  <div style={{
                    paddingTop: '14px',
                    borderTop: '1px dashed #E5E5E5',
                  }}>
                    <p style={{
                      fontSize: '10px', fontWeight: 800, color: '#7A7A7A',
                      letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 4px',
                    }}>
                      Inverse of
                    </p>
                    <p style={{
                      fontSize: '13px', color: '#7A7A7A',
                      textDecoration: 'line-through',
                      textDecorationColor: '#DC2626',
                      textDecorationThickness: '2px',
                      fontStyle: 'italic',
                      margin: 0,
                    }}>
                      {i.inverseOf}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{
            fontSize: '14px', color: '#4A4A4A', fontStyle: 'italic',
            margin: '8px 0 0', textAlign: 'center', lineHeight: 1.55,
          }}>
            Pulling back feels like giving up. It is the only thing that lets the system shift state.
          </p>

        </div>
      </section>

    </div>
  )
}
