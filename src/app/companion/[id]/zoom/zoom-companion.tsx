'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import CommencementFeeButton from '@/components/commencement-fee-button'

// ─── Constants ─────────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress Load',
  '04': 'Training Response',
  '05': 'Fat Loss Response',
}

// What the lead actually selected — the description text matching their score.
// Mirrors the public scorecard at /scorecard exactly.
const SECTION_DESCRIPTIONS: Record<string, Record<number, string>> = {
  '01': {
    1: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.',
    2: 'Inconsistent. Some good days, some bad. Not reliable.',
    3: 'Steady energy through the day. No need for caffeine to function.',
  },
  '02': {
    1: 'Poor quality. Waking through the night. Not rested in the morning.',
    2: 'Okay most nights but not consistently recovering.',
    3: 'Sleeping well. Waking rested. Recovery feels solid.',
  },
  '03': {
    1: 'High stress. Work, life, or emotional load is significant and ongoing.',
    2: 'Moderate. Manageable most of the time but not low.',
    3: 'Low to moderate. Not carrying a heavy chronic stress load right now.',
  },
  '04': {
    1: 'Not progressing. Performance is flat or declining. Body feels beaten up.',
    2: 'Some progress but inconsistent. Hard to build momentum.',
    3: 'Responding well. Getting stronger, fitter, recovering between sessions.',
  },
  '05': {
    1: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.',
    2: 'Slow or stalled. Some movement but not matching the input.',
    3: 'Body is responding. Composition is shifting in the right direction.',
  },
}

// Coach-facing interpretation — what each per-section score means in clinical terms.
const SECTION_INTERPRETATIONS: Record<string, Record<number, string>> = {
  '01': {
    1: 'Energy is significantly depleted — relying on caffeine, crashing through the day. Core signal that the body is running on reserves.',
    2: 'Energy is inconsistent day to day. The variation itself is the signal.',
    3: 'Energy is steady and self-sustaining. Not a limiting factor right now.',
  },
  '02': {
    1: 'Sleep quality is poor. The single biggest recovery suppressor when compromised.',
    2: 'Sleep is okay most nights but not consistently restorative.',
    3: 'Sleep is solid and consistently restorative. Recovery rhythm intact.',
  },
  '03': {
    1: 'Stress load is high and ongoing. Directly suppresses fat loss and training response.',
    2: 'Stress is moderate — has an ongoing background effect.',
    3: 'Stress load is low to moderate. Not a significant driver in the current picture.',
  },
  '04': {
    1: 'Training response has stalled or regressed. Classic depletion-state pattern.',
    2: 'Training response is inconsistent. Hit and miss.',
    3: 'Training response is good — getting stronger, fitter, recovering between sessions.',
  },
  '05': {
    1: 'Fat loss has stopped despite effort. Biology problem, not a behaviour problem.',
    2: 'Fat loss is slow or stalled. Some movement but not matching the input.',
    3: 'Body is responding. Composition is shifting in the right direction.',
  },
}

const BODY_STATE_LANGUAGE: Record<string, { colour: string; badge: string; opening: string; interpretation: string; pattern: string }> = {
  'Depleted State': {
    colour: 'text-red-700 border-red-200 bg-red-50',
    badge: 'bg-red-400',
    // Coach-facing — what's going on under the hood. Not spoken aloud.
    opening: 'Their scorecard came back as Depleted State. Body is in protection mode — cortisol elevated, metabolism suppressed, fat loss and performance shut down. The scorecard surfaced the signal. The call is about understanding what\'s driving it.',
    // Spoken to the lead. Plain, direct.
    interpretation: 'What you\'re seeing isn\'t an effort or willpower thing — your body\'s protecting itself. When you\'re running on poor sleep, high stress, and training that isn\'t paying off, your body shifts into preservation mode. The fact that fat loss has stalled and training feels harder than it should — those are two sides of the same thing.',
    pattern: 'Depleted State: body in protection mode. Cortisol up, metabolism down. Adding more training stimulus makes it worse. The fix is smarter management, not harder work.',
  },
  'Transitioning State': {
    colour: 'text-amber-700 border-amber-200 bg-amber-50',
    badge: 'bg-amber-400',
    opening: 'Their scorecard came back as Transitioning State. They\'ve got capacity but something\'s blocking consistent response. Sleep, stress, recovery rhythm, or a mismatch between training load and where their body is right now. Call is about identifying which.',
    interpretation: 'You\'ve got the capacity — you\'re just not consistently expressing it. Some weeks things click, other weeks they don\'t. That inconsistency is the actual issue. Usually it\'s one or two things holding the rest of it back.',
    pattern: 'Transitioning State: capacity is there, consistency isn\'t. Usually one or two sections dragging the picture. Identify the specific drivers and address them in order.',
  },
  'Ready State': {
    colour: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    badge: 'bg-blue-500',
    opening: 'Their scorecard came back as Ready State. Foundations are in place. If results aren\'t happening at this score, it\'s a prescription problem — the what and how of training and nutrition, not the foundation.',
    interpretation: 'You\'ve got the foundations — energy, sleep, stress, recovery are all in the right place. So when results aren\'t happening, it\'s not a foundation issue. It\'s the training or the nutrition approach not matching where you actually are.',
    pattern: 'Ready State: foundations solid. If results aren\'t happening, it\'s the prescription. Focus on the training and nutrition approach.',
  },
}

// ─── How The System Works (mirrors performance.bodyrecode.au/how-it-works) ─

