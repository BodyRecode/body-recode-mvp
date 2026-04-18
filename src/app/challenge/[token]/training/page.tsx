import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const SESSION_A = [
  {
    name: 'Goblet Squat',
    sets: '3 sets x 12 reps',
    rir: '2-3 RIR',
    cue: 'Keep your chest tall, elbows inside your knees. Controlled descent. Drive through the whole foot.',
  },
  {
    name: 'Push-Ups',
    sets: '3 sets x AMRAP',
    rir: '2-3 reps shy of failure',
    cue: 'Maintain full body tension from head to heels. Full range - chest to floor. Stop before form breaks.',
  },
  {
    name: 'Dumbbell Romanian Deadlift',
    sets: '3 sets x 12 reps',
    rir: '2-3 RIR',
    cue: 'Hips push back, not down. Feel the stretch through your hamstrings. Soft knee, flat back throughout.',
  },
  {
    name: 'Seated or Band Row',
    sets: '3 sets x 12 reps',
    rir: '2 RIR',
    cue: 'Sit tall. Initiate with your elbows, not your hands. Squeeze your shoulder blades at the top.',
  },
  {
    name: 'Step-Ups',
    sets: '3 sets x 10 reps per leg',
    rir: '2 RIR',
    cue: 'Drive through the heel of the working leg. Avoid pushing off the back foot. Full hip extension at the top.',
  },
]

const SESSION_B = [
  {
    name: 'Trap Bar Deadlift or Heavy Dumbbell Deadlift',
    sets: '3 sets x 8 reps',
    rir: '2-3 RIR',
    cue: 'Brace hard before every rep. Drive the floor away. Strong lockout - hips and shoulders rise together.',
  },
  {
    name: 'Dumbbell Bench Press',
    sets: '3 sets x 10-12 reps',
    rir: '2-3 RIR',
    cue: 'Lower slowly - 2 seconds down. Slight arch, feet flat. Press to full extension without locking elbows hard.',
  },
  {
    name: 'Dumbbell Row',
    sets: '3 sets x 12 reps',
    rir: '2-3 RIR',
    cue: 'Elbow drives up and back. Keep your torso stable. Pull to your hip, not your shoulder.',
  },
  {
    name: 'Split Squat',
    sets: '3 sets x 10 reps per leg',
    rir: '2-3 RIR',
    cue: 'Upright torso, front shin stays vertical. Drop straight down. Control the descent.',
  },
  {
    name: 'Conditioning Finisher',
    sets: '3 rounds',
    rir: '30 seconds work / 30 seconds rest',
    cue: 'Choose one: bike, row, sled push, or KB swings. Effort level 7/10. Focus on breathing rhythm.',
  },
]

const SESSION_C = [
  {
    name: 'Front Squat or Goblet Squat',
    sets: '3 sets x 10 reps',
    rir: '2-3 RIR',
    cue: 'Full depth. Keep elbows high throughout. Smooth, controlled tempo - do not rush the descent.',
  },
  {
    name: 'Incline Dumbbell Press',
    sets: '3 sets x 12 reps',
    rir: '2 RIR',
    cue: 'Bench at 30-45 degrees. Control each rep on the way down. Pause briefly at the bottom.',
  },
  {
    name: 'Pull-Ups or Assisted Pull-Ups',
    sets: '3 sets x AMRAP',
    rir: '2-3 reps shy of failure',
    cue: 'Pull your elbows down to your hips, not your chin to the bar. Dead hang at the bottom each rep.',
  },
  {
    name: 'Walking Lunges',
    sets: '3 sets x 10 reps per leg',
    rir: '2 RIR',
    cue: 'Long stride. Knee tracks over the second toe. Tall posture, no forward lean.',
  },
  {
    name: 'Core Circuit',
    sets: '3 rounds',
    rir: 'Plank 30s + Deadbug 10 reps per side',
    cue: 'Plank: squeeze glutes and brace your core like you are about to take a punch. Deadbug: slow and controlled, no lower back arch.',
  },
]

const card: React.CSSProperties = {
  background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '18px 20px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#14b8a6',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
}

const sectionTitle: React.CSSProperties = {
  fontSize: '20px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', margin: '4px 0 0',
}

function ExerciseCard({ ex, index }: { ex: { name: string; sets: string; rir: string; cue: string }; index: number }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: '#14b8a6', minWidth: '20px', paddingTop: '3px' }}>
          {String(index + 1).padStart(2, '0')}
        </span>
        <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0, lineHeight: 1.3 }}>{ex.name}</p>
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' as const, paddingLeft: '32px' }}>
        <span style={{ fontSize: '13px', color: '#78716c', background: '#1c1917', borderRadius: '6px', padding: '4px 10px' }}>{ex.sets}</span>
        <span style={{ fontSize: '13px', color: '#14b8a6', background: 'rgba(20,184,166,0.08)', border: '1px solid rgba(20,184,166,0.15)', borderRadius: '6px', padding: '4px 10px' }}>{ex.rir}</span>
      </div>
      <div style={{ paddingLeft: '32px', borderTop: '1px solid #1c1917', paddingTop: '10px' }}>
        <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.65 }}>{ex.cue}</p>
      </div>
    </div>
  )
}

