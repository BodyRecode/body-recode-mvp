'use client'

import { Search, ArrowDownToLine, RotateCcw, Pill } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): Order of Operations
 *
 * Native vertical 1080x1920 version of /broll/order-of-operations, built so it
 * fills the entire 9:16 reel frame (no landscape letterboxing / side crop).
 *
 * Used by Reel 2 (Tue 23 Jun · Contrarian · Slipping High Performer), Scene 4
 * Doctrine. The landscape four-column row is reflowed to a vertical stack of
 * four ordered step cards reading top to bottom.
 *
 * URL: /broll/order-of-operations/v (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts order-of-operations/v
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
    body: 'Strip the inputs the body cannot afford to keep absorbing. Training volume taxing more than it builds. Stress sources that can go. Stimulants that mask the signal.',
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
    body: 'Now the question becomes real. With the load reduced and the environment restored, what does the panel say. What does the body need. What dose, in what state.',
    gated: true,
  },
]

export default function OrderOfOperationsVerticalPage() {
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
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 22px',
        }}>
          The work, in order
        </p>

        {/* Title */}
        <h1 style={{
          fontSize: '66px', fontWeight: 900, color: '#1A1A1A',
          letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 22px',
        }}>
          Read. Reduce. Restore.<br />Then consider.
        </h1>

        <p style={{
          fontSize: '28px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 44px',
        }}>
          Hormonal support is step four, not step one. The first three are what make step four answerable.
        </p>

        {/* FOUR STEPS — stacked */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {STEPS.map((s) => {
            const Icon = s.icon
            return (
              <div key={s.n} style={{
                background: s.gated ? '#FAFAFA' : '#FFFFFF',
                border: s.gated ? '1px dashed #C8C8C8' : '1px solid #E5E5E5',
                borderLeft: `6px solid ${s.colour}`,
                borderRadius: '18px',
                padding: '26px 30px',
                display: 'flex', gap: '24px', alignItems: 'flex-start',
                position: 'relative',
              }}>
                {s.gated && (
                  <span style={{
                    position: 'absolute', top: '-13px', right: '26px',
                    fontSize: '13px', fontWeight: 800, color: '#FFFFFF',
                    letterSpacing: '0.16em', textTransform: 'uppercase',
                    background: '#7A7A7A',
                    padding: '5px 14px',
                    borderRadius: '8px',
                  }}>
                    Only after 1-3
                  </span>
                )}

                {/* Number + icon column */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', flexShrink: 0, width: '92px' }}>
                  <span style={{
                    fontSize: '52px', fontWeight: 900, color: s.colour,
                    letterSpacing: '-0.04em', lineHeight: 1,
                  }}>
                    {s.n}
                  </span>
                  <div style={{
                    width: '52px', height: '52px', borderRadius: '14px',
                    background: `${s.colour}1A`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={26} strokeWidth={2.4} color={s.colour} />
                  </div>
                </div>

                {/* Text */}
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '32px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    {s.title}
                  </p>
                  <p style={{
                    fontSize: '16px', fontWeight: 700, color: s.colour,
                    letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px',
                  }}>
                    {s.sub}
                  </p>
                  <p style={{ fontSize: '20px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>
                    {s.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footnote */}
        <p style={{
          fontSize: '22px', color: '#4A4A4A', fontStyle: 'italic',
          margin: '40px 0 0', textAlign: 'center', lineHeight: 1.5,
        }}>
          Most men skip the first three and go straight to the fourth. Then wonder why the same problems return six months later.
        </p>

      </div>
    </div>
  )
}
