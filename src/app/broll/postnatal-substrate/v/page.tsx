'use client'

import { AlertOctagon, Moon, Activity, Heart } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): Postnatal Substrate — Zone 1, Conditions Absent
 *
 * Native vertical 1080x1920 version of /broll/postnatal-substrate Zone 1, built
 * so it fills the entire 9:16 reel frame (no landscape letterbox / side crop).
 *
 * Used by Reel 3 (Fri 26 Jun · Coach · Postnatal Athlete), Scene 4 (Body
 * conditions). The 2x2 landscape grid is reflowed to a single vertical column.
 *
 * URL: /broll/postnatal-substrate/v (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts postnatal-substrate/v BR_Broll_9x16_Postnatal_Conditions.png
 */

const CONDITIONS_ABSENT = [
  { label: 'Broken sleep', sub: 'For years, not weeks', icon: Moon },
  { label: 'Sustained stress load', sub: 'Cortisol high across the day', icon: AlertOctagon },
  { label: 'Incomplete recovery', sub: 'No window to rebuild', icon: Activity },
  { label: 'Nervous system reactive', sub: 'Stuck in protection mode', icon: Heart },
]

export default function PostnatalConditionsVerticalPage() {
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

      <div style={{
        position: 'absolute', top: '-260px', right: '-260px',
        width: '760px', height: '760px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%' }}>

        <p style={{
          fontSize: '20px', fontWeight: 700, color: '#DC2626',
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 24px',
        }}>
          Why the body never recovered
        </p>

        <h1 style={{
          fontSize: '74px', fontWeight: 900, color: '#1A1A1A',
          letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 28px',
        }}>
          The conditions to shift back never came.
        </h1>

        <p style={{
          fontSize: '29px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 56px',
        }}>
          Her body hasn't had the regulatory environment it needed to recover. The state shifted. It hasn't shifted back because the substrate for shifting back was never present.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {CONDITIONS_ABSENT.map((c, i) => {
            const Icon = c.icon
            return (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: '6px solid #DC2626',
                borderRadius: '16px',
                padding: '26px 30px',
                display: 'flex', alignItems: 'center', gap: '22px',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(220, 38, 38, 0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={30} strokeWidth={2.4} color="#DC2626" />
                </div>
                <div>
                  <p style={{ fontSize: '28px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.015em' }}>
                    {c.label}
                  </p>
                  <p style={{ fontSize: '19px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                    {c.sub}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <p style={{
          fontSize: '22px', color: '#4A4A4A', fontStyle: 'italic',
          margin: '44px 0 0', lineHeight: 1.5, textAlign: 'center',
        }}>
          She isn't behind. Her body has been waiting for conditions that never came.
        </p>

      </div>
    </div>
  )
}
