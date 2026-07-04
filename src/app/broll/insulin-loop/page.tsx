'use client'

import { ArrowRight } from 'lucide-react'

/**
 * B-roll canvas: The healthy insulin loop
 *
 * White canvas matching the other /broll explainer canvases. Screen-record
 * cutaway for Blueprint education Lesson 2 (Insulin), Scene 1:
 *
 *   "You eat carbs, blood glucose rises, your pancreas releases insulin,
 *    and insulin moves that glucose into your cells... blood sugar drops
 *    back to baseline."
 *
 * URL: /broll/insulin-loop (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'

const STEPS = ['Eat carbs', 'Blood glucose rises', 'Insulin released', 'Glucose into cells', 'Blood sugar back to baseline']

function Step({ n, label }: { n: number; label: string }) {
  return (
    <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: '16px', padding: '24px 16px', boxShadow: '0 8px 24px rgba(0,0,0,0.05)', textAlign: 'center' }}>
      <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: BLUE, color: '#FFFFFF', fontWeight: 800, fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 4px 12px rgba(27,109,252,0.3)' }}>{n}</div>
      <div style={{ fontSize: '17px', fontWeight: 700, color: INK, lineHeight: 1.3 }}>{label}</div>
    </div>
  )
}

export default function InsulinLoopPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: BLUE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>Insulin · the healthy loop</p>
        <h1 style={{ fontSize: '68px', fontWeight: 900, color: INK, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px' }}>How insulin is meant to work.</h1>
        <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 56px', maxWidth: '820px' }}>A clean cycle, every meal. Blood sugar rises, insulin handles it, and between meals your body has clear access to fat as fuel.</p>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <Step n={i + 1} label={s} />
              {i < STEPS.length - 1 && <ArrowRight size={30} color={BLUE} style={{ flexShrink: 0 }} />}
            </div>
          ))}
        </div>

        {/* return loop */}
        <div style={{ position: 'relative', height: '78px', marginTop: '6px' }}>
          <svg width="100%" height="78" viewBox="0 0 1200 78" style={{ position: 'absolute', inset: 0 }}>
            <defs><marker id="ah" markerWidth="9" markerHeight="9" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill={BLUE} /></marker></defs>
            <path d="M1150,4 V50 H60 V10" fill="none" stroke={BLUE} strokeWidth="2.5" strokeDasharray="7 6" markerEnd="url(#ah)" />
          </svg>
          <div style={{ position: 'absolute', left: '50%', top: '40px', transform: 'translateX(-50%)', background: '#FFFFFF', padding: '0 16px', fontSize: '15px', fontWeight: 700, color: BLUE, letterSpacing: '0.03em' }}>insulin clears between meals</div>
        </div>
      </div>
    </div>
  )
}
