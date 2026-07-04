'use client'

/**
 * B-roll canvas: The restriction staircase
 *
 * White canvas matching the other /broll explainer canvases. Screen-record
 * cutaway for Blueprint education Lesson 4 (Thyroid), Scene 5:
 *
 *   "Every cycle of restriction and rebound leaves metabolic rate a little
 *    lower than where it started."
 *
 * URL: /broll/restriction-staircase (noindex - see /broll/layout.tsx)
 */

const BLUE = '#1B6DFC'
const INK = '#1A1A1A'
const MUTED = '#6B6B6B'

const STAIR = 'M120,120 H340 V200 H560 V280 H780 V360 H1000 V440 H1080'
const AREA = `${STAIR} V480 H120 Z`
const TREADS = [
  { x: 230, y: 120, label: 'Cycle 1' },
  { x: 450, y: 200, label: 'Cycle 2' },
  { x: 670, y: 280, label: 'Cycle 3' },
  { x: 890, y: 360, label: 'Cycle 4' },
]

export default function RestrictionStaircasePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', color: INK, fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '80px 64px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '-200px', right: '-200px', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', position: 'relative' }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: BLUE, letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 20px' }}>Metabolic rate · the staircase</p>
        <h1 style={{ fontSize: '68px', fontWeight: 900, color: INK, letterSpacing: '-0.035em', lineHeight: 1.05, margin: '0 0 20px' }}>Every diet cycle steps it down.</h1>
        <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 40px', maxWidth: '820px' }}>Each round of restriction and rebound leaves metabolic rate a little lower than where it started. Over years, you need less and less food to hold the same weight.</p>

        <svg viewBox="0 0 1200 520" style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            <linearGradient id="stairArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BLUE} stopOpacity="0.1" />
              <stop offset="100%" stopColor={BLUE} stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* original level reference */}
          <line x1="120" y1="120" x2="1080" y2="120" stroke="#C9C9C9" strokeWidth="2" strokeDasharray="6 6" />
          <text x="1080" y="108" fill={MUTED} fontSize="16" fontWeight="600" textAnchor="end">Where you started</text>

          {/* y-axis hint */}
          <text x="150" y="500" fill={MUTED} fontSize="15" fontWeight="600" letterSpacing="0.1em">METABOLIC RATE  ↓</text>

          <path d={AREA} fill="url(#stairArea)" />
          <path d={STAIR} fill="none" stroke={BLUE} strokeWidth="4.5" strokeLinejoin="round" strokeLinecap="round" />

          {TREADS.map((t, i) => (
            <g key={i}>
              <circle cx={t.x} cy={t.y} r="6" fill={BLUE} />
              <text x={t.x} y={t.y - 16} fill={INK} fontSize="17" fontWeight="700" textAnchor="middle">{t.label}</text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  )
}
