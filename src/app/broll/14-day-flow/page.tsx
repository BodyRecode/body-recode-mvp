'use client'

import { Video, Activity, LineChart, CheckCircle2, Circle } from 'lucide-react'

/**
 * B-roll canvas: The 14-Day Flow
 *
 * Designed to be screen-recorded as B-roll for the /challenge explainer
 * video. Covers the section of the script:
 *
 *   "Fourteen days of structure to lower the load, settle your system,
 *    and bring it to the point where it can be read properly. On Day 7
 *    a Check-In runs across eight biological markers. On Day 14 you
 *    have your result. Which of four patterns is holding your body.
 *    Why fat loss has stalled. And the three specific things to do next."
 *
 * Three stacked zones, each sized for clean 16:9 capture. Amanda can
 * either scroll the whole page in one take or frame each zone separately.
 *
 * URL: /broll/14-day-flow (noindex - see layout.tsx)
 */

const DAYS = [
  { day: 1,  focus: 'Orientation',           special: null },
  { day: 2,  focus: 'First training',        special: null },
  { day: 3,  focus: 'Digestion settles',     special: null },
  { day: 4,  focus: 'Energy patterns',       special: null },
  { day: 5,  focus: 'Week One Session',      special: 'video' as const },
  { day: 6,  focus: 'Recovery deepens',      special: null },
  { day: 7,  focus: 'Body Decode Check-In',  special: 'checkin' as const },
  { day: 8,  focus: 'Week two begins',       special: null },
  { day: 9,  focus: 'Patterns emerging',     special: null },
  { day: 10, focus: 'Adaptation',            special: null },
  { day: 11, focus: 'Holding the line',      special: null },
  { day: 12, focus: 'Deep recovery',         special: null },
  { day: 13, focus: 'Reflection',            special: null },
  { day: 14, focus: 'Your Body Decode Result', special: 'result' as const },
]

const MARKERS = [
  { name: 'Morning energy',           sub: 'How you feel when you wake up',  status: 'better' as const },
  { name: 'Afternoon energy',         sub: 'The 2-4pm window',                status: 'better' as const },
  { name: 'Puffiness and bloating',   sub: 'Through the day',                 status: 'better' as const },
  { name: 'Sleep quality',            sub: 'How rested you feel',             status: 'same' as const },
  { name: 'Food cravings and hunger', sub: 'Predictability and intensity',    status: 'better' as const },
  { name: 'Mental clarity and focus', sub: 'Sharpness across the day',        status: 'better' as const },
  { name: 'Mood stability',           sub: 'Consistency and evenness',        status: 'same' as const },
  { name: 'Digestion',                sub: 'Comfort and regularity',          status: 'better' as const },
]

const ACTIONS = [
  'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
  'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
  'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
]

const OTHER_PATTERNS = [
  { name: 'Insulin-Drift',    desc: 'Insulin driver. Back and sides, carb cravings, post-meal fatigue.' },
  { name: 'Estrogen-Shift',   desc: 'Oestrogen driver. Hip and thigh storage, water retention, cycle irregularity.' },
  { name: 'Androgen-Decline', desc: 'Testosterone driver. Reduced muscle tone, reduced drive, capacity slipping.' },
]