const HOW_IT_WORKS_STAGES = [
  {
    number: '01',
    title: 'Biological Intake',
    subtitle: '208 Data Points',
    body: 'The system begins with a structured biological intake across eight signal domains. 208 data points in total. Nothing is assumed. Nothing is filled in from a template.',
    chips: ['Training History', 'Nutrition History', 'Metabolic Indicators', 'Hormonal Signals', 'Recovery Patterns', 'Stress Markers', 'Sleep Quality', 'Body Composition'],
    coachScript: '"First thing you do is the foundational intake. 208 questions across eight areas. This is what gives me the data to read what\'s actually going on with your body — not from a template, from you."',
  },
  {
    number: '02',
    title: 'Where it shows up',
    subtitle: 'Four anatomical zones',
    body: 'Your body shows biological load in four main areas. Where you carry it tells me a lot about what\'s driving it — before I even open your intake.',
    zones: [
      { dot: 'red',    region: 'Stomach and waist',              driver: 'Stress and cortisol' },
      { dot: 'amber',  region: 'Under the ribs and abdomen',     driver: 'Digestion and insulin' },
      { dot: 'purple', region: 'Hips, glutes and thighs',        driver: 'Long-term hormonal' },
      { dot: 'cyan',   region: 'Upper back, traps and shoulders', driver: 'Nervous system, running hot' },
    ],
    coachScript: '"Your body has four main areas where things show up. Stomach and waist — that\'s stress. Under the ribs — digestion and insulin. Hips and thighs — long-term hormonal. Upper back and traps — nervous system running too hot. Just by where you\'re carrying it I already have a strong read on what\'s actually driving it."',
  },
  {
    number: '03',
    title: 'What type of body',
    subtitle: 'Four biological profiles',
    body: 'From your intake I read which of four profiles your body is sitting in overall. Each one needs a materially different approach.',
    pieces: [
      { name: 'Stress-Stored', desc: 'Managing a lot, holding on. The harder you push, the tighter the body holds.' },
      { name: 'Estrogen-Shift', desc: 'Body has changed. What used to work doesn\'t anymore. Distribution and recovery feel different.' },
      { name: 'Insulin-Drift', desc: 'Energy is inconsistent. Eating well but feeling flat. Body partitioning energy differently than it used to.' },
      { name: 'Androgen-Decline', desc: 'Response has dropped off. Muscle harder to hold, recovery slower than it used to be.' },
    ],
    coachScript: '"From your intake I sort you into one of four profiles. Based on what you\'ve told me, you\'re sitting in [name the profile]. From there it sets the rules for everything I do with you."',
    bridge: 'Two reads of the same body. The zone tells me where the load is showing on your body. The profile tells me what type of body it\'s coming from. Both feed into how I write your training and nutrition — neither alone gives the full picture.',
  },
  {
    number: '04',
    title: 'Execution',
    subtitle: 'Program · Nutrition · Synthesis · Portal',
    body: 'With the read in place, execution begins. Training, nutrition, and weekly check-in synthesis are all delivered through your client portal. Live from day one.',
    pieces: [
      { name: 'Training Program', desc: 'Load, volume and modality derived from your read — not a template' },
      { name: 'Nutrition Structure', desc: 'Built around your biological profile, adjusted as state shifts' },
      { name: 'Weekly Check-In', desc: 'Structured data capture produces the CFWS in real time' },
      { name: 'Client Portal', desc: 'Program, plan, synthesis docs and check-in history in one place' },
    ],
    coachScript: '"Everything lives in your portal — training program, nutrition, weekly check-ins. All in one place. All driven by your read."',
  },
  {
    number: '05',
    title: 'The Continuous Loop',
    subtitle: 'CFFS + CFWS in parallel',
    body: 'Two documents run in parallel the whole way through: the CFFS — the foundation that doesn\'t change — and the CFWS, your weekly read. I produce a fresh CFWS every week, capturing how your body\'s responding to what we\'ve applied.',
    coachScript: '"Once we\'re going we\'re in a continuous cycle — I read, I adjust, I read again. Every week I do what\'s called a CFWS — your weekly read on how your body\'s responding to what we\'ve applied. That feeds my next adjustment. It\'s not a static plan, it adapts as your body adapts."',
  },
] as const

// ─── Pricing & Packages ────────────────────────────────────────────────────

const WHATS_INCLUDED = [
  'Foundational intake and CFFS — your biological read',
  'Training program written from your data, not a template',
  'Nutrition structure built around your profile',
  'Weekly check-in and CFWS — your weekly read on how your body\'s responding',
  'Direct access between sessions',
  'Two coached sessions per week (in-person packages)',
] as const

const PACKAGES = [
  { tier: 'In-Person 2x', price: '$299/week', founding: '$149.50/week', desc: 'Two coached sessions per week. The default starting structure.', coachAssessed: false, stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00', stripeFounding: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05' },
  { tier: 'In-Person 3x', price: '$409/week', founding: '$204.50/week', desc: 'Three coached sessions per week. Offered when schedule and capacity allow.', coachAssessed: true, stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03', stripeFounding: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06' },
  { tier: 'In-Person 1x + self-led', price: '$199/week', founding: '$99.50/week', desc: 'One coached session per week, you train independently the rest. For clients who already train consistently on their own.', coachAssessed: true, stripe: 'https://buy.stripe.com/eVq5kFeng0yO6ID7tl5ZC0a', stripeFounding: 'https://buy.stripe.com/bJefZj0wqdlA3wrbJB5ZC0b' },
  { tier: 'Online', price: '$149/week', founding: '$74.50/week', desc: 'Same system, same interpretation, weekly check-ins and direct access — no in-person sessions.', coachAssessed: false, stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02', stripeFounding: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04' },
] as const

const COMMENCEMENT_FEE = '$240'

const FOUNDING_OFFER = {
  headline: 'Founding Client Offer · First 20 clients · 50% off',
  blurb: 'Half rate for the duration of their engagement. No agreement, no extra requirement — same coaching, half the fee. Mention only after the standard pricing has landed, or when relevant to the conversation.',
}

// ─── Coach drawer content ──────────────────────────────────────────────────