export default async function TrainingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()
  const { data: enrollment } = await admin
    .from('challenge_enrollments')
    .select('id')
    .eq('token', token)
    .eq('status', 'active')
    .single()
  if (!enrollment) notFound()

  return (
    <div style={{
      minHeight: '100vh', background: '#0c0a09', color: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #1c1917', padding: '18px 24px', background: '#0c0a09' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="160" alt="Body Recode" style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#14b8a6', textDecoration: 'none', fontWeight: 500 }}>
            Back to portal
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>14-Day Body Decode Challenge</p>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: '6px 0 12px', color: '#ffffff' }}>Training Plan</h1>
          <p style={{ fontSize: '15px', color: '#57534e', lineHeight: 1.75, margin: 0 }}>
            This plan is not about intensity. It is about rhythm. Your goal is to give your nervous system consistent, structured stimulus so your body starts adapting and rebuilding its baseline. Three to four sessions across two weeks.
          </p>
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
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', margin: '0 0 5px' }}>{p.heading}</p>
                <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.65 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Warm Up */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>Every session</p>
          <p style={sectionTitle}>Warm-up sequence</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
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
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#14b8a6', minWidth: '18px' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>{step}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Overview */}
        <div style={{ marginBottom: '48px' }}>
          <p style={label}>The Schedule</p>
          <p style={sectionTitle}>Weekly overview</p>
          <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', marginBottom: '16px', lineHeight: 1.6 }}>
            The challenge starts on Sunday. Day 1 is an orientation day - no training. First session is Monday. 4 sessions in week one, 3 in week two.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              {
                week: 'Week 1',
                days: [
                  { day: 'Day 1 - Sun', session: 'Orientation', type: 'No training - read your guides and set up' },
                  { day: 'Day 2 - Mon', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 4 - Wed', session: 'Session B', type: 'Conditioning Focus' },
                  { day: 'Day 6 - Fri', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 7 - Sat', session: 'Session C', type: 'Volume and Density' },
                ],
              },
              {
                week: 'Week 2',
                days: [
                  { day: 'Day 9 - Mon', session: 'Session B', type: 'Conditioning Focus' },
                  { day: 'Day 11 - Wed', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 13 - Fri', session: 'Session C', type: 'Volume and Density' },
                ],
              },
            ].map(w => (
              <div key={w.week}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>{w.week}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {w.days.map(d => (
                    <div key={d.day} style={{ ...card, display: 'flex', alignItems: 'center', padding: '12px 16px', gap: '0' }}>
                      <span style={{ fontSize: '12px', color: '#57534e', fontWeight: 600, minWidth: '120px' }}>{d.day}</span>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '13px', color: '#14b8a6', fontWeight: 700 }}>{d.session}</span>
                        <span style={{ fontSize: '12px', color: '#57534e' }}>{d.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card, marginTop: '12px', background: 'rgba(20,184,166,0.07)', border: '1px solid rgba(20,184,166,0.2)' }}>
            <p style={{ fontSize: '14px', color: '#99d6d0', margin: 0, lineHeight: 1.65 }}>
              <span style={{ color: '#14b8a6', fontWeight: 700 }}>All other days:</span> Walk 30 to 60 minutes. Light, low intensity. This is active recovery, not optional rest.
            </p>
          </div>
        </div>

        {/* Session A */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session A</p>
            <p style={sectionTitle}>Foundation Strength</p>
            <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', lineHeight: 1.6 }}>
              Compound lower and upper body work. Focus is on movement quality and controlled loading.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_A.map((ex, i) => <ExerciseCard key={ex.name} ex={ex} index={i} />)}
          </div>
        </div>

        {/* Session B */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session B</p>
            <p style={sectionTitle}>Conditioning Focus</p>
            <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', lineHeight: 1.6 }}>
              Heavier strength base with a conditioning finisher. Raises work capacity without destroying recovery.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_B.map((ex, i) => <ExerciseCard key={ex.name} ex={ex} index={i} />)}
          </div>
        </div>

        {/* Session C */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session C</p>
            <p style={sectionTitle}>Volume and Density</p>
            <p style={{ fontSize: '14px', color: '#78716c', marginTop: '8px', lineHeight: 1.6 }}>
              Higher rep ranges and a core circuit. Tests your capacity and lays the groundwork for the next phase.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_C.map((ex, i) => <ExerciseCard key={ex.name} ex={ex} index={i} />)}
          </div>
        </div>

        {/* RIR Explainer */}
        <div style={{ ...card }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '8px' }}>What does RIR mean?</p>
          <p style={{ fontSize: '14px', color: '#78716c', lineHeight: 1.7, margin: '0 0 12px' }}>
            RIR stands for Reps In Reserve. It tells you how close to failure to go on each set.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { rir: '1 RIR', desc: 'Stop when you have 1 rep left in the tank. Near-maximal.' },
              { rir: '2 RIR', desc: 'Stop with 2 reps remaining. Hard, but controlled.' },
              { rir: '3 RIR', desc: 'Stop with 3 reps remaining. Moderate effort.' },
            ].map(r => (
              <div key={r.rir} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#14b8a6',
                  background: 'rgba(20,184,166,0.1)', padding: '2px 8px', borderRadius: '4px',
                  whiteSpace: 'nowrap' as const, flexShrink: 0, marginTop: '1px',
                }}>{r.rir}</span>
                <p style={{ fontSize: '13px', color: '#78716c', margin: 0, lineHeight: 1.55 }}>{r.desc}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '13px', color: '#a8a29e', margin: '12px 0 0', lineHeight: 1.6 }}>
            Staying within these ranges keeps intensity productive and recovery manageable across the full 14 days.
          </p>
        </div>

      </div>
    </div>
  )
}
