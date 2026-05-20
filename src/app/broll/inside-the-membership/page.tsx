'use client'

import { Layers, Dumbbell, Salad, BookOpen, Video, Users, LineChart } from 'lucide-react'

/**
 * B-roll canvas: Inside the Membership
 *
 * Designed to be screen-recorded as B-roll for the /membership explainer
 * video. Covers the script beats:
 *
 *   "Block by block. Pattern continuity. The training intensity scales
 *    as your body comes online. The nutrition gets more sophisticated.
 *    A monthly Loom from me reading your check-in data."
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: Block progression - Block A vs B vs C side-by-side showing
 *           how training and nutrition scale.
 *   Zone 2: Portal home (Membership Block A view) - what a Membership
 *           week actually looks like inside the portal.
 *   Zone 3: Coach-in-the-loop elements - monthly Loom + group Q&A +
 *           trend dashboard mockup.
 *
 * URL: /broll/inside-the-membership (noindex - see /broll/layout.tsx)
 */

const BLOCKS = [
  {
    label: 'Block A · Consolidate',
    weeks: 'Weeks 7-12',
    training: 'RIR 2-3. Harder movement patterns. Foundation holds under more demand.',
    nutrition: 'Carb timing introduced. Cycle-aware adjustments. Recovery nutrition layered in.',
    colour: '#1B6DFC',
    active: true,
  },
  {
    label: 'Block B · Advance',
    weeks: 'Weeks 13-18',
    training: 'Complex movement patterns. Training intensity steps up. The system handles real load now.',
    nutrition: 'Calorie periodisation across training and rest days. More precision.',
    colour: '#6B6B6B',
    active: false,
  },
  {
    label: 'Block C · Refine',
    weeks: 'Weeks 19-24',
    training: 'Peak intensity for the cycle. Body now responding to high stimulus.',
    nutrition: 'Highest carb intake of the programme on training days. Fuel for output.',
    colour: '#6B6B6B',
    active: false,
  },
]

