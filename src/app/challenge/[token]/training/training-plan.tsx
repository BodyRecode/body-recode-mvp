'use client'

// Interactive training plan with a Gym / At home toggle.
// Each exercise carries a `home` variant (name + cue) using only a loaded
// backpack, a resistance band, and furniture. Sets/RIR are shared across both
// modes. Substitutions drafted for Kade (Sports Scientist) to validate.

import { useState } from 'react'

type Variant = { name: string; cue: string }
type Exercise = { name: string; sets: string; rir: string; cue: string; home: Variant }

const SESSION_A: Exercise[] = [
  {
    name: 'Goblet Squat', sets: '3 sets x 12 reps', rir: '2-3 RIR',
    cue: 'Keep your chest tall, elbows inside your knees. Controlled descent. Drive through the whole foot.',
    home: { name: 'Backpack Goblet Squat or Tempo Bodyweight Squat', cue: 'Hug a loaded backpack to your chest, or go bodyweight with a slow 3-second descent. Same cues: chest tall, drive through the whole foot.' },
  },
  {
    name: 'Push-Ups', sets: '3 sets x AMRAP', rir: '2-3 reps shy of failure',
    cue: 'Maintain full body tension from head to heels. Full range - chest to floor. Stop before form breaks.',
    home: { name: 'Push-Ups', cue: 'No change needed. To scale easier, put your hands on a bench or counter. Full body tension, chest to the surface.' },
  },
  {
    name: 'Dumbbell Romanian Deadlift', sets: '3 sets x 12 reps', rir: '2-3 RIR',
    cue: 'Hips push back, not down. Feel the stretch through your hamstrings. Soft knee, flat back throughout.',
    home: { name: 'Backpack RDL or Single-Leg RDL', cue: 'Hold a loaded backpack, or go single-leg with bodyweight for balance and hamstring load. Hips push back, flat back throughout.' },
  },
  {
    name: 'Seated or Band Row', sets: '3 sets x 12 reps', rir: '2 RIR',
    cue: 'Sit tall. Initiate with your elbows, not your hands. Squeeze your shoulder blades at the top.',
    home: { name: 'Band Row or Backpack Bent-Over Row', cue: 'Anchor a band in a door, or row a loaded backpack bent at the hips. Lead with the elbows, squeeze the shoulder blades.' },
  },
  {
    name: 'Step-Ups', sets: '3 sets x 10 reps per leg', rir: '2 RIR',
    cue: 'Drive through the heel of the working leg. Avoid pushing off the back foot. Full hip extension at the top.',
    home: { name: 'Step-Ups on a Stair or Sturdy Chair', cue: 'Use your stairs or a solid chair. Hold a backpack to add load. Drive through the heel, full hip extension at the top.' },
  },
]

const SESSION_B: Exercise[] = [
  {
    name: 'Trap Bar Deadlift or Heavy Dumbbell Deadlift', sets: '3 sets x 8 reps', rir: '2-3 RIR',
    cue: 'Brace hard before every rep. Drive the floor away. Strong lockout - hips and shoulders rise together.',
    home: { name: 'Heavy Backpack Deadlift or Single-Leg RDL', cue: 'Load a backpack as heavy as you safely can, or go single-leg for higher reps. Brace hard, flat back, strong lockout.' },
  },
  {
    name: 'Dumbbell Bench Press', sets: '3 sets x 10-12 reps', rir: '2-3 RIR',
    cue: 'Lower slowly - 2 seconds down. Slight arch, feet flat. Press to full extension without locking elbows hard.',
    home: { name: 'Weighted Push-Ups or Backpack Floor Press', cue: 'Backpack on your upper back for push-ups, or press a backpack while lying on the floor. Slow, 2 seconds down.' },
  },
  {
    name: 'Dumbbell Row', sets: '3 sets x 12 reps', rir: '2-3 RIR',
    cue: 'Elbow drives up and back. Keep your torso stable. Pull to your hip, not your shoulder.',
    home: { name: 'Backpack Single-Arm Row or Band Row', cue: 'Row a loaded backpack one arm at a time with a hand on a chair for support, or use a band. Pull to the hip, torso stable.' },
  },
  {
    name: 'Split Squat', sets: '3 sets x 10 reps per leg', rir: '2-3 RIR',
    cue: 'Upright torso, front shin stays vertical. Drop straight down. Control the descent.',
    home: { name: 'Split Squat', cue: 'Bodyweight is plenty to start. Add a backpack to progress. Upright torso, drop straight down, control the descent.' },
  },
  {
    name: 'Conditioning Finisher', sets: '3 rounds', rir: '30 seconds work / 30 seconds rest',
    cue: 'Choose one: bike, row, sled push, or KB swings. Effort level 7/10. Focus on breathing rhythm.',
    home: { name: 'Conditioning Finisher (no equipment)', cue: 'Choose one: stair runs, high knees, burpees, or fast walking intervals. 30s work / 30s rest. Effort 7/10, steady breathing.' },
  },
]

