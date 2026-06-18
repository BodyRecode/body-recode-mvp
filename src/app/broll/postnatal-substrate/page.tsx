'use client'

import { AlertOctagon, Moon, Activity, Heart, Apple, Leaf, Sparkles } from 'lucide-react'

/**
 * B-roll canvas: Postnatal Substrate
 *
 * Designed for Reel 3 (Fri 26 Jun · Coach · Postnatal Athlete).
 *
 * Two zones — one per scene:
 *
 *   Zone 1 (Scene 4 — Body conditions): "Conditions Absent" — why the body
 *     never had what it needed to recover. Broken sleep, sustained stress,
 *     incomplete recovery. State shifted; conditions to shift back never
 *     came.
 *
 *   Zone 2 (Scene 5 — Method): "Restore the Substrate" — what creating the
 *     conditions actually looks like. Not more training, not less food.
 *     The substrate work the body has been waiting for.
 *
 * URL: /broll/postnatal-substrate (noindex)
 */

const CONDITIONS_ABSENT = [
  { label: 'Broken sleep', sub: 'For years, not weeks', icon: Moon },
  { label: 'Sustained stress load', sub: 'Cortisol high across the day', icon: AlertOctagon },
  { label: 'Incomplete recovery', sub: 'No window to rebuild', icon: Activity },
  { label: 'Nervous system reactive', sub: 'Stuck in protection mode', icon: Heart },
]

const SUBSTRATE_INPUTS = [
  { label: 'Predictable meals', sub: 'Anchored, not skipped', icon: Apple },
  { label: 'Sleep window protected', sub: 'Same hours, every night', icon: Moon },
  { label: 'Lower stress load', sub: 'Removed before added to', icon: Leaf },
  { label: 'Steady rhythm restored', sub: 'Signal of safety to the system', icon: Sparkles },
]

export default function PostnatalSubstratePage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · CONDITIONS ABSENT
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '72px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-220px', right: '-220px',
          width: '640px', height: '640px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>

          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#DC2626',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            Why the body never recovered
          </p>

          <h1 style={{
            fontSize: '64px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            The conditions to shift back never came.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            Her body hasn't had the regulatory environment it needed to recover. The state shifted. It hasn't shifted back because the substrate for shifting back was never present.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {CONDITIONS_ABSENT.map((c, i) => {
              const Icon = c.icon
              return (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderLeft: '4px solid #DC2626',
                  borderRadius: '14px',
                  padding: '22px 24px',
                  display: 'flex', alignItems: 'center', gap: '18px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(220, 38, 38, 0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={22} strokeWidth={2.4} color="#DC2626" />
                  </div>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.015em' }}>
                      {c.label}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                      {c.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{
            fontSize: '14px', color: '#4A4A4A', fontStyle: 'italic',
            margin: '24px 0 0', lineHeight: 1.55, textAlign: 'center',
          }}>
            She isn't behind. Her body has been waiting for conditions that never came.
          </p>

        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · RESTORE THE SUBSTRATE
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '72px 64px',
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: '-220px', left: '-220px',
          width: '640px', height: '640px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.10) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>

          <p style={{
            fontSize: '13px', fontWeight: 700, color: '#1B6DFC',
            letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px',
          }}>
            Create the conditions
          </p>

          <h1 style={{
            fontSize: '64px', fontWeight: 900, color: '#1A1A1A',
            letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px',
          }}>
            Restore the substrate. Then build.
          </h1>

          <p style={{
            fontSize: '21px', color: '#4A4A4A', lineHeight: 1.5,
            marginBottom: '48px', maxWidth: '900px',
          }}>
            Not more training. Not less food. The conditions the body needs to release what it has been holding — given consistently, long enough to register as safe.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            {SUBSTRATE_INPUTS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderLeft: '4px solid #1B6DFC',
                  borderRadius: '14px',
                  padding: '22px 24px',
                  display: 'flex', alignItems: 'center', gap: '18px',
                }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(27, 109, 252, 0.10)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Icon size={22} strokeWidth={2.4} color="#1B6DFC" />
                  </div>
                  <div>
                    <p style={{ fontSize: '17px', fontWeight: 900, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.015em' }}>
                      {s.label}
                    </p>
                    <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>
                      {s.sub}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          <p style={{
            fontSize: '14px', color: '#4A4A4A', fontStyle: 'italic',
            margin: '24px 0 0', lineHeight: 1.55, textAlign: 'center',
          }}>
            Build from where the body actually is. Not from where the timeline in her head says it should be.
          </p>

        </div>
      </section>

    </div>
  )
}
