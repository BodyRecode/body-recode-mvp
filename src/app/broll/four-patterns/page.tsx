'use client'

import { Dumbbell, Salad, FileText, BookOpen } from 'lucide-react'

/**
 * B-roll canvas: Four Patterns - Different Prescriptions
 *
 * Designed to be screen-recorded as B-roll for the /blueprint explainer
 * video. Covers the script section:
 *
 *   "Training calibrated. Nutrition timed. Weekly coaching written for
 *    your pattern. Five biology lessons explaining the hormone driving
 *    your pattern."
 *
 * Three stacked zones, each visualising one dimension of pattern-specific
 * delivery across all four patterns:
 *
 *   Zone 1: Training calibrated (RIR + finisher + rest rules per pattern)
 *   Zone 2: Nutrition timed (per-pattern nutrition focus)
 *   Zone 3: Coaching + Lessons (24 unique notes preview + 5 lesson titles)
 *
 * URL: /broll/four-patterns (noindex - see /broll/layout.tsx)
 */

const PATTERN_COLOURS = {
  'Stress-Stored':    '#DC2626',
  'Insulin-Drift':    '#B7791F',
  'Estrogen-Shift':   '#8b5cf6',
  'Androgen-Decline': '#1B6DFC',
} as const

const TRAINING_RULES = [
  {
    name: 'Stress-Stored',
    rir: '3 RIR throughout',
    rules: ['Skip Session B finisher', 'Zone 2 walks only · no HIIT', 'Sleep outranks training', 'Rest 90s minimum'],
  },
  {
    name: 'Insulin-Drift',
    rir: 'Progress to 1-2 RIR',
    rules: ['Session B finisher mandatory', 'Walk 15-20 min post-session', 'Train fasted where possible', 'Carbs to 90-min post-session window'],
  },
  {
    name: 'Estrogen-Shift',
    rir: '2-3 RIR ceiling',
    rules: ['Finisher optional · 6/10 effort', 'Never miss a session', 'Never add extra sessions', 'Hold intensity if cycle disrupts recovery'],
  },
  {
    name: 'Androgen-Decline',
    rir: '3 RIR · gradual progress',
    rules: ['Skip finisher · no extra cardio', 'Rest 2-3 minutes between sets', 'Drop to 2 sets if energy depleted', 'Quality over volume'],
  },
]

const NUTRITION_RULES = [
  {
    name: 'Stress-Stored',
    focus: 'Cortisol regulation',
    rules: ['3 meals per day · no skipping', 'Eat within 60min of waking', 'Caffeine cutoff 10am', 'Evening anchor meal'],
  },
  {
    name: 'Insulin-Drift',
    focus: 'Insulin sensitivity',
    rules: ['2-3 meals · no snacking', 'Fasting gaps protected', 'Post-training carb window only', 'Post-meal walk non-negotiable'],
  },
  {
    name: 'Estrogen-Shift',
    focus: 'Hormonal balance',
    rules: ['3 full meals · no restriction', 'Cycle-aware eating', 'Higher fat for hormone production', 'Consistent meal timing'],
  },
  {
    name: 'Androgen-Decline',
    focus: 'Testosterone signalling',
    rules: ['Protein 2.0-2.2 g/kg', 'Dietary fat protected', 'Magnesium + zinc inputs', '3 meals minimum'],
  },
]

const COACHING_NOTES_PREVIEW = [
  { name: 'Stress-Stored',    week1: 'This week is about removing load, not adding it. Your cortisol has been elevated for a while and the first thing your body needs is a clear signal that the pressure is coming down.' },
  { name: 'Insulin-Drift',    week1: 'This week your only job is to establish the timing. Protein first at every meal. No snacking. Post-training carbs in the window only. Insulin sensitivity is restored by the gaps between eating.' },
  { name: 'Estrogen-Shift',   week1: 'The most important thing you can do this week is eat. Full meals, generous fat, consistent timing. This pattern responds badly to restriction and it responds quickly.' },
  { name: 'Androgen-Decline', week1: 'Your nervous system is the primary target this week. Everything in the programme is designed to reduce the total demand on it. Eat before every session without exception.' },
]