const SESSION_C: Exercise[] = [
  {
    name: 'Front Squat or Goblet Squat', sets: '3 sets x 10 reps', rir: '2-3 RIR',
    cue: 'Full depth. Keep elbows high throughout. Smooth, controlled tempo - do not rush the descent.',
    home: { name: 'Backpack Front Squat or Tempo Squat', cue: 'Hug a backpack to your chest, or slow-tempo bodyweight. Full depth, elbows high, do not rush the descent.' },
  },
  {
    name: 'Incline Dumbbell Press', sets: '3 sets x 12 reps', rir: '2 RIR',
    cue: 'Bench at 30-45 degrees. Control each rep on the way down. Pause briefly at the bottom.',
    home: { name: 'Incline Push-Ups', cue: 'Hands on a couch, bench, or counter. Add a backpack to load it. Control each rep down, pause briefly at the bottom.' },
  },
  {
    name: 'Pull-Ups or Assisted Pull-Ups', sets: '3 sets x AMRAP', rir: '2-3 reps shy of failure',
    cue: 'Pull your elbows down to your hips, not your chin to the bar. Dead hang at the bottom each rep.',
    home: { name: 'Table Inverted Rows or Band Pulldowns', cue: 'Lie under a sturdy table and pull your chest to the edge, or pull a band anchored up high. Drive your elbows to your hips.' },
  },
  {
    name: 'Walking Lunges', sets: '3 sets x 10 reps per leg', rir: '2 RIR',
    cue: 'Long stride. Knee tracks over the second toe. Tall posture, no forward lean.',
    home: { name: 'Walking Lunges', cue: 'Bodyweight to start, backpack to progress. Long stride, tall posture, knee tracks over the second toe.' },
  },
  {
    name: 'Core Circuit', sets: '3 rounds', rir: 'Plank 30s + Deadbug 10 reps per side',
    cue: 'Plank: squeeze glutes and brace your core like you are about to take a punch. Deadbug: slow and controlled, no lower back arch.',
    home: { name: 'Core Circuit', cue: 'No equipment needed. Plank: brace like you are about to take a punch. Deadbug: slow and controlled, no lower back arch.' },
  },
]

const card: React.CSSProperties = {
  background: '#FFFFFF', border: '1px solid #ECEEF2', borderRadius: '14px', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '18px 20px',
}
const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
}
const sectionTitle: React.CSSProperties = {
  fontSize: '26px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.025em', margin: '6px 0 0', lineHeight: 1.2,
}

function ExerciseCard({ ex, index, mode }: { ex: Exercise; index: number; mode: 'gym' | 'home' }) {
  const name = mode === 'home' ? ex.home.name : ex.name
  const cue = mode === 'home' ? ex.home.cue : ex.cue
  return (
    <div style={{ background: '#FFFFFF', border: '1px solid #ECEEF2', borderLeft: '3px solid #1B6DFC', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', borderRadius: '14px', padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '12px', fontWeight: 800, color: '#1B6DFC', background: 'rgba(27,109,252,0.08)', padding: '4px 10px', borderRadius: '6px', fontFamily: '"Courier New",Consolas,monospace', letterSpacing: '0.04em', minWidth: '34px', textAlign: 'center', flexShrink: 0, marginTop: '2px' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <p style={{ fontSize: '19px', fontWeight: 800, color: '#1A1A1A', margin: 0, lineHeight: 1.25, letterSpacing: '-0.015em', flex: 1 }}>{name}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingLeft: '48px' }}>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#3A3A3A', background: '#F5F5F5', border: '1px solid #ECEEF2', borderRadius: '6px', padding: '5px 11px', letterSpacing: '0.01em' }}>{ex.sets}</span>
        <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', background: 'rgba(27,109,252,0.10)', border: '1px solid rgba(27,109,252,0.25)', borderRadius: '6px', padding: '5px 11px', letterSpacing: '0.01em' }}>{ex.rir}</span>
        {mode === 'home' && (
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0E7A4F', background: 'rgba(16,160,100,0.10)', border: '1px solid rgba(16,160,100,0.25)', borderRadius: '6px', padding: '5px 11px', letterSpacing: '0.01em' }}>At home</span>
        )}
      </div>
      <div style={{ paddingLeft: '48px', borderTop: '1px solid #ECEEF2', paddingTop: '12px' }}>
        <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.7 }}>{cue}</p>
      </div>
    </div>
  )
}

