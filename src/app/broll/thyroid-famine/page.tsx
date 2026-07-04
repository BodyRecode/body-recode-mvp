'use client'

import { ArrowRight } from 'lucide-react'

/**
 * B-roll canvas: The thyroid famine response
 *
 * White canvas matching the other /broll explainer canvases. Screen-record
 * cutaway for Blueprint education Lesson 4 (Thyroid), Scene 3:
 *
 *   "When you cut food hard, your body reads it as famine... reduce T4 to
 *    T3 conversion. Less active thyroid hormone, slower metabolic rate."
 *
 * URL: /broll/thyroid-famine (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'

const STEPS = ['Cut food hard', 'Body reads famine', 'Less T4 → T3 conversion', 'Metabolic rate slows']

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '28px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', textAlign: 'center' }}>
      <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: BLUE, color: '#FFFFFF', fontWeight: 800, fontSize: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 4px 12px rgba(27,109,252,0.3)' }}>{n}</div>
      <div style={{ fontSize: '19px', fontWeight: 700, color: INK, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

export default function ThyroidFaminePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: BLUE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>Thyroid · the famine response</p>
        <h1 style={{ fontSize: '68px', fontWeight: 900, color: INK, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px' }}>Cut food, and the body adapts.</h1>
        <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 64px', maxWidth: '820px' }}>Your body cannot tell the difference between a famine and a diet. It slows the metabolic rate to match the lower intake.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <Step n={i + 1} label={s} />
              {i < STEPS.length - 1 && <ArrowRight size={34} color={BLUE} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