export default function InsideTheMembershipPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · BLOCK PROGRESSION
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Block by block
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Training scales. Nutrition gets sharper.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Each block runs six weeks. Pattern continuity carries through. The work calibrates to what your body can now handle.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {BLOCKS.map((b, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderTop: `4px solid ${b.colour}`,
                borderRadius: '14px',
                padding: '24px 22px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: b.active ? 'rgba(27, 109, 252, 0.12)' : 'rgba(107, 107, 107, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Layers size={16} strokeWidth={2.5} color={b.colour} />
                  </div>
                  {b.active && (
                    <span style={{
                      fontSize: '10px', fontWeight: 800, color: '#FFFFFF',
                      background: '#1B6DFC',
                      padding: '3px 8px', borderRadius: '4px',
                      letterSpacing: '0.08em', textTransform: 'uppercase',
                    }}>
                      Starts here
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '17px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {b.label}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 18px' }}>
                  {b.weeks}
                </p>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Dumbbell size={14} strokeWidth={2.5} color="#1B6DFC" />
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                      Training
                    </p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#3A3A3A', lineHeight: 1.55, margin: 0 }}>
                    {b.training}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Salad size={14} strokeWidth={2.5} color="#1B6DFC" />
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
                      Nutrition
                    </p>
                  </div>
                  <p style={{ fontSize: '12px', color: '#3A3A3A', lineHeight: 1.55, margin: 0 }}>
                    {b.nutrition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · PORTAL HOME (BLOCK A VIEW)
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Inside the portal
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Same portal. Deeper work.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            The portal you knew from the Blueprint continues. Block A loads automatically. Pattern continuity carries through.
          </p>

          {/* Portal mockup */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
          }}>
            <div style={{
              background: '#1A1A1A',
              padding: '22px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                  Body Recode Membership · Block A
                </p>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                  Week 9 of 24 · Stress-Stored Pattern
                </p>
              </div>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: 'conic-gradient(#1B6DFC 0deg 135deg, #2C2C2C 135deg 360deg)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%',
                  background: '#1A1A1A',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#FFFFFF' }}>38%</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0' }}>
              {[
                { icon: Dumbbell, label: 'This week training', sub: 'Session A · RIR 2-3 · Finisher: Zone 2 walk 30 min · Rest 90s', accent: true },
                { icon: Salad, label: 'This week nutrition', sub: 'Cortisol anchor evening meal · Caffeine cutoff 10am · Post-training carb window widens' },
                { icon: BookOpen, label: 'Block A library', sub: 'Pattern-specific deep-dives. Supplement protocols. Sleep strategies. New material added each block.' },
                { icon: LineChart, label: 'Your check-in trend', sub: 'Energy, sleep, recovery markers across 6, 12, 18 weeks. The arc becomes visible in the data.' },
              ].map((t, i) => {
                const Icon = t.icon
                return (
                  <div key={i} style={{
                    padding: '20px 24px',
                    borderRight: i % 2 === 0 ? '1px solid #E5E5E5' : 'none',
                    borderBottom: i < 2 ? '1px solid #E5E5E5' : 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      <div style={{
                        width: '34px', height: '34px', borderRadius: '8px',
                        background: t.accent ? '#1B6DFC' : 'rgba(27, 109, 252, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={17} strokeWidth={2.5} color={t.accent ? '#FFFFFF' : '#1B6DFC'} />
                      </div>
                      <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                        {t.label}
                      </p>
                    </div>
                    <p style={{ fontSize: '12px', color: '#4A4A4A', margin: 0, lineHeight: 1.55 }}>
                      {t.sub}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · COACH-IN-THE-LOOP (LOOM + Q&A + DASHBOARD)
          ─────────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px 64px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Coach in the loop
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            A real coach. Reading real data.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Most subscriptions are content libraries. This is the part that makes it not.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Monthly Loom */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #1B6DFC',
              borderLeft: '4px solid #1B6DFC',
              borderRadius: '14px',
              padding: '22px 24px',
              display: 'flex', alignItems: 'flex-start', gap: '18px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: '#1B6DFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Video size={20} strokeWidth={2.5} color="#FFFFFF" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Monthly coach Loom
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#1056D6',
                    background: 'rgba(27, 109, 252, 0.1)',
                    padding: '3px 8px', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Personal · 3-5 min
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, margin: 0 }}>
                  Once a month I review your check-in data and record a personal 3 to 5 minute Loom for you. Not a generic email. Specific to your numbers. What is shifting, what needs adjusting, what to watch for in the next block.
                </p>
              </div>
            </div>

            {/* Group Q&A */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '14px',
              padding: '22px 24px',
              display: 'flex', alignItems: 'flex-start', gap: '18px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(27, 109, 252, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Users size={20} strokeWidth={2.5} color="#1B6DFC" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Monthly group Q&A
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                    background: '#F5F5F5',
                    padding: '3px 8px', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Live
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, margin: 0 }}>
                  Live once a month. I answer the questions that come up most across the membership that month. Replays in your portal.
                </p>
              </div>
            </div>

            {/* Trend dashboard */}
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderRadius: '14px',
              padding: '22px 24px',
              display: 'flex', alignItems: 'flex-start', gap: '18px',
            }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '10px',
                background: 'rgba(27, 109, 252, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <LineChart size={20} strokeWidth={2.5} color="#1B6DFC" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Check-in trend dashboard
                  </p>
                  <span style={{
                    fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                    background: '#F5F5F5',
                    padding: '3px 8px', borderRadius: '4px',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    Weekly
                  </span>
                </div>
                <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, margin: 0 }}>
                  Your weekly check-in data visualised over time. Energy, sleep, recovery, fat loss, and mood markers across 6, 12, and 18 weeks. The arc becomes visible in the data.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
