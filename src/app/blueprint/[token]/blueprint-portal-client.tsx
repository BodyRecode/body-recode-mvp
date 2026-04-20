'use client'

import { useState } from 'react'

type Enrollment = {
  id: string
  first_name: string
  email: string
  token: string
  pattern: string
  pattern_source: string
  purchase_date: string
  current_week: number
}

const PATTERN_CONFIG: Record<string, { label: string; colour: string; description: string }> = {
  'stress-stored': {
    label: 'Stress-Stored',
    colour: '#ef4444',
    description: 'Your programme is built around lowering cortisol load, supporting your stress hormone curve, and creating the biological conditions for your body to release stored fat.',
  },
  'metabolic-drift': {
    label: 'Metabolic-Drift',
    colour: '#f59e0b',
    description: 'Your programme is built around restoring insulin sensitivity, stabilising blood sugar across the day, and timing your nutrition to work with your metabolic rhythm.',
  },
  'hormonal-shift': {
    label: 'Hormonal-Shift',
    colour: '#8b5cf6',
    description: 'Your programme is built around supporting reproductive hormone balance, avoiding the restriction patterns that make this pattern worse, and prioritising recovery as a training variable.',
  },
  'system-overload': {
    label: 'System-Overload',
    colour: '#14b8a6',
    description: 'Your programme is built around reducing total neurological demand, keeping training intensity controlled, and creating the conditions for your nervous system to become responsive again.',
  },
}

const PHASES = [
  { number: 1, name: 'Regulate', weeks: '1-2', description: 'Re-establish structure and biological rhythm.' },
  { number: 2, name: 'Adapt', weeks: '3-4', description: 'Apply progressive load. Drive adaptation.' },
  { number: 3, name: 'Embed', weeks: '5-6', description: 'Lock in the new baseline. Prepare for Stage 3.' },
]

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'training', label: 'Training' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'education', label: 'Education' },
  { id: 'checkin', label: 'Check-In' },
]

type Exercise = { name: string; sets: number; reps: string; notes: string }
type Session = { id: string; name: string; subtitle: string; gym: Exercise[]; home: Exercise[]; bodyweight: Exercise[] }

