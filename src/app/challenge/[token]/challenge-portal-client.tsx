'use client'

import { useRef, useState } from 'react'
import BodyDecodeIntakeForm, { type IntakeResult } from './body-decode-intake'
import BodyDecodeIntakeResult from './body-decode-intake-result'
import { logoUrl, brand, coach } from '@/config/tenant'
import { BookOpen, LineChart, ClipboardCheck, FileText, Compass, Lock, Dumbbell, Salad, Sunrise, Moon, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react'

function SectionLabel({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
      <span style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(27,109,252,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1B6DFC', flexShrink: 0 }}>
        <Icon size={16} strokeWidth={2.5} />
      </span>
      <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{text}</span>
    </div>
  )
}

const DAILY_NOTES: Record<number, { focus: string; note: string }> = {
  1: {
    focus: 'Orientation day',
    note: 'No training today. Day 1 is for getting set up. Read your training plan and nutrition guide in full. Do the morning reset sequence. Eat clean. Go for a walk. Your first training session is tomorrow. Starting with one calm, structured day before the work begins is part of the design.',
  },
  2: {
    focus: 'First training session',
    note: 'Session A today. Notice how your body feels when you wake up - puffy, heavy, tired? That is your baseline. Write it down mentally. Over the next 14 days you will have something to compare it to. Do the morning reset before you train. Keep the session controlled. RIR is your guide, not max effort.',
  },
  3: {
    focus: 'Digestion and inflammation',
    note: 'By day 3, some people start to notice digestion settling. Less bloating, more predictable hunger. This is your system responding to meal timing and food quality. Stay consistent with the nutrition guide today. Simple works.',
  },
  4: {
    focus: 'Energy patterns',
    note: 'Pay attention to your afternoon energy today. Do you crash at the same time? That pattern has a biological cause. The structure you are building right now is directly targeting it. Stay the course.',
  },
  5: {
    focus: 'Week One Progress Session',
    note: 'Today is a rest day from training - walk 30 to 60 minutes as usual. Your Week One Progress Session is now available below. Watch it today while you are in the middle of the reset. It will help you understand what your body has been doing this week and make Week 2 feel much clearer.',
  },
  6: {
    focus: 'Recovery and sleep',
    note: 'Focus on the evening rhythm tonight. Sleep quality is one of the biggest drivers of every symptom you felt at the start. Cortisol, appetite, inflammation, energy. They all trace back to overnight recovery. Give the wind-down sequence your full attention.',
  },
  7: {
    focus: 'Halfway point - Body Decode Check-In',
    note: 'You have reached Day 7. Today the Body Decode Check-In unlocks below. Rate how 8 biological markers have changed since Day 1, then answer 2 pattern questions. Do it now while your body is mid-reset - your answers will reflect what is actually happening in your biology right now.',
  },
  8: {
    focus: 'Your second week begins',
    note: 'Week two is where the changes start becoming visible. The inflammation is settling. The rhythm is forming. Stay disciplined with the training and nutrition today. You are building on a foundation that is already shifting.',
  },
  9: {
    focus: 'Appetite signals',
    note: 'By now your hunger should feel more predictable. Less spiking, less craving. That is your blood sugar stabilising. If you are still getting strong cravings, look at meal spacing. Are you eating at consistent times? Consistency matters more than perfection.',
  },
  10: {
    focus: 'Training response',
    note: 'Notice how your body feels during training compared to Day 1. Less tightness? More energy mid-session? Your nervous system is adapting to the rhythm. This is not fitness progress. This is biological stabilisation. It is the foundation everything else is built on.',
  },
  11: {
    focus: 'Mental clarity',
    note: 'Energy stability and mental clarity are connected. When your cortisol pattern settles and your blood sugar stabilises, your head clears. If you are feeling sharper this week, that is why. It is not a coincidence.',
  },
  12: {
    focus: 'Consistency compounds',
    note: 'Twelve days of structure. Most people have never given their body twelve consecutive days of consistent rhythm. Your biology is responding to something it has not experienced in a long time: predictability. Keep it simple today.',
  },
  13: {
    focus: 'The last push',
    note: 'One more day after today. Do not ease off. The final two days are where the pattern gets locked in. Complete the training, follow the nutrition guide, do both sequences. Finish the way you started.',
  },
  14: {
    focus: 'Day 14 - You finished',
    note: 'Fourteen days. You did it. Take a moment to compare how you feel right now to Day 1. Less puffiness? More stable energy? Clearer head? That is what structure does to biology. This is the baseline your body needs. The next step is understanding your patterns at a deeper level - and building on what you have started.',
  },
}

const RESOURCES_STATIC = [
  {
    id: 'training',
    title: '14-Day Training Plan',
    desc: 'Your session-by-session training structure for all 14 days.',
    icon: Dumbbell,
    href: '__training__',
  },
  {
    id: 'nutrition',
    title: 'Nutrition Guide',
    desc: 'Simple whole foods, meal timing, and digestion-friendly choices.',
    icon: Salad,
    href: '__nutrition__',
  },
  {
    id: 'morning',
    title: 'Morning Reset Sequence',
    desc: '5 minutes every morning. Do this before caffeine.',
    icon: Sunrise,
    href: null,
    steps: [
      '2 minutes of slow nasal breathing before getting out of bed',
      '500ml of water immediately on waking',
      '5 minutes of light movement or walking outside',
      'No phone for the first 20 minutes',
      'Eat breakfast within 60 minutes of waking',
    ],
  },
  {
    id: 'evening',
    title: 'Evening Rhythm Sequence',
    desc: 'Wind down your nervous system before sleep.',
    icon: Moon,
    href: null,
    steps: [
      'Dim lights and reduce screen brightness after 8pm',
      'No eating within 2 hours of sleep',
      '5 minutes of slow breathing or light stretching',
      'Set a consistent sleep time and stick to it',
      'Phone out of the bedroom or on silent',
    ],
  },
]

function ExpandableResource({ resource }: { resource: typeof RESOURCES_STATIC[0] & { locked?: boolean } }) {
  const [open, setOpen] = useState(false)

  return (
    <div style={{
      background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)',
      borderRadius: '12px', overflow: 'hidden',
    }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '18px 20px', cursor: 'pointer',
        }}
        onClick={() => resource.steps ? setOpen(o => !o) : undefined}
      >
        <div style={{
          width: '42px', height: '42px', borderRadius: '10px',
          background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.2)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, color: '#1B6DFC',
        }}>
          <resource.icon size={20} strokeWidth={2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '15px', fontWeight: 700, color: '#1A1A1A', margin: '0 0 3px' }}>{resource.title}</p>
          <p style={{ fontSize: '13px', color: '#6B6B6B', margin: 0, lineHeight: 1.4 }}>{resource.desc}</p>
        </div>
        {resource.locked ? (
          <span style={{
            flexShrink: 0, padding: '8px 14px', borderRadius: '8px',
            background: '#F0F1F4', color: '#9AA0AA',
            fontSize: '12px', fontWeight: 700, whiteSpace: 'nowrap',
            display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            <Lock size={13} strokeWidth={2.5} /> Locked
          </span>
        ) : resource.href ? (
          <a
            href={resource.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              flexShrink: 0, padding: '8px 16px', borderRadius: '8px',
              background: '#1B6DFC', color: '#FFFFFF',
              fontSize: '12px', fontWeight: 700, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            View
          </a>
        ) : (
          <span style={{ color: '#8A9099', flexShrink: 0, display: 'inline-flex' }}>
            {open ? <ChevronUp size={18} strokeWidth={2.5} /> : <ChevronDown size={18} strokeWidth={2.5} />}
          </span>
        )}
      </div>
      {resource.steps && open && (
        <div style={{ borderTop: '1px solid #E5E5E5', padding: '16px 20px' }}>
          {resource.steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: i < resource.steps!.length - 1 ? '12px' : 0 }}>
              <span style={{
                fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                width: '20px', flexShrink: 0, paddingTop: '2px',
              }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <p style={{ fontSize: '14px', color: '#999999', margin: 0, lineHeight: 1.6 }}>{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LockedMilestoneCard({
  label, unlockDay, currentDay,
}: { label: string; unlockDay: number; currentDay: number }) {
  const days = Math.max(unlockDay - currentDay, 0)
  return (
    <div style={{ marginBottom: '48px' }}>
      <SectionLabel icon={Lock} text={label} />
      <div style={{
        background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)',
        borderRadius: '12px', padding: '24px', textAlign: 'center',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '50%',
          background: 'rgba(27,109,252,0.10)', color: '#1B6DFC', display: 'flex', alignItems: 'center',
          justifyContent: 'center', margin: '0 auto 14px',
        }}>
          <Lock size={20} strokeWidth={2.5} />
        </div>
        <p style={{ fontSize: '15px', fontWeight: 700, color: '#4A4A4A', marginBottom: '6px' }}>
          Unlocks on Day {unlockDay}
        </p>
        <p style={{ fontSize: '13px', color: '#999999', margin: 0 }}>
          {days} day{days === 1 ? '' : 's'} to go
        </p>
      </div>
    </div>
  )
}

const PARQ_QUESTIONS = [
  {
    id: 'q1',
    text: 'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
  },
  {
    id: 'q2',
    text: 'Do you feel pain in your chest when you do physical activity?',
  },
  {
    id: 'q3',
    text: 'In the past month, have you had chest pain when you were not doing physical activity?',
  },
  {
    id: 'q4',
    text: 'Do you lose your balance because of dizziness, or do you ever lose consciousness?',
  },
  {
    id: 'q5',
    text: 'Do you have a bone or joint problem (for example, back, knee or hip) that could be made worse by a change in your physical activity?',
  },
  {
    id: 'q6',
    text: 'Is your doctor currently prescribing medication for your blood pressure or a heart condition?',
  },
  {
    id: 'q7',
    text: 'Do you know of any other reason why you should not participate in physical activity?',
  },
]

function ParqForm({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no'>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allAnswered = PARQ_QUESTIONS.every(q => answers[q.id])
  const anyYes = Object.values(answers).some(v => v === 'yes')

  async function handleSubmit() {
    if (!allAnswered || anyYes) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenge/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formType: 'parq', responses: answers }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
          The PAR-Q is a standard physical activity readiness questionnaire. Please answer all questions honestly. If you answer YES to any question, you must consult a doctor before beginning the training component of this challenge.
        </p>
      </div>

      {PARQ_QUESTIONS.map((q, i) => (
        <div key={q.id}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: '#3A3A3A', lineHeight: 1.6, marginBottom: '12px' }}>
            <span style={{ color: '#1B6DFC', marginRight: '8px', fontWeight: 800 }}>{i + 1}.</span>
            {q.text}
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['no', 'yes'] as const).map(val => (
              <button
                key={val}
                onClick={() => setAnswers(a => ({ ...a, [q.id]: val }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                  background: answers[q.id] === val
                    ? val === 'no' ? 'rgba(27, 109, 252,0.12)' : 'rgba(239,68,68,0.12)'
                    : '#E5E5E5',
                  color: answers[q.id] === val
                    ? val === 'no' ? '#1B6DFC' : '#DC2626'
                    : '#4A4A4A',
                  fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                  outline: answers[q.id] === val
                    ? val === 'no' ? '1px solid rgba(27, 109, 252,0.3)' : '1px solid rgba(239,68,68,0.3)'
                    : '1px solid transparent',
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  transition: 'all 0.15s ease',
                }}
              >
                {val === 'yes' ? 'Yes' : 'No'}
              </button>
            ))}
          </div>
        </div>
      ))}

      {anyYes && allAnswered && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: '12px', padding: '20px',
        }}>
          <p style={{ fontSize: '14px', color: '#DC2626', fontWeight: 700, marginBottom: '8px' }}>
            Medical clearance required
          </p>
          <p style={{ fontSize: '13px', color: '#999999', lineHeight: 1.7, margin: 0 }}>
            You have answered YES to one or more questions. Please consult your doctor before beginning the physical training component of this challenge. You can still access all other challenge resources. If your doctor clears you, please contact us at {coach().email}.
                                </p>
        </div>
      )}

      {error && (
        <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allAnswered || anyYes || submitting}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: allAnswered && !anyYes ? '#1B6DFC' : '#E5E5E5',
          color: allAnswered && !anyYes ? '#FFFFFF' : '#4A4A4A',
          fontSize: '15px', fontWeight: 700,
          cursor: allAnswered && !anyYes && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {submitting ? 'Saving...' : 'I confirm all answers are NO - continue'}
      </button>
    </div>
  )
}