const OBJECTION_HANDLING = {
  toneIndicator: 'Tone: Solution to resistance',
  when: 'Use only when pricing has been presented → price objection raised → objection handled → resistance remains.',
  steps: [
    {
      label: 'Step 1 — Handle the objection',
      content: `They say: "That's a lot" / "It's too expensive" / "I can't justify that"

Repeat back: "Yeah — feels like a stretch right now. Got it."

"Here's how I'd look at it. You're not paying for two sessions a week. You're paying for me reading your body the whole time — loading it, recovering it, working out what's actually going on, adjusting. Most people don't have that at any price point.

The real question isn't whether it's expensive. It's whether what you've been doing has actually been working."

↳ Pause. Let them sit with it.
↳ If they move forward — Stage 4 decision panel, Path C (Full Rate).
↳ If price holds — move to Step 2.`,
    },
    {
      label: 'Step 2 — Introduce Online',
      content: `"There's an online option. Same system, same weekly read, same direct access — just remote instead of face to face.

That's $149 a week. Same $240 to get started."

↳ If online works — Stage 4 decision panel, Path C (Online).
↳ If price still holds — non-enrolment is fine. Close cleanly.`,
    },
  ],
  boundary: 'No urgency. No discount framing. Do not re-offer after decline.',
}

const ONLINE_SCRIPT = `"There's an online option — and it's not a lesser version. Same system, same weekly read, same coaching support. The only difference is we're not training together in person.

For some people that's actually the right fit — schedule, location, or just preference.

$149 a week. Same 12-week minimum. Same standards."`

// ─── Stage definitions ─────────────────────────────────────────────────────

type TypedPrompt = { type: 'prompt' | 'sub' | 'category'; text: string }

interface Stage {
  id: number
  name: string
  duration: string
  goal: string
  script: string
  prompts: TypedPrompt[] | string[]
  tips: string | null
  boundary: string | null
  half: 1 | 2
}

type TrainingStatus = 'active' | 'returning' | 'new' | null