const LESSONS = [
  { week: 1, title: 'Cortisol and the Stress Response' },
  { week: 2, title: 'Insulin and Blood Sugar Control' },
  { week: 3, title: 'Testosterone and Muscle Signal' },
  { week: 4, title: 'Thyroid and Metabolic Rate' },
  { week: 5, title: 'Sleep Hormones and Recovery' },
]

export default function FourPatternsPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: '#FFFFFF',
      color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 1 · TRAINING CALIBRATED
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
            Training calibrated
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Same sessions. Four prescriptions.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '56px', maxWidth: '900px' }}>
            Session A, B, C are the same exercises across all four patterns. What differs: RIR targets, finisher rules, rest intervals, and what to do when energy is low.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {TRAINING_RULES.map((p) => (
              <div key={p.name} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderTop: `4px solid ${PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS]}`,
                borderRadius: '14px',
                padding: '22px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(27, 109, 252, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Dumbbell size={16} strokeWidth={2.5} color="#1B6DFC" />
                  </div>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {p.name}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {p.rir}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS], marginTop: '7px', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 2 · NUTRITION TIMED
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
        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Nutrition timed
          </p>
          <h1 style={{ fontSize: '68px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Same foundation. Four overlays.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '56px', maxWidth: '900px' }}>
            Whole foods, protein-first, no tracking. What differs across patterns: meal count, timing, fasting windows, carb placement, and the hormonal focus.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {NUTRITION_RULES.map((p) => (
              <div key={p.name} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderTop: `4px solid ${PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS]}`,
                borderRadius: '14px',
                padding: '22px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(27, 109, 252, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Salad size={16} strokeWidth={2.5} color="#1B6DFC" />
                  </div>
                </div>
                <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
                  {p.name}
                </p>
                <p style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 14px' }}>
                  {p.focus}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {p.rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS], marginTop: '7px', flexShrink: 0 }} />
                      <p style={{ fontSize: '12px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{rule}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────────────────────────────────────────────────────
          ZONE 3 · COACHING NOTES + BIOLOGY LESSONS
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

        <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '20px' }}>
            Coaching + Lessons
          </p>
          <h1 style={{ fontSize: '64px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.035em', lineHeight: 1.05, marginBottom: '20px' }}>
            Twenty-four unique notes. Five biology lessons. Pattern-specific throughout.
          </h1>
          <p style={{ fontSize: '20px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '48px', maxWidth: '1000px' }}>
            Four patterns × six weeks of coaching notes. Each lesson has a pattern-specific callout. The text reads differently for each pattern - because the biology reads differently for each pattern.
          </p>

          {/* Week 1 coaching note preview - all four patterns */}
          <div style={{ marginBottom: '40px' }}>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Week 1 coaching note · all four patterns
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {COACHING_NOTES_PREVIEW.map((p) => (
                <div key={p.name} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderLeft: `4px solid ${PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS]}`,
                  borderRadius: '12px',
                  padding: '20px 22px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: 'rgba(27, 109, 252, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={14} strokeWidth={2.5} color="#1B6DFC" />
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                      {p.name}
                    </p>
                  </div>
                  <p style={{ fontSize: '13px', color: '#3A3A3A', lineHeight: 1.65, margin: 0 }}>
                    {p.week1}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 biology lessons */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 800, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Five biology lessons · each with pattern-specific callout
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
              {LESSONS.map((l) => (
                <div key={l.week} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  padding: '16px 14px',
                  textAlign: 'center',
                }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: '#1B6DFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 10px',
                  }}>
                    <BookOpen size={16} strokeWidth={2.5} color="#FFFFFF" />
                  </div>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>
                    Week {l.week}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.3 }}>
                    {l.title}
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
