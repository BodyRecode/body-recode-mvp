'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'

// ─── Scorecard data (used in first half) ───────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  '01': 'Energy', '02': 'Sleep', '03': 'Stress Load',
  '04': 'Training Response', '05': 'Fat Loss Response',
}

const SECTION_INTERPRETATIONS: Record<string, Record<number, string>> = {
  '01': {
    1: 'Energy is significantly depleted — relying on caffeine, crashing through the day. This is a core signal that the body is running on reserves.',
    2: 'Energy is inconsistent day to day. Not reliably low, but not reliably high either. The variation itself is the signal.',
    3: 'Energy is steady and self-sustaining. Not a limiting factor right now.',
  },
  '02': {
    1: 'Sleep quality is poor — waking through the night, not rested. This is the single biggest recovery suppressor when it\'s compromised.',
    2: 'Sleep is okay most nights but not consistently restorative. Some nights fine, others not.',
    3: 'Sleep is solid and consistently restorative. Recovery rhythm is intact.',
  },
  '03': {
    1: 'Stress load is high and ongoing. Work, life, or emotional demands are significant. This directly suppresses fat loss and training response.',
    2: 'Stress is moderate — manageable most of the time but not low. Has an ongoing background effect.',
    3: 'Stress load is low to moderate. Not a significant driver in the current picture.',
  },
  '04': {
    1: 'Training response has stalled or regressed. Performance flat or declining. Body feels beaten up. Classic depletion-state training pattern.',
    2: 'Training response is inconsistent. Some progress but hard to build momentum. Hit and miss.',
    3: 'Training response is good — getting stronger, fitter, recovering between sessions.',
  },
  '05': {
    1: 'Fat loss has stopped despite effort. Diet clean, training consistent — nothing moving. This is a biology problem, not a behaviour problem.',
    2: 'Fat loss is slow or stalled. Some movement but not matching the input.',
    3: 'Body is responding. Composition is shifting in the right direction.',
  },
}

const BODY_STATE_LANGUAGE: Record<string, { colour: string; badge: string; opening: string; interpretation: string; pattern: string }> = {
  'Depleted State': {
    colour: 'text-red-400 border-red-400/30 bg-red-400/10',
    badge: 'bg-red-400',
    opening: 'Their scorecard came back as Depleted State. This means the body is in protection mode — cortisol elevated, metabolism suppressed, biology actively working against fat loss and performance. The scorecard gave us the signal. This call is about understanding what\'s driving it.',
    interpretation: 'What you\'re experiencing is a biological response, not a willpower or effort problem. When the body registers sustained demand — poor sleep, high stress, inconsistent recovery, training that isn\'t producing results — it shifts into a state where it protects rather than performs. That\'s what the scorecard picked up. It\'s not a coincidence that fat loss has stalled and training feels harder than it should. Those are two symptoms of the same underlying state.',
    pattern: 'Depleted State: The body is in protection mode. Cortisol elevated, metabolism suppressed. Adding more training stimulus typically makes this worse. The fix is not harder — it\'s smarter management of the system.',
  },
  'Transitioning State': {
    colour: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
    badge: 'bg-amber-400',
    opening: 'Their scorecard came back as Transitioning State. They have capacity but something is limiting consistent response. Could be sleep, stress, recovery rhythm, or a mismatch between training load and current biological state. The call is about identifying which.',
    interpretation: 'The Transitioning State means the body has capacity but isn\'t consistently expressing it. Some weeks things click, other weeks they don\'t. That inconsistency is the signal. It usually means there\'s one or two limiting factors keeping the system from settling into a reliable response pattern. The scorecard narrowed down where those are — the section scores point to what\'s holding things back.',
    pattern: 'Transitioning State: Has capacity but not consistency. Something is limiting the response — usually one or two sections dragging the overall picture. The work is identifying the specific drivers and addressing them in order.',
  },
  'Ready State': {
    colour: 'text-teal-400 border-teal-400/30 bg-teal-400/10',
    badge: 'bg-teal-400',
    opening: 'Their scorecard came back as Ready State. Biology is in a position to respond well. If fat loss or performance isn\'t happening at this score, the issue is in the prescription — the what and how of training and nutrition, not the biological foundation. This call is about identifying where the prescription gap is.',
    interpretation: 'A Ready State score means the biology is in a good position — energy, sleep, stress, and recovery are not the limiting factors. When someone in this state isn\'t getting results, it\'s typically a prescription problem. The training or nutrition approach isn\'t matched to what the body needs right now. That\'s actually good news — because it\'s a much more solvable problem than trying to fix depleted biology.',
    pattern: 'Ready State: Biology is responding well. If results aren\'t happening, the issue is in the prescription — not the foundation. Focus the conversation on the training and nutrition approach.',
  },
}