export default function FourteenDayFlowPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · THE 14-DAY ARC
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
        {/* Signal Blue radial accent */}
        <div style={{
          position: 'absolute', top: '-200px', right: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Fourteen days of structure
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            The shape of the work.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '64px', maxWidth: '900px' }}>
            Daily training, nutrition, and coaching. The system settles. By Day 7 your body is stable enough to be read properly. By Day 14 you have your result.
          </p>

          {/* 14-day grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '12px',
          }}>
            {DAYS.map((d) => {
              const isHighlight = d.special !== null
              const Icon = d.special === 'video' ? Video
                         : d.special === 'checkin' ? Activity
                         : d.special === 'result' ? LineChart
                         : null
              return (
                <div key={d.day} style={{
                  background: isHighlight ? '#1B6DFC' : '#FFFFFF',
                  border: isHighlight ? '1px solid #1B6DFC' : '1px solid #E5E5E5',
                  borderRadius: '14px',
                  padding: '20px 16px',
                  minHeight: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isHighlight ? '0 8px 24px rgba(27, 109, 252, 0.25)' : 'none',
                }}>
                  <div>
                    <p style={{
                      fontSize: '10px', fontWeight: 800,
                      color: isHighlight ? 'rgba(255,255,255,0.7)' : '#999999',
                      letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 8px',
                    }}>
                      Day
                    </p>
                    <p style={{
                      fontSize: '40px', fontWeight: 900,
                      color: isHighlight ? '#FFFFFF' : '#1A1A1A',
                      letterSpacing: '-0.03em', lineHeight: 1, margin: 0,
                    }}>
                      {d.day}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
                    {Icon && (
                      <div style={{
                        width: '24px', height: '24px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '6px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Icon size={14} strokeWidth={2.5} color="#FFFFFF" />
                      </div>
                    )}
                    <p style={{
                      fontSize: '12px', fontWeight: 600,
                      color: isHighlight ? '#FFFFFF' : '#6B6B6B',
                      lineHeight: 1.3, margin: 0,
                    }}>
                      {d.focus}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · THE DAY 7 CHECK-IN
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
            Day 7 · Body Decode Check-In
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Eight markers. Scored.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '800px' }}>
            Rate each marker honestly against where you were on Day 1. The pattern emerges from the shape of your answers.
          </p>

          {/* Marker rows */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '16px',
            overflow: 'hidden',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          }}>
            {MARKERS.map((m, i) => (
              <div key={m.name} style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                padding: '20px 28px',
                borderBottom: i < MARKERS.length - 1 ? '1px solid #E5E5E5' : 'none',
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 4px', lineHeight: 1.2 }}>
                    {m.name}
                  </p>
                  <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.3 }}>
                    {m.sub}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {(['better', 'same', 'challenge'] as const).map((option) => {
                    const isSelected = m.status === option
                    const label = option === 'better' ? 'Improving' : option === 'same' ? 'About the same' : 'Still a challenge'
                    return (
                      <div key={option} style={{
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: isSelected
                          ? (option === 'better' ? '#1B6DFC' : option === 'same' ? '#6B6B6B' : '#FFFFFF')
                          : '#FFFFFF',
                        color: isSelected ? '#FFFFFF' : '#999999',
                        border: isSelected
                          ? `1px solid ${option === 'better' ? '#1B6DFC' : option === 'same' ? '#6B6B6B' : '#E5E5E5'}`
                          : '1px solid #E5E5E5',
                        letterSpacing: '0.02em',
                      }}>
                        {label}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Progress score */}
          <div style={{
            marginTop: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#1A1A1A',
            borderRadius: '14px',
            padding: '20px 28px',
          }}>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#999999', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                Your 7-day progress
              </p>
              <p style={{ fontSize: '24px', fontWeight: 900, color: '#FFFFFF', margin: 0, letterSpacing: '-0.02em' }}>
                6 of 8 markers improving
              </p>
            </div>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: '#1B6DFC',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <CheckCircle2 size={28} strokeWidth={2.5} color="#FFFFFF" />
            </div>
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · THE DAY 14 RESULT
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
        {/* Signal Blue radial accent */}
        <div style={{
          position: 'absolute', bottom: '-200px', left: '-200px',
          width: '600px', height: '600px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Day 14 · Your result
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Your pattern. Why fat loss stalled.<br />
            Three actions.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '900px' }}>
            One of four patterns. Delivered automatically the moment you finish the Check-In.
          </p>

          {/* The result card */}
          <div style={{
            background: '#FFFFFF',
            border: '1px solid #E5E5E5',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
          }}>
            {/* Header bar */}
            <div style={{
              background: '#1A1A1A',
              padding: '20px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
                Your Body Decode Result
              </p>
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                Sample
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '40px 32px' }}>
              {/* Pattern */}
              <div style={{ marginBottom: '28px' }}>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '10px' }}>
                  Your biological pattern
                </p>
                <p style={{ fontSize: '44px', fontWeight: 900, color: '#1A1A1A', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                  Stress-Stored Pattern
                </p>
                <p style={{ fontSize: '15px', color: '#6B6B6B', margin: '8px 0 0', fontStyle: 'italic' }}>
                  Cortisol driver. Fat stored at waist and stomach. Wired but tired at night.
                </p>
              </div>

              {/* Why */}
              <div style={{ marginBottom: '28px', paddingTop: '28px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '12px' }}>
                  Why fat loss has stalled
                </p>
                <p style={{ fontSize: '17px', color: '#3A3A3A', lineHeight: 1.7, margin: 0 }}>
                  Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve. The full picture requires understanding exactly how your stress hormones are behaving across the day.
                </p>
              </div>

              {/* Actions */}
              <div style={{ paddingTop: '28px', borderTop: '1px solid #E5E5E5' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '20px' }}>
                  Your three actions for week two
                </p>
                {ACTIONS.map((action, i) => (
                  <div key={i} style={{ display: 'flex', gap: '20px', marginBottom: i < ACTIONS.length - 1 ? '18px' : 0 }}>
                    <span style={{
                      fontSize: '14px', fontWeight: 800, color: '#1B6DFC',
                      minWidth: '28px', fontFamily: 'monospace', paddingTop: '2px',
                    }}>
                      0{i + 1}
                    </span>
                    <p style={{ fontSize: '16px', color: '#3A3A3A', margin: 0, lineHeight: 1.65, flex: 1 }}>{action}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Other 3 patterns - small thumbnails for visual variety in B-roll */}
          <div style={{ marginTop: '40px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '16px' }}>
              The other three patterns
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
              {OTHER_PATTERNS.map((p) => (
                <div key={p.name} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  padding: '18px 20px',
                }}>
                  <p style={{ fontSize: '15px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 6px' }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#6B6B6B', margin: 0, lineHeight: 1.5 }}>
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
