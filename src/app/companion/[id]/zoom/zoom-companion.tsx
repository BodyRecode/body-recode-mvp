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
    colour: 'text-red-400 border-red-400/30 bg-red-400/10',
    badge: 'bg-red-400',
    // Coach-facing — what's going on under the hood. Not spoken aloud.
    opening: 'Their scorecard came back as Depleted State. Body is in protection mode — cortisol elevated, metabolism suppressed, fat loss and performance shut down. The scorecard surfaced the signal. The call is about understanding what\'s driving it.',
    // Spoken to the lead. Plain, direct.
    interpretation: 'What you\'re seeing isn\'t an effort or willpower thing — your body\'s protecting itself. When you\'re running on poor sleep, high stress, and training that isn\'t paying off, your body shifts into preservation mode. The fact that fat loss has stalled and training feels harder than it should — those are two sides of the same thing.',
    pattern: 'Depleted State: body in protection mode. Cortisol up, metabolism down. Adding more training stimulus makes it worse. The fix is smarter management, not harder work.',
  },
  'Transitioning State': {
    colour: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    badge: 'bg-amber-400',
    opening: 'Their scorecard came back as Transitioning State. They\'ve got capacity but something\'s blocking consistent response. Sleep, stress, recovery rhythm, or a mismatch between training load and where their body is right now. Call is about identifying which.',
    interpretation: 'You\'ve got the capacity — you\'re just not consistently expressing it. Some weeks things click, other weeks they don\'t. That inconsistency is the actual issue. Usually it\'s one or two things holding the rest of it back.',
    pattern: 'Transitioning State: capacity is there, consistency isn\'t. Usually one or two sections dragging the picture. Identify the specific drivers and address them in order.',
  },
  'Ready State': {
    colour: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
    badge: 'bg-teal-400',
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
    title: 'Biological Interpretation',
    subtitle: 'The CFFS',
    body: 'I read your data through the Body Recode™ Interpretive Pillars — the Fat Map Method™ is the primary one. The output is the CFFS — your Coach-Facing Foundational Synthesis. It defines your biological profile and the boundaries I work within from there.',
    pieces: [
      { name: 'Stress-Stored', desc: 'Managing a lot, holding on. Body holds tighter instead of releasing fat. The harder you push, the less moves.' },
      { name: 'Estrogen-Shift', desc: 'Body has changed. What used to work doesn\'t anymore. Fat distribution shifted, recovery feels different.' },
      { name: 'Insulin-Drift', desc: 'Energy is inconsistent. Eating well but feeling flat. Body partitioning energy differently than it used to.' },
      { name: 'Androgen-Decline', desc: 'Response has dropped off. Muscle harder to hold, recovery slower, the stimulus that used to work has stopped.' },
    ],
    coachScript: '"From your intake I put together what we call a CFFS — that\'s your foundational read. It tells me which of four profiles you fit into. Based on what you\'ve told me, you\'re sitting in [name the profile]. From there it sets the rules for everything I do with you."',
  },
  {
    number: '03',
    title: 'Execution',
    subtitle: 'Program · Nutrition · Synthesis · Portal',
    body: 'With the CFFS established, execution begins. Training, nutrition, and weekly check-in synthesis are all delivered through your client portal. Live from day one.',
    pieces: [
      { name: 'Training Program', desc: 'Load, volume and modality derived from CFFS — not a template' },
      { name: 'Nutrition Structure', desc: 'Built around your biological profile, adjusted as state shifts' },
      { name: 'Weekly Check-In', desc: 'Structured data capture produces the CFWS in real time' },
      { name: 'Client Portal', desc: 'Program, plan, synthesis docs and check-in history in one place' },
    ],
    coachScript: '"Everything lives in your portal — training program, nutrition, weekly check-ins. All in one place. All driven by your CFFS."',
  },
  {
    number: '04',
    title: 'The Continuous Loop',
    subtitle: 'CFFS + CFWS in parallel',
    body: 'Two documents run in parallel the whole way through: the CFFS — the foundation that doesn\'t change — and the CFWS, your weekly read. I produce a fresh CFWS every week, capturing how your body\'s responding to what we\'ve applied.',
    coachScript: '"Once we\'re going we\'re in a continuous cycle — I read, I adjust, I read again. Every week I do what\'s called a CFWS — your weekly read on how your body\'s responding to what we\'ve applied. That feeds my next adjustment. It\'s not a static plan, it adapts as your body adapts."',
  },
] as const