function HealthDecForm({ token, onComplete }: { token: string; onComplete: () => void }) {
  const [checks, setChecks] = useState<Record<string, boolean>>({
    age: false,
    notPregnant: false,
    notMedical: false,
    responsibility: false,
    doctorConsult: false,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const declarations = [
    { id: 'age', text: 'I am 18 years of age or older.' },
    { id: 'notPregnant', text: 'I am not currently pregnant or in the first 6 weeks post-partum.' },
    { id: 'notMedical', text: 'I understand that the Body Recode challenge is not a medical program and does not constitute medical advice, diagnosis, or treatment.' },
    { id: 'responsibility', text: 'I accept personal responsibility for my participation in this challenge and any physical activity I undertake as part of it.' },
    { id: 'doctorConsult', text: 'I agree to consult a qualified medical professional if I experience any pain, discomfort, or symptoms during the challenge.' },
  ]

  const allChecked = declarations.every(d => checks[d.id])

  async function handleSubmit() {
    if (!allChecked) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenge/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, formType: 'health_dec' }),
      })
      if (!res.ok) throw new Error('Failed to submit')
      onComplete()
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', borderRadius: '12px', padding: '20px' }}>
        <p style={{ fontSize: '13px', color: '#6B6B6B', lineHeight: 1.7, margin: 0 }}>
          Please read and confirm each declaration below. By submitting this form you acknowledge and agree to the following statements.
        </p>
      </div>

      {declarations.map(d => (
        <div
          key={d.id}
          onClick={() => setChecks(c => ({ ...c, [d.id]: !c[d.id] }))}
          style={{
            display: 'flex', gap: '14px', alignItems: 'flex-start',
            background: checks[d.id] ? 'rgba(27, 109, 252,0.06)' : '#FFFFFF',
            border: checks[d.id] ? '1px solid rgba(27, 109, 252,0.25)' : '1px solid #E5E5E5',
            borderRadius: '10px', padding: '16px', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{
            width: '20px', height: '20px', borderRadius: '5px', flexShrink: 0, marginTop: '1px',
            background: checks[d.id] ? '#1B6DFC' : '#E5E5E5',
            border: checks[d.id] ? 'none' : '1px solid #D4D4D4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease',
          }}>
            {checks[d.id] && (
              <svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                <path d="M1 4L4.5 7.5L11 1" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p style={{ fontSize: '14px', color: checks[d.id] ? '#3A3A3A' : '#6B6B6B', lineHeight: 1.6, margin: 0, transition: 'color 0.15s ease' }}>
            {d.text}
          </p>
        </div>
      ))}

      {error && (
        <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!allChecked || submitting}
        style={{
          width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
          background: allChecked ? '#1B6DFC' : '#E5E5E5',
          color: allChecked ? '#FFFFFF' : '#4A4A4A',
          fontSize: '15px', fontWeight: 700,
          cursor: allChecked && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {submitting ? 'Saving...' : 'Submit Health Declaration'}
      </button>
    </div>
  )
}

export default function ChallengePortalClient({
  token, firstName, currentDay, enrolledAt, parqCompleted, healthDecCompleted, savedQuizResult, bodyDecodeIntakeCompleted,
}: {
  token: string
  firstName: string
  currentDay: number
  enrolledAt: string
  parqCompleted: boolean
  healthDecCompleted: boolean
  savedQuizResult: string | null
  bodyDecodeIntakeCompleted: boolean
}) {
  const [intakeDone, setIntakeDone] = useState(bodyDecodeIntakeCompleted)
  const [intakeResult, setIntakeResult] = useState<IntakeResult | null>(null)
  const [parqDone, setParqDone] = useState(parqCompleted)
  const [healthDecDone, setHealthDecDone] = useState(healthDecCompleted)
  const formsRef = useRef<HTMLDivElement | null>(null)
  const intakeRef = useRef<HTMLDivElement | null>(null)
  const [activeForm, setActiveForm] = useState<'parq' | 'health_dec' | null>(
    !parqCompleted ? 'parq' : !healthDecCompleted ? 'health_dec' : null
  )

  const formsComplete = parqDone && healthDecDone
  const todayNote = DAILY_NOTES[currentDay]
  const progress = Math.round((currentDay / 14) * 100)

  const RESOURCES = RESOURCES_STATIC.map(r =>
    r.id === 'training' ? { ...r, href: formsComplete ? `/challenge/${token}/training` : null, locked: !formsComplete }
    : r.id === 'nutrition' ? { ...r, href: formsComplete ? `/challenge/${token}/nutrition` : null, locked: !formsComplete }
    : r
  ) as (typeof RESOURCES_STATIC[0] & { locked?: boolean })[]

  return (
    <div style={{
      minHeight: '100vh', background: '#F5F7FA', color: '#1A1A1A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', position: 'relative',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 340, background: 'radial-gradient(1000px 280px at 50% -50px, rgba(27,109,252,0.07), transparent 70%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ borderBottom: '1px solid #ECEEF2', padding: '18px 24px', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width="160" alt={brand().name} style={{ display: 'block' }} />
          <div style={{
            background: 'rgba(27, 109, 252,0.08)', border: '1px solid rgba(27, 109, 252,0.2)',
            borderRadius: '99px', padding: '5px 14px',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1B6DFC' }}>
              {intakeDone ? `Day ${currentDay} of 14` : 'Day 0 · Setup'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Premium hero panel */}
        <div style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)', borderRadius: 18, padding: '28px 28px 26px', marginBottom: 40, position: 'relative', overflow: 'hidden', boxShadow: '0 14px 34px rgba(11,31,51,0.28)' }}>
          <div style={{ position: 'absolute', top: -90, right: -70, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.3), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#8FB4F5', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
              {intakeDone ? '14-Day Body Decode Challenge' : 'Before your Challenge begins'}
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
              {intakeDone ? `Welcome back, ${firstName}.` : `Welcome, ${firstName}.`}
            </h1>
            {intakeDone && (
              <div style={{ marginTop: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 9 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>DAY {currentDay} OF 14</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8FB4F5' }}>{progress}%</span>
                </div>
                <div style={{ height: 7, background: 'rgba(255,255,255,0.14)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#1B6DFC', borderRadius: 99, width: `${progress}%`, transition: 'width 0.4s ease', boxShadow: '0 0 10px rgba(27,109,252,0.5)' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Day 0 Body Decode Intake — gates everything else until done.
            Scorecard signups arrive with intakeDone=true (skip the form,
            their state classification already lives on the lead row).
            Cold-paid / gym-floor / direct enrollers see the form, submit it,
            see their state-routed result, then click Continue to advance. */}
        {!intakeDone && !intakeResult && (
          <div ref={intakeRef} style={{ marginBottom: '48px', scrollMarginTop: '24px' }}>
            <BodyDecodeIntakeForm
              token={token}
              onComplete={result => {
                setIntakeResult(result)
                // Scroll to top so the result hero lands at the top of the
                // viewport, not mid-page where the user submitted from.
                window.scrollTo({ top: 0, behavior: 'instant' })
              }}
            />
          </div>
        )}

        {!intakeDone && intakeResult && (
          <div ref={intakeRef} style={{ marginBottom: '48px', scrollMarginTop: '24px' }}>
            <BodyDecodeIntakeResult
              result={intakeResult}
              onContinue={() => {
                setIntakeDone(true)
                // Land ON the PAR-Q, not at the top of the page.
                //
                // This used to scroll to top:0, which is the hero and day
                // counter - so someone who had just finished their read was
                // dropped somewhere that looks like arrival, with the one thing
                // still standing between them and their training sitting below
                // the fold as an amber banner. Five of twenty-four never
                // cleared that gate.
                //
                // The forms block only mounts once intakeDone flips, so the ref
                // is not attached until after this render. rAF waits for it.
                requestAnimationFrame(() => {
                  if (formsRef.current) formsRef.current.scrollIntoView({ block: 'start', behavior: 'instant' })
                  else window.scrollTo({ top: 0, behavior: 'instant' })
                })
              }}
            />
          </div>
        )}

        {/* Required Forms */}
        {intakeDone && !formsComplete && (
          <div ref={formsRef} style={{ marginBottom: '48px', scrollMarginTop: '24px' }}>
            <div style={{
              background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: '12px', padding: '16px 20px', marginBottom: '20px',
              display: 'flex', gap: '12px', alignItems: 'flex-start',
            }}>
              <span style={{ flexShrink: 0, display: 'inline-flex', color: '#D97706', marginTop: '1px' }}><AlertTriangle size={18} strokeWidth={2.2} /></span>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#8A5A14', marginBottom: '4px' }}>
                  Required before training
                </p>
                <p style={{ fontSize: '13px', color: '#999999', lineHeight: 1.6, margin: 0 }}>
                  Seven yes-or-no questions and five things to tick. Nothing to type. Twelve taps and your training plan and nutrition guide unlock.
                </p>
              </div>
            </div>

            {/* Form tabs */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              {[
                { key: 'parq' as const, label: 'PAR-Q', done: parqDone },
                { key: 'health_dec' as const, label: 'Health Declaration', done: healthDecDone },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => !tab.done && setActiveForm(tab.key)}
                  style={{
                    flex: 1, padding: '10px 14px', borderRadius: '8px',
                    background: tab.done
                      ? 'rgba(27, 109, 252,0.1)'
                      : activeForm === tab.key ? '#1B6DFC' : '#FFFFFF',
                    color: tab.done ? '#1B6DFC' : activeForm === tab.key ? '#FFFFFF' : '#4A4A4A',
                    border: tab.done ? '1px solid rgba(27, 109, 252, 0.2)' : activeForm === tab.key ? '1px solid #1B6DFC' : '1px solid #E5E5E5',
                    fontSize: '13px', fontWeight: 700,
                    cursor: tab.done ? 'default' : 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab.done ? '✓ ' : ''}{tab.label}
                </button>
              ))}
            </div>

            {activeForm === 'parq' && !parqDone && (
              <ParqForm
                token={token}
                onComplete={() => {
                  setParqDone(true)
                  setActiveForm('health_dec')
                  requestAnimationFrame(() => {
                    formsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  })
                }}
              />
            )}
            {(activeForm === 'health_dec' || (parqDone && !healthDecDone && activeForm !== 'parq')) && !healthDecDone && (
              <HealthDecForm
                token={token}
                onComplete={() => {
                  setHealthDecDone(true)
                  setActiveForm(null)
                }}
              />
            )}
          </div>
        )}

        {/* Everything below this point is gated on the Day 0 intake being done.
            Until the intake is complete (either via prior scorecard data or via
            the in-portal Body Decode Intake form above), the rest of the
            Challenge surface stays hidden so the enroller can't skip the
            state-capture step. */}
        {intakeDone && (
        <>
        {formsComplete && (
          <div style={{
            background: 'rgba(27, 109, 252,0.06)', border: '1px solid rgba(27, 109, 252,0.2)',
            borderRadius: '10px', padding: '14px 18px', marginBottom: '32px',
            display: 'flex', gap: '10px', alignItems: 'center',
          }}>
            <span style={{ fontSize: '16px' }}>✓</span>
            <p style={{ fontSize: '13px', color: '#1B6DFC', fontWeight: 600, margin: 0 }}>
              You are cleared for training. All resources are unlocked.
            </p>
          </div>
        )}

        {/* Today's note */}
        {todayNote && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{
              background: '#FFFFFF', border: '1px solid #ECEEF2', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)',
              borderLeft: '3px solid #1B6DFC',
              borderRadius: '12px', padding: '22px 22px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                <img src={coach().photoUrl} width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={coach().firstName} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1A' }}>{coach().firstName}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Day {currentDay} · {todayNote.focus}</div>
                </div>
              </div>
              <p style={{ fontSize: '15px', color: '#3A3A3A', lineHeight: 1.75, margin: 0 }}>
                {todayNote.note}
              </p>
            </div>
          </div>
        )}

        {/* Resources */}
        <div style={{ marginBottom: '48px' }}>
          <SectionLabel icon={BookOpen} text="Your Resources" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {RESOURCES.map(r => (
              <ExpandableResource key={r.id} resource={r} />
            ))}
          </div>
        </div>

        {/* Day 5 Week One Progress Session — locked before Day 5, unlocks Day 5+ */}
        {currentDay < 5 && (
          <LockedMilestoneCard label="Week One Progress" unlockDay={5} currentDay={currentDay} />
        )}
        {currentDay >= 5 && (
          <div style={{ marginBottom: '48px' }}>
            <SectionLabel icon={LineChart} text="Week One Progress" />
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderLeft: '3px solid #1B6DFC',
              borderRadius: '14px',
              padding: '24px 26px',
              boxShadow: '0 1px 4px rgba(27, 109, 252, 0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#1056D6',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                }}>
                  Week One Progress Session
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700, color: '#6B6B6B',
                  background: '#F5F5F5', border: '1px solid #E5E5E5',
                  borderRadius: '99px', padding: '3px 9px',
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                }}>
                  On demand
                </span>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25 }}>
                Decode what your body has been doing this week.
              </p>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>
                A focused session walking you through exactly what has been happening in your biology, what the signals mean, and what Week 2 is building toward. Pre-recorded, watch any time.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                {[
                  'What your body has been doing this week',
                  'How to decode your biological signals',
                  'Why rhythm beats restriction every time',
                  'The shift from reset to results',
                ].map((item, i) => (
                  <div key={item} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <span style={{
                      fontSize: '11px', fontWeight: 800, color: '#1B6DFC',
                      fontFamily: '"Courier New",Consolas,monospace',
                      minWidth: '22px', paddingTop: '2px',
                    }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <p style={{ fontSize: '14px', color: '#3A3A3A', margin: 0, lineHeight: 1.6 }}>{item}</p>
                  </div>
                ))}
              </div>
              <a
                href={`/challenge/${token}/day-5`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 26px', borderRadius: '10px',
                  background: '#1B6DFC', color: '#FFFFFF',
                  fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF" stroke="none" style={{ flexShrink: 0 }}>
                  <polygon points="6,4 22,12 6,20" />
                </svg>
                Open Week One Progress Session
              </a>
            </div>
          </div>
        )}

        {/* Day 7 Body Decode Check-In — locked before Day 7. Stays on the Day 7
            page on Day 14+ as a permanent re-entry point to the 7-day progress
            view. Does NOT transform into the Day 14 Report — that lives in its
            own card below. */}
        {currentDay < 7 && (
          <LockedMilestoneCard label="Body Decode Check-In" unlockDay={7} currentDay={currentDay} />
        )}
        {currentDay >= 7 && (
          <div style={{ marginBottom: '48px' }}>
            <SectionLabel icon={ClipboardCheck} text="Body Decode Check-In" />
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderLeft: '3px solid #1B6DFC',
              borderRadius: '14px',
              padding: '24px 26px',
              boxShadow: '0 1px 4px rgba(27, 109, 252, 0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#1056D6',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                }}>
                  Day 7 · Body Decode Check-In
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: savedQuizResult ? '#1056D6' : '#6B6B6B',
                  background: savedQuizResult ? 'rgba(27,109,252,0.10)' : '#F5F5F5',
                  border: `1px solid ${savedQuizResult ? 'rgba(27,109,252,0.25)' : '#E5E5E5'}`,
                  borderRadius: '99px', padding: '3px 9px',
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                }}>
                  {savedQuizResult ? 'Progress in' : '5-10 min · Unlocked'}
                </span>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25 }}>
                {savedQuizResult
                  ? 'Your Day 7 progress is in.'
                  : 'Read the pattern your biology has settled into.'}
              </p>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>
                {savedQuizResult
                  ? `Your 7-day progress, marker breakdown, and Week 2 focus are on the Day 7 page.${currentDay < 14 ? ` Your full Body Decode Report arrives on Day 14. ${14 - currentDay} day${14 - currentDay === 1 ? '' : 's'} to go.` : ''}`
                  : 'It reads how your body has shifted this week to identify your specific pattern. Rate 8 biological markers, answer 2 signal questions. Your 7-day progress is shown immediately; your full Body Decode Report arrives on Day 14.'}
              </p>
              {/* Before completion this goes STRAIGHT to the form. It used to
                  point at /day-7, so a button labelled "Open Body Decode
                  Check-In" landed on a content page and asked for a second
                  click. Once completed it goes to /day-7, which is where the
                  progress read lives. */}
              <a
                href={savedQuizResult ? `/challenge/${token}/day-7` : `/challenge/${token}/check-in`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 26px', borderRadius: '10px',
                  background: '#1B6DFC', color: '#FFFFFF',
                  fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {savedQuizResult ? 'View your 7-day progress →' : 'Open Body Decode Check-In →'}
              </a>
            </div>
          </div>
        )}

        {/* Day 14 Body Decode Report — locked before Day 14, live Day 14+. Its
            own card so the report is a first-class milestone rather than a
            transform on the Day 7 card. If the user reaches Day 14 without a
            saved Check-In, the card sends them back to /day-7 to take it. */}
        {currentDay < 14 && (
          <LockedMilestoneCard label="Body Decode Report" unlockDay={14} currentDay={currentDay} />
        )}
        {currentDay >= 14 && (
          <div style={{ marginBottom: '48px' }}>
            <SectionLabel icon={FileText} text="Body Decode Report" />
            <div style={{
              background: '#FFFFFF',
              border: '1px solid #E5E5E5',
              borderLeft: '3px solid #1B6DFC',
              borderRadius: '14px',
              padding: '24px 26px',
              boxShadow: '0 1px 4px rgba(27, 109, 252, 0.06)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' as const }}>
                <span style={{
                  fontSize: '11px', fontWeight: 700, color: '#1056D6',
                  textTransform: 'uppercase' as const, letterSpacing: '0.12em',
                }}>
                  Day 14 · Body Decode Report
                </span>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  color: savedQuizResult ? '#1056D6' : '#B7791F',
                  background: savedQuizResult ? 'rgba(27,109,252,0.10)' : 'rgba(183,121,31,0.10)',
                  border: `1px solid ${savedQuizResult ? 'rgba(27,109,252,0.25)' : 'rgba(183,121,31,0.25)'}`,
                  borderRadius: '99px', padding: '3px 9px',
                  letterSpacing: '0.08em', textTransform: 'uppercase' as const,
                }}>
                  {savedQuizResult ? 'Report ready' : 'Action needed'}
                </span>
              </div>
              <p style={{ fontSize: '22px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', margin: '0 0 12px', lineHeight: 1.25 }}>
                {savedQuizResult
                  ? 'Your Body Decode Report is ready.'
                  : 'Take your Day 7 Check-In first.'}
              </p>
              <p style={{ fontSize: '15px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 20px' }}>
                {savedQuizResult
                  ? 'Open the Day 14 page for the full read. Your pattern, what it means, where it shows up, what it is NOT, and the three actions specific to your pattern.'
                  : 'Your Body Decode Report depends on the Day 7 Check-In. Take it now and your Report will unlock immediately.'}
              </p>
              <a
                href={`/challenge/${token}/${savedQuizResult ? 'day-14' : 'day-7'}`}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '14px 26px', borderRadius: '10px',
                  background: '#1B6DFC', color: '#FFFFFF',
                  fontSize: '14px', fontWeight: 800, textDecoration: 'none',
                  letterSpacing: '0.01em',
                }}
              >
                {savedQuizResult ? 'Open your Body Decode Report →' : 'Open Body Decode Check-In →'}
              </a>
            </div>
          </div>
        )}

        {/* Day 14 ascension CTA */}
        {currentDay >= 14 && (
          <div style={{
            background: 'linear-gradient(135deg, #B5CFFC 0%, #1B6DFC 100%)',
            border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '16px', padding: '28px 24px', marginBottom: '48px',
          }}>
            <SectionLabel icon={Compass} text="What comes next" />
            <p style={{ fontSize: '20px', fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em', marginBottom: '12px', lineHeight: 1.3 }}>
              You have built the foundation. Now build on it.
            </p>
            <p style={{ fontSize: '14px', color: '#1A1A1A', lineHeight: 1.7, marginBottom: '20px' }}>
              The 6-Week {brand().name} Blueprint takes everything you have started here and adds structure, pattern recognition, and education to help you understand exactly why your body responds the way it does.
                                              </p>
            <a
              href={`${brand().marketingDomain}/blueprint?source=challenge_day14_portal`}
              style={{
                display: 'inline-block', padding: '14px 24px', borderRadius: '10px',
                background: '#1B6DFC', color: '#FFFFFF',
                fontSize: '14px', fontWeight: 800, textDecoration: 'none',
              }}
            >
              See the 6-Week Blueprint
            </a>
          </div>
        )}
        </>
        )}

      </div>
    </div>
  )
}