const SESSIONS: Session[] = [
  {
    id: 'A',
    name: 'Session A',
    subtitle: 'Strength Base',
    gym: [
      { name: 'Goblet Squat', sets: 4, reps: '10', notes: 'Focus on depth and control' },
      { name: 'DB Bench Press', sets: 4, reps: '10', notes: 'Stable grip, full range' },
      { name: 'Seated Row', sets: 3, reps: '12', notes: 'Squeeze shoulder blades' },
      { name: 'Reverse Lunge', sets: 3, reps: '12/leg', notes: 'Stay balanced' },
      { name: 'Plank', sets: 3, reps: '30 sec', notes: 'Brace core and breathe' },
    ],
    home: [
      { name: 'DB Goblet Squat', sets: 4, reps: '10', notes: 'Hold one DB at chest. Focus on depth and control.' },
      { name: 'Push-Up', sets: 4, reps: '10-12', notes: 'Hands shoulder-width. Full chest to floor range.' },
      { name: 'Bent Over DB Row', sets: 3, reps: '12/side', notes: 'Hinge at hips, row to hip. Squeeze shoulder blade.' },
      { name: 'Reverse Lunge', sets: 3, reps: '12/leg', notes: 'Hold DBs at sides. Stay balanced.' },
      { name: 'Plank', sets: 3, reps: '30 sec', notes: 'Brace core and breathe.' },
    ],
    bodyweight: [
      { name: 'Tempo Squat', sets: 4, reps: '12', notes: '3 seconds down, pause at the bottom, drive up. Makes bodyweight challenging.' },
      { name: 'Push-Up', sets: 4, reps: '10-12', notes: 'Hands shoulder-width. Full chest to floor range.' },
      { name: 'Table Inverted Row', sets: 3, reps: '10-12', notes: 'Lie under a sturdy table, grip the edge, pull chest up to it. Keep body straight.' },
      { name: 'Reverse Lunge', sets: 3, reps: '12/leg', notes: 'Slow and controlled. Pause at the bottom of each rep.' },
      { name: 'Plank', sets: 3, reps: '30 sec', notes: 'Brace core and breathe.' },
    ],
  },
  {
    id: 'B',
    name: 'Session B',
    subtitle: 'Conditioning and Volume',
    gym: [
      { name: 'Trap Bar Deadlift', sets: 3, reps: '8', notes: 'Neutral spine, drive through heels' },
      { name: 'Overhead Press', sets: 3, reps: '10', notes: 'Control tempo' },
      { name: 'Step-Ups', sets: 3, reps: '12/leg', notes: 'Explode through front leg' },
      { name: 'Lat Pulldown', sets: 3, reps: '12', notes: 'Smooth pull, full stretch' },
      { name: 'Finisher: Row or Bike', sets: 5, reps: '45s hard / 75s easy', notes: 'See pattern rules below' },
    ],
    home: [
      { name: 'DB Romanian Deadlift', sets: 3, reps: '10', notes: 'Hinge at hips, soft knee. Feel the hamstring load.' },
      { name: 'DB Shoulder Press', sets: 3, reps: '10', notes: 'Standing or seated. Press straight overhead, control descent.' },
      { name: 'Step-Ups', sets: 3, reps: '12/leg', notes: 'Use a sturdy chair or step. Drive through the front leg.' },
      { name: 'DB Pullover', sets: 3, reps: '12', notes: 'Lie on floor, hold one DB overhead. Pull to chest slowly.' },
      { name: 'Finisher: High Knees', sets: 5, reps: '45s hard / 75s easy', notes: 'See pattern rules below' },
    ],
    bodyweight: [
      { name: 'Single Leg Hip Hinge', sets: 3, reps: '10/leg', notes: 'Balance on one leg, hinge forward until torso is parallel to the floor. Control the return.' },
      { name: 'Pike Push-Up', sets: 3, reps: '10', notes: 'Hips high, head between arms. Lower crown toward floor, press back up.' },
      { name: 'Step-Ups', sets: 3, reps: '12/leg', notes: 'Use a sturdy chair or step. Drive through the front leg.' },
      { name: 'Superman Hold', sets: 3, reps: '12', notes: 'Lie face down. Lift chest and legs off the floor simultaneously. Hold 2 seconds at the top.' },
      { name: 'Finisher: Burpees', sets: 5, reps: '45s hard / 75s easy', notes: 'See pattern rules below' },
    ],
  },
  {
    id: 'C',
    name: 'Session C',
    subtitle: 'Balance and Stability',
    gym: [
      { name: 'Front Squat', sets: 3, reps: '8', notes: 'Keep upright posture' },
      { name: 'Incline DB Bench', sets: 3, reps: '10', notes: 'Controlled descent' },
      { name: 'DB Row', sets: 3, reps: '10/side', notes: 'Elbow drives back' },
      { name: 'Walking Lunge', sets: 3, reps: '12/leg', notes: 'Step smooth, upright torso' },
      { name: 'Hanging Knee Raise', sets: 3, reps: '10-12', notes: 'Controlled lift, no swing' },
    ],
    home: [
      { name: 'DB Goblet Squat', sets: 3, reps: '8', notes: 'Hold DB at chest. Elbows inside knees at the bottom.' },
      { name: 'Decline Push-Up', sets: 3, reps: '10', notes: 'Feet elevated on a chair. Controlled descent, full range.' },
      { name: 'DB Row', sets: 3, reps: '10/side', notes: 'Brace on a chair or knee. Elbow drives back.' },
      { name: 'Walking Lunge', sets: 3, reps: '12/leg', notes: 'DBs at sides. Step smooth, upright torso.' },
      { name: 'Lying Knee Raise', sets: 3, reps: '10-12', notes: 'Flat on floor. Pull knees to chest with control, lower slow.' },
    ],
    bodyweight: [
      { name: 'Bulgarian Split Squat', sets: 3, reps: '8/leg', notes: 'Rear foot elevated on a chair. Lower slowly, drive up through the front leg.' },
      { name: 'Decline Push-Up', sets: 3, reps: '10', notes: 'Feet elevated on a chair. Controlled descent, full range.' },
      { name: 'Table Inverted Row', sets: 3, reps: '10/side', notes: 'Lie under a sturdy table, grip the edge, pull chest up to it. Keep body straight.' },
      { name: 'Walking Lunge', sets: 3, reps: '12/leg', notes: 'Slow and controlled. Pause at the bottom. Upright torso.' },
      { name: 'Lying Knee Raise', sets: 3, reps: '10-12', notes: 'Flat on floor. Pull knees to chest with control, lower slow.' },
    ],
  },
]

