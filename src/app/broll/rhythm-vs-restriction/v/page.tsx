'use client'

import { AlertTriangle, Activity } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): Rhythm vs Restriction — Zone 1, Reactive vs Regulated
 *
 * Native vertical 1080x1920 version of /broll/rhythm-vs-restriction Zone 1,
 * built so it fills the entire 9:16 reel frame (no landscape letterbox / crop).
 *
 * Used by Reel 4 (Tue 30 Jun · Contrarian · Stressed Executive Woman), Scene 3
 * (more stress on a stressed system). The two side-by-side state columns are
 * reflowed to a vertical stack.
 *
 * NOTE: the landscape source carries Challenge-specific micro-labels ("Day 5",
 * "Before Day 1", "Day 5 onward") because it was first built for the Day 5
 * session. Those are neutralised here ("In protection mode" / "Once it
 * regulates") so the cut reads correctly inside a cold contrarian reel. The
 * state lists themselves are unchanged.
 *
 * URL: /broll/rhythm-vs-restriction/v (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts rhythm-vs-restriction/v
 */

const REACTIVE = [
  'Cortisol elevated through the day',
  'Fat held at the midsection',
  'Energy crashes mid-afternoon',
  'Sleep fragmented, wakes tired',
  'Cravings driven by stress, not hunger',
  'Body in protection mode',
]

const REGULATED = [
  'Cortisol curve recalibrating',
  'Inflammation lowering',
  'Energy steadier across the day',
  'Sleep onset easier, deeper',
  'Hunger predictable, not driven',
  'Body releasing what it was holding',
]

function StateCard({
  tag, tagColour, title, accent, items, borderColour,
}: {
  tag: string; tagColour: string; title: string; accent: string; items: string[]; borderColour: string
}) {
  const Icon = accent === '#DC2626' ? AlertTriangle : Activity
  return (
    <div style={{
      background: '#FFFFFF',
      border: `1px solid ${borderColour}`,
      borderTop: `6px solid ${accent}`,
      borderRadius: '20px',
      padding: '34px 36px',
      flex: 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <Icon size={28} color={accent} strokeWidth={2.2} />
        <p style={{
          fontSize: '16px', fontWeight: 800, color: tagColour,
          letterSpacing: '0.16em', textTransform: 'uppercase', margin: 0,
        }}>
          {tag}
        </p>
      </div>
      <h2 style={{
        fontSize: '40px', fontWeight: 900, color: '#1A1A1A',
        letterSpacing: '-0.025em', lineHeight: 1.12, margin: '0 0 22px',
      }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {items.map((item, i) => (
          <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <span style={{
              fontSize: '15px', fontWeight: 800, color: accent,
              fontFamily: '"Courier New",Consolas,monospace',
              minWidth: '28px', paddingTop: '3px',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <p style={{ fontSize: '22px', color: '#3A3A3A', margin: 0, lineHeight: 1.45 }}>{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RhythmVsRestrictionVerticalPage() {
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
      padding: '80px 72px',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>

      <div style={{
        position: 'absolute', top: '-160px', left: '-160px',
        width: '520px', height: '520px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-160px', right: '-160px',
        width: '520px', height: '520px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27, 109, 252, 0.06) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%' }}>

        <p style={{
          fontSize: '20px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.18em', textTransform: 'uppercase',
          margin: '0 0 22px', textAlign: 'center',
        }}>
          Same body. Two states.
        </p>
        <h1 style={{
          fontSize: '64px', fontWeight: 900,
          letterSpacing: '-0.035em', lineHeight: 1.05,
          color: '#1A1A1A', margin: '0 0 48px', textAlign: 'center',
        }}>
          Reactive biology vs <span style={{ color: '#1B6DFC' }}>Regulated biology</span>
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <StateCard
            tag="In protection mode" tagColour="#DC2626" title="Reactive biology"
            accent="#DC2626" borderColour="rgba(220, 38, 38, 0.25)" items={REACTIVE}
          />
          <StateCard
            tag="Once it regulates" tagColour="#1056D6" title="Regulated biology"
            accent="#1B6DFC" borderColour="rgba(27, 109, 252, 0.3)" items={REGULATED}
          />
        </div>

        <p style={{
          fontSize: '22px', color: '#6B6B6B',
          textAlign: 'center', margin: '40px 0 0', lineHeight: 1.55,
        }}>
          This shift is not random. Reduce the load and restore recovery, and the body moves from one state to the other.
        </p>
      </div>
    </div>
  )
}