function buildStages(leadName: string, bodyState: string, totalScore: number | null, trainingStatus: TrainingStatus): Stage[] {
  const firstName = leadName.split(' ')[0]
  const stateInfo = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  const stage2Tail =
    trainingStatus === 'returning'
      ? `That's where you're at right now, before we put any load back in.\n\nWhat was your reaction when you saw it?`
      : trainingStatus === 'new'
      ? `That's your starting point — where we work from before adding any training in.\n\nWhat was your reaction when you saw it?`
      : `What was your reaction when you saw the result?`

  const stage4Preface =
    trainingStatus === 'returning'
      ? `Coming back into it, this gives us a clear starting point.\n\n`
      : trainingStatus === 'new'
      ? `This is the starting point — important context for how we ease you in.\n\n`
      : ``

  return [
    {
      id: 1,
      name: 'Recap',
      duration: '5-7 min',
      goal: 'Recap their scorecard results and what you\'ve already covered with them. Their reaction is the signal.',
      script: `"OK ${firstName}, before we go any further I want to recap where we\'re at.

Your scorecard came back as ${bodyState}${scoreDisplay}.

${stage4Preface}${stateInfo.interpretation}

${stage2Tail}"`,
      prompts: [
        { type: 'prompt', text: 'Quick first — are you currently training, coming back to it after a break, or fairly new to all this?' },
        { type: 'prompt', text: 'What stood out to you most when you saw your result?' },
        { type: 'prompt', text: 'Did it feel accurate to where you\'re at?' },
        { type: 'prompt', text: 'Anything that surprised you, or didn\'t land?' },
      ] as TypedPrompt[],
      tips: 'Capture their training context using the toggle below before moving on. Stages 2-3 adapt automatically. The scorecard breakdown panel is right here — point at sections as you reference them.',
      boundary: null,
      half: 1,
    },
    {
      id: 2,
      name: 'Conversation & Hot Spot',
      duration: '10-15 min',
      goal: 'Build the conversation. Explore context (energy, sleep, stress, training) to build rapport, then push to the real emotional reason they\'re here. Specific, vulnerable, in their words.',
      script: `"Now I want to get a clearer picture of what\'s actually been going on for you. The scorecard shows the pattern but doesn\'t know the why behind it.

I\'ll ask a few questions about how things are going day to day. Then we\'ll talk about what you actually want to change. Just answer honestly — there\'s no right answer."`,
      prompts: [
        { type: 'category', text: 'CONTEXT — BUILD THE PICTURE' },
        { type: 'category', text: 'ENERGY' },
        { type: 'prompt', text: 'Walk me through what a typical day looks like energy-wise.' },
        { type: 'sub', text: 'Do you rely on caffeine to get through the day?' },
        { type: 'sub', text: 'When does the energy drop usually hit?' },
        { type: 'sub', text: 'How does energy feel after training specifically?' },
        { type: 'category', text: 'SLEEP' },
        { type: 'prompt', text: 'What does sleep actually look like for you right now?' },
        { type: 'sub', text: 'Are you waking through the night?' },
        { type: 'sub', text: 'Do you wake feeling rested?' },
        { type: 'sub', text: 'Has this been going on long, or recent?' },
        { type: 'category', text: 'STRESS LOAD' },
        { type: 'prompt', text: 'What\'s the stress load like right now — work, life, or something else?' },
        { type: 'sub', text: 'Is the demand ongoing or situational?' },
        { type: 'sub', text: 'Do you carry it into training?' },
        { type: 'sub', text: 'Any genuine downtime in a typical week?' },
        ...(trainingStatus === 'returning'
          ? [
              { type: 'category', text: 'TRAINING (RETURNING)' },
              { type: 'prompt', text: 'Walk me through what training looked like before you stepped back.' },
              { type: 'sub', text: 'What made you stop?' },
              { type: 'sub', text: 'How long has it been?' },
              { type: 'sub', text: 'What does training look like right now, if anything?' },
            ] as TypedPrompt[]
          : trainingStatus === 'new'
          ? [
              { type: 'category', text: 'TRAINING (NEW)' },
              { type: 'prompt', text: 'Have you done any structured exercise before?' },
              { type: 'sub', text: 'What\'s prompted you to look at this now?' },
              { type: 'sub', text: 'What does activity look like in a typical week right now?' },
            ] as TypedPrompt[]
          : [
              { type: 'category', text: 'TRAINING' },
              { type: 'prompt', text: 'What does progress actually look like compared to what you\'re putting in?' },
              { type: 'sub', text: 'Are you getting stronger over time?' },
              { type: 'sub', text: 'How do you feel during sessions compared to 6-12 months ago?' },
              { type: 'sub', text: 'Does the body feel beaten up, or recovered between sessions?' },
            ] as TypedPrompt[]),
        { type: 'category', text: 'HOT SPOT — WHAT YOU REALLY WANT TO CHANGE' },
        { type: 'prompt', text: 'What is it about how you look or feel right now that you most want to change?' },
        { type: 'sub', text: 'Don\'t just say weight or size — what\'s underneath that?' },
        { type: 'sub', text: 'Is it how clothes fit? Catching yourself in the mirror?' },
        { type: 'sub', text: 'A specific situation where you really feel it?' },
        { type: 'prompt', text: 'When did you last feel really good in your body? What was different then?' },
        { type: 'prompt', text: 'If we sorted that out for you, what changes day to day?' },
        { type: 'prompt', text: 'Has anyone ever made a comment that stuck with you?' },
      ] as TypedPrompt[],
      tips: 'Build rapport with the context questions before you push for the hot spot. Often the hot spot surfaces naturally in the earlier categories — when it does, follow it. Repeat the hot spot back word-for-word when they say it. Drop it into live notes so you have it on hand for Stage 3.',
      boundary: 'No prescriptions, no advice, no solutions yet. Just listening and reflecting. The longer they sit in the truth of the hot spot, the more invested they get.',
      half: 1,
    },
    {
      id: 3,
      name: 'Tie hot spot to training',
      duration: '5-7 min',
      goal: 'Connect what they just told you in Stage 2 to what coaching does about it. Bridge from feeling understood to seeing the solution.',
      script: '',
      prompts: [
        '↳ Pause briefly between cards. Don\'t rush.',
        '↳ Card 02 (Where it shows up) — match their hot spot to a zone if it\'s locational ("you said hips and thighs — that\'s long-term hormonal").',
        '↳ Card 03 (What type of body) — name their likely profile based on intake + hot spot. Read the description.',
        '↳ Read the "How they connect" note after Card 03 — that\'s the bridge between zone and profile.',
      ] as string[],
      tips: 'Every card anchors back to their words from Stage 2. The coach script under each card is what you say — read it, don\'t paraphrase generically.',
      boundary: 'Don\'t jump to pricing until all four cards are walked through and tied back.',
      half: 2,
    },
    {
      id: 4,
      name: 'Offer & Packages',
      duration: '5-10 min',
      goal: 'Present pricing in the context of what they just connected to. Why each package suits. Then close.',
      script: `"You\'ve seen what I do, and you\'ve seen how it gets to the thing you told me about.

Here\'s what\'s included: the foundational intake and CFFS, your training program, nutrition structure, weekly check-in and CFWS read, direct access between sessions, and two coached sessions a week.

$299 a week. That\'s where most people start.

Three sessions is available where the schedule and your capacity allow — $409. I\'ll guide that based on what your body can actually handle.

There\'s also a one-off $240 to get started — covers the setup before coaching begins.

[IF SUITABLE — see tips below]

There\'s also a 1 session option — I\'m with you in person once a week and you do another session or two on your own. $199 a week. That suits people who already train consistently on their own and want me as the in-person check-in once a week.

— and one more thing —

Founding client offer for the first 20 clients. Half rate for the duration of your engagement. So $299 becomes $149.50. Online drops to $74.50. Three sessions becomes $204.50. One session drops to $99.50. Same coaching, just half the fee. Once 20 spots fill it closes."`,
      prompts: [
        '↳ PAUSE after stating the price. Let it land. Don\'t fill the silence.',
        '↳ Use the decision panel on the right to mark Path A / B / C when they respond.',
        'IF objection → open Coach Drawer → Objection Handling.',
      ] as string[],
      tips: 'Lead with 2x as the default. Mention 1x ONLY if their training history shows self-discipline (returning trainer with a strong base, busy exec who\'s trained consistently for years, etc). Skip 1x for new trainers, anyone who admitted inconsistency in Stage 2, or anyone where 2x is non-negotiable for habit-building. After stating the number, pause. Three paths: A declined (close cleanly), B needs time (diagnose what\'s sitting with them), C proceeding (pick pathway, send fee link).',
      boundary: 'No urgency manipulation. No discount framing. Don\'t present 1x to leads who haven\'t demonstrated they\'ll do the self-led work — it sets them up to fail. Non-enrolment is an acceptable outcome.',
      half: 2,
    },
  ]
}

// ─── Component ─────────────────────────────────────────────────────────────

type PathwayType = 'full_rate' | 'online'

interface ZoomCompanionProps {
  leadName: string
  bodyState: string
  totalScore: number | null
  sectionScores: Record<string, number> | null
  leadId: string
  initialNotes: string
  lastCommencementFeeSentAt: string | null
  commencementFeeSendCount: number
}