// ─── Objection / override content (used in second half) ────────────────────

const OBJECTION_TRIGGERED = {
  toneIndicator: 'Tone: Solution to resistance',
  when: 'Use only when: pricing has been presented → price objection raised → objection handled → resistance remains.',
  steps: [
    {
      label: 'Step 1 — Handle the objection',
      content: `They say: "That's a lot" / "It's too expensive" / "I can't justify that"

Repeat back: "So the investment feels like a stretch — got it."

"Here's how I'd look at it. You're not paying for two sessions a week. You're paying for a system that's reading your body the whole time — loading it, recovering it, interpreting what's happening and adjusting. Most people don't have access to that at any price point.

The real question isn't whether it's expensive. It's whether what you've been doing has been working. If it has, you don't need this. But if it hasn't — that has a cost too. It's just not showing up as a line item."

↳ Pause. Let them sit with it. Don't fill the silence.
↳ If they move forward — Stage 8, Path C (Full Rate).
↳ If price objection holds — move to Step 2.`,
    },
    {
      label: 'Step 2 — Introduce Online',
      content: `"The other thing worth knowing is that there's an online option. Same system, same interpretation, same weekly check-ins and direct access - just remote instead of face to face.

That's $149 a week. Same commencement fee to get started.

If the in-person format was part of the hesitation, that might be worth considering."

↳ If online works — Stage 8, Path C (Online).
↳ If price still holds — return to standard decision flow. Non-enrolment is acceptable.`,
    },
  ],
  followups: [
    '"Do you want me to walk you through how that works?"',
    '"Would that make this more workable for you?"',
  ],
  exitPath: 'If declined → move to Online Coaching tab. Or return to standard decision flow.',
  boundary: 'Do not introduce before objection. Do not introduce if objection resolves. Do not re-offer after decline. Do not frame as discount. Do not escalate tone.',
}

const ONLINE_SCRIPT = `"There is also an online option - and I want to be clear, this is not a lesser version of the system.

Everything that makes Body Recode work is still there. The weekly check-ins, the interpretation, the performance synthesis, the ongoing coaching support. The only difference is that we're not training together in person.

For some people that's actually the right structure - whether it's schedule, location, or just preference.

That sits at $149 per week. Same 12-week minimum. Same standards."`

// ─── Stage definitions ──────────────────────────────────────────────────────

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
  paths?: Array<{
    label: string
    colour: 'red' | 'amber' | 'teal' | 'violet'
    lines: string[]
    subItems: Array<{ trigger: string; response: string }>
    links?: Array<{ label: string; url: string }>
  }>
  half: 1 | 2
}

