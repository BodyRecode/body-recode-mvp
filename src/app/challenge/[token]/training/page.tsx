import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

const SESSION_A = [
  { name: 'Goblet Squat', sets: '3 sets x 12 reps', rir: '2-3 RIR', cue: 'Controlled tempo. Keep chest tall.' },
  { name: 'Push-Ups', sets: '3 sets x AMRAP', rir: '2-3 shy', cue: 'Maintain tension. Full range.' },
  { name: 'Dumbbell Romanian Deadlift', sets: '3 sets x 12 reps', rir: '2-3 RIR', cue: 'Feel the stretch. Hips back.' },
  { name: 'Seated or Band Row', sets: '3 sets x 12 reps', rir: '2 RIR', cue: 'Focus on posture. Squeeze at the top.' },
  { name: 'Step-Ups', sets: '3 sets x 10 reps per leg', rir: '2 RIR', cue: 'Drive through the heel.' },
]

const SESSION_B = [
  { name: 'Trap Bar or Heavy Dumbbell Deadlift', sets: '3 sets x 8 reps', rir: '2-3 RIR', cue: 'Strong lockout. Stable brace.' },
  { name: 'Dumbbell Bench Press', sets: '3 sets x 10-12 reps', rir: '2-3 RIR', cue: 'Slow controlled lower.' },
  { name: 'Dumbbell Row', sets: '3 sets x 12 reps', rir: '2-3 RIR', cue: 'Elbow drives back.' },
  { name: 'Split Squat', sets: '3 sets x 10 reps per leg', rir: '2-3 RIR', cue: 'Upright torso.' },
  { name: 'Conditioning Finisher', sets: '3 rounds', rir: '30s work / 30s rest', cue: 'Focus on breathing.' },
]

const SESSION_C = [
  { name: 'Front Squat or Goblet Squat', sets: '3 sets x 10 reps', rir: '2-3 RIR', cue: 'Full depth. Smooth tempo.' },
  { name: 'Incline Dumbbell Press', sets: '3 sets x 12 reps', rir: '2 RIR', cue: 'Control each rep.' },
  { name: 'Pull-Ups or Assisted Pull-Ups', sets: '3 sets x AMRAP', rir: '2-3 shy', cue: 'Pull elbows down.' },
  { name: 'Walking Lunges', sets: '3 sets x 10 reps per leg', rir: '2 RIR', cue: 'Steady drive.' },
  { name: 'Core Circuit', sets: '3 rounds', rir: 'Plank 30s + Deadbug 10/side', cue: 'Stay controlled.' },
]

const card: React.CSSProperties = {
  background: '#111110', border: '1px solid #1c1917', borderRadius: '12px', padding: '18px 20px',
}

const label: React.CSSProperties = {
  fontSize: '11px', fontWeight: 700, color: '#14b8a6',
  letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px',
}

function ExerciseCard({ ex }: { ex: { name: string; sets: string; rir: string; cue: string } }) {
  return (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <p style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', margin: 0 }}>{ex.name}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' as const }}>
        <span style={{ fontSize: '13px', color: '#a8a29e', background: '#1c1917', borderRadius: '6px', padding: '3px 10px' }}>{ex.sets}</span>
        <span style={{ fontSize: '13px', color: '#14b8a6', background: 'rgba(20,184,166,0.08)', borderRadius: '6px', padding: '3px 10px' }}>{ex.rir}</span>
      </div>
      <p style={{ fontSize: '13px', color: '#57534e', margin: 0, fontStyle: 'italic' }}>{ex.cue}</p>
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
      <div style={{ borderBottom: '1px solid #1c1917', padding: '18px 24px' }}>
        <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style={{ display: 'block' }} />
          <Link href={`/challenge/${token}`} style={{ fontSize: '13px', color: '#57534e', textDecoration: 'none' }}>
            ← Back to portal
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Title */}
        <div style={{ marginBottom: '40px' }}>
          <p style={label}>14-Day Body Decode Challenge</p>
          <h1 style={{ fontSize: '28px', fontWeight: 900, letterSpacing: '-0.02em', margin: '6px 0 12px' }}>Training Plan</h1>
          <p style={{ fontSize: '15px', color: '#a8a29e', lineHeight: 1.7, margin: 0 }}>
            This plan is designed to calm your system, rebuild structure, and reduce the daily friction that makes your body feel harder to manage. Your goal is not intensity. Your goal is rhythm.
          </p>
        </div>

        {/* Weekly Overview */}
        <div style={{ marginBottom: '48px' }}>
          <p style={{ ...label, marginBottom: '16px' }}>Weekly Overview</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {[
              {
                week: 'Week 1',
                days: [
                  { day: 'Day 1 (Mon)', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 3 (Wed)', session: 'Session B', type: 'Conditioning Focus' },
                  { day: 'Day 5 (Fri)', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 6 (Sat)', session: 'Session C', type: 'Volume and Density' },
                ],
              },
              {
                week: 'Week 2',
                days: [
                  { day: 'Day 8 (Mon)', session: 'Session B', type: 'Conditioning Focus' },
                  { day: 'Day 10 (Wed)', session: 'Session A', type: 'Foundation Strength' },
                  { day: 'Day 12 (Fri)', session: 'Session C', type: 'Volume and Density' },
                ],
              },
            ].map(w => (
              <div key={w.week}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>{w.week}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {w.days.map(d => (
                    <div key={d.day} style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px' }}>
                      <span style={{ fontSize: '13px', color: '#57534e', fontWeight: 600, minWidth: '110px' }}>{d.day}</span>
                      <div style={{ flex: 1, paddingLeft: '16px' }}>
                        <span style={{ fontSize: '14px', color: '#14b8a6', fontWeight: 700 }}>{d.session}</span>
                        <span style={{ fontSize: '13px', color: '#78716c', marginLeft: '8px' }}>{d.type}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...card, marginTop: '12px', background: 'rgba(20,184,166,0.05)', border: '1px solid rgba(20,184,166,0.15)' }}>
            <p style={{ fontSize: '14px', color: '#99d6d0', margin: 0, lineHeight: 1.6 }}>
              <strong style={{ color: '#14b8a6' }}>Movement days:</strong> Walk 30-60 minutes on all non-training days.
            </p>
          </div>
        </div>

        {/* Session A */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session A</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0', letterSpacing: '-0.01em' }}>Foundation Strength</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_A.map(ex => <ExerciseCard key={ex.name} ex={ex} />)}
          </div>
        </div>

        {/* Session B */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session B</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0', letterSpacing: '-0.01em' }}>Conditioning Focus</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_B.map(ex => <ExerciseCard key={ex.name} ex={ex} />)}
          </div>
        </div>

        {/* Session C */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{ marginBottom: '16px' }}>
            <p style={label}>Session C</p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#ffffff', margin: '4px 0 0', letterSpacing: '-0.01em' }}>Volume and Density</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {SESSION_C.map(ex => <ExerciseCard key={ex.name} ex={ex} />)}
          </div>
        </div>

        {/* RIR note */}
        <div style={{ ...card, background: '#111110', borderColor: '#1c1917' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: '#14b8a6', marginBottom: '6px' }}>What is RIR?</p>
          <p style={{ fontSize: '13px', color: '#78716c', lineHeight: 1.6, margin: 0 }}>
            RIR stands for Reps In Reserve. 2 RIR means you stop the set when you have 2 reps left in the tank. This keeps intensity controlled and supports recovery across the 14 days.
          </p>
        </div>

      </div>
    </div>
  )
}