// ─── Pricing & Packages ────────────────────────────────────────────────────

const PRICING_BREAKDOWN = [
  { label: 'CFFS diagnostic & body state interpretation', value: '$297' },
  { label: 'Training program written for your state', value: '$200' },
  { label: 'Nutrition protocol', value: '$150' },
  { label: 'Weekly CFWS interpretation', value: '$150 / week' },
  { label: 'Direct access between sessions', value: '$100 / week' },
  { label: 'In-person sessions (2/wk)', value: '$120 each' },
] as const

const PACKAGES = [
  { tier: 'In-Person 2x', price: '$299/week', founding: '$149.50/week', desc: 'Two coached sessions per week. The default starting structure.', stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00', stripeFounding: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05' },
  { tier: 'In-Person 3x', price: '$409/week', founding: '$204.50/week', desc: 'Three coached sessions per week. Coach-assessed only — offered when capacity allows.', stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03', stripeFounding: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06' },
  { tier: 'Online', price: '$149/week', founding: '$74.50/week', desc: 'Same system, same interpretation, weekly check-ins and direct access — no in-person sessions.', stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02', stripeFounding: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04' },
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
↳ If they move forward — Stage 9, Path C (Full Rate).
↳ If price holds — move to Step 2.`,
    },
    {
      label: 'Step 2 — Introduce Online',
      content: `"There's an online option. Same system, same weekly read, same direct access — just remote instead of face to face.

That's $149 a week. Same $240 to get started."

↳ If online works — Stage 9, Path C (Online).
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
    // ── FIRST HALF (consultation) ──────────────────────────────────────────
    {
      id: 1,
      name: 'Opening Frame',
      duration: '2-3 min',
      goal: 'Create safety. Establish this is not a sales call. Set the tone.',
      script: `"Thanks for jumping on, ${firstName}.

The plan today is to walk through what showed up in your scorecard and hear what's actually going on for you.

Nothing to decide today. I just want to check that what the scorecard picked up matches what you're seeing."`,
      prompts: [
        { type: 'prompt', text: 'Quick first — are you currently training, coming back to it after a break, or fairly new to all this?' },
        { type: 'prompt', text: 'How did you find doing the scorecard?' },
        { type: 'prompt', text: 'Was it straightforward to answer?' },
        { type: 'prompt', text: 'Did anything make you stop and think?' },
      ] as TypedPrompt[],
      tips: 'Capture their training context using the toggle above before moving to Stage 2. Stages 2-4 will adapt automatically. Slow down. Let them land.',
      boundary: null,
      half: 1,
    },
    {
      id: 2,
      name: 'Scorecard Reflection',
      duration: '4-6 min',
      goal: 'Walk them through their actual results. Let them respond before you interpret. Their reaction is the signal.',
      script: `"Before I tell you what I see, I want to hear what you see first.

Your scorecard came back as ${bodyState}${scoreDisplay}.

${stage2Tail}"`,
      prompts: [
        { type: 'prompt', text: 'What stood out to you most when you saw your result?' },
        { type: 'prompt', text: 'Did it feel accurate to where you\'re at right now?' },
        { type: 'prompt', text: 'Was there anything that surprised you, or anything that didn\'t land?' },
        { type: 'prompt', text: 'Had you considered any of those areas as a factor before?' },
      ] as TypedPrompt[],
      tips: 'Their reaction surfaces the real friction point. The strongest insight usually appears here. The section breakdown is right there in the panel — refer to specific scores when they speak.',
      boundary: null,
      half: 1,
    },
    {
      id: 3,
      name: 'Context Exploration',
      duration: '10-12 min',
      goal: 'Get the picture behind the scores. The scorecard gives the signal — the conversation gives the context.',
      script: `"Now I want to get a clearer picture of what's actually been going on. The scorecard shows the pattern but doesn't know the why.

I'll ask a few questions. Just answer honestly — there's no right answer."`,
      prompts: [
        { type: 'category', text: 'ENERGY' },
        { type: 'prompt', text: 'Walk me through what a typical day looks like for you energy-wise.' },
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
        { type: 'sub', text: 'Do you find yourself carrying it into training?' },
        { type: 'sub', text: 'Any genuine downtime in a typical week?' },
        ...(trainingStatus === 'returning'
          ? [
              { type: 'category', text: 'TRAINING (RETURNING)' },
              { type: 'prompt', text: 'Walk me through what training looked like before you stepped back.' },
              { type: 'sub', text: 'What made you stop?' },
              { type: 'sub', text: 'How long has it been?' },
              { type: 'sub', text: 'What does training look like right now, if anything?' },
              { type: 'category', text: 'COMPOSITION' },
              { type: 'prompt', text: 'Walk me through how things shifted while you were away from training.' },
              { type: 'sub', text: 'Has the body changed in ways that have surprised you?' },
              { type: 'sub', text: 'Has anything you\'ve tried recently moved the needle?' },
              { type: 'sub', text: 'How long has it felt off?' },
            ] as TypedPrompt[]
          : trainingStatus === 'new'
          ? [
              { type: 'category', text: 'TRAINING (NEW)' },
              { type: 'prompt', text: 'Have you done any structured exercise before?' },
              { type: 'sub', text: 'What\'s prompted you to look at this now?' },
              { type: 'sub', text: 'What does activity look like in a typical week right now?' },
              { type: 'sub', text: 'Is there anything you\'ve been trying on your own?' },
              { type: 'category', text: 'COMPOSITION' },
              { type: 'prompt', text: 'Walk me through what you\'ve tried before in terms of body composition.' },
              { type: 'sub', text: 'Has anything worked, or has it been mostly stalled?' },
              { type: 'sub', text: 'How long has it felt this way?' },
            ] as TypedPrompt[]
          : [
              { type: 'category', text: 'TRAINING RESPONSE' },
              { type: 'prompt', text: 'What does progress actually look like compared to what you\'re putting in?' },
              { type: 'sub', text: 'Are you getting stronger over time?' },
              { type: 'sub', text: 'How do you feel during sessions compared to 6-12 months ago?' },
              { type: 'sub', text: 'Does the body feel beaten up or recovered between sessions?' },
              { type: 'category', text: 'FAT LOSS RESPONSE' },
              { type: 'prompt', text: 'Walk me through what you\'ve tried for fat loss and what\'s actually happened.' },
              { type: 'sub', text: 'Is the diet consistent?' },
              { type: 'sub', text: 'Has anything worked in the past? What changed?' },
              { type: 'sub', text: 'How long has it felt stuck?' },
            ] as TypedPrompt[]),
      ] as TypedPrompt[],
      tips: 'One question at a time. Let silence work. You\'re building context — not solving anything.',
      boundary: 'No prescriptions. No "you should try...". No advice. Just listening.',
      half: 1,
    },
    {
      id: 4,
      name: 'Pattern Interpretation',
      duration: '5-7 min',
      goal: 'Name the pattern clearly. Make it understandable, not alarming.',
      script: `"Based on what you've told me and what showed up in the scorecard, here's what I'm hearing.

${stage4Preface}${stateInfo.interpretation}

That's not on you — it's how the body responds when these things stack up. It's also one of the more common patterns I see."`,
      prompts: [
        { type: 'prompt', text: 'Does that explanation feel like it reflects what you\'ve been experiencing?' },
        { type: 'prompt', text: 'Does it help make sense of what you\'ve noticed?' },
        { type: 'prompt', text: 'Did anything in that surprise you?' },
        { type: 'prompt', text: 'Has it changed the way you\'re thinking about it?' },
      ] as TypedPrompt[],
      tips: 'Keep it observational. Make the pattern feel understandable — not alarming.',
      boundary: 'No medical interpretation. No outcome promises. Pattern identification only.',
      half: 1,
    },

    // ── SECOND HALF (bridge → system → price → decision) ───────────────────
    {
      id: 5,
      name: 'Hot Spot Framing',
      duration: '5-7 min',
      goal: 'Name the specific thing that came up in the first half, confirm it. Do not move on until they feel understood.',
      script: `"Before we talk about what working together looks like, I want to come back to something you said.

[Name the specific thing — e.g. "You said you've been training consistently but your body isn't responding the way it should." OR "You said something shifted and you're not sure when or why."]

That's the spot where what you're putting in stopped matching what you're getting back. That's the thing we're going to address.

Does that sound about right?"`,
      prompts: [
        '↳ If yes → "Good. That\'s exactly what we\'re going to address. Let me explain how it works."',
        '↳ If they add more → let them talk. The more specific they get, the more invested they become.',
        'IF MOTIVATION COMES UP → "Motivation is information, not the problem."',
        'IF THEY MINIMISE IT → "Most people do that — they\'ve been managing it for so long it starts to feel normal."',
      ] as string[],
      tips: 'You already know the hot spot from the first half. This is about naming it back precisely and watching them confirm it.',
      boundary: 'Do not move on until the hot spot is clearly named and confirmed.',
      half: 2,
    },
    {
      id: 6,
      name: 'Emotional Acknowledgement',
      duration: '2-3 min',
      goal: 'Normalise the confusion and confidence erosion that comes with interpretive uncertainty.',
      script: `"One more thing I want to mention, because it comes up a lot.

When you can't tell why your body's not responding, it does more than just confuse you — it eats away at your confidence.

You start second-guessing your effort, your judgement, even your consistency.

Not because you're doing anything wrong — but because you can't see what your body's actually telling you."`,
      prompts: [
        'Has that been part of your experience — second-guessing yourself?',
        'How long has that been sitting with you?',
        '↳ TRANSITION → "Good — let me walk you through what the system actually does."',
      ] as string[],
      tips: 'Observational, not therapeutic. Name it and move on.',
      boundary: null,
      half: 2,
    },
    {
      id: 7,
      name: 'How The System Works',
      duration: '5-7 min',
      goal: 'Walk through the four stages of the Body Recode™ system. They need to see what they\'re actually paying for before pricing.',
      script: `"Before I get to the numbers, I want to walk you through how this actually works — four stages, every client goes through them. The price you'll hear next isn't for sessions. It's for this."`,
      prompts: [
        '↳ Walk through cards 1 → 4 in order. Each has a 1-line script underneath.',
        '↳ Pause briefly between cards. Don\'t rush.',
        '↳ End with: "That\'s the whole system. Continuous loop, governed by data, not guesswork."',
      ] as string[],
      tips: 'This is a presentation, not a conversation. They\'re absorbing the structure. Speak to each card slowly. Don\'t add improvised content — the cards have the language.',
      boundary: 'Do not jump to pricing before all four cards have been walked through.',
      half: 2,
    },
    {
      id: 8,
      name: 'Pricing',
      duration: '5-10 min',
      goal: 'Present the packages as information, not persuasion. Lead with In-Person 2x.',
      script: `"Now you've seen what's involved. Here's what it costs.

Before I give you the number, let me show you what each piece is worth on its own — so the number makes sense.

[Walk through the breakdown: CFFS $297, Program $200, Nutrition $150, Weekly read $150/wk, Direct access $100/wk, Sessions $120 each.]

Add it up — you're well over $1,000 a month for the individual pieces.

The full thing together is $299 a week. Two sessions per week. That's where most people start.

Three sessions is available where the schedule and your capacity allow — $409. I'll guide that based on what your body can actually handle.

There's also a one-off $240 to get started — covers the setup before coaching begins.

— and one more thing —

I'm running a founding client offer for the first 20 clients. Half rate for the duration of your engagement with me. So instead of $299 a week it's $149.50. Online drops to $74.50, three-session in-person to $204.50. Same coaching, same depth — just half the fee. Once 20 spots are filled it closes."`,
      prompts: [
        '↳ PAUSE after stating the price. Let it land. Do not fill the silence.',
        '↳ TRANSITION → When they respond, move to Stage 9.',
        'IF objection → open Coach Drawer → Objection Handling.',
      ] as string[],
      tips: 'Present pricing as information. No urgency. After stating the number — pause.',
      boundary: 'Lead with In-Person 2x. Online ($149/wk) only if they can\'t do in-person. 3x is coach-assessed only.',
      half: 2,
    },
    {
      id: 9,
      name: 'Decision',
      duration: '2-3 min',
      goal: 'Identify the pathway and close cleanly.',
      script: `"Take whatever time you need.

If it feels like the right fit, we can talk through next steps.

If not, that's fine — the scorecard read still stands on its own."`,
      prompts: [] as string[],
      tips: 'Three paths. Know which one you\'re in before you respond. Path A closes cleanly — don\'t re-pitch.',
      boundary: 'No urgency. No discount framing. Non-enrolment is an acceptable outcome.',
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
}

export default function ZoomCompanion({
  leadName, bodyState, totalScore, sectionScores, leadId, initialNotes,
}: ZoomCompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [decisionPath, setDecisionPath] = useState<'A' | 'B' | 'C' | null>(null)
  const [pathwayType, setPathwayType] = useState<PathwayType | null>(null)
  const [trainingStatus, setTrainingStatusState] = useState<TrainingStatus>(null)
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
  const isDecisionStage = currentStage === 8

  const sectionColour = (score: number) =>
    score === 1 ? 'text-red-400 border-red-400/30 bg-red-400/10'
    : score === 2 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'

  const sectionDot = (score: number) =>
    score === 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-teal-400'

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
          <p className="text-white text-sm leading-relaxed">{p.text}</p>
        </div>
      )
    })
  }

  function renderStringPrompts(prompts: string[]) {
    return prompts.map((p, i) => (
      <div key={i} className={`rounded-xl p-4 ${
        p.startsWith('↳') ? 'bg-transparent border border-stone-800' :
        p.startsWith('IF ') ? 'bg-amber-400/5 border border-amber-400/20' :
        'bg-stone-900 border border-stone-800'
      }`}>
        <p className="text-white text-sm leading-relaxed">{p}</p>
      </div>
    ))
  }

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <a href={`/dashboard/leads/${leadId}`} className="text-xs text-stone-600 hover:text-stone-400 transition-colors mb-0.5 block">
              ← Back to lead
            </a>
            <p className="text-lg font-bold text-white">{leadName}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stateInfo.colour}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stateInfo.badge}`} />
              {bodyState}{scoreDisplay}
            </div>
            <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${isFirstHalf ? 'border-stone-700 text-stone-500 bg-stone-900' : 'border-[#10E1C2]/30 text-[#10E1C2] bg-[#10E1C2]/5'}`}>
              {isFirstHalf ? 'First Half' : 'Second Half'}
            </div>
            {trainingStatus && (
              <div className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                trainingStatus === 'active' ? 'border-[#10E1C2]/30 text-[#10E1C2] bg-[#10E1C2]/5'
                : trainingStatus === 'returning' ? 'border-amber-400/30 text-amber-400 bg-amber-400/5'
                : 'border-violet-400/30 text-violet-400 bg-violet-400/5'
              }`}>
                {trainingStatus === 'active' ? 'Active trainer' : trainingStatus === 'returning' ? 'Returning' : 'New to training'}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setDrawerSection('objection'); setDrawerOpen(o => !o) }}
            className={`text-xs font-bold px-3 py-2 rounded-lg border transition-colors ${drawerOpen ? 'border-amber-400/40 text-amber-400 bg-amber-400/10' : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'}`}
          >
            Coach Drawer
          </button>
          <span className="text-2xl font-mono font-bold text-white tabular-nums">{formatTime(seconds)}</span>
          <button
            onClick={() => setRunning(r => !r)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${running ? 'bg-stone-700 hover:bg-stone-600 text-white' : 'bg-[#10E1C2] text-black hover:bg-[#0ecfb2]'}`}
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
        <div className="w-52 border-r border-white/10 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-2">First Half</p>
          {STAGES.filter(s => s.half === 1).map(s => {
            const idx = STAGES.indexOf(s)
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(idx)}
                className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                  idx === currentStage
                    ? 'bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2]'
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

          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-2 mt-4">Second Half</p>
          {STAGES.filter(s => s.half === 2).map(s => {
            const idx = STAGES.indexOf(s)
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(idx)}
                className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                  idx === currentStage
                    ? 'bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2]'
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

          <div className="mt-auto pt-4 border-t border-white/10 flex gap-2">
            {currentStage > 0 && (
              <button onClick={() => setCurrentStage(s => s - 1)} className="flex-1 text-xs text-stone-500 hover:text-white py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors">
                Back
              </button>
            )}
            {currentStage < STAGES.length - 1 && (
              <button onClick={() => setCurrentStage(s => s + 1)} className="flex-1 text-xs text-[#10E1C2] py-1.5 rounded-lg border border-[#10E1C2]/30 hover:bg-[#10E1C2]/10 transition-colors">
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
              <h2 className="text-xl font-bold text-white mb-3">{stage.name}</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">{stage.goal}</p>

              {/* Stage 1 — Training context capture (drives Stages 2-4 personalisation) */}
              {stage.id === 1 && (
                <div className="mb-6 bg-stone-900 border border-stone-800 rounded-xl p-5">
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">Training context</p>
                  <p className="text-xs text-stone-400 mb-4">Pick what matches before moving on. Stages 2-4 adapt to this.</p>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'active' as const, label: 'Currently training', dot: 'bg-[#10E1C2]', cls: 'border-[#10E1C2]/40 bg-[#10E1C2]/10 text-[#10E1C2]' },
                      { key: 'returning' as const, label: 'Returning to it', dot: 'bg-amber-400', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-400' },
                      { key: 'new' as const, label: 'New to training', dot: 'bg-violet-400', cls: 'border-violet-400/40 bg-violet-400/10 text-violet-400' },
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

              {/* Stage 2 — Scorecard Reflection: rich per-lead view */}
              {stage.id === 2 && (
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

              {/* Stage 7 — How The System Works: 4-card visual */}
              {stage.id === 7 && (
                <div className="space-y-3 mb-6">
                  {HOW_IT_WORKS_STAGES.map(card => (
                    <div key={card.number} className="border border-stone-800 bg-stone-900 rounded-xl p-5">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-3xl font-bold text-[#10E1C2] tabular-nums leading-none">{card.number}</span>
                        <div>
                          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Stage {card.number}</p>
                          <p className="text-base font-bold text-white">{card.title}</p>
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

                      {'pieces' in card && card.pieces && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          {card.pieces.map(p => (
                            <div key={p.name} className="bg-stone-800 border border-stone-700 rounded-lg p-3">
                              <p className="text-xs font-semibold text-white mb-0.5">{p.name}</p>
                              <p className="text-[11px] text-stone-400 leading-snug">{p.desc}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="border-t border-stone-800 pt-3 mt-3">
                        <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-widest mb-1">Coach script</p>
                        <p className="text-sm text-stone-200 italic leading-relaxed">{card.coachScript}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Stage 8 — Pricing: itemised breakdown + packages */}
              {stage.id === 8 && (
                <div className="space-y-3 mb-6">
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">What\'s included — and what each piece costs on its own</p>
                    <div className="space-y-2">
                      {PRICING_BREAKDOWN.map(item => (
                        <div key={item.label} className="flex items-center justify-between border-b border-stone-800/50 pb-2 last:border-0 last:pb-0">
                          <p className="text-sm text-stone-300">{item.label}</p>
                          <p className="text-sm font-bold text-white tabular-nums">{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-stone-500 mt-3 leading-relaxed">Add it up — well over $1,000/month for the individual pieces. The investment for all of it together is the package below.</p>
                  </div>

                  <div className="space-y-2">
                    {PACKAGES.map(pkg => (
                      <div key={pkg.tier} className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                        <div className="flex items-baseline justify-between mb-1">
                          <p className="text-sm font-bold text-white">{pkg.tier}</p>
                          <div className="text-right">
                            <p className="text-base font-bold text-[#10E1C2]">{pkg.price}</p>
                            <p className="text-[11px] text-stone-500">Founding: <span className="text-[#10E1C2]/80 font-semibold">{pkg.founding}</span></p>
                          </div>
                        </div>
                        <p className="text-xs text-stone-400 leading-relaxed">{pkg.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex items-center justify-between">
                    <p className="text-sm text-stone-300">One-time commencement fee</p>
                    <p className="text-base font-bold text-white tabular-nums">{COMMENCEMENT_FEE}</p>
                  </div>

                  <div className="border border-[#10E1C2]/30 bg-[#10E1C2]/5 rounded-xl p-4">
                    <p className="text-[11px] font-bold text-[#10E1C2] uppercase tracking-widest mb-1">{FOUNDING_OFFER.headline}</p>
                    <p className="text-stone-300 text-sm leading-relaxed">{FOUNDING_OFFER.blurb}</p>
                  </div>
                </div>
              )}

              {/* Script (always shown) */}
              {stage.script && (
                <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/30 rounded-xl p-5 mb-3">
                  <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-3">Script</p>
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

              {/* Tips */}
              {stage.tips && (
                <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/20 rounded-xl p-4 mt-4">
                  <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-1">Coach note</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{stage.tips}</p>
                </div>
              )}

              {/* Boundary */}
              {stage.boundary && (
                <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4 mt-3">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                  <p className="text-stone-400 text-sm leading-relaxed">{stage.boundary}</p>
                </div>
              )}

            </div>
          </div>

          {/* Notes + Decision panel */}
          <div className="w-72 border-l border-white/10 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Live Notes</p>
              <button onClick={saveNotes} className="text-xs text-[#10E1C2] hover:text-white transition-colors font-semibold">
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

            <div className="p-4 border-t border-white/10 space-y-3">

              {/* Decision panel — only on Stage 9 */}
              {isDecisionStage && (
                <div className="space-y-2">
                  <p className="text-xs text-stone-600 uppercase tracking-wider font-semibold">Mark outcome</p>
                  {!decisionPath ? (
                    <>
                      <button onClick={() => markDecision('A')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors">
                        Path A — Declined
                      </button>
                      <button onClick={() => markDecision('B')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors">
                        Path B — Needs Time
                      </button>
                      <button onClick={() => markDecision('C')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] hover:bg-[#10E1C2]/20 transition-colors">
                        Path C — Proceeding
                      </button>
                    </>
                  ) : decisionPath === 'C' && !pathwayType ? (
                    <>
                      <p className="text-xs text-stone-500 mb-1">How did they proceed?</p>
                      <button onClick={() => markPathway('full_rate')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] hover:bg-[#10E1C2]/20 transition-colors">
                        Full Rate (In-Person)
                      </button>
                      <button onClick={() => markPathway('online')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-stone-700/50 border border-stone-600 text-stone-300 hover:bg-stone-700 transition-colors">
                        Online
                      </button>
                    </>
                  ) : decisionPath !== 'C' ? (
                    <div className={`text-xs font-bold px-3 py-2 rounded-lg text-center ${
                      decisionPath === 'A'
                        ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                        : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                    }`}>
                      Path {decisionPath} recorded
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-xs font-bold px-3 py-2 rounded-lg bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] text-center">
                        {pathwayType === 'full_rate' ? 'Full Rate' : 'Online'} — send commencement fee
                      </div>
                      <CommencementFeeButton leadId={leadId} />
                    </div>
                  )}
                </div>
              )}

              {/* Mark call complete */}
              <button
                onClick={markCallComplete}
                disabled={callComplete}
                className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors ${callComplete ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-stone-800 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white'}`}
              >
                {callComplete ? 'Call Marked Complete' : 'Mark Call Complete'}
              </button>

              {/* Declined follow-up */}
              <button
                onClick={sendDeclinedSequence}
                disabled={declinedSent || sendingDeclined}
                className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors ${declinedSent ? 'bg-stone-900 border border-stone-800 text-stone-600' : 'bg-stone-800 border border-stone-700 text-amber-400 hover:border-amber-500/40 hover:text-amber-300'}`}
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
          <div className="w-[420px] bg-[#0d0d0d] border-l border-white/10 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest">Coach Drawer</p>
              <button onClick={() => setDrawerOpen(false)} className="text-stone-500 hover:text-white text-sm">×</button>
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
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-stone-500 hover:text-stone-300'
                  }`}
                >{t.label}</button>
              ))}
            </div>

            {drawerSection === 'objection' && (
              <div className="space-y-3">
                <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">{OBJECTION_HANDLING.toneIndicator}</p>
                  <p className="text-stone-400 text-xs leading-relaxed">{OBJECTION_HANDLING.when}</p>
                </div>
                {OBJECTION_HANDLING.steps.map((step, i) => (
                  <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">{step.label}</p>
                    <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{step.content}</p>
                  </div>
                ))}
                <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-3">
                  <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                  <p className="text-stone-400 text-xs">{OBJECTION_HANDLING.boundary}</p>
                </div>
              </div>
            )}

            {drawerSection === 'online' && (
              <div className="space-y-3">
                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                  <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">Online Coaching script</p>
                  <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{ONLINE_SCRIPT}</p>
                </div>
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Package</p>
                  <div className="flex items-center justify-between">
                    <p className="text-white text-sm font-semibold">Online Performance Coaching</p>
                    <p className="text-amber-400 text-sm font-bold">$149/week</p>
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