const PATTERN_TRAINING: Record<string, {
  progression: { phase: string; weeks: string; rir: string; notes: string }[]
  rules: string[]
}> = {
  'stress-stored': {
    progression: [
      { phase: 'Regulate', weeks: '1-2', rir: '3 RIR', notes: 'Technique only. Never push through fatigue.' },
      { phase: 'Adapt', weeks: '3-4', rir: '3 RIR', notes: 'Load increases are slow and deliberate. No chasing.' },
      { phase: 'Embed', weeks: '5', rir: '2-3 RIR', notes: 'No peak effort week. Keep controlled throughout.' },
      { phase: 'Embed (Deload)', weeks: '6', rir: '4 RIR', notes: 'Extended deload. Reduce sets by 30%.' },
    ],
    rules: [
      'Skip the Session B finisher - no conditioning work',
      'Optional Zone 2 only (walk 20-30 min) - never high intensity cardio',
      'Sleep outranks training. If sleep was poor, reduce session intensity further.',
      'Rest between sets: minimum 90 seconds',
    ],
  },
  'metabolic-drift': {
    progression: [
      { phase: 'Regulate', weeks: '1-2', rir: '3 RIR', notes: 'Technique and consistency.' },
      { phase: 'Adapt', weeks: '3-4', rir: '2 RIR', notes: 'Progressive load. Add weight when RIR feels comfortable.' },
      { phase: 'Embed', weeks: '5', rir: '1-2 RIR', notes: 'Push intensity. Record best sets.' },
      { phase: 'Embed (Deload)', weeks: '6', rir: '3-4 RIR', notes: 'Deload. Reduce sets by 30%.' },
    ],
    rules: [
      'Include the Session B finisher every session - it is not optional for this pattern',
      'Walk 15-20 minutes after every session - lowers post-session blood sugar significantly',
      'Train before eating where possible - fasted or semi-fasted training improves insulin response',
      'Carbohydrate intake timed to within 90 minutes post-session only',
    ],
  },
  'hormonal-shift': {
    progression: [
      { phase: 'Regulate', weeks: '1-2', rir: '3 RIR', notes: 'Establish consistent attendance. Never miss a session.' },
      { phase: 'Adapt', weeks: '3-4', rir: '2-3 RIR', notes: 'Add load slowly. Do not push to 2 RIR if recovery is compromised.' },
      { phase: 'Embed', weeks: '5', rir: '2 RIR', notes: 'No 1 RIR sets. Intensity is secondary to showing up.' },
      { phase: 'Embed (Deload)', weeks: '6', rir: '3-4 RIR', notes: 'Deload. Reduce sets by 30%.' },
    ],
    rules: [
      'Session B finisher: optional, effort level 6/10 only - never hard conditioning',
      'Never miss a session because motivation is low - consistency is the adaptation signal',
      'Never add extra sessions - three days is the prescription, not a minimum',
      'If cycle timing is disrupting recovery in Weeks 3-4, hold intensity rather than pushing through',
    ],
  },
  'system-overload': {
    progression: [
      { phase: 'Regulate', weeks: '1-2', rir: '3 RIR', notes: 'Drop set count to 2 sets per exercise if fatigue is present.' },
      { phase: 'Adapt', weeks: '3-4', rir: '3 RIR', notes: 'Very gradual load increase only. Never chase numbers.' },
      { phase: 'Embed', weeks: '5', rir: '2-3 RIR', notes: 'No peak effort week. Controlled throughout.' },
      { phase: 'Embed (Deload)', weeks: '6', rir: '4 RIR', notes: 'Extended deload. Reduce sets by 40%.' },
    ],
    rules: [
      'Skip the Session B finisher - no conditioning work',
      'No additional cardio - walking only, and only if it feels genuinely restorative',
      'Rest between sets: 2-3 minutes minimum',
      'If energy is significantly depleted on any day, reduce to 2 working sets per exercise',
      'This pattern does not respond to volume - it responds to quality and recovery',
    ],
  },
}

type PatternAssessmentProps = {
  onComplete: (pattern: string) => void
  token: string
}

