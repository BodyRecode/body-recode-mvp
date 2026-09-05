'use client'

import { useState, useEffect } from 'react'
import { Dumbbell, BookOpen, ClipboardCheck, ChevronRight, Salad, GraduationCap, Compass, ListChecks, X } from 'lucide-react'
import { logoUrl, brand, coach } from '@/config/tenant'
import { BLUEPRINT_LESSON_VIDEOS, BLUEPRINT_WELCOME_VIDEOS, BLUEPRINT_WELCOME_POSTERS } from '@/lib/video-urls'
import { resolveAssessmentPattern, type AssessmentSex } from '@/lib/pattern-taxonomy'

// Consistent icon-led header for each portal tab.
function TabHeader({ icon: Icon, title, subtitle, colour }: { icon: React.ElementType; title: string; subtitle: React.ReactNode; colour: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 28 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${colour}14`, color: colour, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} />
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: '#141821', letterSpacing: '-0.01em', margin: '0 0 4px' }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#666D7A', margin: 0, lineHeight: 1.6 }}>{subtitle}</p>
      </div>
    </div>
  )
}

// Hosted video player. Source is a Supabase storage URL from lib/video-urls,
// not a bundled public/ asset - see that file for why. preload="metadata" so
// the card renders instantly and the client only pulls the full file on play.
function VideoPlayer({ src, poster, aspect = '16 / 9' }: { src: string; poster?: string; aspect?: string }) {
  return (
    <video
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      style={{ width: '100%', aspectRatio: aspect, borderRadius: 12, background: '#0B0B0B', display: 'block' }}
    />
  )
}

// Branded video placeholder shown wherever a Blueprint video will embed but
// has not been produced yet. Swap for the real <VideoPlayer> when the
// asset lands. 16:9 by default.
function VideoPlaceholder({ label }: { label: string }) {
  return (
    <div style={{
      position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden',
      background: 'linear-gradient(135deg, #141821 0%, #0B1F3F 100%)', border: '1px dashed rgba(27,109,252,0.45)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 20,
    }}>
      <div style={{
        width: 54, height: 54, borderRadius: '50%', background: 'rgba(27,109,252,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, boxShadow: '0 6px 18px rgba(27,109,252,0.4)',
      }}>
        <div style={{ width: 0, height: 0, borderTop: '9px solid transparent', borderBottom: '9px solid transparent', borderLeft: '15px solid #FFFFFF', marginLeft: 4 }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 12, color: '#8FB4F5', letterSpacing: '0.04em' }}>In production with Amanda</div>
    </div>
  )
}

// Inline mechanism figures for the education lessons - the same diagrams as the
// /broll canvases, sized for the lesson card. Give immediate teaching value
// while the lesson videos are in production.
function LessonFigure({ eyebrow, caption, children }: { eyebrow: string; caption: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#FAFBFF', border: '1px solid #E9EEF9', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>{eyebrow}</div>
      {children}
      <div style={{ fontSize: 12, color: '#666D7A', marginTop: 10, lineHeight: 1.55 }}>{caption}</div>
    </div>
  )
}

const CORTISOL_CURVE = 'M50,130 C90,100 120,30 160,25 C210,18 245,60 300,92 C360,124 420,142 470,152 C500,158 520,161 530,163'
function CortisolCurveFigure() {
  return (
    <LessonFigure eyebrow="The cortisol curve" caption="Peaks 30 to 45 minutes after waking, declines through the day, and drops low by evening so melatonin can take over.">
      <svg viewBox="0 0 580 208" style={{ width: '100%', height: 'auto', display: 'block' }}>
        <defs>
          <linearGradient id="ccFig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B6DFC" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#1B6DFC" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="50" y1="180" x2="530" y2="180" stroke="#E8EAEE" strokeWidth="1.5" />
        <path d={`${CORTISOL_CURVE} L530,180 L50,180 Z`} fill="url(#ccFig)" />
        <path d={CORTISOL_CURVE} fill="none" stroke="#1B6DFC" strokeWidth="3" strokeLinecap="round" />
        <circle cx="50" cy="130" r="4.5" fill="#1B6DFC" />
        <circle cx="160" cy="25" r="5" fill="#1B6DFC" />
        <circle cx="530" cy="163" r="4.5" fill="#1B6DFC" />
        <text x="50" y="199" fill="#666D7A" fontSize="11" fontWeight="700" textAnchor="middle">WAKE</text>
        <text x="160" y="15" fill="#141821" fontSize="12" fontWeight="800" textAnchor="middle">PEAK</text>
        <text x="530" y="199" fill="#141821" fontSize="11" fontWeight="700" textAnchor="end">LOW BY EVENING</text>
      </svg>
    </LessonFigure>
  )
}

// Compact step-flow used by the insulin / testosterone / thyroid / sleep figures.
function ChipFlow({ steps, loop }: { steps: string[]; loop?: boolean }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'stretch', gap: 6 }}>
        {steps.map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            <div style={{ flex: 1, minWidth: 0, background: '#FFFFFF', border: '1px solid #E9EEF9', borderRadius: 9, padding: '12px 10px', textAlign: 'center', fontSize: 12.5, fontWeight: 600, color: '#141821', lineHeight: 1.3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s}</div>
            {i < steps.length - 1 && <div style={{ display: 'flex', alignItems: 'center', color: '#1B6DFC', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>→</div>}
          </div>
        ))}
      </div>
      {loop && <div style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', textAlign: 'center', marginTop: 10, letterSpacing: '0.04em' }}>↻ the loop reinforces itself</div>}
    </div>
  )
}

// Renders the matching mechanism figure for a lesson week.
function LessonDiagram({ week }: { week: number }) {
  if (week === 1) return <CortisolCurveFigure />
  if (week === 2) return (
    <LessonFigure eyebrow="The insulin loop" caption="While insulin is up, fat-burning is off. Meaningful gaps between meals let insulin clear so your body can burn fat again.">
      <ChipFlow steps={['Eat carbs', 'Insulin rises, fat-burning off', 'Gaps clear insulin', 'Fat-burning resumes']} />
    </LessonFigure>
  )
  if (week === 3) return (
    <LessonFigure eyebrow="The self-reinforcing loop" caption="Fat cells convert testosterone into oestrogen, which makes fat harder to lose - so the loop keeps running.">
      <ChipFlow steps={['More body fat', 'More aromatase', 'Testosterone to oestrogen', 'Harder to lose fat']} loop />
    </LessonFigure>
  )
  if (week === 4) return (
    <LessonFigure eyebrow="The famine response" caption="Your body cannot tell a diet from a famine. Cut food hard and it slows the metabolic rate to match.">
      <ChipFlow steps={['Cut food hard', 'Body reads famine', 'Less T4 to T3', 'Metabolic rate slows']} />
    </LessonFigure>
  )
  if (week === 5) return (
    <LessonFigure eyebrow="What sleep resets" caption="Every major hormone resets overnight. Poor sleep quietly undoes the work the rest of the programme is doing.">
      <ChipFlow steps={['Cortisol resets', 'Insulin restored', 'Testosterone made', 'Growth hormone pulses']} />
    </LessonFigure>
  )
  return null
}

type Enrollment = {
  id: string
  first_name: string
  email: string
  token: string
  pattern: string
  pattern_source: string
  pattern_confirmed_at: string | null
  purchase_date: string
  current_week: number
}

const PATTERN_CONFIG: Record<string, { label: string; colour: string; description: string }> = {
  'stress-stored': {
    label: 'Stress-Stored',
    colour: '#DC2626',
    description: 'Your programme is built around lowering cortisol load, supporting your stress hormone curve, and creating the biological conditions for your body to release stored fat.',
  },
  'metabolic-drift': {
    label: 'Insulin-Drift',
    colour: '#B7791F',
    description: 'Your programme is built around restoring insulin sensitivity, stabilising blood sugar across the day, and timing your nutrition to work with your metabolic rhythm. The storage across your back and sides comes down as insulin signalling rebuilds.',
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift',
    colour: '#8b5cf6',
    description: 'Your programme is built around supporting oestrogen balance, avoiding the restriction patterns that make this pattern worse, and prioritising recovery as a training variable. Cycle-aware adjustments are layered throughout.',
  },
  'system-overload': {
    label: 'Androgen-Decline',
    colour: '#1B6DFC',
    description: 'Your programme is built around protecting muscle, controlling load, and rebuilding the conditions that support testosterone signalling. Recovery is the lever. Drive and capacity return as the system comes back online.',
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
  // changeMode = buyer is adjusting a pattern that was already carried in (not
  // the first-time pending assessment), so post to confirm-pattern, not set-pattern.
  changeMode?: boolean
}

function PatternAssessment({ onComplete, token, changeMode }: PatternAssessmentProps) {
  const [q1, setQ1] = useState('')
  const [q2, setQ2] = useState('')
  const [sex, setSex] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Storage location leads the read. Wording follows Fat_Map_Definitions_LOCKED v2.0:
  // front vs back is what separates the two midsection patterns, and androgen is a
  // composition shift rather than a place.
  const q1Options = [
    { value: 'stress-stored', label: 'Front of the stomach and waist - while arms and legs stay lean' },
    { value: 'metabolic-drift', label: 'Mid-back, lower back and love handles - more the back and sides than the front' },
    { value: 'hormonal-shift', label: 'Hips, glutes and outer thighs' },
    { value: 'system-overload', label: 'Not one place - the middle is filling while muscle and tone are dropping' },
  ]

  const q2Options = [
    { value: 'stress-stored', label: 'Exhausted but wired - tired but cannot switch off at night' },
    { value: 'metabolic-drift', label: 'Heavy and sluggish - especially after meals or mid-afternoon' },
    { value: 'hormonal-shift', label: 'Hormonally inconsistent - mood shifts, water retention, or cycle disruption' },
    { value: 'system-overload', label: 'Strength and drive falling - not depleted, just less capable than I was' },
  ]

  // Sex is a hard gate: Estrogen-Shift is female only, Androgen-Decline male only.
  const sexOptions = [
    { value: 'F', label: 'Female' },
    { value: 'M', label: 'Male' },
  ]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!q1 || !q2 || !sex) return
    setSubmitting(true)

    // Storage leads, signal confirms, sex hard-gates. Resolved server-side so the
    // doctrine lives in one place. Ref: Fat_Map_Definitions_LOCKED.md v2.0.
    const resolved = resolveAssessmentPattern({
      storage: q1,
      signal: q2,
      sex: sex as AssessmentSex,
    })
    if (!resolved) { setSubmitting(false); return }

    await fetch(changeMode ? '/api/blueprint/confirm-pattern' : '/api/blueprint/set-pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        changeMode
          ? { token, pattern: resolved, change: true }
          : { token, storage: q1, signal: q2, sex },
      ),
    })
    onComplete(resolved)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <img src={logoUrl()} width={110} alt={brand().name} style={{ display: 'block', marginBottom: 40 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#141821', margin: '0 0 12px', fontFamily: 'system-ui, sans-serif' }}>
          {changeMode ? 'Choose your pattern' : 'One last step before your portal opens'}
        </h1>
        <p style={{ fontSize: 15, color: '#666D7A', lineHeight: 1.75, margin: '0 0 36px', fontFamily: 'system-ui, sans-serif' }}>
          Three questions to identify your biological pattern. This determines how your programme is built.
        </p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#43474F', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Biological sex
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sexOptions.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: sex === opt.value ? '#E8EAEE' : '#FFFFFF', border: `1px solid ${sex === opt.value ? '#1B6DFC' : '#CFD4DC'}`, borderRadius: 8 }}>
                  <input type="radio" name="sex" value={opt.value} checked={sex === opt.value} onChange={() => setSex(opt.value)} style={{ marginTop: 2, accentColor: '#1B6DFC' }} />
                  <span style={{ fontSize: 14, color: '#141821', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: 13, color: '#8A8A8A', lineHeight: 1.6, margin: '10px 0 0', fontFamily: 'system-ui, sans-serif' }}>
              Two of the four patterns are sex-specific, so this changes which reads are possible.
            </p>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#43474F', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Where do you most notice excess puffiness or softness in your body?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q1Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q1 === opt.value ? '#E8EAEE' : '#FFFFFF', border: `1px solid ${q1 === opt.value ? '#1B6DFC' : '#CFD4DC'}`, borderRadius: 8 }}>
                  <input type="radio" name="q1" value={opt.value} checked={q1 === opt.value} onChange={() => setQ1(opt.value)} style={{ marginTop: 2, accentColor: '#1B6DFC' }} />
                  <span style={{ fontSize: 14, color: '#141821', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#43474F', margin: '0 0 16px', fontFamily: 'system-ui, sans-serif' }}>
              Which of these fits most closely right now?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {q2Options.map(opt => (
                <label key={opt.value} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', background: q2 === opt.value ? '#E8EAEE' : '#FFFFFF', border: `1px solid ${q2 === opt.value ? '#1B6DFC' : '#CFD4DC'}`, borderRadius: 8 }}>
                  <input type="radio" name="q2" value={opt.value} checked={q2 === opt.value} onChange={() => setQ2(opt.value)} style={{ marginTop: 2, accentColor: '#1B6DFC' }} />
                  <span style={{ fontSize: 14, color: '#141821', lineHeight: 1.6, fontFamily: 'system-ui, sans-serif' }}>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
          <button
            type="submit"
            disabled={!q1 || !q2 || !sex || submitting}
            style={{ padding: '15px', background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none', cursor: (!q1 || !q2 || submitting) ? 'not-allowed' : 'pointer', opacity: (!q1 || !q2 || submitting) ? 0.5 : 1, fontFamily: 'system-ui, sans-serif' }}
          >
            {submitting ? 'Opening your portal...' : 'Open my Blueprint'}
          </button>
        </form>
      </div>
    </div>
  )
}

function PatternConfirm({ pattern, source, token, firstName, onConfirm, onAdjust }: {
  pattern: string
  source: string
  token: string
  firstName: string
  onConfirm: () => void
  onAdjust: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const fromChallenge = source === 'challenge'
  const intro = fromChallenge
    ? 'From your 14-Day Challenge, your biological pattern came back as'
    : 'Based on your Readiness Scorecard, your biological pattern looks like'
  // Both branches have to leave the door genuinely open. The Challenge read is
  // the strongest signal in the funnel, but it is still a read, and stating it
  // as settled is what stopped buyers correcting it before Week 1.
  const note = fromChallenge
    ? 'That came from your full 14-day read, which is the strongest signal we have on you. If your bloods, your history, or your own sense of it point somewhere else, change it now rather than six weeks in.'
    : 'This is a preliminary read from your scorecard. Confirm to start, or choose a different pattern if it does not fit what you are experiencing.'

  async function confirm() {
    setSubmitting(true)
    await fetch('/api/blueprint/confirm-pattern', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    onConfirm()
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div style={{ maxWidth: 560, width: '100%' }}>
        <img src={logoUrl()} width={110} alt={brand().name} style={{ display: 'block', marginBottom: 40 }} />
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#141821', margin: '0 0 12px', fontFamily: 'system-ui, sans-serif' }}>
          {firstName ? `Welcome, ${firstName}.` : 'Welcome.'}
        </h1>
        <p style={{ fontSize: 15, color: '#666D7A', lineHeight: 1.75, margin: '0 0 24px', fontFamily: 'system-ui, sans-serif' }}>
          {intro}:
        </p>
        <div style={{ border: `1px solid ${config.colour}`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 22px', marginBottom: 20, background: `${config.colour}0A` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: config.colour }} />
            <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#141821', fontFamily: 'system-ui, sans-serif' }}>{config.label}</p>
          </div>
          <p style={{ margin: 0, fontSize: 14, color: '#43474F', lineHeight: 1.65, fontFamily: 'system-ui, sans-serif' }}>{config.description}</p>
        </div>
        <p style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.7, margin: '0 0 28px', fontFamily: 'system-ui, sans-serif' }}>{note}</p>
        <button
          onClick={confirm}
          disabled={submitting}
          style={{ width: '100%', padding: '15px', background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: 15, borderRadius: 8, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.5 : 1, fontFamily: 'system-ui, sans-serif' }}
        >
          {submitting ? 'Opening your Blueprint...' : 'Confirm & open my Blueprint'}
        </button>
        <button
          onClick={onAdjust}
          disabled={submitting}
          style={{ width: '100%', marginTop: 12, padding: '13px', background: 'transparent', color: '#666D7A', fontWeight: 600, fontSize: 14, borderRadius: 8, border: '1px solid #CFD4DC', cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'system-ui, sans-serif' }}
        >
          Choose a different pattern
        </button>
      </div>
    </div>
  )
}

const FOUNDATION_FOODS = [
  { category: 'Protein', examples: 'Beef, chicken, eggs, pork, lamb, turkey, seafood, yoghurt, cottage cheese', note: 'Anchor every meal with protein first' },
  { category: 'Fat', examples: 'Butter, ghee, coconut oil, avocado, cheese, egg yolks, tallow', note: 'Your energy source between meals' },
  { category: 'Fruit', examples: 'Bananas, berries, pineapple, apples, oranges, grapes, mango', note: 'Primary carbohydrate source every day' },
  { category: 'Post-Training Carbs', examples: 'White rice, potatoes, sweet potato, honey', note: 'Post-training window only' },
]

const REMOVE_FOODS = [
  'Seed oils (canola, sunflower, vegetable)',
  'Processed and packaged foods',
  'Refined sugar',
  'Bread, pasta, cereals, wraps',
  'Alcohol',
  'Flavoured drinks and juice',
  'Protein bars and diet foods',
  'Fast food and takeaway',
]

const PORTION_GUIDE = [
  { food: 'Protein', measure: '1-2 palms', detail: 'Per meal. A palm is roughly 100-150g cooked meat or 2-3 eggs.' },
  { food: 'Fat', measure: '1 thumb', detail: 'Per meal. One thumb = roughly 1 tbsp butter or ghee, or half an avocado.' },
  { food: 'Fruit', measure: '1-2 fists', detail: 'Per day total. A fist = one medium piece of fruit or a large handful of berries.' },
  { food: 'Starchy Carbs', measure: '1-2 cupped hands', detail: 'Post-training only. One cupped hand = roughly 100-150g cooked rice or potato.' },
]

const PATTERN_PORTIONS: Record<string, { note: string; adjustments: string[] }> = {
  'stress-stored': {
    note: 'Standard portions apply. The key rule is never under-eat - restriction spikes cortisol and works against this pattern directly.',
    adjustments: [
      'Protein: 2 palms per meal minimum - supports cortisol regulation',
      'Fat: generous - 1 thumb minimum per meal, more is fine',
      'Starchy carbs: 1 cupped hand post-training. Do not add extra on rest days.',
      'Do not reduce portions if you are not hungry - eat the meal anyway and build the rhythm',
    ],
  },
  'metabolic-drift': {
    note: 'Portion size matters most at the post-training carb window. Keep starchy carb portions measured - this is where insulin is most active.',
    adjustments: [
      'Protein: 2 palms per meal - always eat protein before anything else',
      'Fat: 1 thumb per meal on rest days, reduce slightly post-training to allow carbs to do the work',
      'Starchy carbs: 1 cupped hand post-training to start. Increase to 2 cupped hands only if performance drops.',
      'Fruit: 1 fist on rest days - choose lower-GI options (berries, apple). Freely on training days.',
    ],
  },
  'hormonal-shift': {
    note: 'Generous portions are part of the protocol, not a concession. Inadequate fat and calorie intake directly suppresses the hormones this pattern needs to shift.',
    adjustments: [
      'Protein: 2 palms per meal minimum',
      'Fat: 1-2 thumbs per meal - this pattern requires more fat than others',
      'Starchy carbs: 1-2 cupped hands post-training. Do not restrict on training days.',
      'Include starchy carbs 2-3 times per week even on rest days if energy is low - this pattern does not respond well to strict carb cycling',
    ],
  },
  'system-overload': {
    note: 'Eat full portions at every meal without question. Your nervous system is already running a deficit - under-eating extends the recovery timeline.',
    adjustments: [
      'Protein: 2 palms per meal - red meat at least once per day (beef or lamb)',
      'Fat: 1-2 thumbs per meal. Never low-fat.',
      'Starchy carbs: 1-2 cupped hands post-training. Do not skip this.',
      'If appetite is low, prioritise protein and fat over volume - a smaller meal with adequate protein and fat is better than a large low-protein meal',
    ],
  },
}

const PATTERN_NUTRITION: Record<string, {
  headline: string
  rules: string[]
  avoid: string[]
  phaseNotes: { phase: string; weeks: string; note: string }[]
}> = {
  'stress-stored': {
    headline: 'Cortisol is the driver. Your nutrition strategy is built around keeping it calm - not spiking it further with restriction, skipped meals, or caffeine.',
    rules: [
      'Eat breakfast within 1 hour of waking - skipping breakfast spikes morning cortisol',
      'Never train fasted - eat a small meal before every session',
      'No caffeine after 12pm - afternoon caffeine elevates cortisol into the evening',
      'Do not skip meals - undereating is a physiological stressor',
      'Evening meal is protein and fat only - no stimulants, no sugar',
      'Salt and water on waking every morning - supports adrenal function',
      'Prioritise magnesium-rich foods: pumpkin seeds, leafy greens, dark chocolate',
    ],
    avoid: [
      'Fasted training',
      'Caffeine after 12pm',
      'Skipped meals or intentional restriction',
      'Alcohol - elevates cortisol and disrupts sleep architecture',
      'Late-night carbohydrates',
    ],
    phaseNotes: [
      { phase: 'Regulate', weeks: '1-2', note: 'Remove the foods list. Establish the three-meal rhythm. Do not restrict calories - focus on food quality only.' },
      { phase: 'Adapt', weeks: '3-4', note: 'Post-training carb window is active. Tighten the meal rhythm. Assess sleep quality - nutrition adjustments should follow sleep.' },
      { phase: 'Embed', weeks: '5-6', note: 'Maintain the structure. Week 6 deload: reduce overall food volume slightly in line with reduced training output.' },
    ],
  },
  'metabolic-drift': {
    headline: 'Insulin sensitivity is the target. Every nutrition decision is made through the lens of blood glucose - when you eat carbs, how much, and what you do after.',
    rules: [
      'Train fasted or semi-fasted where possible - improves insulin response',
      'Post-training carb window is 90 minutes maximum - strict for this pattern',
      'Walk 15-20 minutes after every meal - clears post-meal blood glucose significantly',
      'Protein first at every meal - always eat protein before carbohydrates',
      'Eliminate snacking - longer fasting gaps between meals restore insulin sensitivity',
      'Rest days: protein, fat, and fruit only - no starchy carbs',
      'Choose lower-GI fruit on rest days: berries, apples, pears over banana or mango',
    ],
    avoid: [
      'Snacking between meals',
      'Starchy carbs on rest days',
      'Fruit juice - spikes glucose without fibre',
      'High-GI fruit outside the training window',
      'Eating carbohydrates before protein at any meal',
    ],
    phaseNotes: [
      { phase: 'Regulate', weeks: '1-2', note: 'Remove the foods list. Establish the two-meal or three-meal rhythm with no snacking. Post-training carb window begins immediately.' },
      { phase: 'Adapt', weeks: '3-4', note: 'Tighten carb timing. Increase post-training carb volume if performance is improving. Continue walking after meals.' },
      { phase: 'Embed', weeks: '5-6', note: 'Carb flexibility increases slightly. Introduce one extra starchy carb meal per week if energy and recovery support it.' },
    ],
  },
  'hormonal-shift': {
    headline: 'Restriction makes this pattern worse. Your nutrition strategy is built around adequacy - enough fat, enough calories, and enough consistency to support hormone production.',
    rules: [
      'Dietary fat is non-negotiable - hormones are synthesised from cholesterol, never go low-fat',
      'Do not restrict calories significantly - the hormonal axis responds badly to sustained restriction',
      'Include carbohydrates regularly - not just post-training, hormonal health requires consistent glucose availability',
      'Prioritise omega-3 rich foods: salmon, sardines, eggs, grass-fed beef',
      'Weeks 3-4 may require more fat and carbohydrates if cycle timing creates energy demands - listen and adjust',
      'Full-fat dairy is encouraged: yoghurt, cheese, butter',
      'Eat three full meals per day - do not skip',
    ],
    avoid: [
      'Low-fat or fat-free products',
      'Calorie restriction or intentional undereating',
      'Skipped meals',
      'Alcohol - disrupts oestrogen metabolism',
      'Excess caffeine - over 2 cups per day adds hormonal load',
    ],
    phaseNotes: [
      { phase: 'Regulate', weeks: '1-2', note: 'Remove the foods list. Prioritise food quality and three consistent meals. Fat intake should be generous from day one.' },
      { phase: 'Adapt', weeks: '3-4', note: 'If cycle timing is disrupting energy in this phase, increase fat and carbohydrate volume. Do not reduce - this is a recovery input.' },
      { phase: 'Embed', weeks: '5-6', note: 'Maintain the structure. Week 6 deload: food volume stays the same - do not reduce nutrition because training volume drops.' },
    ],
  },
  'system-overload': {
    headline: 'Your nervous system is under load. Nutrition is a recovery tool - the goal is nutrient density and adequacy, not restriction or optimisation.',
    rules: [
      'Always eat before training - never fasted, the nervous system needs fuel',
      'Prioritise red meat: beef and lamb are highest in zinc and iron, both critical for neurological recovery',
      'Magnesium every evening - food sources or supplement: pumpkin seeds, dark chocolate, leafy greens',
      'Limit caffeine to one coffee, before noon - excess caffeine increases neurological load',
      'Three meals minimum per day - undereating is a stressor your system cannot currently manage',
      'Post-training carb window is active and important - do not skip it',
      'Protein at every meal without exception',
    ],
    avoid: [
      'Fasted training',
      'Calorie restriction of any kind',
      'Skipped meals',
      'Caffeine after 12pm or more than one coffee per day',
      'Alcohol - neurological recovery is already compromised',
    ],
    phaseNotes: [
      { phase: 'Regulate', weeks: '1-2', note: 'Remove the foods list. Focus on consistency and adequacy. Do not attempt to reduce food volume - the goal is quality, not restriction.' },
      { phase: 'Adapt', weeks: '3-4', note: 'Post-training carb window becomes more important as training load gradually increases. Prioritise sleep and magnesium alongside nutrition.' },
      { phase: 'Embed', weeks: '5-6', note: 'Maintain full food volume through the deload week. Recovery is the stimulus - nutrition supports it.' },
    ],
  },
}

function MorningToggle({ preTrainingNote }: { preTrainingNote: string }) {
  const [timing, setTiming] = useState<'later' | 'morning'>('later')

  const rhythms = {
    later: [
      { time: 'On waking', food: '500ml water + pinch of salt', note: 'Before anything else' },
      { time: 'Breakfast', food: 'Protein + fat', note: 'Eggs in butter, yoghurt + berries, or similar' },
      { time: 'Pre-training', food: 'Salt + water', note: 'Add small fruit or honey if needed' },
      { time: 'Post-training', food: 'Whey + fruit', note: 'Within 30 minutes' },
      { time: 'Post-training meal', food: 'Protein + starchy carbs', note: 'Beef + rice, chicken + potato' },
      { time: 'Evening meal', food: 'Protein + fat', note: 'No starchy carbs' },
    ],
    morning: [
      { time: 'On waking', food: '500ml water + pinch of salt', note: 'Before anything else' },
      { time: 'Pre-training', food: preTrainingNote, note: '15-20 min before training' },
      { time: 'Post-training', food: 'Whey + fruit', note: 'Within 30 minutes of finishing' },
      { time: 'Breakfast', food: 'Protein + starchy carbs', note: 'This is your post-training meal - beef + rice, eggs + potato' },
      { time: 'Lunch', food: 'Protein + fat', note: 'Standard meal, no starchy carbs' },
      { time: 'Evening meal', food: 'Protein + fat', note: 'No starchy carbs' },
    ],
  }

  return (
    <div>
      <div style={{ display: 'flex', background: '#E8EAEE', borderRadius: 8, padding: 3, gap: 2, marginBottom: 16, width: 'fit-content' }}>
        {([{ id: 'later', label: 'Train Later in Day' }, { id: 'morning', label: 'Train First Thing' }] as const).map(t => (
          <button key={t.id} onClick={() => setTiming(t.id)} style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600, color: timing === t.id ? '#FFFFFF' : '#43474F', background: timing === t.id ? '#1B6DFC' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {rhythms[timing].map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 16, padding: '11px 0', borderBottom: i < rhythms[timing].length - 1 ? '1px solid #E8EAEE' : 'none' }}>
            <span style={{ fontSize: 12, color: '#43474F', paddingTop: 1 }}>{row.time}</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#141821', marginBottom: 2 }}>{row.food}</div>
              <div style={{ fontSize: 12, color: '#3d3935' }}>{row.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NutritionTab({ pattern }: { pattern: string }) {
  const [section, setSection] = useState<'overview' | 'portions' | 'foundation' | 'meals'>('overview')
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const nutritionData = PATTERN_NUTRITION[pattern] ?? PATTERN_NUTRITION['stress-stored']

  return (
    <div>
      <TabHeader icon={Salad} colour={config.colour} title="Nutrition Framework"
        subtitle={<>Built on the HABNS foundation with {config.label} pattern emphasis applied across all 6 weeks.</>} />

      {/* Section nav */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {([
          { id: 'overview', label: 'Your Pattern' },
          { id: 'portions', label: 'Portions' },
          { id: 'foundation', label: 'Foundation Foods' },
          { id: 'meals', label: 'Meal Builder' },
        ] as const).map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 600, color: section === s.id ? '#FFFFFF' : '#43474F', background: section === s.id ? '#1B6DFC' : '#FFFFFF', border: `1px solid ${section === s.id ? '#1B6DFC' : '#CFD4DC'}`, borderRadius: 8, cursor: 'pointer' }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === 'overview' && (
        <div>
          {/* Pattern headline */}
          <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              {config.label} - Nutrition Strategy
            </div>
            <p style={{ fontSize: 14, color: '#43474F', margin: 0, lineHeight: 1.75 }}>{nutritionData.headline}</p>
          </div>

          {/* Pattern rules */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Rules for Your Pattern
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {nutritionData.rules.map((rule, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{rule}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Avoid */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Avoid for 6 Weeks
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {nutritionData.avoid.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: '#E8EAEE', border: '1px solid #CFD4DC', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={9} strokeWidth={3} color="#DC2626" />
                  </div>
                  <span style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phase notes */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Phase Adjustments
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {nutritionData.phaseNotes.map((row, i) => (
                <div key={i} style={{ paddingBottom: i < 2 ? 16 : 0, marginBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? '1px solid #E8EAEE' : 'none' }}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>{row.phase}</span>
                    <span style={{ fontSize: 12, color: '#43474F' }}>Weeks {row.weeks}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.65 }}>{row.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'portions' && (
        <div>
          {/* How to measure */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              How to Measure
            </div>
            <p style={{ fontSize: 13, color: '#666D7A', margin: '0 0 16px', lineHeight: 1.7 }}>
              Use your hand as your measuring tool. It scales to your body size automatically - no scales or tracking required.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 110px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid #E8EAEE', marginBottom: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Food</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Measure</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>What That Means</span>
              </div>
              {PORTION_GUIDE.map((row, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 110px 1fr', gap: 12, padding: '12px 0', borderBottom: i < PORTION_GUIDE.length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#141821' }}>{row.food}</span>
                  <span style={{ fontSize: 13, color: '#1B6DFC', fontWeight: 600 }}>{row.measure}</span>
                  <span style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.5 }}>{row.detail}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pattern-specific portion note */}
          <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>
              {config.label} - Portion Notes
            </div>
            <p style={{ fontSize: 13, color: '#43474F', margin: '0 0 16px', lineHeight: 1.75 }}>
              {PATTERN_PORTIONS[pattern]?.note}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PATTERN_PORTIONS[pattern]?.adjustments.map((adj, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{adj}</span>
                </div>
              ))}
            </div>
          </div>

          {/* General rule */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '18px 20px' }}>
            <p style={{ fontSize: 13, color: '#43474F', margin: 0, lineHeight: 1.7 }}>
              These are starting portions. If you are losing weight too fast, add more protein and fat. If you are not progressing, review the avoid list and tighten carb timing before adjusting portions.
            </p>
          </div>
        </div>
      )}

      {section === 'foundation' && (
        <div>
          {/* Foundation foods */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Foundation Foods
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {FOUNDATION_FOODS.map((food, i) => (
                <div key={i} style={{ paddingBottom: i < FOUNDATION_FOODS.length - 1 ? 16 : 0, marginBottom: i < FOUNDATION_FOODS.length - 1 ? 16 : 0, borderBottom: i < FOUNDATION_FOODS.length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#141821', marginBottom: 4 }}>{food.category}</div>
                  <div style={{ fontSize: 13, color: '#43474F', marginBottom: 4, lineHeight: 1.6 }}>{food.examples}</div>
                  <div style={{ fontSize: 12, color: '#43474F' }}>{food.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Remove list */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Remove for 6 Weeks (All Patterns)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REMOVE_FOODS.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: '#E8EAEE', border: '1px solid #CFD4DC', flexShrink: 0, marginTop: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <X size={9} strokeWidth={3} color="#DC2626" />
                  </div>
                  <span style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hydration */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Hydration
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                '2-3 litres of water daily',
                'Pinch of salt in your first glass every morning',
                'Electrolytes during training',
                'Coffee is fine - maximum 2 cups, before noon',
                'No flavoured drinks, juice, or soft drinks',
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B6DFC', marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.6 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {section === 'meals' && (
        <div>
          {/* Meals per day */}
          {(() => {
            const mealsConfig: Record<string, { count: string; note: string }> = {
              'stress-stored': { count: '3 meals per day', note: 'Breakfast, lunch, and dinner. Never skip. Snacking is fine if genuinely hungry - protein and fat only.' },
              'metabolic-drift': { count: '2-3 meals per day', note: 'Three meals is the default. Some do well on two larger meals with a longer gap between. No snacking either way - the fasting window between meals is part of the protocol.' },
              'hormonal-shift': { count: '3 meals per day', note: 'Three full meals every day without exception. Do not attempt two meals or intermittent fasting - this pattern requires consistent fuel for hormone production.' },
              'system-overload': { count: '3 meals per day', note: 'Three meals minimum. If appetite is low, still eat - prioritise protein and fat even if the meal is small. Skipping is not an option for this pattern.' },
            }
            const mc = mealsConfig[pattern] ?? mealsConfig['stress-stored']
            return (
              <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Meals Per Day
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#141821', marginBottom: 8 }}>{mc.count}</div>
                <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.7 }}>{mc.note}</p>
              </div>
            )
          })()}

          {/* Daily rhythm */}
          {(() => {
            const isMetabolic = pattern === 'metabolic-drift'
            const isStressStored = pattern === 'stress-stored'
            const isSystemOverload = pattern === 'system-overload'
            const preTrainingNote = isMetabolic
              ? 'Water + electrolytes only. Fasted is ideal for this pattern.'
              : isStressStored || isSystemOverload
              ? 'Small snack required - banana, honey, or yoghurt. Never fully fasted.'
              : 'Small snack - banana or yoghurt. Keep it light.'
            return (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
                  Daily Rhythm - Training Day
                </div>
                {/* Toggle */}
                <MorningToggle preTrainingNote={preTrainingNote} />
              </div>
            )
          })()}

          {/* Meal builder */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Meal Builder
            </div>
            <p style={{ fontSize: 13, color: '#666D7A', margin: '0 0 16px', lineHeight: 1.7 }}>Every meal follows the same structure. Build each meal in this order.</p>
            {[
              { step: '1', label: 'Protein', detail: 'Always first. Beef, chicken, eggs, pork, lamb, seafood, yoghurt.' },
              { step: '2', label: 'Fat', detail: 'Every meal. Butter, ghee, avocado, cheese, egg yolks, coconut oil.' },
              { step: '3', label: 'Fruit', detail: 'Daily carbohydrate base. Any fruit you enjoy. Eat freely.' },
              { step: '4', label: 'Starchy Carbs', detail: 'Post-training window only. Rice, potato, sweet potato, honey.' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: 16, paddingBottom: i < 3 ? 16 : 0, marginBottom: i < 3 ? 16 : 0, borderBottom: i < 3 ? '1px solid #E8EAEE' : 'none' }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#1B6DFC', border: '2px solid #1B6DFC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#FFFFFF' }}>{item.step}</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#141821', marginBottom: 3 }}>
                    {item.label}
                    {i === 3 && <span style={{ fontSize: 11, color: '#43474F', marginLeft: 8, fontWeight: 400 }}>post-training only</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.6 }}>{item.detail}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Example meals */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Example Meals
            </div>
            {[
              { label: 'Breakfast (every day)', items: ['3 eggs scrambled in butter + half an avocado', 'Cottage cheese + mixed berries + honey', 'Greek yoghurt + banana + pinch of salt'] },
              { label: 'Lunch or Dinner - Rest Day', items: ['Beef mince + avocado + salt + side of fruit', 'Chicken thighs cooked in butter + side of fruit', 'Salmon fillet + cucumber + avocado'] },
              { label: 'Post-Training Meal', items: ['Beef mince + white rice', 'Chicken thighs + potato + butter', 'Ground turkey + sweet potato', 'Whey protein + banana immediately post-session'] },
            ].map((group, i) => (
              <div key={i} style={{ paddingBottom: i < 2 ? 16 : 0, marginBottom: i < 2 ? 16 : 0, borderBottom: i < 2 ? '1px solid #E8EAEE' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#43474F', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{group.label}</div>
                {group.items.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: 10, marginBottom: j < group.items.length - 1 ? 6 : 0 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3d3935', marginTop: 7, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.6 }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Shopping list */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
              Shopping List
            </div>
            {[
              { label: 'Proteins', items: 'Beef mince, chicken thighs, eggs, salmon, pork, lamb, Greek yoghurt, cottage cheese, whey protein' },
              { label: 'Fats', items: 'Butter, ghee, coconut oil, avocados, cheddar cheese, egg yolks' },
              { label: 'Fruit', items: 'Bananas, mixed berries (fresh or frozen), pineapple, apples, oranges, mango' },
              { label: 'Post-Training Carbs', items: 'White rice, potatoes, sweet potato, raw honey' },
              { label: 'Hydration', items: 'Quality sea salt or Himalayan salt, electrolyte powder (no sugar)' },
              { label: 'Kitchen', items: 'Bone broth, herbs, spices, garlic, lemon' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < 5 ? 12 : 0, marginBottom: i < 5 ? 12 : 0, borderBottom: i < 5 ? '1px solid #E8EAEE' : 'none' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#43474F', minWidth: 120, paddingTop: 1 }}>{row.label}</div>
                <div style={{ fontSize: 13, color: '#43474F', lineHeight: 1.6 }}>{row.items}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const LESSONS = [
  {
    week: 1,
    title: 'Cortisol and the Stress Response',
    sections: [
      { heading: 'What it is', body: 'Cortisol is your primary stress hormone, produced by the adrenal glands and regulated by the HPA axis - a communication chain between the hypothalamus, pituitary gland, and adrenals. It follows a natural 24-hour curve: rising sharply within 30-45 minutes of waking to mobilise energy and sharpen focus, then declining gradually through the day so that melatonin can take over and drive sleep onset at night. In short bursts, cortisol is useful. It is anti-inflammatory, mobilises stored fuel, and prepares you for demands. The problem is not cortisol itself - it is cortisol that never switches off.' },
      { heading: 'What goes wrong', body: 'Chronic stress from poor sleep, overtraining, skipped meals, sustained psychological pressure, and excessive caffeine keeps the HPA axis in a constant state of activation. Cortisol stays elevated across the full day rather than following its natural curve. The body interprets prolonged elevation as a survival threat and responds accordingly: it increases fat storage, particularly visceral fat around the abdomen. It breaks down muscle tissue for fuel, which reduces metabolic rate. It disrupts sleep architecture, which compounds every other hormonal problem. Digestion slows, immune function is suppressed, and other hormone systems are actively downregulated to redirect resources toward the perceived threat.' },
      { heading: 'Why common approaches make it worse', body: 'Training harder and eating less are two of the most reliable ways to elevate cortisol further. High-intensity training without adequate recovery spikes cortisol acutely and keeps it elevated through the day. Calorie restriction triggers the same survival signalling - the body reads a food shortage as a stressor and responds by raising cortisol, storing more fat, and slowing metabolism. Both approaches feel productive but work directly against the biological correction this pattern needs.' },
      { heading: 'How it connects to the other hormones', body: 'Cortisol is the upstream driver for most of what goes wrong in the hormones covered in this series. It raises blood sugar independently of food intake through gluconeogenesis, which drives insulin resistance over time. It competes with reproductive hormones for the same cholesterol precursor molecules, directly suppressing oestrogen and progesterone. It blocks the conversion of thyroid T4 to active T3, reducing metabolic rate. And it is the single most consistent suppressor of testosterone. Normalising cortisol does not just reduce stress - it creates the conditions for every other hormone in this series to function correctly.' },
      { heading: 'Signs it is improving', body: 'Energy stabilises through the day rather than spiking in the morning and crashing in the afternoon. Sleep onset becomes easier and less restless. The urge to eat late at night - a classic cortisol-driven behaviour - reduces and eventually disappears. Morning energy begins to feel genuine rather than forced, and the dependence on immediate caffeine after waking lessens. Belly fat, which is typically the last to move in this pattern, begins to shift in Weeks 3-4 once the cortisol curve has come down enough for fat metabolism to resume.' },
    ],
    patternCallouts: {
      'stress-stored': 'Cortisol is your primary driver. The entire structure of your programme - controlled training intensity, sleep as a non-negotiable, eating within an hour of waking, no fasted training - is designed to bring this curve back down and keep it there.',
      'metabolic-drift': 'Cortisol raises blood sugar independently of food through a process called gluconeogenesis. As your cortisol load reduces through the programme, your insulin sensitivity improves as a direct downstream effect.',
      'hormonal-shift': 'Cortisol and reproductive hormones compete for the same cholesterol precursor molecules. When cortisol demand is high, oestrogen and progesterone production is suppressed. Reducing cortisol load is a primary lever for restoring hormonal balance in your pattern.',
      'system-overload': 'Your total neurological load is keeping cortisol elevated. Every recovery-first decision in your programme - controlled RIR, no finishers, extended rest periods, no extra sessions - is directly targeting cortisol reduction.',
    },
  },
  {
    week: 2,
    title: 'Insulin and Blood Sugar Control',
    sections: [
      { heading: 'What it is', body: 'Insulin is a peptide hormone produced by the beta cells of the pancreas. It is released every time blood glucose rises - primarily after carbohydrate intake, and to a lesser extent after protein. Its primary job is to move glucose out of the bloodstream and into cells, where it is used for immediate energy, stored as glycogen in muscle and liver, or converted to fat when glycogen is full. When this system is working correctly, insulin is released in small, efficient pulses. Blood sugar stabilises quickly after meals, energy is consistent between meals, and fat is accessible as fuel during fasting and training windows.' },
      { heading: 'What goes wrong', body: 'Repeated and excessive blood glucose spikes - from frequent meals, high-carbohydrate intake, snacking, and high-GI foods - gradually reduce how sensitive cells are to insulin. This is insulin resistance. The pancreas compensates by producing more insulin to achieve the same effect. Over time, chronically elevated insulin circulates even between meals. High circulating insulin signals the body to store fat rather than release it. Fat metabolism is effectively switched off for as long as insulin remains elevated. People with significant insulin resistance can be eating a moderate diet and still struggle to shift body composition because the hormonal environment will not allow it.' },
      { heading: 'Why common approaches make it worse', body: 'Frequent eating - including healthy snacking - keeps insulin elevated throughout the day and prevents the fasting windows where insulin drops and fat metabolism resumes. Low-fat diets replace fat with carbohydrates, increasing the glucose load per meal. Cardio-only training misses the most insulin-sensitising stimulus available - muscle contraction drives glucose uptake independently of insulin through a separate pathway. High-stress lifestyles raise cortisol, which raises blood sugar even without eating, producing an insulin response with no food intake at all.' },
      { heading: 'How it connects to the other hormones', body: 'Chronically elevated insulin drives oestrogen excess by stimulating aromatase - the enzyme that converts testosterone to oestrogen - and suppresses sex hormone binding globulin, making hormone levels harder to regulate. It contributes to elevated cortisol through the blood sugar crashes and stress responses that follow glucose spikes. Insulin resistance at the cellular level also reduces thyroid hormone sensitivity, meaning thyroid hormones may be present in circulation but cannot be effectively used. Improving insulin sensitivity creates downstream improvements across multiple hormone systems simultaneously.' },
      { heading: 'Signs it is improving', body: 'Afternoon energy crashes - typically between 2-3pm - reduce and eventually disappear. Hunger becomes more predictable and less urgent between meals, with fewer episodes of sudden, demanding cravings. The desire for sugar or refined carbohydrates after meals drops significantly. Sleep quality often improves as blood sugar stabilises overnight and no longer triggers cortisol spikes in the early hours. Body composition changes become visible, particularly in the lower abdomen, as fat metabolism becomes accessible again.' },
    ],
    patternCallouts: {
      'stress-stored': 'Cortisol raises blood sugar directly through gluconeogenesis - producing glucose from non-carbohydrate sources even without eating. As your cortisol curve normalises, this background blood sugar elevation reduces and insulin sensitivity improves alongside it.',
      'metabolic-drift': 'Insulin sensitivity is your primary target. Your post-training carb window, post-meal walks, fasted or semi-fasted training, and elimination of between-meal snacking are all working directly on this mechanism.',
      'hormonal-shift': 'Insulin resistance drives oestrogen excess through increased aromatase activity and suppressed sex hormone binding globulin. Improving insulin sensitivity is a direct lever for restoring the reproductive hormone balance your pattern needs.',
      'system-overload': 'One night of poor sleep - the norm in this pattern early in the programme - reduces insulin sensitivity by 20-30% the following day. As sleep quality improves through the programme, insulin function improves in parallel.',
    },
  },
  {
    week: 3,
    title: 'Testosterone and Muscle Signal',
    sections: [
      { heading: 'What it is', body: 'Testosterone is an androgen hormone produced primarily in the testes in men and in the ovaries and adrenal glands in women. While men carry significantly higher levels, testosterone is equally important for women - driving lean muscle maintenance, fat metabolism, energy, motivation, libido, sleep quality, and mood stability. It works as a body composition signal: when adequate, your body receives a consistent instruction to maintain and build muscle tissue. More functional muscle at rest means a higher basal metabolic rate, greater fat-burning capacity during training, and faster recovery between sessions.' },
      { heading: 'What goes wrong', body: 'Chronically elevated cortisol, excessive training load, calorie restriction, poor sleep, and excess body fat all suppress testosterone through distinct mechanisms. Cortisol and testosterone share an inverse relationship through shared HPA axis regulation. Overtraining creates a recovery deficit that lowers output. Calorie restriction signals scarcity, which downregulates anabolic hormones. Poor sleep reduces the overnight testosterone synthesis that accounts for the majority of daily production. And excess body fat matters because adipose tissue contains aromatase - the enzyme that converts testosterone to oestrogen. Higher body fat means more active conversion, creating an environment where testosterone is consistently depleted.' },
      { heading: 'Why common approaches make it worse', body: 'Training harder and eating less are the two most common responses to a stall in progress - and both suppress testosterone. The restriction trap is important to understand: cutting calories further reduces anabolic hormone output, slows metabolic rate, increases cortisol, and makes recovery harder. The person ends up working harder than ever for less result, which leads to more restriction and a further hormonal decline. The only exit from this cycle is reducing the suppressive inputs - not adding more of them.' },
      { heading: 'How it connects to the other hormones', body: 'Testosterone and cortisol are directly linked - as one rises chronically, the other falls. Insulin resistance reduces testosterone by suppressing production and increasing aromatase activity, compounding the body fat conversion problem. Thyroid health influences how testosterone is metabolised at the cellular level - subclinical thyroid suppression can impair utilisation even when production appears normal. Testosterone restoration therefore happens as a downstream effect of correcting the other hormones in this series, rather than being a target in isolation.' },
      { heading: 'Signs it is improving', body: 'Recovery between training sessions noticeably improves - less soreness, faster return to training readiness. Motivation and drive begin to return without needing to force them. Muscle definition starts to improve even at a similar body weight as muscle is maintained and fat reduces. Sleep becomes deeper and more restorative, and waking feels genuinely rested rather than reluctant. Energy between sessions is stable and consistent rather than feeling depleted for days after each workout.' },
    ],
    patternCallouts: {
      'stress-stored': 'Cortisol and testosterone have a direct inverse relationship - when one is elevated chronically, the other is suppressed. As your cortisol curve normalises through the programme, testosterone signal recovers as a direct downstream effect.',
      'metabolic-drift': 'Improving insulin sensitivity reduces aromatase activity and increases testosterone availability. The training protocol in your programme is specifically calibrated to stimulate testosterone without the cortisol spike that comes from training too intensely for your current recovery state.',
      'hormonal-shift': 'For women, the balance of testosterone relative to oestrogen and progesterone is the critical variable. Over-training and restriction both suppress testosterone and worsen the imbalance. Your programme protects against both.',
      'system-overload': 'Chronic neurological overload is one of the most reliable ways to suppress testosterone. The recovery-first structure of your programme - adequate food, controlled intensity, full rest days - creates the conditions for testosterone to restore.',
    },
  },
  {
    week: 4,
    title: 'Thyroid and Metabolic Rate',
    sections: [
      { heading: 'What it is', body: 'The thyroid is a small butterfly-shaped gland at the base of the throat that produces two primary hormones: T4 (thyroxine) and T3 (triiodothyronine). T4 is the inactive storage form - it circulates in the bloodstream until converted to active T3, primarily in the liver and peripheral tissues. T3 is the hormone that actually sets your metabolic rate. It governs how fast every cell in your body processes energy, regulates body temperature, heart rate, digestion speed, mood, and cognitive function. When thyroid function is optimal, your body burns fuel efficiently and body composition responds predictably to training and nutrition.' },
      { heading: 'What goes wrong', body: 'Three factors reliably suppress thyroid function. First, calorie restriction triggers a metabolic adaptation where T4 to T3 conversion is deliberately reduced - the body reads a food shortage as a threat and slows metabolism to match intake. Second, chronically elevated cortisol directly impairs T4 to T3 conversion, reducing active thyroid hormone even when T4 production by the gland appears normal on a blood test. Third, systemic inflammation from poor food quality, seed oil consumption, gut dysfunction, or chronic stress suppresses thyroid activity at the receptor level. The result is a metabolic rate that progressively decreases, making each attempt at fat loss harder than the last.' },
      { heading: 'Why common approaches make it worse', body: 'Reducing calories further is the most common response to a plateau - and the most reliable way to suppress thyroid output further. The body is not malfunctioning when it does this. It is executing a survival protocol that protected humans through famine. The problem is that this protocol is being triggered by lifestyle stress rather than actual food scarcity, and it is working exactly as designed. Each cycle of restriction and rebound leaves metabolic rate slightly lower than before. People end up needing to eat less and less to maintain the same weight - not because they have failed, but because the thyroid is adapting to every reduction.' },
      { heading: 'How it connects to the other hormones', body: 'Cortisol suppresses T4 to T3 conversion - addressing cortisol improves thyroid function as a downstream effect. Oestrogen excess in the hormonal-shift pattern can block thyroid receptors directly, meaning hormone is present in circulation but cannot be used at the cell. Insulin resistance at the cellular level also reduces thyroid hormone sensitivity. Thyroid function tends to be a downstream indicator of the overall hormonal environment rather than a standalone problem - it normalises as the other variables are corrected.' },
      { heading: 'Signs it is improving', body: 'Body temperature stabilises - persistent cold hands and feet, often dismissed as normal, reduce as T3 levels recover. Energy at rest improves and the dependence on caffeine to function through the day decreases. Digestion speeds up slightly and bloating reduces. Hair loss or excessive shedding - one of the more distressing but overlooked symptoms of subclinical thyroid suppression - often reduces noticeably within four to six weeks of metabolic improvement. Body composition begins to shift even without deliberate calorie reduction as metabolic rate recovers.' },
    ],
    patternCallouts: {
      'stress-stored': 'Cortisol impairs the conversion of inactive T4 to active T3. Reducing your cortisol load through the programme directly supports thyroid function - you do not need to target the thyroid separately.',
      'metabolic-drift': 'Thyroid function improves as insulin sensitivity is restored and systemic inflammation reduces. Both are direct targets of your programme structure. Metabolic rate recovery is a downstream effect of the primary work.',
      'hormonal-shift': 'Oestrogen excess can block thyroid receptors directly, reducing thyroid hormone effectiveness even when blood levels appear normal. Restoring hormonal balance through your programme removes this block and supports metabolic rate recovery.',
      'system-overload': 'Subclinical thyroid suppression is common in this pattern due to the combination of chronic stress load and often-inadequate food intake. The non-negotiable food volume in your programme protects thyroid output while recovery reduces the suppressive cortisol load.',
    },
  },
  {
    week: 5,
    title: 'Sleep Hormones and Recovery',
    sections: [
      { heading: 'What it is', body: 'Sleep is the primary biological recovery window and the reset mechanism for every hormone in this series. It is governed by two overlapping systems. Melatonin, produced by the pineal gland in response to darkness, drives sleep onset and regulates the circadian timing of the sleep cycle. Circadian rhythm is a 24-hour internal clock regulated by light exposure, meal timing, physical activity, and temperature - and it governs not just sleep but the timing of cortisol release, insulin sensitivity, testosterone production, and thyroid hormone activity across the full day. Growth hormone, the primary anabolic and tissue repair hormone, is released in pulses during slow-wave deep sleep and accounts for the majority of overnight recovery.' },
      { heading: 'What goes wrong', body: 'Artificial light at night - particularly blue light from screens - suppresses melatonin production and delays sleep onset. Irregular sleep and wake times destabilise circadian rhythm, reducing sleep quality even when total duration appears adequate. High evening cortisol - common in all four patterns - prevents the nervous system from downregulating enough for deep sleep to occur. Late meals elevate insulin during the sleep window, disrupting growth hormone release. Alcohol, while it may accelerate sleep onset, fragments sleep architecture significantly and reduces the deep sleep that does the actual recovery work.' },
      { heading: 'Why common approaches make it worse', body: 'Sleeping in on weekends to compensate for weekday sleep debt creates social jet lag - a misalignment between circadian rhythm and behaviour that reduces sleep quality further across the full week. Increasing training intensity to improve sleep often backfires when cortisol is already elevated - hard evening training raises cortisol and delays sleep onset. Using alcohol to wind down reduces the deep sleep that is the primary recovery mechanism, creating a cycle where it feels necessary to fall asleep but consistently undermines the quality of recovery.' },
      { heading: 'How it connects to the other hormones', body: 'Sleep is where every other hormone in this series undergoes its daily reset. Cortisol resets to its morning baseline during sleep - without adequate deep sleep, the following day begins with elevated baseline cortisol. Insulin sensitivity is restored overnight - poor sleep directly impairs it by 20-30% the next day. Testosterone synthesis occurs primarily during sleep, particularly in the first half of the night. Thyroid hormone activity is regulated by circadian rhythm, with T3 conversion peaking in alignment with the sleep-wake cycle. Improving sleep quality is not one variable among many - it is the upstream input that determines how effectively every other part of the programme is working.' },
      { heading: 'Signs it is improving', body: 'Falling asleep within 20 minutes of lying down without the mind racing. Waking without an alarm feeling genuinely rested rather than heavy and reluctant. Energy is stable from mid-morning through the afternoon without a 2-3pm crash. Mood and emotional resilience improve noticeably day to day. Physical recovery between training sessions accelerates - muscle soreness clears faster and the readiness to train returns sooner. The morning cortisol awakening response, which should feel like a natural energised rise, begins to feel that way rather than anxious or exhausted.' },
    ],
    patternCallouts: {
      'stress-stored': 'Sleep is treated as a training variable in your programme because it is one. Poor sleep is the single fastest way to spike cortisol and undo an entire week of work. If sleep quality is poor, your programme adjusts - reduce session intensity before anything else.',
      'metabolic-drift': 'One night of poor sleep reduces insulin sensitivity by 20-30% the following day. Given that insulin sensitivity is your primary target, sleep quality is not optional. It is part of the protocol.',
      'hormonal-shift': 'Deep sleep is when growth hormone peaks and reproductive hormones complete their daily reset cycle. Disrupted sleep directly disrupts the hormonal balance your programme is working to restore. Protecting sleep is protecting the result.',
      'system-overload': 'Sleep is the primary recovery stimulus for your nervous system - it outranks training in your programme. The highest-leverage action available to your pattern is consistent, high-quality sleep. Everything else is built around protecting it.',
    },
  },
]

function EducationTab({ pattern, currentWeek }: { pattern: string; currentWeek: number }) {
  const [openLesson, setOpenLesson] = useState<number | null>(null)
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']

  return (
    <div>
      <TabHeader icon={GraduationCap} colour={config.colour} title="Education Hub"
        subtitle="One lesson unlocks each week. Each covers the biology behind your pattern and what the programme is doing about it." />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {LESSONS.map((lesson) => {
          const unlocked = currentWeek >= lesson.week
          const isOpen = openLesson === lesson.week
          const callout = lesson.patternCallouts[pattern as keyof typeof lesson.patternCallouts]

          return (
            <div key={lesson.week} style={{ background: '#FFFFFF', border: `1px solid ${isOpen ? '#CFD4DC' : '#E8EAEE'}`, borderRadius: 12, overflow: 'hidden', opacity: unlocked ? 1 : 0.45 }}>
              {/* Header row */}
              <button
                onClick={() => unlocked && setOpenLesson(isOpen ? null : lesson.week)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 20px', background: 'none', border: 'none', cursor: unlocked ? 'pointer' : 'default', textAlign: 'left' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: unlocked ? config.colour : '#E8EAEE', border: `2px solid ${unlocked ? config.colour : '#CFD4DC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: unlocked ? '#FFFFFF' : '#43474F' }}>{lesson.week}</span>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: unlocked ? '#141821' : '#43474F' }}>{lesson.title}</div>
                    <div style={{ fontSize: 12, color: '#43474F', marginTop: 2 }}>{unlocked ? `Week ${lesson.week}` : `Unlocks Week ${lesson.week}`}</div>
                  </div>
                </div>
                {unlocked && (
                  <div style={{ fontSize: 18, color: '#43474F', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>
                    ↓
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div style={{ borderTop: '1px solid #E8EAEE' }}>
                  {/* Mechanism figure + Video */}
                  <div style={{ padding: '20px 20px 0' }}>
                    <LessonDiagram week={lesson.week} />
                    <div style={{ marginBottom: 20 }}>
                      {BLUEPRINT_LESSON_VIDEOS[lesson.week] ? (
                        <VideoPlayer src={BLUEPRINT_LESSON_VIDEOS[lesson.week]} />
                      ) : (
                        <VideoPlaceholder label={`${lesson.title} · lesson video`} />
                      )}
                    </div>
                  </div>

                  {/* Sections */}
                  <div style={{ padding: '0 20px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 24 }}>
                      {lesson.sections.map((section, i) => (
                        <div key={i}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: config.colour, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                            {section.heading}
                          </div>
                          <p style={{ fontSize: 14, color: '#43474F', lineHeight: 1.8, margin: 0 }}>{section.body}</p>
                        </div>
                      ))}
                    </div>

                    {/* Pattern callout */}
                    <div style={{ background: '#FFFFFF', border: `1px solid ${config.colour}30`, borderLeft: `3px solid ${config.colour}`, borderRadius: 8, padding: '14px 16px' }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                        Your Pattern - {config.label}
                      </div>
                      <p style={{ fontSize: 13, color: '#43474F', lineHeight: 1.7, margin: 0 }}>{callout}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
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
      <TabHeader icon={Dumbbell} colour={config.colour} title="Training Programme"
        subtitle="3 days per week. Full body hybrid split. Sessions A, B, and C rotate each week." />

      {/* Suggested training days */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Suggested Schedule
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
          {[
            { day: 'Monday', session: 'A', subtitle: 'Strength Base' },
            { day: 'Wednesday', session: 'B', subtitle: 'Conditioning' },
            { day: 'Friday', session: 'C', subtitle: 'Balance' },
          ].map(item => (
            <div key={item.day} style={{ background: '#E8EAEE', borderRadius: 8, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 12, color: '#43474F', marginBottom: 6 }}>{item.day}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#1B6DFC', marginBottom: 4 }}>Session {item.session}</div>
              <div style={{ fontSize: 11, color: '#3d3935' }}>{item.subtitle}</div>
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: '#3d3935', margin: 0, lineHeight: 1.6 }}>
          Any 3 non-consecutive days works. The gap between sessions is more important than the specific days. Avoid training back to back.
        </p>
      </div>

      {/* Current week target */}
      <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Week {currentWeek} Target - {currentPhaseRow.phase}
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: '#141821' }}>{currentPhaseRow.rir}</span>
        </div>
        <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.6 }}>{currentPhaseRow.notes}</p>
      </div>

      {/* Pattern rules */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          {config.label} - Training Rules
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {trainingData.rules.map((rule, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Full progression table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px', marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>
          Phase Progression
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 12, padding: '8px 0', borderBottom: '1px solid #E8EAEE', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Phase</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Weeks</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#3d3935', letterSpacing: '0.08em', textTransform: 'uppercase' }}>RIR</span>
          </div>
          {trainingData.progression.map((row, i) => {
            const isActive = row === currentPhaseRow
            return (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 80px', gap: 12, padding: '12px 0', borderBottom: i < 3 ? '1px solid #E8EAEE' : 'none', background: isActive ? 'rgba(27, 109, 252,0.04)' : 'transparent', borderRadius: isActive ? 6 : 0 }}>
                <span style={{ fontSize: 13, color: isActive ? '#1B6DFC' : '#141821', fontWeight: isActive ? 700 : 400 }}>{row.phase}</span>
                <span style={{ fontSize: 13, color: '#43474F' }}>{row.weeks}</span>
                <span style={{ fontSize: 13, color: isActive ? config.colour : '#43474F', fontWeight: isActive ? 600 : 400 }}>{row.rir}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Session tabs */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Session Templates
          </div>
          {/* Gym / Home / Bodyweight toggle */}
          <div style={{ display: 'flex', background: '#E8EAEE', borderRadius: 8, padding: 3, gap: 2 }}>
            {([
              { id: 'gym', label: 'Gym' },
              { id: 'home', label: 'Home (DBs)' },
              { id: 'bodyweight', label: 'No Equipment' },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: mode === m.id ? '#FFFFFF' : '#43474F', background: mode === m.id ? '#1B6DFC' : 'transparent', border: 'none', borderRadius: 6, cursor: 'pointer', whiteSpace: 'nowrap' }}
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
              style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600, color: activeSession === s.id ? '#FFFFFF' : '#43474F', background: activeSession === s.id ? '#1B6DFC' : '#FFFFFF', border: `1px solid ${activeSession === s.id ? '#1B6DFC' : '#CFD4DC'}`, borderRadius: 8, cursor: 'pointer' }}
            >
              Session {s.id}
            </button>
          ))}
        </div>

        <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #E8EAEE', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#141821' }}>{activeSessionData.name}</div>
              <div style={{ fontSize: 12, color: '#43474F', marginTop: 2 }}>{activeSessionData.subtitle}</div>
            </div>
            {mode !== 'gym' && (
              <div style={{ fontSize: 11, color: '#43474F', background: '#E8EAEE', padding: '4px 10px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                {mode === 'home' ? 'DBs + bodyweight' : 'No equipment needed'}
              </div>
            )}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8EAEE' }}>
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
                    <tr key={i} style={{ borderBottom: i < exercises.length - 1 ? '1px solid #E8EAEE' : 'none', opacity: finisherSkipped ? 0.4 : 1 }}>
                      <td style={{ padding: '14px 20px', fontSize: 14, color: '#141821', fontWeight: isFinisher ? 600 : 500 }}>
                        {ex.name}
                        {finisherSkipped && <span style={{ fontSize: 11, color: '#43474F', marginLeft: 8 }}>(skipped)</span>}
                      </td>
                      <td style={{ padding: '14px 12px', fontSize: 14, color: '#666D7A', textAlign: 'center' }}>{ex.sets}</td>
                      <td style={{ padding: '14px 12px', fontSize: 13, color: '#666D7A', textAlign: 'center', whiteSpace: 'nowrap' }}>{ex.reps}</td>
                      <td style={{ padding: '14px 20px', fontSize: 13, color: '#43474F', lineHeight: 1.5 }}>{ex.notes}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* RIR explainer */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '18px 20px' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#43474F', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
          What is RIR?
        </div>
        <p style={{ fontSize: 13, color: '#666D7A', margin: 0, lineHeight: 1.7 }}>
          RIR stands for Reps in Reserve. It is how many more reps you could have done before reaching failure.
          3 RIR means you stop when you have 3 reps left. 1 RIR means you stop when you have 1 rep left.
          This is how the programme manages intensity across each phase without requiring a 1-rep max test.
        </p>
      </div>
    </div>
  )
}

const COACHING_NOTES: Record<string, Record<number, string>> = {
  'stress-stored': {
    1: `This week is about removing load, not adding it. Your cortisol has been elevated for a while and the first thing your body needs is a clear signal that the pressure is coming down. The training is intentionally controlled. The meal structure is consistent. That is the work.\n\nDo not judge this week by the scale. Judge it by how your evenings feel. If you are sleeping better or waking up slightly less wired, the curve is already moving. That is the result for Week 1.`,
    2: `The rhythm is starting to establish. By now your body is getting the signal that meals are coming at predictable times, training is not a threat, and sleep has room to recover. These are the inputs cortisol responds to.\n\nYour main focus this week is consistency over everything else. Same meal timing, same sleep window, same training structure. The body does not change from one week of effort - it changes from one week of rhythm repeated enough times to become the new baseline.`,
    3: `You are moving into the Adapt phase. Load increases this week - but for your pattern, that means deliberate and controlled, not chasing numbers. Your cortisol is sensitive to effort spikes, so the RIR target is there for a reason. Leave the reps in reserve.\n\nWatch your energy through the day this week. If it is getting more even - if the afternoon crash is less severe or the late-night hunger has quieted - that is the cortisol curve coming down. The training is now building on a calmer system, which is where real adaptation starts.`,
    4: `Midpoint. You have two weeks of regulated rhythm behind you and two weeks of progressive training under your belt. This is the week where the compound effect starts to show up physically.\n\nStay on structure. No extra sessions, no restriction, no chasing. The pattern that suppressed your cortisol in the first place was doing more and eating less - every time you resist that instinct this week, you are reinforcing the new biology. Trust the programme.`,
    5: `This is the closest this programme gets to a peak effort week for your pattern - and it is still not maximum intensity. Two to three reps in reserve, every set. The goal is strong, consistent sessions without pushing the cortisol response that high training loads create.\n\nIf your energy and recovery have been improving, you will feel the difference in these sessions. More output from the same perceived effort. That is metabolic rate and hormone function recovering together. Keep sleep as the priority this week - it is what converts this week's training into Week 6 results.`,
    6: `Deload week. This is not optional and it is not a sign that the programme is ending - it is the final adaptation stimulus. The body makes its biggest changes when load drops and recovery takes over. Reduce sets by 30 percent. Keep everything else exactly the same.\n\nSpend some time this week noticing what has changed since Week 1. Energy through the day. Sleep quality. Belly fat distribution. Afternoon crashes. These are the markers that shift first in your pattern - and after six weeks of consistent work, most of them should look different.`,
  },
  'metabolic-drift': {
    1: `This week your only job is to establish the timing. Protein first at every meal. No snacking. Post-training carbs in the window only. These rules exist because insulin sensitivity is restored by the gaps between eating, not by the food itself.\n\nDo not try to optimise everything at once. Get the structure in place first. The walk after meals is more important than it sounds - 15 minutes clears post-meal blood glucose better than most supplements. Do it every day this week.`,
    2: `The rhythm is working. By now your cells are starting to respond to the fasting gaps between meals and your hunger signals should be getting more predictable. The 3pm crash may still be there but it should be softer.\n\nThis week, focus on the post-training window. Get your protein and carbs in within 90 minutes of finishing every session. This is the highest-leverage carbohydrate timing for your pattern - your cells are most insulin-sensitive in that window and every meal you hit it correctly is a direct deposit into metabolic recovery.`,
    3: `Adapt phase. Progressive load starts this week and the Session B finisher is now an important metabolic tool. Muscle contraction drives glucose uptake independently of insulin - the more muscle you are using, the more your cells are clearing glucose without needing an insulin spike.\n\nIf you have been consistent with the rest day nutrition (protein, fat, fruit only), you should notice that your energy on rest days is steadier than it was in Week 1. That is insulin sensitivity improving. Your body is starting to run on fat between meals the way it should.`,
    4: `Midpoint. Your insulin environment is different to what it was four weeks ago. The afternoon crashes should be significantly reduced or gone. Hunger between meals should feel manageable rather than urgent. These are not minor wins - these are the primary targets of your programme and they are moving.\n\nIncrease post-training carb volume this week if your performance in sessions has been improving. The carbs are there to fuel the training that drives the adaptation. Do not hold back on the post-training window if you are training hard.`,
    5: `Peak effort week. Push intensity in your sessions this week - the 1 to 2 RIR target is real. Your insulin sensitivity is significantly improved from Week 1 which means your body is now able to put training volume to work in a way it could not at the start.\n\nKeep the post-meal walks this week. Even in a peak effort week, 15 minutes after meals is one of the most consistent interventions for this pattern. The combination of high training intensity and controlled post-meal glucose clearance is what drives the final shift in body composition.`,
    6: `Deload week. Reduce training volume by 30 percent but keep the nutrition structure identical. This is important - rest days still follow the rest day protocol. Post-training carbs still go in the window after lighter sessions. The insulin environment you have built over six weeks is maintained by the structure, not by the training load.\n\nThis week is about consolidating what you have built. The metabolic flexibility you have now - the ability to use fat between meals, the stable energy, the predictable hunger - is your new baseline. The goal of Stage 3 is to build on it.`,
  },
  'hormonal-shift': {
    1: `The most important thing you can do this week is eat. Full meals, generous fat, consistent timing. Do not skip breakfast. Do not reduce portions because you feel like it. This pattern responds badly to restriction and it responds quickly - one week of undereating can set the hormonal environment back significantly.\n\nThe training is deliberate this week. Three RIR, consistent attendance, nothing extra. Consistency is the adaptation signal for your pattern - not intensity. Show up, do the work at the prescribed effort, and leave.`,
    2: `Rhythm is establishing. Two weeks of consistent meals and consistent training sends a signal to your hormonal axis that resources are available and the body is not under threat. That signal is what allows oestrogen, progesterone, and testosterone to regulate properly.\n\nWatch your energy and mood this week. For this pattern, hormonal stabilisation often shows up first as fewer dramatic shifts - less of the afternoon slump, more even mood across the day, slightly less water retention. These are early indicators. Note them and keep the structure exactly as it has been.`,
    3: `Adapt phase. Load increases this week but the ceiling is lower than other patterns. Two to three RIR, not two. If recovery is compromised because of where you are in your cycle, hold intensity rather than pushing through. This is not optional - overreaching in Weeks 3-4 directly disrupts the hormonal balance the programme is building.\n\nFat intake is especially important this week. Cholesterol is the precursor for all steroid hormones. If you are in a higher-demand phase hormonally, your body needs more raw material. Eat more fat, not less.`,
    4: `Midpoint. Four weeks of adequate nutrition and controlled training has been creating the conditions for hormonal recalibration. If your cycle is regular, this week may feel easier or harder depending on where you are in it - that is normal and does not mean the programme is not working.\n\nDo not add extra sessions this week even if motivation is high. Three days is the prescription, not a minimum. The recovery between sessions is where the adaptation is happening - more training takes recovery resources away from hormonal repair and puts them into physical repair instead.`,
    5: `Week 5 is the closest to peak effort for this pattern - and the ceiling is still two RIR. No sets taken to near-failure. The goal this week is to demonstrate the progress made across five weeks of consistent work without creating the hormonal stress that hard training produces.\n\nIf you are noticing clearer muscle definition, more stable energy, fewer cycle-related disruptions, or improved mood consistency - those are all signs the programme has been working on the right targets. Sleep remains the most important variable this week. It is where reproductive hormones reset daily.`,
    6: `Deload week. Reduce sets by 30 percent. Keep food volume exactly the same - this is one of the most important rules for your pattern this week. Training volume drops but nutrition does not. Restriction during deload is a common mistake and for your pattern it directly undermines the hormonal recovery the lower training load is supposed to create.\n\nTake stock of the six weeks. Body composition changes in this pattern often lag behind energy and mood changes by two to three weeks. If your energy and mood have improved significantly, the physical results may still be arriving over the next few weeks.`,
  },
  'system-overload': {
    1: `Your nervous system is the primary target this week. Everything in the programme is designed to reduce the total demand on it - controlled training intensity, adequate food, no extra sessions, longer rest between sets. This is not a gentle approach because the programme is easy. It is a precise approach because your pattern does not respond to volume.\n\nEat before every session without exception. Your nervous system needs fuel to function and it cannot recover from training on empty. If appetite is low, prioritise protein and fat even if the meal is small.`,
    2: `By now the structure should be starting to feel more natural. The controlled sessions, the full meals, the longer rest periods. Your nervous system is beginning to register that the demand is lower than it has been - and that registration is the first step toward recovery.\n\nSleep is the highest-leverage action available to you this week. More than training, more than nutrition. If you can protect one variable this week, protect sleep. The recovery that happens overnight is the primary stimulus your pattern responds to.`,
    3: `Adapt phase begins. Load increases this week but the RIR target stays at three for your pattern. Gradual is the word. Your nervous system adapts to progressive increases only when those increases are small enough to absorb fully between sessions. Chasing numbers now would undo the regulation work of the first two weeks.\n\nMagnesium this week is worth prioritising. Pumpkin seeds, dark chocolate, or a supplement in the evening. Magnesium directly supports nervous system recovery and most people in this pattern are running low. It is a small input with a disproportionate effect on sleep quality and recovery rate.`,
    4: `Midpoint. Your energy should be noticeably different to Week 1. Not perfect, but different. The flat, unresponsive feeling that characterises this pattern early in the programme tends to shift by Week 4 when the other inputs - sleep, nutrition, controlled training - have been consistently in place.\n\nDo not chase the progress by adding volume. The system is responding to quality, not quantity. Keep the sets at the prescribed number, keep the rest periods at two to three minutes, and keep the session B finisher skipped. The discipline here is in restraint, not effort.`,
    5: `Week 5. Two to three RIR across all sessions. This is the peak of the programme for your pattern and it is still controlled. If your energy and recovery have been improving week on week, these sessions should feel genuinely strong - more output from the same effort level, faster recovery between sets, better readiness coming into each session.\n\nSleep and magnesium remain non-negotiable this week. The training is asking more than it has been - the recovery needs to match it. Red meat at least once this day this week for zinc and iron density. Your nervous system needs both.`,
    6: `Deload week. Reduce sets by 40 percent for your pattern. This is the deepest deload in the programme and it is prescribed specifically because androgen signalling rebuilds on rest more than on active work. Lighter sessions, full food, long sleep.\n\nThis week is also a good time to reflect on the journey. Androgen-Decline is one of the hardest patterns to shift because it requires doing less when every instinct says to do more. If you have followed the structure, your testosterone signalling is in a significantly better state than it was six weeks ago. The next phase builds from here.`,
  },
}

const CHECKIN_MARKERS: { key: string; label: string; low: string; high: string }[] = [
  { key: 'energy_levels', label: 'Overall energy through the day', low: 'Flat and exhausted', high: 'Consistent and clear' },
  { key: 'morning_energy', label: 'Morning energy on waking', low: 'Heavy and reluctant', high: 'Ready and alert' },
  { key: 'sleep_quality', label: 'Sleep quality', low: 'Poor or broken', high: 'Deep and restful' },
  { key: 'afternoon_crash', label: 'Afternoon energy crash', low: 'Severe crash', high: 'No crash at all' },
  { key: 'hunger_cravings', label: 'Hunger and cravings between meals', low: 'Constant and urgent', high: 'Predictable and calm' },
  { key: 'training_recovery', label: 'Recovery between training sessions', low: 'Still sore and depleted', high: 'Ready and recovered' },
  { key: 'mood_stability', label: 'Mood and emotional stability', low: 'Reactive or flat', high: 'Stable and even' },
  { key: 'physical_changes', label: 'Physical changes noticed', low: 'None visible', high: 'Clear progress' },
]

type CheckIn = {
  id: string
  week_number: number
  energy_levels: number
  morning_energy: number
  sleep_quality: number
  afternoon_crash: number
  hunger_cravings: number
  training_recovery: number
  mood_stability: number
  physical_changes: number
  notes: string | null
  submitted_at: string
}

function CheckInTab({ pattern, currentWeek, token }: { pattern: string; currentWeek: number; token: string }) {
  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const [checkins, setCheckins] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const defaultMarkers = Object.fromEntries(CHECKIN_MARKERS.map(m => [m.key, 3]))
  const [markers, setMarkers] = useState<Record<string, number>>(defaultMarkers)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    fetch(`/api/blueprint/checkin?token=${token}`)
      .then(r => r.json())
      .then(d => { setCheckins(d.checkins ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [token])

  // The check-in the client is actually being asked for is the EARLIEST week
  // still outstanding, not whatever week the portal has advanced to. The
  // advance email says "submit your Week 1 check-in" while the portal had
  // already rolled to Week 2, so Dee Berry's Week 1 answers saved as Week 2
  // (her own note on the row reads "This is for Week 1"), the Week 1 reminder
  // kept firing at someone who had already checked in, and the Week 2 slot was
  // burnt. Target the week the email names.
  const submittedWeeks = new Set(checkins.map(c => c.week_number))
  let targetWeek = currentWeek
  for (let w = 1; w <= currentWeek; w++) {
    if (!submittedWeeks.has(w)) { targetWeek = w; break }
  }
  const alreadySubmittedThisWeek = submittedWeeks.has(targetWeek)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/blueprint/checkin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, week_number: targetWeek, notes, ...markers }),
    })
    if (res.ok) {
      const newCheckin: CheckIn = {
        id: crypto.randomUUID(),
        week_number: targetWeek,
        notes: notes || null,
        submitted_at: new Date().toISOString(),
        ...Object.fromEntries(CHECKIN_MARKERS.map(m => [m.key, markers[m.key]])),
      } as CheckIn
      setCheckins(prev => [...prev, newCheckin])
      setSubmitted(true)
    } else {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong.')
    }
    setSubmitting(false)
  }

  const scoreAvg = (c: CheckIn) => {
    const vals = CHECKIN_MARKERS.map(m => c[m.key as keyof CheckIn] as number)
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
  }

  return (
    <div>
      <TabHeader icon={ClipboardCheck} colour={config.colour} title="Weekly Check-In"
        subtitle="8 biological markers. Rated 1-5. Takes about 2 minutes. Submit once per week." />

      {/* This week's form */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#43474F', fontSize: 13 }}>Loading...</div>
      ) : alreadySubmittedThisWeek || submitted ? (
        <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '24px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Week {targetWeek} - Submitted</div>
          <p style={{ fontSize: 14, color: '#666D7A', margin: 0, lineHeight: 1.7 }}>Check-in for this week is complete. The next one will be available at Week {Math.min(targetWeek + 1, 6)}.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '24px', marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>
              Week {targetWeek} Check-In
            </div>
            <p style={{ fontSize: 13, color: '#43474F', margin: '0 0 24px', lineHeight: 1.6 }}>
              Rate each marker for how this week has felt overall. 1 = poor, 5 = excellent.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {CHECKIN_MARKERS.map((marker, i) => (
                <div key={marker.key} style={{ paddingBottom: i < CHECKIN_MARKERS.length - 1 ? 24 : 0, borderBottom: i < CHECKIN_MARKERS.length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#141821', marginBottom: 12 }}>{marker.label}</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    {[1, 2, 3, 4, 5].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setMarkers(prev => ({ ...prev, [marker.key]: val }))}
                        style={{
                          flex: 1,
                          padding: '10px 0',
                          fontSize: 14,
                          fontWeight: 700,
                          color: markers[marker.key] === val ? '#FFFFFF' : '#43474F',
                          background: markers[marker.key] === val ? config.colour : '#E8EAEE',
                          border: `1px solid ${markers[marker.key] === val ? config.colour : '#CFD4DC'}`,
                          borderRadius: 8,
                          cursor: 'pointer',
                        }}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#3d3935' }}>{marker.low}</span>
                    <span style={{ fontSize: 11, color: '#3d3935' }}>{marker.high}</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#141821', marginBottom: 8 }}>Anything else to flag this week? <span style={{ fontWeight: 400, color: '#43474F' }}>(optional)</span></div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Symptoms, energy patterns, anything unexpected..."
                rows={3}
                style={{ width: '100%', background: '#FFFFFF', border: '1px solid #CFD4DC', borderRadius: 8, padding: '12px 14px', fontSize: 13, color: '#43474F', resize: 'vertical', fontFamily: 'system-ui, sans-serif', boxSizing: 'border-box' }}
              />
            </div>

            {error && <p style={{ fontSize: 13, color: '#DC2626', margin: '12px 0 0' }}>{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              style={{ marginTop: 20, width: '100%', padding: '14px', background: config.colour, color: '#FFFFFF', fontWeight: 700, fontSize: 14, borderRadius: 8, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
            >
              {submitting ? 'Saving...' : `Submit Week ${targetWeek} Check-In`}
            </button>
          </div>
        </form>
      )}

      {/* History */}
      {checkins.length > 0 && (
        <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px 24px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
            Check-In History
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[...checkins].sort((a, b) => b.week_number - a.week_number).map((c, i) => (
              <div key={c.id} style={{ paddingBottom: i < checkins.length - 1 ? 16 : 0, marginBottom: i < checkins.length - 1 ? 16 : 0, borderBottom: i < checkins.length - 1 ? '1px solid #E8EAEE' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>Week {c.week_number}</span>
                  <span style={{ fontSize: 12, color: '#43474F' }}>Avg {scoreAvg(c)} / 5</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                  {CHECKIN_MARKERS.map(m => (
                    <div key={m.key} style={{ background: '#FFFFFF', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 10, color: '#3d3935', marginBottom: 3, lineHeight: 1.3 }}>{m.label.split(' ').slice(0, 3).join(' ')}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: (c[m.key as keyof CheckIn] as number) >= 4 ? config.colour : (c[m.key as keyof CheckIn] as number) <= 2 ? '#DC2626' : '#98A0AD' }}>
                        {c[m.key as keyof CheckIn]}
                      </div>
                    </div>
                  ))}
                </div>
                {c.notes && (
                  <p style={{ fontSize: 13, color: '#666D7A', margin: '10px 0 0', lineHeight: 1.6, fontStyle: 'italic' }}>{c.notes}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function BlueprintPortalClient({
  enrollment,
  activeMembershipToken,
}: {
  enrollment: Enrollment
  activeMembershipToken: string | null
}) {
  const [pattern, setPattern] = useState(enrollment.pattern)
  const [confirmedAt, setConfirmedAt] = useState<string | null>(enrollment.pattern_confirmed_at ?? null)
  const [adjusting, setAdjusting] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  // Week 6: Extension is a decline-path downsell, revealed only if they say they're
  // not ready for the recurring Membership (avoids cannibalising Membership LTV).
  const [showExtension, setShowExtension] = useState(false)

  // First-time buyer with no pattern on file: the assessment gate.
  if (pattern === 'pending') {
    return (
      <PatternAssessment
        token={enrollment.token}
        onComplete={(p) => { setPattern(p); setConfirmedAt(new Date().toISOString()) }}
      />
    )
  }

  // Pattern carried in from a prior read (Challenge / scorecard) but not yet
  // confirmed by the buyer: show confirm-or-adjust before the programme opens.
  if (!confirmedAt) {
    if (adjusting) {
      return (
        <PatternAssessment
          token={enrollment.token}
          changeMode
          onComplete={(p) => { setPattern(p); setConfirmedAt(new Date().toISOString()); setAdjusting(false) }}
        />
      )
    }
    return (
      <PatternConfirm
        pattern={pattern}
        source={enrollment.pattern_source}
        token={enrollment.token}
        firstName={enrollment.first_name}
        onConfirm={() => setConfirmedAt(new Date().toISOString())}
        onAdjust={() => setAdjusting(true)}
      />
    )
  }

  const config = PATTERN_CONFIG[pattern] ?? PATTERN_CONFIG['stress-stored']
  const currentWeek = enrollment.current_week ?? 1
  const currentPhase = currentWeek <= 2 ? PHASES[0] : currentWeek <= 4 ? PHASES[1] : PHASES[2]

  return (
    <div style={{ minHeight: '100vh', background: '#F5F7FA', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', position: 'relative' }}>
      <style>{`
        .bp-lift { transition: transform .15s ease, box-shadow .15s ease; }
        .bp-lift:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(16,24,40,0.08), 0 20px 38px rgba(16,24,40,0.13) !important; }
      `}</style>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 360, background: 'radial-gradient(1100px 300px at 50% -60px, rgba(27,109,252,0.07), transparent 70%)', pointerEvents: 'none' }} />

      {/* Top bar */}
      <div style={{ borderBottom: '1px solid #E8EAEE', padding: '16px 0', background: '#FFFFFF', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <img src={logoUrl()} width={140} alt={brand().name} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: `${config.colour}12`, padding: '6px 12px', borderRadius: 99 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: config.colour }} />
            <span style={{ fontSize: 13, color: config.colour, fontWeight: 700 }}>{config.label}</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ borderBottom: '1px solid #E8EAEE', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', overflowX: 'auto', position: 'sticky', top: 57, zIndex: 20 }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', gap: 6, padding: '10px 24px' }}>
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            style={{ padding: '9px 16px', fontSize: 13, fontWeight: 700, color: activeTab === item.id ? '#FFFFFF' : '#43474F', background: activeTab === item.id ? '#1B6DFC' : 'transparent', border: 'none', borderRadius: 99, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: activeTab === item.id ? '0 2px 8px rgba(27,109,252,0.3)' : 'none', transition: 'all 0.15s' }}
          >
            {item.label}
          </button>
        ))}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px', position: 'relative' }}>

        {activeTab === 'home' && (
          <div>
            {/* Premium hero panel */}
            <div style={{ background: 'linear-gradient(140deg, #17191F 0%, #0C1B33 100%)', borderRadius: 18, padding: '30px 30px 28px', marginBottom: 24, position: 'relative', overflow: 'hidden', boxShadow: '0 14px 34px rgba(11,31,51,0.28)' }}>
              <div style={{ position: 'absolute', top: -90, right: -70, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(27,109,252,0.28), transparent 70%)', pointerEvents: 'none' }} />
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8FB4F5', letterSpacing: '0.12em', textTransform: 'uppercase' }}>6-Week Body Rewire</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FFFFFF', background: config.colour, padding: '3px 11px', borderRadius: 99, letterSpacing: '0.04em' }}>{config.label}</span>
                </div>
                <h1 style={{ fontSize: 30, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', margin: '0 0 8px' }}>
                  Welcome back, {enrollment.first_name}
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.68)', lineHeight: 1.65, margin: '0 0 24px', maxWidth: 580 }}>{config.description}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em' }}>WEEK {currentWeek} OF 6</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#8FB4F5' }}>{currentPhase.name} phase</span>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {[1, 2, 3, 4, 5, 6].map(w => (
                    <div key={w} style={{ flex: 1, height: 7, borderRadius: 99, background: w <= currentWeek ? '#1B6DFC' : 'rgba(255,255,255,0.14)', boxShadow: w <= currentWeek ? '0 0 10px rgba(27,109,252,0.5)' : 'none', transition: 'background 0.3s' }} />
                  ))}
                </div>
              </div>
            </div>

            {/* Quick-action dashboard tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[
                { icon: Dumbbell, eyebrow: 'Training', label: "This week's sessions", tab: 'training' },
                { icon: BookOpen, eyebrow: 'Lesson', label: LESSONS[currentWeek - 1]?.title ?? 'Review all lessons', tab: 'education' },
                { icon: ClipboardCheck, eyebrow: 'Check-In', label: 'Rate your 8 markers', tab: 'checkin' },
              ].map(t => {
                const Icon = t.icon
                return (
                  <button key={t.tab} className="bp-lift" onClick={() => setActiveTab(t.tab)} style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, padding: '16px', boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', cursor: 'pointer', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(27,109,252,0.1)', color: '#1B6DFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={19} />
                      </div>
                      <ChevronRight size={16} color="#C4C8D0" />
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: '#666D7A', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{t.eyebrow}</div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: '#141821', lineHeight: 1.3 }}>{t.label}</div>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Pattern welcome video - Week 1 only */}
            {currentWeek === 1 && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '20px', marginBottom: 24 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>
                  Start here · Welcome
                </div>
                {BLUEPRINT_WELCOME_VIDEOS[pattern] ? (
                  <VideoPlayer src={BLUEPRINT_WELCOME_VIDEOS[pattern]} poster={BLUEPRINT_WELCOME_POSTERS[pattern]} />
                ) : (
                  <VideoPlaceholder label={`Welcome to your ${config.label} Blueprint`} />
                )}
              </div>
            )}

            {COACHING_NOTES[pattern]?.[currentWeek] && (
              <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '24px', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
                  <img src={coach().photoUrl} width={38} height={38} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} alt={coach().firstName} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#141821' }}>{coach().firstName}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: config.colour, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Week {currentWeek} coaching note</div>
                  </div>
                </div>
                {COACHING_NOTES[pattern][currentWeek].split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: 14, color: '#43474F', lineHeight: 1.8, margin: i === 0 ? '0 0 14px' : '0' }}>{para}</p>
                ))}
              </div>
            )}

            {/* Midpoint reflection - Week 3 only */}
            {currentWeek === 3 && (() => {
              const reflections: Record<string, string[]> = {
                'stress-stored': [
                  'Is your afternoon energy crash less severe than Week 1?',
                  'Are you falling asleep faster or staying asleep longer?',
                  'Has the late-night hunger or restlessness reduced?',
                  'Does your morning energy feel less forced?',
                ],
                'metabolic-drift': [
                  'Is the 3pm crash softer or gone compared to Week 1?',
                  'Is hunger between meals more predictable and less urgent?',
                  'Have sugar cravings after meals reduced?',
                  'Is your energy more stable across the day?',
                ],
                'hormonal-shift': [
                  'Has your mood been more stable or consistent?',
                  'Is there less water retention or puffiness?',
                  'Is energy through the day more even?',
                  'Has motivation to train been easier to access?',
                ],
                'system-overload': [
                  'Does your energy feel less flat than Week 1?',
                  'Are you recovering between sessions faster?',
                  'Is sleep feeling more restorative?',
                  'Is the general heaviness or depletion lifting?',
                ],
              }
              const questions = reflections[pattern] ?? reflections['stress-stored']
              return (
                <div style={{ background: '#FFFFFF', border: `1px solid #E8EAEE`, borderLeft: `4px solid ${config.colour}`, borderRadius: 12, padding: '24px', marginBottom: 24 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
                    Midpoint Reflection
                  </div>
                  <p style={{ fontSize: 14, color: '#43474F', margin: '0 0 16px', lineHeight: 1.75 }}>
                    You are halfway through. The Adapt phase starts this week. Before you move into higher intensity, take a moment to notice what has already shifted since Week 1.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    {questions.map((q, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: config.colour, marginTop: 6, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: '#666D7A', lineHeight: 1.65 }}>{q}</span>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: 13, color: '#43474F', margin: 0, lineHeight: 1.7 }}>
                    These are the markers your pattern moves first. Physical changes come later. If any of these are shifting, the programme is working exactly as it should.
                  </p>
                </div>
              )
            })()}

            {/* Week 6: ascension CTA (no Membership yet) OR handoff card (Membership already active) */}
            {currentWeek === 6 && activeMembershipToken && (
              <div style={{ background: '#FFFFFF', border: '1px solid #1B6DFC', borderRadius: 12, padding: '24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1B6DFC, #8b5cf6)' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Membership active
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#141821', marginBottom: 12 }}>
                  Your work has moved.
                </div>
                <p style={{ fontSize: 14, color: '#43474F', margin: '0 0 20px', lineHeight: 1.8 }}>
                  Block A is loaded and live in your Membership portal. The training, nutrition, and weekly check-in continue there from here. Your Blueprint pattern, your six weeks of foundation, and your check-in history all carry forward.
                </p>
                <a
                  href={`/membership/${activeMembershipToken}`}
                  style={{ display: 'inline-block', padding: '13px 24px', background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none' }}
                >
                  Continue at your Membership portal →
                </a>
              </div>
            )}

            {currentWeek === 6 && !activeMembershipToken && (
              <div style={{ background: '#FFFFFF', border: '1px solid #1B6DFC', borderRadius: 12, padding: '24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #1B6DFC, #8b5cf6)' }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                  What comes next
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#141821', marginBottom: 12 }}>
                  You built the foundation. Now keep going.
                </div>
                <p style={{ fontSize: 14, color: '#43474F', margin: '0 0 20px', lineHeight: 1.8 }}>
                  Six weeks established the rhythm. The {brand().name} Membership is where that work compounds. Same coaching system, same pattern continuity - new blocks every six weeks with a coach watching your numbers.
                                                  </p>
                <div style={{ marginBottom: 20 }}>
                  <VideoPlaceholder label="Week 6 · What comes next" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                  {[
                    'Progressive 6-week training blocks built on your Blueprint foundation',
                    'Nutrition precision layer updated each block - carb cycling, cycle-aware strategies',
                    'Monthly coach Loom based on your check-in data',
                    'Monthly group Q&A call - live with Kade',
                    '$49 per week - cancel anytime',
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#1B6DFC', marginTop: 6, flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#43474F', lineHeight: 1.65 }}>{item}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  <a
                    href="/membership?source=blueprint_week6_portal"
                    style={{ display: 'inline-block', padding: '13px 24px', background: '#1B6DFC', color: '#FFFFFF', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none' }}
                  >
                    Join the Membership - $49/week
                  </a>
                  <a
                    href={`${brand().marketingDomain}/book?from=blueprint_week6`}
                    style={{ display: 'inline-block', padding: '13px 24px', background: 'transparent', color: '#1B6DFC', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none', border: '1px solid #1B6DFC' }}
                  >
                    Or skip to 1:1 coaching →
                  </a>
                  <a
                    href={`mailto:${coach().email}?subject=Blueprint complete - question about next step`}
                    style={{ display: 'inline-block', padding: '13px 24px', background: 'transparent', color: '#43474F', fontWeight: 700, fontSize: 14, borderRadius: 8, textDecoration: 'none', border: '1px solid #CFD4DC' }}
                  >
                    Ask a question first
                  </a>
                </div>

                {/* Decline-path downsell: Extension surfaces only if they say they're not ready to commit to the recurring Membership */}
                {!showExtension ? (
                  <button
                    onClick={() => setShowExtension(true)}
                    style={{ background: 'none', border: 'none', padding: '14px 0 0', color: '#666D7A', fontSize: 13, fontWeight: 600, textDecoration: 'underline', cursor: 'pointer' }}
                  >
                    Not ready for a subscription?
                  </button>
                ) : (
                  <div style={{ marginTop: 16, padding: '16px 18px', background: '#FAFBFC', border: '1px solid #E8EAEE', borderRadius: 10 }}>
                    <p style={{ fontSize: 13, color: '#43474F', lineHeight: 1.6, margin: '0 0 12px' }}>
                      Prefer to keep going without a subscription? The <strong>90-Day Extension</strong> gives you 12 more weeks (Blocks A + B) for a one-time <strong>$197</strong>. If you join the Membership later, you pick up at Block C - no backtracking.
                    </p>
                    <a
                      href="/extension"
                      style={{ display: 'inline-block', padding: '11px 20px', background: 'transparent', color: '#1B6DFC', fontWeight: 700, fontSize: 13, borderRadius: 8, textDecoration: 'none', border: '1px solid #1B6DFC' }}
                    >
                      See the 90-Day Extension - $197 →
                    </a>
                  </div>
                )}
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '24px', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
                <Compass size={14} /> Current Phase
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 20, fontWeight: 700, color: '#141821' }}>Phase {currentPhase.number} - {currentPhase.name}</span>
                <span style={{ fontSize: 13, color: '#43474F' }}>Weeks {currentPhase.weeks}</span>
              </div>
              <p style={{ fontSize: 14, color: '#666D7A', margin: '0 0 16px', lineHeight: 1.7 }}>{currentPhase.description}</p>
              <div style={{ fontSize: 13, color: '#43474F' }}>Week {currentWeek} of 6</div>
            </div>

            <div style={{ background: '#FFFFFF', border: '1px solid #E8EAEE', borderRadius: 14, boxShadow: '0 1px 2px rgba(16,24,40,0.04), 0 8px 20px rgba(16,24,40,0.05)', padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 700, color: config.colour, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 16 }}>
                <ListChecks size={14} /> Programme Phases
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {PHASES.map((phase, i) => {
                  const isActive = phase.number === currentPhase.number
                  const isPast = phase.number < currentPhase.number
                  return (
                    <div key={phase.number} style={{ display: 'flex', gap: 16, paddingBottom: i < 2 ? 20 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: isActive ? '#1B6DFC' : isPast ? '#CFD4DC' : '#E8EAEE', border: `2px solid ${isActive ? '#1B6DFC' : '#CFD4DC'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#FFFFFF' : '#43474F' }}>{phase.number}</span>
                        </div>
                        {i < 2 && <div style={{ width: 2, flex: 1, background: '#E8EAEE', marginTop: 4 }} />}
                      </div>
                      <div style={{ paddingTop: 4, paddingBottom: i < 2 ? 8 : 0 }}>
                        <div style={{ fontSize: 14, fontWeight: isActive ? 700 : 600, color: isActive ? '#1B6DFC' : '#141821', marginBottom: 2 }}>
                          {phase.name} <span style={{ fontWeight: 400, color: '#666D7A' }}>· Weeks {phase.weeks}</span>
                          {isActive && <span style={{ fontSize: 10, fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(27,109,252,0.1)', padding: '2px 8px', borderRadius: 99, marginLeft: 8, verticalAlign: 'middle' }}>Current</span>}
                        </div>
                        <div style={{ fontSize: 13, color: '#43474F', lineHeight: 1.6 }}>{phase.description}</div>
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
          <NutritionTab pattern={pattern} />
        )}

        {activeTab === 'education' && (
          <EducationTab pattern={pattern} currentWeek={currentWeek} />
        )}

        {activeTab === 'checkin' && (
          <CheckInTab pattern={pattern} currentWeek={currentWeek} token={enrollment.token} />
        )}

      </div>
    </div>
  )
}
