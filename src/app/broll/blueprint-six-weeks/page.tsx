'use client'

import { FileText, Dumbbell, BookOpen, Salad, Compass, CheckCircle2, ArrowRight } from 'lucide-react'

/**
 * B-roll canvas: Blueprint Six-Week Journey
 *
 * Designed to be screen-recorded as B-roll for the /blueprint explainer
 * video. Covers the script beats that the four-patterns canvas does not:
 *
 *   "Day 1 your portal opens. By Week 6 the pattern is corrected and
 *    your body is ready to compound. At Week 6 you ascend into the
 *    ongoing Membership, if you want it."
 *
 * Three viewport-sized zones moving through the six-week arc:
 *
 *   Zone 1: Day 1 - Portal opens. Pattern banner + Week 1 daily structure.
 *   Zone 2: Week 3 - Midpoint reflection. Pattern-specific questions.
 *   Zone 3: Week 6 - Pattern corrected + Membership ascension CTA.
 *
 * URL: /broll/blueprint-six-weeks (noindex - see /broll/layout.tsx)
 */

const STRESS_STORED_COLOUR = '#DC2626'

const MIDPOINT_QUESTIONS = [
  'Is your afternoon energy crash less severe than Week 1?',
  'Are you falling asleep faster or staying asleep longer?',
  'Has the late-night hunger or restlessness reduced?',
  'Does your morning energy feel less forced?',
]

export default function BlueprintSixWeeksPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · DAY 1 - PORTAL OPENS
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

        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Day 1 · Your portal opens
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            The corrective work starts.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '800px' }}>
            Your pattern is already identified. Your portal opens immediately. Week 1 is loaded with your training, nutrition, coaching note, and biology lesson.
          </p>

          {/* Portal mockup */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
          }}>
            {/* Pattern banner */}
            <div style={{
              background: '#1A1A1A',
              padding: '20px 28px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                  6-Week Body Rewire · Week 1 of 6
                </p>
                <p style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.015em', margin: 0 }}>
                  Stress-Stored Pattern · Regulate phase
                </p>
              </div>
              <div style={{
                padding: '8px 16px', borderRadius: '99px',
                background: STRESS_STORED_COLOUR,
              }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Active
                </span>
              </div>
            </div>

            {/* Today's coaching note (featured) */}
            <div style={{
              padding: '24px 28px',
              background: 'linear-gradient(135deg, rgba(27, 109, 252, 0.04) 0%, transparent 100%)',
              borderBottom: '1px solid #E5E5E5',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px',
                  background: '#1B6DFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(27, 109, 252, 0.3)',
                }}>
                  <FileText size={18} strokeWidth={2.5} color="#FFFFFF" />
                </div>
                <div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    Week 1 coaching note
                  </p>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                    Removing load, not adding it
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>
                Your cortisol has been elevated for a while and the first thing your body needs is a clear signal that the pressure is coming down. The training is intentionally controlled. The meal structure is consistent. That is the work.
              </p>
            </div>

            {/* Three tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0' }}>
              {[
                { icon: Dumbbell, label: 'This week training', sub: 'Session A · 3 RIR throughout · Skip the finisher · 90s rest minimum' },
                { icon: Salad, label: 'This week nutrition', sub: '3 meals per day · Eat within 60min of waking · Caffeine cutoff 10am' },
                { icon: BookOpen, label: 'This week lesson', sub: 'Cortisol and the Stress Response · 9 minute video + 5-section breakdown' },
              ].map((t, i) => {
                const Icon = t.icon
                return (
                  <div key={i} style={{
                    padding: '20px 22px',
                    borderRight: i < 2 ? '1px solid #E5E5E5' : 'none',
                    background: '#FFFFFF',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: 'rgba(27, 109, 252, 0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon size={16} strokeWidth={2.5} color="#1B6DFC" />
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
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
          ZONE 2 · WEEK 3 - MIDPOINT REFLECTION
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
        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Week 3 · Midpoint reflection
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Halfway. Before the Adapt phase begins.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Four pattern-specific reflection questions. Before training intensity steps up in the Adapt phase, you check what has already shifted since Week 1.
          </p>

          {/* Reflection card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderLeft: `4px solid ${STRESS_STORED_COLOUR}`,
            borderRadius: '16px',
            padding: '32px 32px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                background: STRESS_STORED_COLOUR,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Compass size={20} strokeWidth={2.5} color="#FFFFFF" />
              </div>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 800, color: '#dc2626', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                  Stress-Stored · Midpoint Reflection
                </p>
                <p style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                  What has shifted since Week 1?
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {MIDPOINT_QUESTIONS.map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: 'rgba(239, 68, 68, 0.1)',
                    color: STRESS_STORED_COLOUR,
                    fontSize: '12px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  <p style={{ fontSize: '16px', color: '#3A3A3A', margin: 0, lineHeight: 1.55 }}>{q}</p>
                </div>
              ))}
            </div>

            <p style={{ fontSize: '13px', color: '#6B6B6B', fontStyle: 'italic', margin: '24px 0 0', paddingTop: '20px', borderTop: '1px solid #E5E5E5', lineHeight: 1.6 }}>
              Each of the four patterns gets a different set of midpoint questions. Yours surfaces what should be shifting first in your pattern, so the Adapt phase builds on visible progress.
            </p>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · WEEK 6 - PATTERN CORRECTED + ASCENSION
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
          width: '700px', height: '700px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Week 6 · Pattern corrected
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Six weeks done.<br />Body ready to compound.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            The pattern is corrected. The compensation has been pulled. At Week 6 you ascend into the ongoing Membership - or end here, if you want to.
          </p>

          {/* Completion card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
          }}>
            {/* Header */}
            <div style={{
              background: '#1A1A1A',
              padding: '24px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#1B6DFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 size={22} strokeWidth={2.5} color="#FFFFFF" />
                </div>
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                    6-Week Body Rewire · Complete
                  </p>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                    Your pattern is corrected.
                  </p>
                </div>
              </div>
            </div>

            {/* Ascension CTA */}
            <div style={{ padding: '32px 32px' }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 10px' }}>
                What comes next
              </p>
              <p style={{ fontSize: '24px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.015em', margin: '0 0 14px', lineHeight: 1.2 }}>
                Block A loads automatically when you join the Membership.
              </p>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.65, margin: '0 0 24px' }}>
                Pattern continuity carries through. Same portal. The training intensity steps up as your body comes online. A monthly Loom from me reviewing your check-in data. $49 per week. Cancel anytime.
              </p>

              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: '#1B6DFC', color: '#FFFFFF',
                padding: '14px 24px', borderRadius: '10px',
                fontSize: '15px', fontWeight: 800,
                boxShadow: '0 4px 16px rgba(27, 109, 252, 0.3)',
              }}>
                Ascend to the Membership
                <ArrowRight size={18} strokeWidth={2.5} color="#FFFFFF" />
              </div>
              <p style={{ fontSize: '12px', color: '#6B6B6B', margin: '14px 0 0', fontStyle: 'italic' }}>
                Optional. If you want to end the journey at Week 6, you can.
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