function PatternAssessment({ onComplete, token }: PatternAssessmentProps) {
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const q1Options = [
    { value: 'stress-stored', label: 'Stomach and waist - above and below the navel' },
    { value: 'metabolic-drift', label: 'Lower gut and abdomen - even when you have not eaten much' },
    { value: 'hormonal-shift', label: 'Hips, thighs, and lower body' },
    { value: 'system-overload', label: 'Upper back, chest, or arms' },
  ]

  const q2Options = [
    { value: 'stress-stored', label: 'Exhausted but wired - tired but cannot switch off at night' },
    { value: 'metabolic-drift', label: 'Heavy and sluggish - especially after meals or in the afternoon' },
    { value: 'hormonal-shift', label: 'Hormonally inconsistent - mood shifts, water retention, or cycle disruption' },
    { value: 'system-overload', label: 'Flat and stalled - not depleted, just not changing or responding' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q1 || !q2) return
    setSubmitting(true)
    const pattern = q2
    await fetch('/api/blueprint/set-pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, pattern }),
    })
    onComplete(pattern)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={110} alt="Body Recode" style={{ display: 'block', marginBottom: 40 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: '0 0 12px', fontFamily: 'system-ui, sans-serif' }}>
          One last step before your portal opens
        </h1>
        <p style={{ fontSize: 15, color: '#78716c', lineHeight: 1.75, margin: '0 0 36px', fontFamily: 'system-ui, sans-serif' }}>
          Two questions to identify your biological pattern. This determines how your programme is built.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#a8a29e', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Where do you most notice excess puffiness or softness in your body?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q1Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q1 === opt.value ? '#1c1917' : '#111110', border: `1px solid ${q1 === opt.value ? '#14b8a6' : '#292524'}`, borderRadius: 8 }}>
                  <input type="radio" name="q1" value={opt.value} checked={q1 === opt.value} onChange={() => setQ1(opt.value)} style={{ marginTop: 2, accentColor: '#14b8a6' }} />
                  <span style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#a8a29e', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Which of these fits most closely right now?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q2Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q2 === opt.value ? '#1c1917' : '#111110', border: `1px solid ${q2 === opt.value ? '#14b8a6' : '#292524'}`, borderRadius: 8 }}>
                  <input type="radio" name="q2" value={opt.value} checked={q2 === opt.value} onChange={() => setQ2(opt.value)} style={{ marginTop: 2, accentColor: '#14b8a6' }} />
                  <span style={{ fontSize: 14, color: '#d4d0cc', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!q1 || !q2 || submitting}
            style={{ padding: '15px', background: '#14b8a6', color: '#0c0a09', fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none', cursor: (!q1 || !q2 || submitting) ? 'not-allowed' : 'pointer', opacity: (!q1 || !q2 || submitting) ? 0.5 : 1, fontFamily: 'system-ui, sans-serif' }}
          >
            {submitting ? 'Opening your portal...' : 'Open my Blueprint'}
          </button>
        </form>
      </div>
    </div>
  )
}

function TrainingTab({ pattern, currentWeek }: { pattern: string; currentWeek: number }) {
  const [activeSession, setActiveSession] = useState('A')
  const [mode, setMode] = useState<'gym' | 'home' | 'bodyweight'>('gym')
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const trainingData = PATTERN_TRAINING[pattern] ?? PATTERN_TRAINING['stress-stored']
  const currentPhaseRow = currentWeek <= 2 ? trainingData.progression[0] : currentWeek <= 4 ? trainingData.progression[1] : currentWeek === 5 ? trainingData.progression[2] : trainingData.progression[3]
  const activeSessionData = SESSIONS.find(s => s.id === activeSession)!
  const exercises = activeSessionData[mode]

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '0 0 6px' }}>Training Programme</h2>
        <p style={{ fontSize: 14, color: '#78716c', margin: 0, lineHeight: 1.7 }}>
          3 days per week. Full body hybrid split. Sessions A, B, and C rotate each week.
        </p>
      </div>

      {/* Suggested training days */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Suggested Schedule
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { day: 'Monday', session: 'A', subtitle: 'Strength Base' },
            { day: 'Wednesday', session: 'B', subtitle: 'Conditioning' },
            { day: 'Friday', session: 'C', subtitle: 'Balance' },
          ].map(item => (
            <div key={item.day} style={{ background: '#1c1917', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#57534e', marginBottom: 6 }}>{item.day}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#14b8a6', marginBottom: 4 }}>Session {item.session}</div>
              <div style={{ fontSize: 11, color: '#3d3935' }}>{item.subtitle}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#3d3935', margin: 0, lineHeight: 1.6 }}>
          Any 3 non-consecutive days works. The gap between sessions is more important than the specific days. Avoid training back to back.
        </p>
      </div>

      {/* Current week target */}
      <div style={{ background: '#111110', border: `1px solid #1c1917`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Week {currentWeek} Target - {currentPhaseRow.phase}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>{currentPhaseRow.rir}</span>
        </div>
        <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.6 }}>{currentPhaseRow.notes}</p>
      </div>

      {/* Pattern rules */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          {config.label} - Training Rules
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trainingData.rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#a8a29e', lineHeight: 1.65 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full progression table */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Phase Progression
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 12, padding: '8px 0', borderBottom: '1px solid #1c1917', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phase</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Weeks</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RIR</span>
          </div>
          {trainingData.progression.map((row, i) => {
            const isActive = row === currentPhaseRow
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid #1c1917' : 'none', background: isActive ? 'rgba(20,184,166,0.04)' : 'transparent', borderRadius: isActive ? 6 : 0 }}>
                <span style={{ fontSize: 13, color: isActive ? '#fff' : '#78716c', fontWeight: isActive ? 600 : 400 }}>{row.phase}</span>
                <span style={{ fontSize: 13, color: isActive ? '#a8a29e' : '#57534e' }}>{row.weeks}</span>
                <span style={{ fontSize: 13, color: isActive ? config.colour : '#57534e', fontWeight: isActive ? 600 : 400 }}>{row.rir}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session tabs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Session Templates
          </div>
          {/* Gym / Home / Bodyweight toggle */}
          <div style={{ display: 'flex', background: '#1c1917', borderRadius: 8, padding: 3, gap: 2 }}>
            {([
              { id: 'gym', label: 'Gym' },
              { id: 'home', label: 'Home (DBs)' },
              { id: 'bodyweight', label: 'No Equipment' },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: mode === m.id ? '#0c0a09' : '#57534e', background: mode === m.id ? '#14b8a6' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {SESSIONS.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSession(s.id)}
              style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, color: activeSession === s.id ? '#0c0a09' : '#57534e', background: activeSession === s.id ? '#14b8a6' : '#111110', border: `1px solid ${activeSession === s.id ? '#14b8a6' : '#292524'}`, borderRadius: 8, cursor: 'pointer' }}
            >
              Session {s.id}
            </button>
          ))}
        </div>

        <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #1c1917', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>{activeSessionData.name}</div>
              <div style={{ fontSize: 12, color: '#57534e', marginTop: 2 }}>{activeSessionData.subtitle}</div>
            </div>
            {mode !== 'gym' && (
              <div style={{ fontSize: 11, color: '#57534e', background: '#1c1917', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                {mode === 'home' ? 'DBs + bodyweight' : 'No equipment needed'}
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1c1917' }}>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Exercise</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Sets</th>
                  <th style={{ padding: '10px 12px', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Reps</th>
                  <th style={{ padding: '10px 20px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Notes</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => {
                  const isFinisher = ex.name.startsWith('Finisher')
                  const finisherSkipped = isFinisher && (pattern === 'stress-stored' || pattern === 'system-overload')
                  return (
                    <tr key={i} style={{ borderBottom: i < exercises.length - 1 ? '1px solid #1c1917' : 'none', opacity: finisherSkipped ? 0.4 : 1 }}>
                      <td style={{ padding: '14px 20px', fontSize: 14, color: finisherSkipped ? '#57534e' : '#d4d0cc', fontWeight: isFinisher ? 600 : 400 }}>
                        {ex.name}
                        {finisherSkipped && <span style={{ fontSize: 11, color: '#57534e', marginLeft: 8 }}>(skipped)</span>}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 14, color: '#78716c', textAlign: 'center' }}>{ex.sets}</td>
                      <td style={{ padding: '14px 12px', fontSize: 13, color: '#78716c', textAlign: 'center', whiteSpace: 'nowrap' }}>{ex.reps}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#57534e', lineHeight: 1.5 }}>{ex.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIR explainer */}
      <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '18px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#57534e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          What is RIR?
        </div>
        <p style={{ fontSize: 13, color: '#78716c', margin: 0, lineHeight: 1.7 }}>
          RIR stands for Reps in Reserve. It is how many more reps you could have done before reaching failure.
          3 RIR means you stop when you have 3 reps left. 1 RIR means you stop when you have 1 rep left.
          This is how the programme manages intensity across each phase without requiring a 1-rep max test.
        </p>
      </div>
    </div>
  )
}

export default function BlueprintPortalClient({ enrollment }: { enrollment: Enrollment }) {
  const [pattern, setPattern] = useState(enrollment.pattern)
  const [activeTab, setActiveTab] = useState('home')

  if (pattern === 'pending') {
    return (
      <PatternAssessment
        token={enrollment.token}
        onComplete={(p) => setPattern(p)}
      />
    )
  }

  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const currentWeek = enrollment.current_week ?? 1
  const currentPhase = currentWeek <= 2 ? PHASES[0] : currentWeek <= 4 ? PHASES[1] : PHASES[2]

  return (
    <div style={{ minHeight: '100vh', background: '#0c0a09', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src="https://bodyrecode.au/logo-teal.png" width={140} alt="Body Recode" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.colour }} />
          <span style={{ fontSize: 13, color: '#78716c', fontWeight: 600 }}>{config.label}</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ padding: '14px 16px', fontSize: 13, fontWeight: 600, color: activeTab === item.id ? '#14b8a6' : '#57534e', background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === item.id ? '#14b8a6' : 'transparent'}`, cursor: 'pointer', whiteSpace: 'nowrap' }}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px' }}>

        {activeTab === 'home' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px' }}>
                Welcome, {enrollment.first_name}
              </h1>
              <p style={{ fontSize: 15, color: '#78716c', margin: 0, lineHeight: 1.75 }}>
                6-Week Body Rewire Blueprint
              </p>
            </div>

            <div style={{ background: '#111110', border: `1px solid #1c1917`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '24px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Your Pattern
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>{config.label}</div>
              <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: 0 }}>{config.description}</p>
            </div>

            <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '24px', marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                Current Phase
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#fff' }}>Phase {currentPhase.number} - {currentPhase.name}</span>
                <span style={{ fontSize: 13, color: '#57534e' }}>Weeks {currentPhase.weeks}</span>
              </div>
              <p style={{ fontSize: 14, color: '#78716c', margin: '0 0 16px', lineHeight: 1.7 }}>{currentPhase.description}</p>
              <div style={{ fontSize: 13, color: '#57534e' }}>Week {currentWeek} of 6</div>
            </div>

            <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '24px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#57534e', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                Programme Phases
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {PHASES.map((phase, i) => {
                  const isActive = phase.number === currentPhase.number
                  const isPast = phase.number < currentPhase.number
                  return (
                    <div key={phase.number} style={{ display: 'flex', gap: 16, paddingBottom: i < 2 ? 20 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive ? '#14b8a6' : isPast ? '#292524' : '#1c1917', border: `2px solid ${isActive ? '#14b8a6' : '#292524'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#0c0a09' : '#57534e' }}>{phase.number}</span>
                        </div>
                        {i < 2 && <div style={{ width: 2, flex: 1, background: '#1c1917', marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingTop: 4, paddingBottom: i < 2 ? 8 : 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: isActive ? '#fff' : '#57534e', marginBottom: 2 }}>
                          {phase.name} <span style={{ fontWeight: 400, color: '#3d3935' }}>- Weeks {phase.weeks}</span>
                        </div>
                        <div style={{ fontSize: 13, color: isActive ? '#78716c' : '#3d3935', lineHeight: 1.6 }}>{phase.description}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'training' && (
          <TrainingTab pattern={pattern} currentWeek={currentWeek} />
        )}

        {activeTab === 'nutrition' && (
          <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Nutrition Framework</h2>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: '0 0 8px' }}>
              Nutrition guide with {config.label} pattern emphasis.
            </p>
            <p style={{ fontSize: 13, color: '#57534e' }}>Content coming soon.</p>
          </div>
        )}

        {activeTab === 'education' && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 24px' }}>Education Hub</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { title: 'Cortisol and the Stress Response', week: 'Week 1' },
                { title: 'Insulin and Blood Sugar Control', week: 'Week 2' },
                { title: 'Testosterone and Muscle Signal', week: 'Week 3' },
                { title: 'Thyroid and Metabolic Rate', week: 'Week 4' },
                { title: 'Sleep Hormones and Recovery', week: 'Week 5' },
              ].map((lesson, i) => (
                <div key={i} style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 10, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: '#57534e' }}>Unlocks {lesson.week}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#3d3935', background: '#1c1917', padding: '4px 10px', borderRadius: 6 }}>
                    Coming soon
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'checkin' && (
          <div style={{ background: '#111110', border: '1px solid #1c1917', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 12px' }}>Weekly Check-In</h2>
            <p style={{ fontSize: 14, color: '#78716c', lineHeight: 1.75, margin: '0 0 8px' }}>
              Weekly progress tracking across 8 biological markers.
            </p>
            <p style={{ fontSize: 13, color: '#57534e' }}>Content coming soon.</p>
          </div>
        )}

      </div>
    </div>
  )
}