function ModeToggle({ mode, setMode }: { mode: 'gym' | 'home'; setMode: (m: 'gym' | 'home') => void }) {
  const base: React.CSSProperties = {
    flex: 1, padding: '11px 14px', borderRadius: '9px', border: 'none', cursor: 'pointer',
    fontSize: '14px', fontWeight: 800, letterSpacing: '0.01em', transition: 'all 0.15s',
  }
  return (
    <div style={{ display: 'flex', gap: '6px', background: '#EEF1F5', border: '1px solid #E2E7EE', borderRadius: '12px', padding: '5px' }}>
      <button onClick={() => setMode('gym')} style={{ ...base, background: mode === 'gym' ? '#1B6DFC' : 'transparent', color: mode === 'gym' ? '#FFFFFF' : '#6B7280' }}>
        In the gym
      </button>
      <button onClick={() => setMode('home')} style={{ ...base, background: mode === 'home' ? '#1B6DFC' : 'transparent', color: mode === 'home' ? '#FFFFFF' : '#6B7280' }}>
        At home
      </button>
    </div>
  )
}

export default function TrainingPlan({ initialMode = 'gym' }: { initialMode?: 'gym' | 'home' }) {
  const [mode, setMode] = useState<'gym' | 'home'>(initialMode)

  const sessions = [
    { key: 'A', title: 'Foundation Strength', blurb: 'Compound lower and upper body work. Focus is on movement quality and controlled loading.', list: SESSION_A },
    { key: 'B', title: 'Conditioning Focus', blurb: 'Heavier strength base with a conditioning finisher. Raises work capacity without destroying recovery.', list: SESSION_B },
    { key: 'C', title: 'Volume and Density', blurb: 'Higher rep ranges and a core circuit. Tests your capacity and lays the groundwork for the next phase.', list: SESSION_C },
  ]

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '32px 24px 80px' }}>

      {/* Setup toggle */}
      <div style={{ marginBottom: '48px' }}>
        <p style={label}>Choose your setup</p>
        <p style={sectionTitle}>Gym or at home</p>
        <p style={{ fontSize: '14px', color: '#4A4A4A', margin: '8px 0 16px', lineHeight: 1.6 }}>
          Same plan, two ways to run it. The at-home version uses a loaded backpack, a resistance band, and furniture. Switch any time.
        </p>
        <ModeToggle mode={mode} setMode={setMode} />
        {mode === 'home' && (
          <div style={{ ...card, marginTop: '12px', background: 'rgba(16,160,100,0.06)', border: '1px solid rgba(16,160,100,0.2)' }}>
            <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, lineHeight: 1.65 }}>
              <span style={{ color: '#0E7A4F', fontWeight: 700 }}>Home kit:</span> a sturdy backpack you can load with books or water bottles, one resistance band, and a solid chair, table, or stairs. That is enough for all three sessions.
            </p>
          </div>
        )}
      </div>

      {/* Core principles */}
      <div style={{ marginBottom: '48px' }}>
        <p style={label}>Before you start</p>
        <p style={sectionTitle}>How to approach this</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
          {[
            { heading: 'RIR over max effort', body: 'You will see RIR (Reps In Reserve) next to each exercise. This means you stop the set when you have that many reps left. 2 RIR means you could have done 2 more. This keeps the system calm and recovery predictable.' },
            { heading: 'Tempo matters', body: 'Most exercises call for a controlled descent. Count 2 seconds down. This increases time under tension without adding more sets and protects your joints throughout the 14 days.' },
            { heading: 'Rest between sets', body: '90 to 120 seconds for strength work. 60 seconds for conditioning. Do not rush. The rest is part of the session.' },
            { heading: 'Walk on rest days', body: '30 to 60 minutes of low-intensity walking on every non-training day. This is not optional. Walking is active recovery and directly supports cortisol regulation.' },
          ].map(p => (
            <div key={p.heading} style={{ ...card }}>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 5px' }}>{p.heading}</p>
              <p style={{ fontSize: '13px', color: '#4A4A4A', margin: 0, lineHeight: 1.65 }}>{p.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Warm Up */}
      <div style={{ marginBottom: '48px' }}>
        <p style={label}>Every session</p>
        <p style={sectionTitle}>Warm-up sequence</p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
          Do this before every session. 5 to 8 minutes. It prepares the joints, nervous system, and movement patterns.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            '5 minutes light cardio - walk, bike, or row',
            'Hip circles - 10 each direction',
            'Bodyweight squats x 10, controlled tempo',
            'Band pull-aparts or arm swings x 15',
            'Cat-cow spinal movement x 10',
            '1 light warm-up set of your first exercise',
          ].map((step, i) => (
            <div key={step} style={{ ...card, padding: '12px 16px', display: 'flex', gap: '12px', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#1B6DFC', minWidth: '18px' }}>{String(i + 1).padStart(2, '0')}</span>
              <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0 }}>{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 14-Day Overview */}
      <div style={{ marginBottom: '48px' }}>
        <p style={label}>The Schedule</p>
        <p style={sectionTitle}>14-day overview</p>
        <p style={{ fontSize: '14px', color: '#4A4A4A', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
          Day 1 is your orientation day — no training. Your first session is Day 2. Week one has 4 sessions, week two has 3. Start any day of the week — the structure works around your life.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {[
            { week: 'Week 1 · Days 1-7', days: [
              { day: 'Day 1', session: 'Orientation', type: 'No training — read your guides and set up' },
              { day: 'Day 2', session: 'Session A', type: 'Foundation Strength' },
              { day: 'Day 4', session: 'Session B', type: 'Conditioning Focus' },
              { day: 'Day 6', session: 'Session A', type: 'Foundation Strength' },
              { day: 'Day 7', session: 'Session C', type: 'Volume and Density' },
            ] },
            { week: 'Week 2 · Days 8-14', days: [
              { day: 'Day 9', session: 'Session B', type: 'Conditioning Focus' },
              { day: 'Day 11', session: 'Session A', type: 'Foundation Strength' },
              { day: 'Day 13', session: 'Session C', type: 'Volume and Density' },
            ] },
          ].map(w => (
            <div key={w.week}>
              <p style={{ fontSize: '13px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>{w.week}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {w.days.map(d => (
                  <div key={d.day} style={{ ...card, display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '0' }}>
                    <span style={{ fontSize: '12px', color: '#6B6B6B', fontWeight: 700, minWidth: '64px' }}>{d.day}</span>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '13px', color: '#1B6DFC', fontWeight: 700 }}>{d.session}</span>
                      <span style={{ fontSize: '12px', color: '#6B6B6B' }}>{d.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...card, marginTop: '12px', background: 'rgba(27,109,252,0.07)', border: '1px solid rgba(27,109,252,0.2)' }}>
          <p style={{ fontSize: '14px', color: '#1A1A1A', margin: 0, lineHeight: 1.65 }}>
            <span style={{ color: '#1B6DFC', fontWeight: 700 }}>All other days:</span> Walk 30 to 60 minutes. Light, low intensity. This is active recovery, not optional rest.
          </p>
        </div>
      </div>

      {/* Sessions */}
      {sessions.map(s => (
        <div key={s.key} style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session {s.key}</p>
            <p style={sectionTitle}>{s.title}</p>
            <p style={{ fontSize: '14px', color: '#6B6B6B', marginTop: '8px', lineHeight: 1.6 }}>{s.blurb}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {s.list.map((ex, i) => <ExerciseCard key={ex.name} ex={ex} index={i} mode={mode} />)}
          </div>
        </div>
      ))}

      {/* RIR Explainer */}
      <div style={{ ...card }}>
        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1B6DFC', marginBottom: '8px' }}>What does RIR mean?</p>
        <p style={{ fontSize: '14px', color: '#6B6B6B', lineHeight: 1.7, margin: '0 0 12px' }}>
          RIR stands for Reps In Reserve. It tells you how close to failure to go on each set.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { rir: '1 RIR', desc: 'Stop when you have 1 rep left in the tank. Near-maximal.' },
            { rir: '2 RIR', desc: 'Stop with 2 reps remaining. Hard, but controlled.' },
            { rir: '3 RIR', desc: 'Stop with 3 reps remaining. Moderate effort.' },
          ].map(r => (
            <div key={r.rir} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', background: 'rgba(27,109,252,0.1)', padding: '2px 8px', borderRadius: '4px', whiteSpace: 'nowrap', flexShrink: 0, marginTop: '1px' }}>{r.rir}</span>
              <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.55 }}>{r.desc}</p>
            </div>
          ))}
        </div>
        <p style={{ fontSize: '13px', color: '#6B6B6B', margin: '12px 0 0', lineHeight: 1.6 }}>
          Staying within these ranges keeps intensity productive and recovery manageable across the full 14 days.
        </p>
      </div>

    </div>
  )
}