function buildStages(leadName: string, bodyState: string, totalScore: number | null, sectionScores: Record<string, number> | null): Stage[] {
  const firstName = leadName.split(' ')[0]
  const stateInfo = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  return [
    // ── FIRST HALF ──
    {
      id: 1,
      name: 'Opening Frame',
      duration: '2-3 min',
      goal: 'Create safety and remove pressure. Establish this is not a sales call.',
      script: `"Thanks for jumping on today, ${firstName}.

The purpose of this conversation is to talk through what showed up in your scorecard and hear a bit more about what's actually been happening for you.

There's nothing you need to decide today. I just want to make sure the patterns the scorecard picked up actually match what you've been experiencing."`,
      prompts: [
        { type: 'prompt', text: 'How did you find doing the scorecard?' },
        { type: 'prompt', text: 'Was it straightforward to answer?' },
        { type: 'prompt', text: 'Did anything make you stop and think?' },
      ] as TypedPrompt[],
      tips: 'Slow down. Let them land. The tone you set here carries the whole call.',
      boundary: null,
      half: 1,
    },
    {
      id: 2,
      name: 'Scorecard Reflection',
      duration: '4-6 min',
      goal: 'Let them respond to their result before you interpret it. Their reaction is the signal.',
      script: `"Before I share anything, I want to hear your take first.

Your scorecard came back as ${bodyState}${scoreDisplay}. You've had a chance to sit with that.

What was your reaction when you saw the result?"`,
      prompts: [
        { type: 'prompt', text: 'What stood out to you most when you saw your result?' },
        { type: 'prompt', text: 'Did it feel accurate to where you\'re at right now?' },
        { type: 'prompt', text: 'Was there anything that surprised you, or anything that didn\'t land?' },
        { type: 'prompt', text: 'Had you considered any of those areas as a factor before?' },
      ] as TypedPrompt[],
      tips: 'Do not explain the result first. Their reaction surfaces the real friction point. The strongest insight usually appears here.',
      boundary: null,
      half: 1,
    },
    {
      id: 3,
      name: 'Context Exploration',
      duration: '10-12 min',
      goal: 'Understand the real picture behind the section scores. The scorecard gives the signal — the conversation gives the context.',
      script: `"What I want to do now is get a clearer picture of what's actually been going on — because the scorecard shows the pattern, but it doesn't know the context behind it.

I'm going to ask you a few questions. Just answer as openly as you can."`,
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
        { type: 'sub', text: 'Has this been going on long or is it a recent thing?' },
        { type: 'category', text: 'STRESS LOAD' },
        { type: 'prompt', text: 'What\'s the stress load like right now — is it work, life, or something else driving it?' },
        { type: 'sub', text: 'Is the demand ongoing or more situational?' },
        { type: 'sub', text: 'Do you find yourself carrying it into training?' },
        { type: 'sub', text: 'Is there any period of genuine downtime in a typical week?' },
        { type: 'category', text: 'TRAINING RESPONSE' },
        { type: 'prompt', text: 'What does progress actually look like right now compared to what you\'re putting in?' },
        { type: 'sub', text: 'Are you getting stronger over time?' },
        { type: 'sub', text: 'How do you feel during sessions compared to 6-12 months ago?' },
        { type: 'sub', text: 'Does the body feel beaten up or recovered between sessions?' },
        { type: 'category', text: 'FAT LOSS RESPONSE' },
        { type: 'prompt', text: 'Walk me through what you\'ve tried in terms of fat loss and what\'s actually happened.' },
        { type: 'sub', text: 'Is the diet consistent?' },
        { type: 'sub', text: 'Has anything worked in the past? What changed?' },
        { type: 'sub', text: 'How long has it felt stuck?' },
        { type: 'category', text: 'TRAINING STRUCTURE' },
        { type: 'prompt', text: 'What does your training actually look like week to week right now?' },
        { type: 'sub', text: 'How many sessions per week?' },
        { type: 'sub', text: 'Do you follow a structured program or train more by feel?' },
        { type: 'sub', text: 'Has the structure changed recently?' },
      ] as TypedPrompt[],
      tips: 'Ask one question at a time. Let silence do work. You\'re building context — not solving anything yet.',
      boundary: 'No prescriptions. No "you should try...". No training or nutrition advice. Just listening and clarifying.',
      half: 1,
    },
    {
      id: 4,
      name: 'Pattern Interpretation',
      duration: '5-7 min',
      goal: 'Name the pattern clearly. Clarity — not solution. Make it feel understandable, not alarming.',
      script: `"Based on what you've just described and what showed up in the scorecard, here's what I'm hearing.

${stateInfo.interpretation}

That's not a personal failing — it's a system response. And it's one of the more common patterns we see."`,
      prompts: [
        { type: 'prompt', text: 'Does that explanation feel like it reflects what you\'ve been experiencing?' },
        { type: 'prompt', text: 'Does it help make sense of what you\'ve noticed?' },
        { type: 'prompt', text: 'Did anything in that surprise you?' },
        { type: 'prompt', text: 'Has it changed the way you\'re thinking about it?' },
      ] as TypedPrompt[],
      tips: 'Keep it observational. The goal is to make the pattern feel understandable — not alarming, not overwhelming. Then move into the second half.',
      boundary: 'No medical interpretation. No outcome promises. No training adjustments. Pattern identification only.',
      half: 1,
    },

    // ── SECOND HALF ──
    {
      id: 5,
      name: 'Hot Spot Framing',
      duration: '5-7 min',
      goal: 'Name the specific thing that came up in the first half, confirm it, make them feel understood. Do not move to pricing until this is done.',
      script: `"Before we talk about what support looks like, I want to come back to something you mentioned earlier.

[Name the specific thing — e.g. "You said you've been training consistently but your body isn't responding the way it should." OR "You mentioned you've tried a few different things and nothing has really clicked." OR "You said something shifted — and you're not sure when or why."]

That's what I'd call the hot spot. It's not a goal. It's the point where effort and response stopped feeling aligned.

Is that still the right way to describe it?"`,
      prompts: [
        '↳ If yes → "Good. That\'s exactly what we\'re going to address. Let me explain how."',
        '↳ If they add more → let them talk. The more specific they get, the more invested they become.',
        'IF MOTIVATION COMES UP → "Motivation is information, not the problem. The question is what it\'s telling us about where your system is right now."',
        'IF THEY MINIMISE IT → "Most people do that — they\'ve been managing it for so long it starts to feel normal. It\'s not."',
      ] as string[],
      tips: 'You already know the hot spot from the first half of this call. This stage is about naming it back precisely and watching them confirm it. You are not fishing — you are reflecting.',
      boundary: 'Do not move to pricing until the hot spot is clearly named and confirmed.',
      half: 2,
    },
    {
      id: 6,
      name: 'Emotional Acknowledgement',
      duration: '2-3 min',
      goal: 'Normalise the confusion and confidence erosion that often accompanies interpretive uncertainty.',
      script: `"Something I want to name, because it comes up a lot.

When people feel unsure about how their body is responding, it's not just confusing - it can quietly erode confidence.

People start second-guessing their effort, their judgement, even their consistency.

Not because they're doing something wrong, but because the feedback loop isn't clear.

The purpose of this work isn't to make that heavier. It's to give you a way to understand what's happening so decisions don't have to be made off frustration or guesswork."`,
      prompts: [
        'Has that been part of your experience - second-guessing yourself?',
        'How long has that been sitting with you?',
        '↳ TRANSITION → "Good — let me walk you through what the coaching structure actually looks like."',
      ] as string[],
      tips: 'This is observational, not therapeutic. Name it and move on. Don\'t dwell or invite deep emotional processing.',
      boundary: null,
      half: 2,
    },
    {
      id: 7,
      name: 'Pricing',
      duration: '5-10 min',
      goal: 'Present the coaching structure and packages as information, not persuasion. Full rate is always Offer 1.',
      script: `"Before I give you the number, let me walk you through what's included and what each piece costs on its own - just so the price makes sense in context. This is not what you'll pay. I just want you to understand what you're actually getting.

The CFFS diagnostic - the body state interpretation, the signal mapping, everything we used to understand what's actually going on with you - that's a $297 service.

From that I build your training program. Written for your state specifically, not a template. $200.

Nutrition protocol - what to eat, how much, what to prioritise right now. $150.

Every week I'm reading your check-in data and interpreting it. Not tracking - interpreting. Working out what your body is doing and adjusting accordingly. That's $150 a week on its own.

You've got direct access to me between sessions. Something comes up, you don't wait. $100 a week.

And the sessions themselves - two per week, face to face. $120 each.

Add that up and you're well over $1,000 a month for the individual pieces - before you factor in the fact that it's all running under one system that's reading your body the whole time.

The investment for all of that is $299 a week. That's where most people start - two sessions.

Three sessions is available where your schedule and capacity allow. $409. I'll guide that decision based on what your system can actually handle.

There's also a one-time commencement fee of $240 to get started. That covers the setup work on my end before coaching begins."`,
      prompts: [
        '↳ PAUSE after stating the price. Do not fill the silence. Let it land.',
        '↳ IF they go quiet → stay quiet. The first person to speak loses the frame.',
        'REFRAME — pick one if hesitation shows:',
        '💬 CONFIDENCE: "Most people feel clearer after the first two weeks than they have in years. Not because everything has changed - because nothing is guesswork anymore."',
        '💬 RESULTS: "The guys who get the most out of this aren\'t the ones who try the hardest - they\'re the ones who finally stopped fighting their body state."',
        '💬 SIMPLE: "It works when you stop trying to override your body and start working with it. That\'s all this is."',
        '💬 STAKES: "The cost of staying where you are is higher than the cost of this. You\'ve already proven that by being here."',
        '↳ TRANSITION → When they respond, move to Stage 8.',
      ] as string[],
      tips: 'Present pricing as information. Do not use urgency, scarcity, or pressure. After presenting pricing — pause and allow response. Evaluate based on response.',
      boundary: 'Full rate is always Offer 1. No discount framing. No urgency. Founding client is Offer 2 only — via objection-triggered or manual override.',
      half: 2,
    },
    {
      id: 8,
      name: 'Decision',
      duration: '2-3 min',
      goal: 'Identify the decision pathway and close cleanly.',
      script: `"Take whatever time you need with it.

If it feels like the right fit, we can talk next steps.

If not, the report still stands on its own."`,
      prompts: [] as string[],
      paths: [
        {
          label: 'PATH A — Not proceeding',
          colour: 'red' as const,
          lines: [
            'Acknowledge without persuasion. Reinforce the clarity gained. Leave the door open.',
            '"That\'s completely fine. The report still stands — you now have a clearer read on what\'s actually going on. If anything changes, the door\'s open."',
          ],
          subItems: [],
        },
        {
          label: 'PATH B — Needs time',
          colour: 'amber' as const,
          lines: [
            '"That\'s fine — take the time you need. Before we wrap up, can I ask what\'s sitting with you? Is it the investment, the fit, or something else?"',
          ],
          subItems: [
            { trigger: 'It\'s the money', response: '"Understood. There is one other option I haven\'t mentioned yet — it\'s not available to everyone. Do you want me to explain it?" → move to Founding Client if appropriate.' },
            { trigger: 'Whether it\'ll work', response: '"That\'s fair — especially if you\'ve tried things before. The report you already have is the first output of the system working. That wasn\'t a pitch, that was the system reading your data. Whether coaching is right is a separate question — but the read is already done."' },
            { trigger: 'Needs permission', response: '"Makes sense. Is there someone else who needs to be part of this? I\'m happy to jump on a call with both of you if that helps."' },
            { trigger: 'Follow-up', response: '"When would be a good time to pick this back up? I\'d rather have a date than leave it open-ended."' },
          ],
        },
        {
          label: 'PATH C — Proceeding (Full Rate)',
          colour: 'teal' as const,
          lines: [
            'Send commencement fee first. Once paid, send weekly subscription link. Confirm Deliberate Start Window (3-7 days). Send intake link.',
          ],
          subItems: [],
          links: [
            { label: 'Commencement Fee — $240', url: 'https://buy.stripe.com/6oUbJ392W3L02sn00T5ZC01' },
            { label: 'In-Person 2x — $299/week', url: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00' },
            { label: 'In-Person 3x — $409/week', url: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03' },
          ],
        },
        {
          label: 'PATH C — Proceeding (Online)',
          colour: 'teal' as const,
          lines: [
            'Send commencement fee first. Once paid, send online subscription link. Confirm Deliberate Start Window. Send intake link.',
          ],
          subItems: [],
          links: [
            { label: 'Commencement Fee — $240', url: 'https://buy.stripe.com/6oUbJ392W3L02sn00T5ZC01' },
            { label: 'Online — $149/week', url: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02' },
          ],
        },
      ],
      tips: 'Standard and online: commencement fee first, then subscription.',
      boundary: 'No urgency manipulation. No discount framing. Non-enrolment is an acceptable outcome.',
      half: 2,
    },
  ]
}

// ─── Component ──────────────────────────────────────────────────────────────

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
  const [activeTab, setActiveTab] = useState<'prompts' | 'objection_triggered' | 'online' | 'signals' | 'language'>('prompts')
  const [decisionPath, setDecisionPath] = useState<'A' | 'B' | 'C' | null>(null)
  const [pathwayType, setPathwayType] = useState<PathwayType | null>(null)
  const [declinedSent, setDeclinedSent] = useState(false)
  const [sendingDeclined, setSendingDeclined] = useState(false)
  const [callComplete, setCallComplete] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageScrollRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (stageScrollRef.current) stageScrollRef.current.scrollTop = 0
    setActiveTab('prompts')
  }, [currentStage])

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds(s => s + 1), 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const renderWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)
    return parts.map((part, i) =>
      urlRegex.test(part) ? (
        <a key={i} href={part} target="_blank" rel="noopener noreferrer"
          className="text-[#10E1C2] underline underline-offset-2 hover:text-[#0ecfb2] transition-colors break-all">{part}</a>
      ) : <span key={i}>{part}</span>
    )
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

  const STAGES = buildStages(leadName, bodyState, totalScore, sectionScores)
  const stage = STAGES[currentStage]
  const stateInfo = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''
  const isFirstHalf = stage.half === 1
  const isDecisionStage = currentStage === 7

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
          <div key={i} className="bg-stone-900/50 border border-stone-800/50 rounded-lg px-4 py-2.5 ml-4">
            <p className="text-stone-400 text-sm leading-relaxed">{p.text}</p>
          </div>
        )
      }
      return (
        <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
          <p className="text-white text-sm leading-relaxed">&ldquo;{p.text}&rdquo;</p>
        </div>
      )
    })
  }

  function renderStringPrompts(prompts: string[]) {
    return prompts.map((p, i) => (
      <div key={i} className={`rounded-xl p-4 ${
        p.startsWith('PATH') ? 'bg-amber-400/5 border border-amber-400/20' :
        p.startsWith('IF ') ? 'bg-stone-800 border border-stone-700' :
        p.startsWith('↳') ? 'bg-transparent border border-stone-800 ml-4' :
        p.startsWith('REFRAME') ? 'bg-violet-500/5 border border-violet-500/20' :
        p.startsWith('💬') ? 'bg-violet-500/5 border border-violet-500/15 ml-4' :
        'bg-stone-900 border border-stone-800'
      }`}>
        <p className={`text-sm leading-relaxed ${
          p.startsWith('REFRAME') ? 'text-violet-400 font-bold uppercase tracking-wider text-xs' :
          p.startsWith('💬') ? 'text-stone-200' :
          'text-white'
        }`}>{renderWithLinks(p.startsWith('💬') ? p.replace(/^💬 \w+: /, '') : p)}</p>
        {p.startsWith('💬') && (
          <p className="text-xs text-violet-400 font-semibold mt-1 uppercase tracking-wider">{p.match(/^💬 (\w+):/)?.[1]}</p>
        )}
      </div>
    ))
  }

  const firstHalfTabs = ['prompts', 'signals', 'language'] as const
  const secondHalfTabs = ['prompts', 'objection_triggered', 'online', 'signals'] as const
  const tabLabels: Record<string, string> = {
    prompts: isFirstHalf ? 'Prompts' : 'Script & Prompts',
    signals: 'Scorecard Breakdown',
    language: 'Interpretation Language',
    objection_triggered: 'Objection Handling',
    online: 'Online Coaching',
  }
  const tabColours: Record<string, string> = {
    prompts: 'border-[#10E1C2] text-[#10E1C2]',
    signals: 'border-[#10E1C2] text-[#10E1C2]',
    language: 'border-[#10E1C2] text-[#10E1C2]',
    objection_triggered: 'border-amber-400 text-amber-400',
    online: 'border-amber-400 text-amber-400',
  }
  const currentTabs = isFirstHalf ? firstHalfTabs : secondHalfTabs

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <a href={`/dashboard/leads/${leadId}`} className="text-xs text-stone-600 hover:text-stone-400 transition-colors mb-0.5 block">
              Back to lead
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
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-mono font-bold text-white tabular-nums">{formatTime(seconds)}</span>
          <button
            onClick={() => setRunning(r => !r)}
            className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${running ? 'bg-stone-700 hover:bg-stone-600 text-white' : 'bg-[#10E1C2] text-black hover:bg-[#0ecfb2]'}`}
          >
            {running ? 'Pause' : seconds === 0 ? 'Start' : 'Resume'}
          </button>
          {seconds > 0 && (
            <button onClick={() => { setSeconds(0); setRunning(false) }} className="text-xs text-stone-500 hover:text-stone-300 transition-colors">
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Stage nav */}
        <div className="w-52 border-r border-white/10 p-4 flex flex-col gap-1 overflow-y-auto">
          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-2">First Half</p>
          {STAGES.filter(s => s.half === 1).map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStage(i)}
              className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                i === currentStage
                  ? 'bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2]'
                  : i < currentStage ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <p className="text-xs font-bold">{s.id}. {s.name}</p>
              <p className="text-xs opacity-60 mt-0.5">{s.duration}</p>
            </button>
          ))}
          <div className="flex items-center gap-2 my-2">
            <div className="h-px flex-1 bg-stone-800" />
            <span className="text-[9px] font-bold text-stone-600 uppercase tracking-widest">Pricing</span>
            <div className="h-px flex-1 bg-stone-800" />
          </div>
          {STAGES.filter(s => s.half === 2).map((s, i) => {
            const globalIndex = i + 4
            return (
              <button
                key={s.id}
                onClick={() => setCurrentStage(globalIndex)}
                className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                  globalIndex === currentStage
                    ? 'bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2]'
                    : globalIndex < currentStage ? 'text-stone-500 hover:text-stone-300'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <p className="text-xs font-bold">{s.id}. {s.name}</p>
                <p className="text-xs opacity-60 mt-0.5">{s.duration}</p>
              </button>
            )
          })}
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="flex gap-2">
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
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Stage detail */}
          <div ref={stageScrollRef} className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-widest">Stage {stage.id}</span>
                <span className="text-xs text-stone-600">{stage.duration}</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isFirstHalf ? 'bg-stone-800 text-stone-500' : 'bg-[#10E1C2]/10 text-[#10E1C2]'}`}>
                  {isFirstHalf ? 'Consultation' : 'Pricing'}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{stage.name}</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">{stage.goal}</p>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 border-b border-white/10 flex-wrap">
                {currentTabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-semibold px-3 py-2 border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? tabColours[tab] : 'border-transparent text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tabLabels[tab]}
                  </button>
                ))}
              </div>

              {/* Script & Prompts tab */}
              {activeTab === 'prompts' && (
                <div className="space-y-2">
                  {stage.script && (
                    <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/30 rounded-xl p-5 mb-4">
                      <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-3">Script</p>
                      <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
                    </div>
                  )}

                  {/* Value Stack on Pricing stage */}
                  {stage.id === 7 && (
                    <div className="bg-stone-900 border border-stone-700 rounded-xl overflow-hidden mb-2">
                      <div className="px-5 py-3 border-b border-stone-700 flex items-center justify-between">
                        <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Grand Slam Value Stack</p>
                        <p className="text-xs text-stone-500">Reference — not a script</p>
                      </div>
                      <div className="divide-y divide-stone-800">
                        {[
                          { item: 'Body State Scorecard', value: '$97', solves: 'I don\'t know where I\'m starting from' },
                          { item: 'CFFS Full Diagnostic', value: '$297', solves: 'I don\'t know why my body isn\'t responding' },
                          { item: 'Custom Training Program', value: '$200', solves: 'I don\'t know how to train for my state' },
                          { item: 'Nutrition Protocol', value: '$150', solves: 'I don\'t know what to eat' },
                          { item: 'Weekly CFWS Interpretation', value: '$150/wk', solves: 'I don\'t know if what I\'m doing is working' },
                          { item: 'Direct coach access', value: '$100/wk', solves: 'I\'ll get stuck and have no one to ask' },
                          { item: 'Zoom check-ins', value: '$120/session', solves: 'I need accountability' },
                        ].map((row, i) => (
                          <div key={i} className="flex items-start gap-4 px-5 py-3">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white">{row.item}</p>
                              <p className="text-xs text-stone-500 mt-0.5">{row.solves}</p>
                            </div>
                            <span className="text-xs font-bold text-teal-400 shrink-0 mt-0.5">{row.value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 border-t border-stone-700 flex items-center justify-between bg-stone-800/50">
                        <p className="text-xs font-bold text-white">Total perceived value</p>
                        <p className="text-sm font-bold text-teal-400">$1,000+/mo</p>
                      </div>
                      <div className="px-5 py-3 border-t border-stone-700 flex items-center justify-between">
                        <p className="text-xs font-bold text-white">Actual price (2x in-person)</p>
                        <p className="text-sm font-bold text-white">$299/wk (~$1,196/mo)</p>
                      </div>
                    </div>
                  )}

                  {isFirstHalf
                    ? renderTypedPrompts(stage.prompts as TypedPrompt[])
                    : renderStringPrompts(stage.prompts as string[])}

                  {'paths' in stage && stage.paths && stage.paths.map((path, i) => {
                    const colourMap = {
                      red: { border: 'border-red-500/30', bg: 'bg-red-500/5', label: 'text-red-400', subBg: 'bg-red-500/5 border-red-500/15' },
                      amber: { border: 'border-amber-400/30', bg: 'bg-amber-400/5', label: 'text-amber-400', subBg: 'bg-amber-400/5 border-amber-400/15' },
                      teal: { border: 'border-teal-400/30', bg: 'bg-teal-400/5', label: 'text-teal-400', subBg: 'bg-teal-400/5 border-teal-400/15' },
                      violet: { border: 'border-violet-400/30', bg: 'bg-violet-400/5', label: 'text-violet-400', subBg: 'bg-violet-400/5 border-violet-400/15' },
                    }
                    const c = colourMap[path.colour]
                    return (
                      <div key={i} className={`rounded-xl overflow-hidden border ${c.border}`}>
                        <div className={`px-4 py-2.5 ${c.bg}`}>
                          <p className={`text-xs font-bold uppercase tracking-wider ${c.label}`}>{path.label}</p>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          {path.lines.map((line, j) => (
                            <p key={j} className="text-sm text-stone-200 leading-relaxed">{line}</p>
                          ))}
                          {path.subItems.length > 0 && (
                            <div className="space-y-2 mt-2">
                              {path.subItems.map((sub, j) => (
                                <div key={j} className={`rounded-lg p-3 border ${c.subBg} ml-2`}>
                                  <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${c.label}`}>If — {sub.trigger}</p>
                                  <p className="text-sm text-stone-300 leading-relaxed">{sub.response}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {'links' in path && path.links && path.links.length > 0 && (
                            <div className="space-y-1.5 mt-2 pt-2 border-t border-stone-800">
                              {path.links.map((link, j) => (
                                <a key={j} href={link.url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center justify-between text-sm font-medium ${c.label} hover:underline`}>
                                  <span>{link.label}</span>
                                  <span className="text-xs text-stone-500">↗</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {stage.tips && (
                    <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/20 rounded-xl p-4 mt-4">
                      <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-1">Coach note</p>
                      <p className="text-stone-400 text-sm leading-relaxed">{stage.tips}</p>
                    </div>
                  )}
                  {stage.boundary && (
                    <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                      <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                      <p className="text-stone-400 text-sm leading-relaxed">{stage.boundary}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Scorecard Breakdown tab */}
              {activeTab === 'signals' && (
                <div className="space-y-3">
                  <div className={`border rounded-xl p-4 ${stateInfo.colour}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider">{bodyState}</p>
                      {totalScore && <span className="text-xs font-bold">{totalScore} / 15</span>}
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">{stateInfo.opening}</p>
                  </div>
                  {sectionScores ? (
                    Object.entries(SECTION_LABELS).map(([key, label]) => {
                      const score = sectionScores[key] ?? null
                      if (score === null) return null
                      return (
                        <div key={key} className={`border rounded-xl p-4 ${sectionColour(score)}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`w-1.5 h-1.5 rounded-full ${sectionDot(score)}`} />
                              <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
                            </div>
                            <span className="text-xs font-bold">{score} / 3</span>
                          </div>
                          <p className="text-sm leading-relaxed opacity-80">{SECTION_INTERPRETATIONS[key]?.[score] ?? ''}</p>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-stone-500 text-sm">Section scores not available — lead may not have purchased the Body Decode Report.</p>
                  )}
                </div>
              )}

              {/* Interpretation Language tab (first half only) */}
              {activeTab === 'language' && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500 mb-4">Pre-written interpretation language based on {leadName}&apos;s body state. Use naturally — not verbatim.</p>
                  <div className={`border rounded-xl p-4 ${stateInfo.colour}`}>
                    <p className="text-xs font-bold uppercase tracking-wider mb-3">{bodyState} — Pattern</p>
                    <p className="text-sm leading-relaxed opacity-90 mb-3">{stateInfo.pattern}</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Interpretation Script</p>
                    <p className="text-stone-300 text-sm leading-relaxed italic">&ldquo;{stateInfo.interpretation}&rdquo;</p>
                  </div>
                  {sectionScores && Object.entries(sectionScores).filter(([, s]) => s === 1).length > 0 && (
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Low Section Language</p>
                      <div className="space-y-3">
                        {Object.entries(sectionScores).filter(([, s]) => s === 1).map(([key]) => (
                          <div key={key}>
                            <p className="text-xs font-semibold text-red-400 mb-1">{SECTION_LABELS[key]}</p>
                            <p className="text-stone-400 text-sm leading-relaxed italic">&ldquo;{SECTION_INTERPRETATIONS[key]?.[1]}&rdquo;</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Objection-Triggered tab */}
              {activeTab === 'objection_triggered' && (
                <div className="space-y-4">
                  <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">{OBJECTION_TRIGGERED.toneIndicator}</p>
                    <p className="text-stone-400 text-xs leading-relaxed">{OBJECTION_TRIGGERED.when}</p>
                  </div>
                  {OBJECTION_TRIGGERED.steps.map((step, i) => (
                    <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider">{step.label}</p>
                      <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{step.content}</p>
                    </div>
                  ))}
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Follow-up prompts</p>
                    {OBJECTION_TRIGGERED.followups.map((f, i) => (
                      <div key={i} className="bg-stone-800 rounded-lg p-3">
                        <p className="text-stone-300 text-sm">{f}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                    <p className="text-stone-400 text-sm leading-relaxed">{OBJECTION_TRIGGERED.boundary}</p>
                  </div>
                </div>
              )}

              {/* Online Coaching tab */}
              {activeTab === 'online' && (
                <div className="space-y-4">
                  <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-5">
                    <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">Script — Online Coaching Option</p>
                    <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{ONLINE_SCRIPT}</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider">Package details</p>
                    <div className="flex justify-between items-center">
                      <p className="text-white text-sm font-semibold">Online Performance Coaching</p>
                      <p className="text-amber-400 text-sm font-bold">$149/week</p>
                    </div>
                  </div>
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

              {/* Decision panel - only on Decision stage */}
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
                        Full Rate
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
                    <div className="text-xs font-bold px-3 py-2 rounded-lg bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] text-center">
                      {pathwayType === 'full_rate' ? 'Full Rate' : 'Online'} — send commencement fee link
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
              {!declinedSent && (
                <p className="text-xs text-stone-600 text-center leading-relaxed">
                  3-email re-engagement sequence + $97 self-guided program offer
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
