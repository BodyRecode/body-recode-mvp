'use client'

import { Search, ArrowDownToLine, RotateCcw, Pill } from 'lucide-react'

/**
 * B-roll canvas: Order of Operations
 *
 * Designed for Reel 2 (Tue 23 Jun · Contrarian · Slipping High Performer),
 * Scene 4 Doctrine:
 *
 *   "The work, in order: read the state. Reduce the load the body is
 *    carrying. Restore the regulatory environment. Then look at whether
 *    hormonal support is the right input, and what dose, in what state."
 *
 * Single-zone canvas. Four numbered, ordered steps stacked left-to-right.
 * Steps 1-3 are foundational. Step 4 (hormonal support) sits visually
 * behind a gate — only on the table after 1-3 have done their work.
 *
 * URL: /broll/order-of-operations (noindex)
 */

const STEPS = [
  {
    n: '01',
    title: 'Read the state',
    sub: 'Diagnostic before prescription',
    icon: Search,
    colour: '#1B6DFC',
    body: 'What is the system actually doing right now. Cortisol pattern. Sleep architecture. Recovery debt. Where the body is, not where you assume it is.',
  },
  {
    n: '02',
    title: 'Reduce the load',
    sub: 'Subtract before you add',
    icon: ArrowDownToLine,
    colour: '#1B6DFC',
    body: 'Strip the inputs the body cannot afford to keep absorbing. Training volume that is taxing more than it builds. Stress sources that can be removed. Stimulants that mask the signal.',
  },
  {
    n: '03',
    title: 'Restore the environment',
    sub: 'Rebuild the substrate',
    icon: RotateCcw,
    colour: '#1B6DFC',
    body: 'Sleep, rhythm, nutritional consistency, recovery practices. The conditions a hormonal system needs to regulate itself before being prescribed at.',
  },
  {
    n: '04',
    title: 'Then consider hormonal support',
    sub: 'Right input, right dose, right state',
    icon: Pill,
    colour: '#8b5cf6',
    body: 'Now the question becomes a real question. With the load reduced and the environment restored, what does the panel say. What does the body need. What dose, in what state.',
    gated: true,
  },
]

export default function OrderOfOperationsPage() {
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
            The work, in order
          </p>

          <h1 style={{
            fontSize: '60px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            Read. Reduce. Restore. Then consider.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            Hormonal support is step four, not step one. The first three are what make step four answerable.
          </p>

          {/* FOUR STEPS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.n} style={{
                  background: s.gated ? '#FAFAFA' : '#FFFFFF',
                  border: s.gated ? '1px dashed #C8C8C8' : '1px solid #E5E5E5',
                  borderTop: `4px solid ${s.colour}`,
                  borderRadius: '16px',
                  padding: '24px 22px',
                  position: 'relative',
                }}>
                  {s.gated && (
                    <span style={{
                      position: 'absolute', top: '-12px', right: '16px',
                      fontSize: '9px', fontWeight: 800, color: '#FFFFFF',
                      letterSpacing: '0.18em', textTransform: 'uppercase',
                      background: '#7A7A7A',
                      padding: '4px 10px',
                      borderRadius: '6px',
                    }}>
                      Only after 1-3
                    </span>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                    <span style={{
                      fontSize: '28px', fontWeight: 900, color: s.colour,
                      letterSpacing: '-0.04em', lineHeight: 1,
                    }}>
                      {s.n}
                    </span>
                    <div style={{
                      width: '34px', height: '34px', borderRadius: '10px',
                      background: `${s.colour}1A`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={18} strokeWidth={2.4} color={s.colour} />
                    </div>
                  </div>

                  <p style={{ fontSize: '17px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.015em', lineHeight: 1.2 }}>
                    {s.title}
                  </p>
                  <p style={{
                    fontSize: '11px', fontWeight: 700, color: s.colour,
                    letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
                  }}>
                    {s.sub}
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#3A3A3A', lineHeight: 1.55, margin: 0 }}>
                    {s.body}
                  </p>
                </div>
              )
            })}
          </div>

          <p style={{
            fontSize: '14px', color: '#4A4A4A', fontStyle: 'italic',
            margin: '24px 0 0', textAlign: 'center', lineHeight: 1.55,
          }}>
            Most men skip the first three and go straight to the fourth. Then wonder why the same problems return six months later.
          </p>

        </div>
      </section>

    </div>
  )
}