export default function ZoomCompanion({
  leadName, bodyState, totalScore, sectionScores, leadId, initialNotes,
  lastCommencementFeeSentAt, commencementFeeSendCount,
}: ZoomCompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [decisionPath, setDecisionPath] = useState<'A' | 'B' | 'C' | null>(null)
  const [pathwayType, setPathwayType] = useState<PathwayType | null>(null)
  const [trainingStatus, setTrainingStatusState] = useState<TrainingStatus>(null)
  const [compactMode, setCompactMode] = useState(true)
  const [declinedSent, setDeclinedSent] = useState(false)
  const [sendingDeclined, setSendingDeclined] = useState(false)
  const [callComplete, setCallComplete] = useState(false)

  // Coach drawer (Objection Handling, Online, Coach language)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerSection, setDrawerSection] = useState<'objection' | 'online' | 'language'>('objection')

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageScrollRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (stageScrollRef.current) stageScrollRef.current.scrollTop = 0
  }, [currentStage])

  // Persist training status per-lead in localStorage so a refresh mid-call
  // doesn't lose the selection. Hydration on mount only.
  useEffect(() => {
    try {
      const v = localStorage.getItem(`zoom-companion:${leadId}:training-status`)
      if (v === 'active' || v === 'returning' || v === 'new') {
        setTrainingStatusState(v)
      }
    } catch {}
  }, [leadId])

  // Compact mode: hides script / tips / boundary blocks for in-person calls
  // where reading paragraphs across a table is impractical. Persists globally.
  useEffect(() => {
    try {
      const v = localStorage.getItem('zoom-companion:compact')
      if (v === '0') setCompactMode(false)
      // default true otherwise (already initial state)
    } catch {}
  }, [])

  function toggleCompact() {
    setCompactMode(c => {
      const next = !c
      try { localStorage.setItem('zoom-companion:compact', next ? '1' : '0') } catch {}
      return next
    })
  }

  function setTrainingStatus(v: TrainingStatus) {
    setTrainingStatusState(v)
    try {
      if (v) {
        localStorage.setItem(`zoom-companion:${leadId}:training-status`, v)
      } else {
        localStorage.removeItem(`zoom-companion:${leadId}:training-status`)
      }
    } catch {}
  }

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const saveNotes = async () => {
    setSaving(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaving(false)
  }

  const markDecision = async (path: 'A' | 'B' | 'C') => {
    const statusMap = { A: 'closed_declined', B: 'zoom_completed', C: 'zoom_completed' }
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: statusMap[path],
        zoom2_outcome: path === 'A' ? 'not_proceeding' : path === 'B' ? 'needs_time' : 'proceeding',
      }),
    })
    setDecisionPath(path)
  }

  const markPathway = async (type: PathwayType) => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zoom2_pathway_type: type }),
    })
    setPathwayType(type)
  }

  const markCallComplete = async () => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'zoom_completed' }),
    })
    setCallComplete(true)
  }

  const sendDeclinedSequence = async () => {
    setSendingDeclined(true)
    await fetch(`/api/leads/${leadId}/send-zoom1-declined`, { method: 'POST' })
    setDeclinedSent(true)
    setSendingDeclined(false)
  }

  const STAGES = buildStages(leadName, bodyState, totalScore, trainingStatus)
  const stage = STAGES[currentStage]
  const stateInfo = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''
  const isFirstHalf = stage.half === 1
  const isDecisionStage = currentStage === 3

  const sectionColour = (score: number) =>
    score === 1 ? 'text-red-700 border-red-200 bg-red-50'
    : score === 2 ? 'text-amber-700 border-amber-200 bg-amber-50'
    : 'text-emerald-700 border-emerald-200 bg-emerald-50'

  const sectionDot = (score: number) =>
    score === 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-blue-500'

  function renderTypedPrompts(prompts: TypedPrompt[]) {
    return prompts.map((p, i) => {
      if (p.type === 'category') {
        return (
          <div key={i} className="flex items-center gap-3 pt-2">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{p.text}</span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
        )
      }
      if (p.type === 'sub') {
        return (
          <div key={i} className="ml-4 bg-transparent border border-stone-800 rounded-lg px-4 py-2">
            <p className="text-stone-400 text-sm">{p.text}</p>
          </div>
        )
      }
      return (
        <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl px-4 py-3">
          <p className="text-[#1A1A1A] text-sm leading-relaxed">{p.text}</p>
        </div>
      )
    })
  }

  function renderStringPrompts(prompts: string[]) {
    return prompts.map((p, i) => (
      <div key={i} className={`rounded-xl p-4 ${
        p.startsWith('↳') ? 'bg-transparent border border-stone-800' :
        p.startsWith('IF ') ? 'bg-amber-400/5 border border-amber-200' :
        'bg-stone-900 border border-stone-800'
      }`}>
        <p className="text-[#1A1A1A] text-sm leading-relaxed">{p}</p>
      </div>
    ))
  }

  return (
    <div className="h-screen bg-[#FFFFFF] text-[#1A1A1A] flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="border-b border-stone-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <a href={`/dashboard/leads/${leadId}`} className="text-xs text-stone-600 hover:text-stone-400 transition-colors mb-0.5 block">
              ← Back to lead
            </a>
            <p className="text-lg font-bold text-[#1A1A1A]">{leadName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stateInfo.colour}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stateInfo.badge}`} />
              {bodyState}{scoreDisplay}
            </div>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isFirstHalf ? 'border-stone-700 text-stone-500 bg-stone-900' : 'border-blue-200 text-[#1B6DFC] bg-blue-50'}`}>
              {isFirstHalf ? 'Listen' : 'Pitch'}
            </div>
            {trainingStatus && (
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                trainingStatus === 'active' ? 'border-blue-200 text-[#1B6DFC] bg-blue-50'
                : trainingStatus === 'returning' ? 'border-amber-200 text-amber-700 bg-amber-400/5'
                : 'border-violet-200 text-violet-700 bg-violet-400/5'
              }`}>
                {trainingStatus === 'active' ? 'Active trainer' : trainingStatus === 'returning' ? 'Returning' : 'New to training'}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleCompact}
            className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${compactMode ? 'border-[#1B6DFC]/40 text-[#1B6DFC] bg-blue-50' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
            title="Compact mode hides scripts, tips, and boundary panels — leaving only the prompts and action buttons. Best for in-person calls."
          >
            {compactMode ? 'Compact ✓' : 'Compact'}
          </button>
          <button
            onClick={() => { setDrawerSection('objection'); setDrawerOpen(o => !o) }}
            className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${drawerOpen ? 'border-amber-400/40 text-amber-700 bg-amber-50' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
          >
            Coach Drawer
          </button>
          <span className="text-2xl font-mono font-bold text-[#1A1A1A] tabular-nums">{formatTime(seconds)}</span>
          <button
            onClick={() => setRunning(r => !r)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${running ? 'bg-stone-700 hover:bg-stone-600 text-[#1A1A1A]' : 'bg-[#1B6DFC] text-[#1A1A1A] hover:bg-[#1056D6]'}`}
          >
            {running ? 'Pause' : seconds === 0 ? 'Start' : 'Resume'}
          </button>
          {seconds > 0 && (
            <button onClick={() => { setSeconds(0); setRunning(false) }} className="text-xs text-stone-500 hover:text-stone-300 transition-colors">Reset</button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Stage nav */}
        <div className="w-52 border-r border-stone-200 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-2">Listen</p>
          {STAGES.filter(s => s.half === 1).map(s => {
            const idx = STAGES.indexOf(s)
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(idx)}
                className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                  idx === currentStage
                    ? 'bg-blue-50 border border-blue-200 text-[#1B6DFC]'
                    : idx < currentStage
                    ? 'text-stone-500 hover:text-stone-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <p className="text-xs font-bold">{s.id}. {s.name}</p>
                <p className="text-xs opacity-60 mt-0.5">{s.duration}</p>
              </button>
            )
          })}

          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-2 mt-4">Pitch</p>
          {STAGES.filter(s => s.half === 2).map(s => {
            const idx = STAGES.indexOf(s)
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(idx)}
                className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                  idx === currentStage
                    ? 'bg-blue-50 border border-blue-200 text-[#1B6DFC]'
                    : idx < currentStage
                    ? 'text-stone-500 hover:text-stone-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <p className="text-xs font-bold">{s.id}. {s.name}</p>
                <p className="text-xs opacity-60 mt-0.5">{s.duration}</p>
              </button>
            )
          })}

          <div className="mt-auto pt-4 border-t border-stone-200 flex gap-2">
            {currentStage > 0 && (
              <button onClick={() => setCurrentStage(s => s - 1)} className="flex-1 text-xs text-stone-500 hover:text-[#1A1A1A] py-1.5 rounded-lg border border-stone-200 hover:border-stone-300 transition-colors">
                Back
              </button>
            )}
            {currentStage < STAGES.length - 1 && (
              <button onClick={() => setCurrentStage(s => s + 1)} className="flex-1 text-xs text-[#1B6DFC] py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors">
                Next
              </button>
            )}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">

          <div ref={stageScrollRef} className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-widest">Stage {stage.id}</span>
                <span className="text-xs text-stone-600">{stage.duration}</span>
              </div>
              <h2 className="text-xl font-bold text-[#1A1A1A] mb-3">{stage.name}</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">{stage.goal}</p>

              {/* Stage 1 — Training context capture (drives Stage 2 personalisation) */}
              {stage.id === 1 && (
                <div className="mb-6 bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Training context</p>
                  <p className="text-xs text-stone-400 mb-4">Pick what matches before moving on. Stage 2 adapts to this.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'active' as const, label: 'Currently training', dot: 'bg-[#1B6DFC]', cls: 'border-[#1B6DFC]/40 bg-blue-50 text-[#1B6DFC]' },
                      { key: 'returning' as const, label: 'Returning to it', dot: 'bg-amber-400', cls: 'border-amber-400/40 bg-amber-50 text-amber-700' },
                      { key: 'new' as const, label: 'New to training', dot: 'bg-violet-400', cls: 'border-violet-400/40 bg-violet-50 text-violet-700' },
                    ]).map(opt => {
                      const selected = trainingStatus === opt.key
                      return (
                        <button
                          key={opt.key}
                          onClick={() => setTrainingStatus(selected ? null : opt.key)}
                          className={`px-3 py-3 rounded-lg text-xs font-semibold border transition-colors text-left ${
                            selected ? opt.cls : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${opt.dot}`} />
                            <span className="text-[10px] uppercase tracking-wider opacity-70">{opt.key}</span>
                          </div>
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                  {trainingStatus && (
                    <button
                      onClick={() => setTrainingStatus(null)}
                      className="mt-3 text-[11px] text-stone-600 hover:text-stone-400 transition-colors"
                    >
                      Clear selection
                    </button>
                  )}
                </div>
              )}

              {/* Stage 1 — Lead-specific scorecard breakdown lives in Recap */}
              {stage.id === 1 && (
                <div className="space-y-3 mb-6">
                  <div className={`border rounded-xl p-5 ${stateInfo.colour}`}>
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-1 opacity-80">Their result</p>
                    <p className="text-xl font-bold mb-2">{bodyState}{scoreDisplay}</p>
                    <p className="text-sm leading-relaxed opacity-80">{stateInfo.opening}</p>
                  </div>

                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Section breakdown — what they said</p>
                    {sectionScores ? (
                      <div className="space-y-3">
                        {Object.keys(SECTION_LABELS).map(key => {
                          const score = sectionScores[key] ?? null
                          const description = score ? SECTION_DESCRIPTIONS[key]?.[score] : null
                          const interpretation = score ? SECTION_INTERPRETATIONS[key]?.[score] : null
                          return (
                            <div key={key} className={`border rounded-lg p-3 ${score ? sectionColour(score) : 'border-stone-800 bg-stone-800/30 text-stone-500'}`}>
                              <div className="flex items-center justify-between mb-1.5">
                                <p className="text-xs font-bold uppercase tracking-wider">{SECTION_LABELS[key]}</p>
                                {score ? (
                                  <span className="text-xs font-bold">{score}/3</span>
                                ) : (
                                  <span className="text-xs">—</span>
                                )}
                              </div>
                              {description && (
                                <p className="text-sm leading-relaxed mb-1.5 opacity-90">&ldquo;{description}&rdquo;</p>
                              )}
                              {interpretation && (
                                <p className="text-xs leading-relaxed opacity-60">{interpretation}</p>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-stone-500 text-xs">No section breakdown captured for this lead. Use the body state context above.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Stage 3 — Tie hot spot to training: 4-card visual */}
              {stage.id === 3 && (
                <div className="space-y-3 mb-6">
                  {/* Opening tie-back */}
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">Open with</p>
                    <p className="text-sm text-stone-200 italic leading-relaxed">&ldquo;OK. Based on what you just told me about [their hot spot] — here&rsquo;s exactly how my coaching gets to that. Let me walk you through it.&rdquo;</p>
                  </div>

                  {HOW_IT_WORKS_STAGES.map(card => (
                    <div key={card.number} className="border border-stone-800 bg-stone-900 rounded-xl p-5">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-[#1B6DFC] tabular-nums leading-none">{card.number}</span>
                        <div>
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Stage {card.number}</p>
                          <p className="text-base font-bold text-[#1A1A1A]">{card.title}</p>
                          <p className="text-xs text-stone-500">{card.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-sm text-stone-300 leading-relaxed mb-3">{card.body}</p>

                      {'chips' in card && card.chips && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {card.chips.map(chip => (
                            <span key={chip} className="text-[11px] font-medium px-2 py-1 rounded-md bg-stone-800 border border-stone-700 text-stone-300">
                              {chip}
                            </span>
                          ))}
                        </div>
                      )}

                      {'zones' in card && card.zones && (
                        <div className="space-y-2 mb-3">
                          {card.zones.map(z => {
                            const dotClass =
                              z.dot === 'red' ? 'bg-red-400' :
                              z.dot === 'amber' ? 'bg-amber-400' :
                              z.dot === 'purple' ? 'bg-purple-400' :
                              'bg-cyan-400'
                            return (
                              <div key={z.region} className="flex items-center gap-3 bg-stone-800 border border-stone-700 rounded-lg p-3">
                                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotClass}`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-[#1A1A1A]">{z.region}</p>
                                  <p className="text-[11px] text-stone-400 leading-snug">{z.driver}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      {'pieces' in card && card.pieces && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {card.pieces.map(p => (
                            <div key={p.name} className="bg-stone-800 border border-stone-700 rounded-lg p-3">
                              <p className="text-xs font-semibold text-[#1A1A1A] mb-0.5">{p.name}</p>
                              <p className="text-[11px] text-stone-400 leading-snug">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {'bridge' in card && card.bridge && (
                        <div className="bg-amber-400/5 border border-amber-200 rounded-lg p-3 mb-3">
                          <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">How they connect</p>
                          <p className="text-[13px] text-stone-300 leading-relaxed">{card.bridge}</p>
                        </div>
                      )}

                      <div className="border-t border-stone-800 pt-3 mt-3">
                        <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-1">Coach script</p>
                        <p className="text-sm text-stone-200 italic leading-relaxed">{card.coachScript}</p>
                      </div>
                    </div>
                  ))}

                  {/* Closing line */}
                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">Close with</p>
                    <p className="text-sm text-stone-200 italic leading-relaxed">&ldquo;That&rsquo;s how I get to the thing you just told me.&rdquo;</p>
                  </div>
                </div>
              )}

              {/* Stage 4 — Offer & Packages */}
              {stage.id === 4 && (
                <div className="space-y-3 mb-6">
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">What\'s included</p>
                    <ul className="space-y-2">
                      {WHATS_INCLUDED.map(item => (
                        <li key={item} className="flex gap-2 text-sm text-stone-300 leading-relaxed">
                          <span className="text-[#1B6DFC] flex-shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    {PACKAGES.map(pkg => (
                      <div key={pkg.tier} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                        <div className="flex items-baseline justify-between mb-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-bold text-[#1A1A1A]">{pkg.tier}</p>
                            {pkg.coachAssessed && (
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 border border-amber-200 bg-amber-50 px-1.5 py-0.5 rounded">Coach-assessed</span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-[#1B6DFC]">{pkg.price}</p>
                            <p className="text-[11px] text-stone-500">Founding: <span className="text-[#1B6DFC]/80 font-semibold">{pkg.founding}</span></p>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{pkg.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-sm text-stone-300">One-time commencement fee</p>
                    <p className="text-base font-bold text-[#1A1A1A] tabular-nums">{COMMENCEMENT_FEE}</p>
                  </div>

                  <div className="border border-blue-200 bg-blue-50 rounded-xl p-4">
                    <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-1">{FOUNDING_OFFER.headline}</p>
                    <p className="text-stone-300 text-sm leading-relaxed">{FOUNDING_OFFER.blurb}</p>
                  </div>
                </div>
              )}

              {/* Script — hidden in compact mode */}
              {stage.script && !compactMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-3">
                  <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-wider mb-3">Script</p>
                  <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
                </div>
              )}

              {/* Prompts */}
              {stage.prompts.length > 0 && (
                <div className="space-y-3 mb-3">
                  {Array.isArray(stage.prompts) && typeof stage.prompts[0] === 'object' && 'type' in (stage.prompts[0] as object)
                    ? renderTypedPrompts(stage.prompts as TypedPrompt[])
                    : renderStringPrompts(stage.prompts as string[])}
                </div>
              )}

              {/* Tips — hidden in compact mode */}
              {stage.tips && !compactMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                  <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-wider mb-1">Coach note</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{stage.tips}</p>
                </div>
              )}

              {/* Boundary — hidden in compact mode */}
              {stage.boundary && !compactMode && (
                <div className="bg-red-400/5 border border-red-200 rounded-xl p-4 mt-3">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Boundary</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{stage.boundary}</p>
                </div>
              )}

            </div>
          </div>

          {/* Notes + Decision panel */}
          <div className="w-72 border-l border-stone-200 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Live Notes</p>
              <button onClick={saveNotes} className="text-xs text-[#1B6DFC] hover:text-[#1A1A1A] transition-colors font-semibold">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Type observations as the call unfolds..."
              className="flex-1 bg-transparent text-stone-300 text-sm p-4 resize-none focus:outline-none placeholder-stone-700 leading-relaxed"
              style={{ minHeight: '200px' }}
            />

            <div className="p-4 border-t border-stone-200 space-y-3">

              {/* Decision panel — only on Stage 4 */}
              {isDecisionStage && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Mark outcome</p>
                  {!decisionPath ? (
                    <>
                      <button onClick={() => markDecision('A')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-red-50 border border-red-500/20 text-red-700 hover:bg-red-100 transition-colors">
                        Path A — Declined
                      </button>
                      <button onClick={() => markDecision('B')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-amber-50 border border-amber-500/20 text-amber-700 hover:bg-amber-100 transition-colors">
                        Path B — Needs Time
                      </button>
                      <button onClick={() => markDecision('C')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1B6DFC] hover:bg-[#1B6DFC]/20 transition-colors">
                        Path C — Proceeding
                      </button>
                    </>
                  ) : decisionPath === 'C' && !pathwayType ? (
                    <>
                      <p className="text-xs text-stone-500 mb-1">How did they proceed?</p>
                      <button onClick={() => markPathway('full_rate')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1B6DFC] hover:bg-[#1B6DFC]/20 transition-colors">
                        Full Rate (In-Person)
                      </button>
                      <button onClick={() => markPathway('online')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-stone-700/50 border border-stone-600 text-stone-300 hover:bg-stone-700 transition-colors">
                        Online
                      </button>
                    </>
                  ) : decisionPath !== 'C' ? (
                    <div className={`text-xs font-bold px-3 py-2 rounded-lg text-center ${
                      decisionPath === 'A'
                        ? 'bg-red-50 border border-red-500/20 text-red-700'
                        : 'bg-amber-50 border border-amber-500/20 text-amber-700'
                    }`}>
                      Path {decisionPath} recorded
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs font-bold px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-[#1B6DFC] text-center">
                        {pathwayType === 'full_rate' ? 'Full Rate' : 'Online'} — send commencement fee
                      </div>
                      <CommencementFeeButton leadId={leadId} />
                      {lastCommencementFeeSentAt && (() => {
                        const sentAt = new Date(lastCommencementFeeSentAt)
                        const ageHours = (Date.now() - sentAt.getTime()) / 36e5
                        const expired = ageHours >= 24
                        const sentLabel = sentAt.toLocaleString('en-AU', {
                          timeZone: 'Australia/Brisbane',
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: 'numeric', minute: '2-digit', hour12: true,
                        })
                        return (
                          <p className={`text-[11px] ${expired ? 'text-amber-500' : 'text-stone-500'}`}>
                            Last sent {sentLabel} Brisbane{commencementFeeSendCount > 1 ? ` · ${commencementFeeSendCount}×` : ''}
                            {expired && ' · link expired'}
                          </p>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )}

              {/* Mark call complete */}
              <button
                onClick={markCallComplete}
                disabled={callComplete}
                className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors ${callComplete ? 'bg-blue-600/10 border border-blue-600/20 text-emerald-700' : 'bg-stone-800 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-[#1A1A1A]'}`}
              >
                {callComplete ? 'Call Marked Complete' : 'Mark Call Complete'}
              </button>

              {/* Declined follow-up */}
              <button
                onClick={sendDeclinedSequence}
                disabled={declinedSent || sendingDeclined}
                className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors ${declinedSent ? 'bg-stone-900 border border-stone-800 text-stone-600' : 'bg-stone-800 border border-stone-700 text-amber-700 hover:border-amber-300 hover:text-amber-700'}`}
              >
                {declinedSent ? 'Declined sequence sent' : sendingDeclined ? 'Sending...' : 'Send declined follow-up'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Coach Drawer (overlay) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawerOpen(false)} />
          <div className="w-[420px] bg-[#FFFFFF] border-l border-stone-200 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Coach Drawer</p>
              <button onClick={() => setDrawerOpen(false)} className="text-stone-500 hover:text-[#1A1A1A] text-sm">×</button>
            </div>

            <div className="flex gap-1 border-b border-stone-800">
              {([
                { key: 'objection', label: 'Objection Handling' },
                { key: 'online', label: 'Online' },
                { key: 'language', label: 'Language' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setDrawerSection(t.key)}
                  className={`text-xs font-semibold px-3 py-2 border-b-2 -mb-px transition-colors ${
                    drawerSection === t.key
                      ? 'border-amber-400 text-amber-700'
                      : 'border-transparent text-stone-500 hover:text-stone-300'
                  }`}
                >{t.label}</button>
              ))}
            </div>

            {drawerSection === 'objection' && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">{OBJECTION_HANDLING.toneIndicator}</p>
                  <p className="text-stone-400 text-xs leading-relaxed">{OBJECTION_HANDLING.when}</p>
                </div>
                {OBJECTION_HANDLING.steps.map((step, i) => (
                  <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">{step.label}</p>
                    <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{step.content}</p>
                  </div>
                ))}
                <div className="bg-red-400/5 border border-red-200 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">Boundary</p>
                  <p className="text-stone-400 text-xs">{OBJECTION_HANDLING.boundary}</p>
                </div>
              </div>
            )}

            {drawerSection === 'online' && (
              <div className="space-y-3">
                <div className="bg-amber-400/5 border border-amber-200 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Online Coaching script</p>
                  <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{ONLINE_SCRIPT}</p>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Package</p>
                  <div className="flex items-center justify-between">
                    <p className="text-[#1A1A1A] text-sm font-semibold">Online Performance Coaching</p>
                    <p className="text-amber-700 text-sm font-bold">$149/week</p>
                  </div>
                </div>
              </div>
            )}

            {drawerSection === 'language' && (
              <div className="space-y-3">
                <div className={`border rounded-xl p-4 ${stateInfo.colour}`}>
                  <p className="text-xs font-bold uppercase tracking-wider mb-2">{bodyState} — Pattern</p>
                  <p className="text-sm leading-relaxed opacity-90 mb-3">{stateInfo.pattern}</p>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Interpretation language</p>
                  <p className="text-stone-300 text-sm leading-relaxed italic">&ldquo;{stateInfo.interpretation}&rdquo;</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
