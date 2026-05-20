'use client'

import { TrendingDown, Activity, Layers } from 'lucide-react'

/**
 * B-roll canvas: The Long Arc
 *
 * Designed to be screen-recorded as B-roll for the /membership explainer
 * video. Covers the script beats:
 *
 *   "The window closes. The structure disappears. The body slowly
 *    returns to where it was."
 *   "State shift is not a six-week event. It is a months-long arc.
 *    Six weeks of work corrects the pattern. Months of work shifts
 *    the state."
 *
 * Three viewport-sized zones:
 *
 *   Zone 1: The cycle - programmes end, results fade. Visual timeline
 *           showing 5 typical programmes ending with results regressing.
 *   Zone 2: The arc - the months-long state-shift journey from Depleted
 *           through Transitioning to Ready.
 *   Zone 3: The 24-week block structure - how the Membership delivers
 *           the arc through Blueprint + Block A + Block B + Block C.
 *
 * URL: /broll/the-long-arc (noindex - see /broll/layout.tsx)
 */

const PROGRAMME_CYCLE = [
  { name: 'Programme 1', duration: '6 weeks', result: 'Results came. Faded by month 4.' },
  { name: 'Programme 2', duration: '12 weeks', result: 'Strong start. Lost it in month 5.' },
  { name: 'Programme 3', duration: '3 months', result: 'Window closed. Back where you started.' },
  { name: 'Programme 4', duration: '8 weeks', result: 'Same pattern. Same fade.' },
]

const ARC_STAGES = [
  { state: 'Depleted', months: 'Month 0', desc: 'Body in protection mode. Pattern identified. Compensation pulled by Blueprint Week 6.', colour: '#ef4444' },
  { state: 'Transitioning', months: 'Months 2-4', desc: 'Pattern corrected. Body has capacity but is not yet converting consistently. The Membership Blocks calibrate the work as the system comes online.', colour: '#f59e0b' },
  { state: 'Ready', months: 'Months 5-8+', desc: 'Biology in flow. Block C runs at peak intensity. Pattern reassessment. The work compounds.', colour: '#1B6DFC' },
]

const BLOCKS = [
  { label: 'Blueprint', weeks: 'Weeks 1-6', desc: 'Pattern corrected. Body comes out of acute compensation.', status: 'foundation' as const },
  { label: 'Block A · Consolidate', weeks: 'Weeks 7-12', desc: 'Foundation holds under more demanding work. Carb timing, cycle-aware strategies, recovery protocols.', status: 'active' as const },
  { label: 'Block B · Advance', weeks: 'Weeks 13-18', desc: 'Training intensity steps up. Complex movement. Calorie periodisation across training and rest days.', status: 'upcoming' as const },
  { label: 'Block C · Refine', weeks: 'Weeks 19-24', desc: 'Peak intensity. Pattern reassessment at the end. Continue or shift pattern routing.', status: 'upcoming' as const },
]

export default function TheLongArcPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · THE CYCLE - PROGRAMMES END, RESULTS FADE
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
            The cycle
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Programme ends. Result fades.<br />Repeat.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Every programme has a window. The window closes, the structure disappears, and the body slowly returns to where it was. Each cycle resets the work.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {PROGRAMME_CYCLE.map((p, i) => (
              <div key={i} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderLeft: '4px solid #6B6B6B',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: '20px',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'rgba(107, 107, 107, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <TrendingDown size={18} strokeWidth={2.5} color="#6B6B6B" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#3A3A3A', margin: 0, lineHeight: 1.5 }}>
                    {p.result}
                  </p>
                </div>
                <div style={{
                  padding: '6px 14px', borderRadius: '99px',
                  background: '#F5F5F5',
                  fontSize: '11px', fontWeight: 700, color: '#6B6B6B',
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  flexShrink: 0,
                }}>
                  {p.duration}
                </div>
              </div>
            ))}
          </div>

          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '32px 0 0', lineHeight: 1.5 }}>
            Every cycle, the body slowly returns to where it was.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · THE ARC - DEPLETED -> TRANSITIONING -> READY
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
            The arc
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            State shift takes months.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Six weeks corrects the pattern. Months of work shifts the state. Depleted to Transitioning to Ready is a long arc, not a single event.
          </p>

          {/* The arc visual */}
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              {ARC_STAGES.map((stage, i) => (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderTop: `5px solid ${stage.colour}`,
                  borderRadius: '14px',
                  padding: '24px 22px',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Activity size={18} strokeWidth={2.5} color={stage.colour} />
                    <p style={{ fontSize: '11px', fontWeight: 800, color: stage.colour, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                      {stage.months}
                    </p>
                  </div>
                  <p style={{ fontSize: '24px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.1 }}>
                    {stage.state} State
                  </p>
                  <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.6, margin: 0 }}>
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p style={{ fontSize: '18px', fontWeight: 700, color: '#1A1A1A', margin: '32px 0 0', lineHeight: 1.5 }}>
            The Membership is the infrastructure for the arc.
          </p>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · THE 24-WEEK BLOCK STRUCTURE
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
            The 24-week structure
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Block by block.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            Twenty-four weeks. Four blocks. Pattern continuity carries every block. Pattern reassessment at the end of each 24-week cycle.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {BLOCKS.map((b, i) => {
              const isFoundation = b.status === 'foundation'
              const isActive = b.status === 'active'
              return (
                <div key={i} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderLeft: `4px solid ${isFoundation ? '#999999' : isActive ? '#1B6DFC' : '#E5E5E5'}`,
                  borderRadius: '12px',
                  padding: '20px 24px',
                  display: 'flex', alignItems: 'center', gap: '20px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: isFoundation ? '#999999' : isActive ? '#1B6DFC' : 'rgba(27, 109, 252, 0.08)',
                    color: isFoundation || isActive ? '#FFFFFF' : '#1B6DFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <Layers size={20} strokeWidth={2.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                        {b.label}
                      </p>
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                        background: '#F5F5F5',
                        padding: '3px 8px', borderRadius: '4px',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {b.weeks}
                      </span>
                      {isFoundation && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                          background: '#F5F5F5',
                          padding: '3px 8px', borderRadius: '4px',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          Pre-Membership
                        </span>
                      )}
                      {isActive && (
                        <span style={{
                          fontSize: '10px', fontWeight: 700, color: '#FFFFFF',
                          background: '#1B6DFC',
                          padding: '3px 8px', borderRadius: '4px',
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                        }}>
                          Membership starts
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.55 }}>
                      {b.desc}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}
