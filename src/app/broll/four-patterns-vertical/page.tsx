'use client'

import { Dumbbell, Salad, FileText, BookOpen } from 'lucide-react'

/**
 * B-roll canvas: Four Patterns - Different Prescriptions (9:16 VERTICAL)
 *
 * Vertical (1080×1920) sibling of /broll/four-patterns. Same content and
 * copy, re-laid-out for portrait screen recording so it can be used as
 * B-roll cutaway footage in the 9:16 vertical videos - specifically the
 * Day 14 Ascension reel (Day 14 email), which is vertical-only.
 *
 * The horizontal /broll/four-patterns page is unchanged and still serves
 * the 16:9 master of the Blueprint explainer.
 *
 * Three stacked, viewport-sized zones (record each separately):
 *
 *   Zone 1: Training calibrated (RIR + finisher + rest rules per pattern)
 *   Zone 2: Nutrition timed (per-pattern nutrition focus)
 *   Zone 3: Coaching + Lessons (Week 1 notes preview + 5 lesson titles)
 *
 * Portrait tuning vs the horizontal version:
 *   - 2×2 pattern-card grids instead of 4-across
 *   - Week 1 notes stay 2×2; lessons become a single-column list
 *   - Headlines scaled down, side padding reduced for the narrow frame
 *
 * URL: /broll/four-patterns-vertical (noindex - see /broll/layout.tsx)
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

export default function FourPatternsVerticalPage() {
  return (
    <div style={{
      width: '100%',
      maxWidth: '1080px',
      margin: '0 auto',
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
        padding: '72px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: '-160px', right: '-160px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.1) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '18px' }}>
            Training calibrated
          </p>
          <h1 style={{ fontSize: '56px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '20px' }}>
            Same sessions.<br />Four prescriptions.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '44px' }}>
            Session A, B, C are the same exercises across all four patterns. What differs: RIR targets, finisher rules, rest intervals, and what to do when energy is low.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            {TRAINING_RULES.map((p) => (
              <div key={p.name} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderTop: `4px solid ${PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS]}`,
                borderRadius: '16px',
                padding: '26px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(27, 109, 252, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Dumbbell size={20} strokeWidth={2.5} color="#1B6DFC" />
                  </div>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 5px', letterSpacing: '-0.01em' }}>
                  {p.name}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  {p.rir}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {p.rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS], marginTop: '8px', flexShrink: 0 }} />
                      <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{rule}</p>
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
        padding: '72px 48px',
        background: '#F7F7F7',
        borderTop: '1px solid #E5E5E5',
        borderBottom: '1px solid #E5E5E5',
      }}>
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '18px' }}>
            Nutrition timed
          </p>
          <h1 style={{ fontSize: '56px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: '20px' }}>
            Same foundation.<br />Four overlays.
          </h1>
          <p style={{ fontSize: '22px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '44px' }}>
            Whole foods, protein-first, no tracking. What differs across patterns: meal count, timing, fasting windows, carb placement, and the hormonal focus.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '18px' }}>
            {NUTRITION_RULES.map((p) => (
              <div key={p.name} style={{
                background: '#FFFFFF',
                border: '1px solid #E5E5E5',
                borderTop: `4px solid ${PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS]}`,
                borderRadius: '16px',
                padding: '26px 24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: 'rgba(27, 109, 252, 0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Salad size={20} strokeWidth={2.5} color="#1B6DFC" />
                  </div>
                </div>
                <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', margin: '0 0 5px', letterSpacing: '-0.01em' }}>
                  {p.name}
                </p>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 16px' }}>
                  {p.focus}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {p.rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '9px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: PATTERN_COLOURS[p.name as keyof typeof PATTERN_COLOURS], marginTop: '8px', flexShrink: 0 }} />
                      <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.5, margin: 0 }}>{rule}</p>
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
        padding: '72px 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', bottom: '-160px', left: '-160px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%', position: 'relative' }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '18px' }}>
            Coaching + Lessons
          </p>
          <h1 style={{ fontSize: '48px', fontWeight: 900, color: '#1A1A1A', letterSpacing: '-0.03em', lineHeight: 1.06, marginBottom: '18px' }}>
            Twenty-four unique notes. Five biology lessons.
          </h1>
          <p style={{ fontSize: '20px', color: '#4A4A4A', lineHeight: 1.5, marginBottom: '36px' }}>
            Four patterns × six weeks of coaching notes. Each lesson has a pattern-specific callout. The text reads differently for each pattern - because the biology reads differently for each pattern.
          </p>

          {/* Week 1 coaching note preview - all four patterns */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Week 1 coaching note · all four patterns
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
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
                      width: '30px', height: '30px', borderRadius: '7px',
                      background: 'rgba(27, 109, 252, 0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <FileText size={15} strokeWidth={2.5} color="#1B6DFC" />
                    </div>
                    <p style={{ fontSize: '16px', fontWeight: 800, color: '#1A1A1A', margin: 0 }}>
                      {p.name}
                    </p>
                  </div>
                  <p style={{ fontSize: '14px', color: '#3A3A3A', lineHeight: 1.6, margin: 0 }}>
                    {p.week1}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5 biology lessons - single-column list for portrait */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#6B6B6B', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '14px' }}>
              Five biology lessons · each with pattern-specific callout
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {LESSONS.map((l) => (
                <div key={l.week} style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E5E5',
                  borderRadius: '12px',
                  padding: '14px 18px',
                  display: 'flex', alignItems: 'center', gap: '16px',
                }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '10px',
                    background: '#1B6DFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <BookOpen size={18} strokeWidth={2.5} color="#FFFFFF" />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 800, color: '#1056D6', letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 3px' }}>
                      Week {l.week}
                    </p>
                    <p style={{ fontSize: '17px', fontWeight: 700, color: '#1A1A1A', margin: 0, lineHeight: 1.25 }}>
                      {l.title}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}
