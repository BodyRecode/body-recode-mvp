'use client'

import { Apple, Moon, Leaf, Sparkles } from 'lucide-react'

/**
 * B-roll canvas (9:16 PORTRAIT): Postnatal Substrate — Zone 2, Restore the Substrate
 *
 * Native vertical 1080x1920 version of /broll/postnatal-substrate Zone 2, built
 * so it fills the entire 9:16 reel frame (no landscape letterbox / side crop).
 *
 * Used by Reel 3 (Fri 26 Jun · Coach · Postnatal Athlete), Scene 5 (Method).
 * The 2x2 landscape grid is reflowed to a single vertical column. Grey backdrop
 * retained from the landscape Zone 2.
 *
 * URL: /broll/postnatal-substrate/v2 (noindex — see /broll/layout.tsx)
 * Export: npx tsx scripts/export-broll-vertical-png.ts postnatal-substrate/v2 BR_Broll_9x16_Postnatal_Restore.png
 */

const SUBSTRATE_INPUTS = [
  { label: 'Predictable meals', sub: 'Anchored, not skipped', icon: Apple },
  { label: 'Sleep window protected', sub: 'Same hours, every night', icon: Moon },
  { label: 'Lower stress load', sub: 'Removed before added to', icon: Leaf },
  { label: 'Steady rhythm restored', sub: 'Signal of safety to the system', icon: Sparkles },
]

export default function PostnatalRestoreVerticalPage() {
  return (
    <div style={{
      width: '1080px',
      height: '1920px',
      margin: '0 auto',
      background: '#F7F7F7',
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
        position: 'absolute', bottom: '-260px', left: '-260px',
        width: '760px', height: '760px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', width: '100%' }}>

        <p style={{
          fontSize: '20px', fontWeight: 700, color: '#1B6DFC',
          letterSpacing: '0.15em', textTransform: 'uppercase', margin: '0 0 24px',
        }}>
          Create the conditions
        </p>

        <h1 style={{
          fontSize: '74px', fontWeight: 900, color: '#1A1A1A',
          letterSpacing: '-0.035em', lineHeight: 1.04, margin: '0 0 28px',
        }}>
          Restore the substrate. Then build.
        </h1>

        <p style={{
          fontSize: '29px', color: '#4A4A4A', lineHeight: 1.5, margin: '0 0 56px',
        }}>
          Not more training. Not less food. The conditions the body needs to release what it has been holding, given consistently, long enough to register as safe.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {SUBSTRATE_INPUTS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: '6px solid #1B6DFC',
                borderRadius: '16px',
                padding: '26px 30px',
                display: 'flex', alignItems: 'center', gap: '22px',
              }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '16px',
                  background: 'rgba(27, 109, 252, 0.10)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={30} strokeWidth={2.4} color="#1B6DFC" />
                </div>
                <div>
                  <p style={{ fontSize: '28px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.015em' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: '19px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                    {s.sub}
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
          Build from where the body actually is. Not from where the timeline in her head says it should be.
        </p>

      </div>
    </div>
  )
}
