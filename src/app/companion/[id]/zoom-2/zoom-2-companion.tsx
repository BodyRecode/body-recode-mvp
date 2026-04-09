'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'

const STAGES = [
  {
    id: 1,
    name: 'Report Review',
    duration: '5-7 min',
    goal: 'Ensure the member is reading the report correctly and safely.',
    script: `"Before we get into anything else, I want to briefly revisit what you received after our first call — the orientation guide and your scorecard results.

Not to go through them line by line - but to make sure everything has landed the way it was intended."`,
    prompts: [
      'INTERPRETIVE BOUNDARIES - "The report is a single-point snapshot. It is not a verdict, a diagnosis, or a directive. It does not prescribe training changes or assess readiness."',
      '↳ Does that make sense in terms of how you read it?',
      'PATTERN LANGUAGE - "Did any of the pattern descriptions feel familiar to you? Or confusing?"',
      '↳ There is no right answer here - mismatch is useful information too.',
      'WHAT IT DID NOT DO - "The report deliberately avoided labelling problems, assigning blame, ranking your performance, or telling you what to do next."',
      '↳ Did you notice that when you read it?',
      'EMOTIONAL RESPONSE - "How did it feel to read it? Relief, frustration, confusion, neutral - all valid."',
      'READINESS CHECK - "One last thing - meaningful interpretation requires observation across time. A single report can\'t tell the full story. That\'s why ongoing synthesis exists inside Body Recode."',
      '↳ TRANSITION → "Good — that\'s exactly what I needed to know. Let\'s keep going."',
    ],
    tips: 'This is a calibration check, not a correctness check. Let them respond freely. Their emotional response usually points toward the primary hot spot.',
    boundary: null,
  },
  {
    id: 2,
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
      '↳ TRANSITION → "Good — I want to come back to something specific you mentioned earlier."',
    ],
    tips: 'This is observational, not therapeutic. Name it and move on. Don\'t dwell or invite deep emotional processing.',
    boundary: null,
  },
  {
    id: 3,
    name: 'Hot Spot Framing',
    duration: '5-7 min',
    goal: 'Name the hot spot from Zoom 1, confirm it, make them feel understood. Do not move to pricing until this is done.',
    script: `"Before we talk about what support looks like, I want to come back to something you mentioned earlier.

[Name the specific thing from Zoom 1 — e.g. "You said you've been training consistently but your body isn't responding the way it should." OR "You mentioned you've tried a few different things and nothing has really clicked." OR "You said something shifted — and you're not sure when or why."]

That's what I'd call the hot spot. It's not a goal. It's the point where effort and response stopped feeling aligned.

Is that still the right way to describe it?"`,
    prompts: [
      '↳ If yes → "Good. That\'s exactly what we\'re going to address. Let me explain how."',
      '↳ If they add more → let them talk. The more specific they get, the more invested they become.',
      'IF MOTIVATION COMES UP → "Motivation is information, not the problem. The question is what it\'s telling us about where your system is right now."',
      'IF THEY MINIMISE IT → "Most people do that — they\'ve been managing it for so long it starts to feel normal. It\'s not."',
    ],
    tips: 'You already know the hot spot from Zoom 1. This stage is about naming it back precisely and watching them confirm it. You are not fishing — you are reflecting. The goal is for them to feel understood before pricing is introduced.',
    boundary: 'Do not move to pricing until the hot spot is clearly named and confirmed. Do not ask open questions — name it and confirm it.',
  },
  {
    id: 4,
    name: 'Pricing',
    duration: '5-10 min',
    goal: 'Present the coaching structure and packages as information, not persuasion. Full rate is always Offer 1. No mention of founding client program unless objection held or manual override selected.',
    script: `"Before I give you the number, let me walk you through what's included and what each piece costs on its own - just so the price makes sense in context. This is not what you'll pay. I just want you to understand what you're actually getting.

The CFFS diagnostic - the body state interpretation, the signal mapping, everything we used to understand what's actually going on with you - that's a $297 service.

From that I build your training program. Written for your state specifically, not a template. $200.

Nutrition protocol - what to eat, how much, what to prioritise right now. $150.

Every week I'm reading your check-in data and interpreting it. Not tracking - interpreting. Working out what your body is doing and adjusting accordingly. That's $150 a week on its own.

You've got direct access to me between sessions. Something comes up, you don't wait. $100 a week.

And the sessions themselves - two per week, face to face. $120 each.

Add that up and you're well over $1,000 a month for the individual pieces - before you factor in the fact that it's all running under one system that's reading your body the whole time.

The investment for all of that is $299 a week. That's where most people start - two sessions.

Three sessions is available where your schedule and capacity allow. $409. I'll guide that decision based on what your system can actually handle."`,
    prompts: [
      '↳ PAUSE after stating the price. Do not fill the silence. Let it land.',
      '↳ IF they go quiet → stay quiet. The first person to speak loses the frame.',
      'REFRAME — pick one if hesitation shows:',
      '💬 CONFIDENCE: "Most people feel clearer after the first two weeks than they have in years. Not because everything has changed - because nothing is guesswork anymore."',
      '💬 RESULTS: "The guys who get the most out of this aren\'t the ones who try the hardest - they\'re the ones who finally stopped fighting their body state."',
      '💬 SIMPLE: "It works when you stop trying to override your body and start working with it. That\'s all this is."',
      '💬 STAKES: "The cost of staying where you are is higher than the cost of this. You\'ve already proven that by being here."',
      '↳ TRANSITION → When they respond, move to Stage 5.',
    ],
    tips: 'Present pricing as information. Do not use urgency, scarcity, or pressure. After presenting pricing — pause and allow response. Do not jump to founding client. Evaluate based on response.',
    boundary: 'Full rate is always Offer 1. No discount framing. No urgency. Founding client is Offer 2 only — via objection-triggered or manual override.',
  },
  {
    id: 5,
    name: 'Decision',
    duration: '2-3 min',
    goal: 'Identify the decision pathway and close cleanly.',
    script: `"Take whatever time you need with it.

If it feels like the right fit, we can talk next steps.

If not, the report still stands on its own."`,
    prompts: [
      'PATH A - NOT PROCEEDING: Acknowledge without persuasion. Reinforce the clarity gained. Leave the door open professionally. "That\'s completely fine. The report still stands — you now have a clearer read on what\'s actually going on. If anything changes, the door\'s open."',
      'PATH B - NEEDS TIME: "That\'s fine — take the time you need. Before we wrap up, can I ask what\'s sitting with you? Is it the investment, whether this is the right fit, or something else?"\n↳ If it\'s the money → "Understood. If the investment is the sticking point, there is one other option I haven\'t mentioned yet. It\'s not available to everyone — do you want me to explain it?" [→ move to Founding Client if appropriate]\n↳ If it\'s whether it\'ll work → "That\'s a fair concern — especially if you\'ve tried things before. What I\'d say is the report you already have is the first output of the system working. That wasn\'t a pitch. That was the system reading your data. Whether coaching is right is a separate question — but the read is already done."\n↳ If they need permission → "Makes sense. Is there someone else who needs to be part of this decision? I\'m happy to jump on a call with both of you if that helps."\n↳ Set a specific follow-up → "When would be a good time to pick this back up? I\'d rather have a date than leave it open-ended."',
      'PATH C - PROCEEDING (FULL RATE): Confirm the package. Send commencement fee link first ($240). Once paid, send weekly subscription link. Confirm Deliberate Start Window (3-7 days). Send intake link after fee received.',
      'PATH C - PROCEEDING (FOUNDING CLIENT): Confirm the founding client program. Send case study agreement link first. Once signed, send commencement fee ($240). Once paid, send subscription at founding rate. Confirm Deliberate Start Window. Send intake link.',
      'PATH C - PROCEEDING (ONLINE): Send commencement fee first ($240). Once paid, send online subscription link ($149/week). Confirm Deliberate Start Window. Send intake link.',
      'COMMENCEMENT FEE - $240 (one-time): https://buy.stripe.com/6oUbJ392W3L02sn00T5ZC01',
      'ONLINE $149/week: https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02',
      'IN-PERSON 2x $299/week: https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00',
      'IN-PERSON 3x $409/week: https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03',
    ],
    tips: 'Founding client: agreement must be signed before any payment link is sent. Standard and online: commencement fee first, then subscription.',
    boundary: 'No urgency manipulation. No discount framing. Non-enrolment is an acceptable outcome.',
  },
]

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
↳ If they move forward — Stage 5, Path C (Full Rate).
↳ If price objection holds — move to Step 2.`,
    },
    {
      label: 'Step 2 — Introduce Founding Client',
      content: `"There's one other option I want to put in front of you — I'll explain it properly so you can decide if it's relevant.

I have a small number of founding client positions open. These are clients whose full coaching journey gets documented — intake, interpretation, weekly data, outcomes. It's how I formally validate the system across real cases.

In exchange for that, fees are adjusted by 50% for the full engagement. So $149.50 a week instead of $299 for two sessions, or $204.50 instead of $409 for three.

That's not a discount. It's a trade — your participation has genuine value to the system, and the fee reflects that.

If that changes things for you, I can walk you through what's involved."`,
    },
    {
      label: 'Step 3 — If they want the detail',
      content: `COMMITMENT
"Minimum 12 weeks. That's what makes it a valid case study. Most founding clients stay 6 to 12 months, but we don't ask for that upfront."

WHAT GETS DOCUMENTED
"Everything that's already happening — your intake, CFFS interpretation, weekly check-ins, synthesis outputs. Nothing extra from you. You just show up and do the work."

CONSENT
"You sign an agreement before we start. Two options — anonymised, where your identity is removed from anything published, or named, where you review anything before it goes public. Internal use for system development is covered either way."

NOT REDUCED COACHING
"Same sessions, same interpretation, same system. The only thing that changes is the fee."

NEXT STEP
"If you want to go ahead — I send the case study agreement first. Once that's signed, I send the commencement fee link. That's it."`,
    },
  ],
  followups: [
    '"Do you want me to walk you through how that works?"',
    '"Would that make this more workable for you?"',
  ],
  exitPath: 'If declined → move to Online Coaching tab. Or return to standard decision flow.',
  boundary: 'Do not introduce before objection. Do not introduce if objection resolves. Do not re-offer after decline. Do not frame as discount. Do not escalate tone.',
}

const MANUAL_OVERRIDE = {
  toneIndicator: 'Tone: Selective inclusion',
  when: 'Use only when: no price objection is present, client is aligned to proceed, client is identified as a strong case study candidate.',
  insertPoint: 'After pricing is explained — before objection handling begins.',
  qualificationChecklist: [
    'Complex or high-value interpretive pattern',
    'Strong compliance signal — clear communication, engaged in both zooms',
    'Long-term candidate — likely to sustain 6–12 month engagement',
    'You actively want this client in the founding cohort',
  ],
  qualificationRule: 'All four must be true. If any are unclear — do not use manual override.',
  script: `"Before we lock anything in, I want to raise something with you that sits slightly outside the standard coaching structure.

I'm currently in the process of formally validating the Body Recode™ interpretive system across real client engagements.

To do that properly, I need a small number of clients whose entire coaching journey is documented — from the initial CFFS interpretation through to the weekly CFWS cycles and outcomes over time. That documentation becomes part of the evidence base for the system.

I have five positions available for this. I call them founding client positions.

Based on everything I know about your situation — your check-in data, what came up in Zoom 1, and what we've discussed today — I think you would be a strong fit for one of these positions.

Here is what it means practically.

You would enter a formal case study agreement before we commence. That agreement covers exactly what gets documented, how it is used, whether you are named or anonymised, and your right to review anything before it is published externally. Nothing happens with your data without your knowledge and sign-off.

In exchange for that participation, your coaching fees are adjusted by 50% for the full duration of your engagement with me. Not just for the first 12 weeks — for as long as you remain in the program and the agreement is active.

At your package level that means $149.50/week instead of $299/week (2x), or $204.50/week instead of $409/week (3x).

This is not a promotional offer. I am not discounting my services. I am making a direct trade — your documented participation has genuine value to the development of this system, and the adjustment reflects that value.

There is no pressure to say yes. If you would prefer to commence as a standard client at full rate that option is absolutely available. But I wanted to offer you this first because I think your case would contribute something meaningful.

Do you want me to walk you through what the agreement looks like before you decide?"`,
  followups: [
    '"Do you want me to walk you through the agreement before you decide?"',
    '"There are five positions in total. I\'m selective about who I offer this to."',
    '"The coaching structure and standards are identical to a full-rate engagement. Nothing is reduced except the fee."',
  ],
  walkThrough: `MINIMUM COMMITMENT
"The minimum is 12 weeks. That's the threshold for a valid case study — it needs enough time to see a real pattern. Most founding clients stay 6 to 12 months, but we don't ask for that upfront."

WHAT GETS DOCUMENTED
"Everything that's already part of the coaching process — your intake, your CFFS interpretation, your weekly check-ins, the synthesis outputs. Nothing extra is required from you. You just participate fully."

CONSENT — TWO OPTIONS
"Before we start, you sign an agreement that covers how your data can be used externally. You choose one of two tiers:
- Tier 1: Anonymised — your case study can be published but your identity is removed.
- Tier 2: Named — your name can be used, but you review anything before it goes public.
Either way, internal use for system development is part of the agreement regardless of tier."

WHAT IT IS NOT
"This is not reduced coaching. The sessions, the interpretation, the system — all identical to a full-rate engagement. The only thing that changes is the fee."

SEQUENCE
"If you want to proceed, I send you the case study agreement to sign before anything else. Once that's signed, I send the commencement fee link. Coaching begins from there."`,
  ifAskedWhyYou: `"A few reasons. Your check-in data showed a pattern that's genuinely useful to document — it's not a simple case. What came up in Zoom 1 and what you've described today tells me there's something worth tracking properly over time. And from the way you've engaged across both calls, I think you're someone who will participate consistently. That's what makes a case study valid. I'm not offering this to everyone — I'm offering it because I think your case will contribute something real to the system."`,
  exitPath: 'If declined — return to standard decision flow. Offer full rate or online pathway. Do not re-offer.',
  boundary: 'Do not use if a price objection is present. Do not introduce reactively. Do not frame as incentive or cheaper coaching. Do not increase energy or urgency. Do not use both triggers in the same conversation.',
}

const ONLINE_SCRIPT = `"There is also an online option - and I want to be clear, this is not a lesser version of the system.

Everything that makes Body Recode work is still there. The weekly check-ins, the interpretation, the performance synthesis, the ongoing coaching support. The only difference is that we're not training together in person.

For some people that's actually the right structure - whether it's schedule, location, or just preference.

That sits at $149 per week. Same 12-week minimum. Same standards."`

const OBJECTIONS = [
  {
    objection: '"It\'s too expensive."',
    response: `"That's a fair thing to sit with. What I'd say is the investment reflects the full system - not just the sessions. You're not paying for two hours of training per week. You're paying for ongoing interpretation, pattern tracking, and a structured process that most people don't have access to. The question is whether that's useful for where you are right now."`,
    followup: 'If they remain hesitant on price — consider Objection-Triggered tab.',
    dropDown: true,
  },
  {
    objection: '"I need to think about it."',
    response: `"Of course. Take whatever time you need. The one thing I'd encourage you to be clear on is what specifically you need to think through - because if there's a question I haven't answered, I'd rather address it now than leave you sitting with something unresolved."`,
    followup: '"What is it you\'re sitting with?"',
    dropDown: false,
  },
  {
    objection: '"I don\'t have time for two sessions a week."',
    response: `"That's worth exploring. The sessions are structured - same time each week, built around your schedule. Most people find that having a fixed structure actually reduces the mental load of figuring out when to train."`,
    followup: 'If time is genuinely the issue and not resolved - introduce the online option.',
    dropDown: true,
  },
  {
    objection: '"What if it doesn\'t work?"',
    response: `"That's the right question to ask. The honest answer is - the system is designed to tell you why something isn't working, not just keep pushing harder. If patterns aren't shifting, that becomes visible quickly. And if at any point this stops feeling like the right fit, we stop. That applies on both sides."`,
    followup: null,
    dropDown: false,
  },
  {
    objection: '"I\'ve tried coaching before and it didn\'t work."',
    response: `"What did that look like?"`,
    followup: '"Most coaching fails because it\'s prescriptive without being interpretive - it tells you what to do without explaining why the body is responding the way it is. That\'s the gap Body Recode is designed to fill. The system doesn\'t assume you haven\'t tried hard enough."',
    dropDown: false,
  },
  {
    objection: '"Can I try it for a month first?"',
    response: `"I understand the instinct. The reason we structure around 12 weeks is that meaningful patterns don't emerge in four weeks - they need time to settle. A shorter window would give us data but not enough context to interpret it properly. That's not in your interest. The 12-week minimum is about giving the process enough time to actually work."`,
    followup: null,
    dropDown: false,
  },
  {
    objection: '"Can I just do one session a week?"',
    response: `"One session isn't a structure I offer inside Body Recode. The two-session structure is the minimum that allows for proper load exposure, recovery observation, and pattern tracking across the week. Below that, the coaching layer loses its integrity."`,
    followup: 'If they still can\'t commit to two sessions - introduce the online option.',
    dropDown: true,
  },
]

type PathwayType = 'full_rate' | 'founding_client_objection_triggered' | 'founding_client_manual_override' | 'online'

interface Zoom2CompanionProps {
  leadName: string
  bodyState: string
  totalScore: number | null
  sectionScores: Record<string, number> | null
  leadId: string
  initialNotes: string
}

export default function Zoom2Companion({
  leadName,
  bodyState,
  totalScore,
  sectionScores,
  leadId,
  initialNotes,
}: Zoom2CompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'prompts' | 'objection_triggered' | 'manual_override' | 'online' | 'signals'>('prompts')
  const [decisionPath, setDecisionPath] = useState<'A' | 'B' | 'C' | null>(null)
  const [pathwayType, setPathwayType] = useState<PathwayType | null>(null)
  const [sendingAgreement, setSendingAgreement] = useState(false)
  const [agreementSent, setAgreementSent] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stageScrollRef = useRef<HTMLDivElement | null>(null)

  useLayoutEffect(() => {
    if (stageScrollRef.current) {
      stageScrollRef.current.scrollTop = 0
    }
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
          className="text-[#10E1C2] underline underline-offset-2 hover:text-[#0ecfb2] transition-colors break-all"
        >{part}</a>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  const markDecision = async (path: 'A' | 'B' | 'C') => {
    const statusMap = { A: 'closed_declined', B: 'zoom_2_completed', C: 'zoom_2_completed' }
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
    const triggerMap: Record<PathwayType, string | null> = {
      full_rate: null,
      founding_client_objection_triggered: 'objection_triggered',
      founding_client_manual_override: 'manual_override',
      online: null,
    }
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        zoom2_pathway_type: type,
        zoom2_trigger_type: triggerMap[type],
      }),
    })
    setPathwayType(type)
  }

  const sendAgreement = async () => {
    setSendingAgreement(true)
    await fetch(`/api/leads/${leadId}/send-agreement`, { method: 'POST' })
    setSendingAgreement(false)
    setAgreementSent(true)
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

  const stage = STAGES[currentStage]
  const firstName = leadName.split(' ')[0]
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  const SECTION_LABELS: Record<string, string> = {
    '01': 'Energy', '02': 'Sleep', '03': 'Stress Load',
    '04': 'Training Response', '05': 'Fat Loss Response',
  }
  const sectionColour = (score: number) =>
    score === 1 ? 'text-red-400 border-red-400/30 bg-red-400/10'
    : score === 2 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'

  const isFoundingClientPathway = pathwayType === 'founding_client_objection_triggered' || pathwayType === 'founding_client_manual_override'

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <a href={`/dashboard/leads/${leadId}`} className="text-xs text-stone-600 hover:text-stone-400 transition-colors mb-0.5 block">← Back to lead</a>
            <p className="text-lg font-bold text-white">{leadName}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border text-[#10E1C2] border-[#10E1C2]/30 bg-[#10E1C2]/10">
              {bodyState}{scoreDisplay}
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
        <div className="w-52 border-r border-white/10 p-4 flex flex-col gap-1">
          <p className="text-xs text-stone-600 uppercase tracking-widest font-semibold mb-3">Stages</p>
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrentStage(i)}
              className={`text-left px-3 py-2.5 rounded-lg transition-colors ${
                i === currentStage
                  ? 'bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2]'
                  : i < currentStage
                  ? 'text-stone-500 hover:text-stone-300'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <p className="text-xs font-bold">{s.id}. {s.name}</p>
              <p className="text-xs opacity-60 mt-0.5">{s.duration}</p>
            </button>
          ))}
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
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{stage.name}</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">{stage.goal}</p>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 border-b border-white/10 flex-wrap">
                {([
                  { key: 'prompts', label: 'Script & Prompts' },
                  { key: 'objection_triggered', label: 'Objection-Triggered', colour: 'amber' },
                  { key: 'manual_override', label: 'Manual Override', colour: 'violet' },
                  { key: 'online', label: 'Online Coaching', colour: 'amber' },
                  { key: 'signals', label: 'Scorecard Breakdown' },
                ] as const).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`text-xs font-semibold px-3 py-2 border-b-2 -mb-px transition-colors ${
                      activeTab === tab.key
                        ? ('colour' in tab && tab.colour === 'amber')
                          ? 'border-amber-400 text-amber-400'
                          : ('colour' in tab && tab.colour === 'violet')
                          ? 'border-violet-400 text-violet-400'
                          : 'border-[#10E1C2] text-[#10E1C2]'
                        : 'border-transparent text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Script & Prompts tab */}
              {activeTab === 'prompts' && (
                <div className="space-y-3">
                  {stage.script && (
                    <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/30 rounded-xl p-5 mb-2">
                      <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-3">Script</p>
                      <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
                    </div>
                  )}

                  {/* Value Stack — shown only on Pricing stage */}
                  {stage.id === 4 && (
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
                  {stage.prompts.map((p, i) => (
                    <div key={i} className={`rounded-xl p-4 ${
                      p.startsWith('PATH') ? 'bg-amber-400/5 border border-amber-400/20' :
                      p.startsWith('IF ') ? 'bg-stone-800 border border-stone-700' :
                      p.startsWith('↳') ? 'bg-transparent border border-stone-800 ml-4' :
                      p.startsWith('REFRAME') ? 'bg-violet-500/5 border border-violet-500/20' :
                      p.startsWith('💬') ? 'bg-violet-500/5 border border-violet-500/15 ml-4' :
                      p.includes(' - $') ? 'bg-stone-900 border border-stone-700' :
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
                  ))}
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
                  <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Exit path</p>
                    <p className="text-stone-400 text-sm">{OBJECTION_TRIGGERED.exitPath}</p>
                  </div>
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                    <p className="text-stone-400 text-sm leading-relaxed">{OBJECTION_TRIGGERED.boundary}</p>
                  </div>
                </div>
              )}

              {/* Manual Override tab */}
              {activeTab === 'manual_override' && (
                <div className="space-y-4">
                  <div className="bg-violet-400/10 border border-violet-400/30 rounded-xl p-4">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-1">{MANUAL_OVERRIDE.toneIndicator}</p>
                    <p className="text-stone-400 text-xs leading-relaxed">{MANUAL_OVERRIDE.when}</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">Qualification checklist — all four must be true</p>
                    <div className="space-y-2">
                      {MANUAL_OVERRIDE.qualificationChecklist.map((item, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="w-5 h-5 rounded-full border border-violet-400/30 bg-violet-400/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-violet-400" />
                          </div>
                          <p className="text-stone-300 text-sm">{item}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-stone-500 text-xs mt-3">{MANUAL_OVERRIDE.qualificationRule}</p>
                  </div>
                  <div className="bg-stone-800 border border-stone-700 rounded-xl p-3">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Insert point</p>
                    <p className="text-stone-300 text-sm">{MANUAL_OVERRIDE.insertPoint}</p>
                  </div>
                  <div className="bg-violet-400/5 border border-violet-400/20 rounded-xl p-5">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-3">Script</p>
                    <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{MANUAL_OVERRIDE.script}</p>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Follow-up prompts</p>
                    {MANUAL_OVERRIDE.followups.map((f, i) => (
                      <div key={i} className="bg-stone-800 rounded-lg p-3">
                        <p className="text-stone-300 text-sm">{f}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-violet-400/5 border border-violet-400/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-violet-400 uppercase tracking-wider mb-2">If they want to know more</p>
                    <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{MANUAL_OVERRIDE.walkThrough}</p>
                  </div>
                  <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">If asked &quot;why me?&quot;</p>
                    <p className="text-stone-400 text-sm">{MANUAL_OVERRIDE.ifAskedWhyYou}</p>
                  </div>
                  <div className="bg-stone-800 border border-stone-700 rounded-xl p-4">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">Exit path</p>
                    <p className="text-stone-400 text-sm">{MANUAL_OVERRIDE.exitPath}</p>
                  </div>
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                    <p className="text-stone-400 text-sm leading-relaxed">{MANUAL_OVERRIDE.boundary}</p>
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
                    <div className="border-t border-stone-800 pt-3 space-y-1.5 text-xs text-stone-400">
                      <p>Weekly Performance Check-Ins</p>
                      <p>Ongoing coaching interpretation and synthesis</p>
                      <p>No in-person sessions</p>
                      <p>12-week minimum interpretive window</p>
                      <p>Same commencement fee applies</p>
                    </div>
                  </div>
                  <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-2">
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Follow-up prompts</p>
                    {[
                      '"Does that feel like it would work for your situation?"',
                      '"The structure and standards are exactly the same - the delivery is just remote."',
                      '"Same 12-week window, same check-in process, same interpretation layer."',
                    ].map((p, i) => (
                      <div key={i} className="bg-stone-800 border border-stone-700 rounded-lg p-3">
                        <p className="text-stone-300 text-sm">{p}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Boundary</p>
                    <p className="text-stone-400 text-sm">If they decline all options — close cleanly. No further pressure. Move to Stage 5 Path A.</p>
                  </div>
                </div>
              )}

              {/* Scorecard Breakdown tab */}
              {activeTab === 'signals' && (
                <div className="space-y-4">
                  <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-1">Body State</p>
                    <p className="text-white text-sm font-semibold">{bodyState}{scoreDisplay}</p>
                  </div>
                  {sectionScores ? (
                    Object.entries(SECTION_LABELS).map(([key, label]) => {
                      const score = sectionScores[key] ?? null
                      if (score === null) return null
                      return (
                        <div key={key} className={`border rounded-xl p-4 ${sectionColour(score)}`}>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold uppercase tracking-wider">{label}</p>
                            <span className="text-xs font-bold">{score}/3</span>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-xs text-stone-500">Section scores not available — lead did not purchase the Body Decode Report.</p>
                  )}
                  <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4">
                    <p className="text-xs text-stone-500 leading-relaxed">For objection handling, use the <button onClick={() => setActiveTab('objection_triggered')} className="text-amber-400 font-semibold hover:text-amber-300 transition-colors">Objection-Triggered tab</button>.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes + Decision panel */}
          <div className="w-72 border-l border-white/10 flex flex-col overflow-y-auto">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Live Notes</p>
              <button
                onClick={saveNotes}
                className="text-xs text-[#10E1C2] hover:text-white transition-colors font-semibold"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Type observations as the call unfolds..."
              className="flex-1 bg-transparent text-stone-300 text-sm p-4 resize-none focus:outline-none placeholder-stone-700 leading-relaxed"
            />
            <div className="p-4 border-t border-white/10 space-y-3">

              {/* Decision path */}
              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Decision Path</p>
                <div className="space-y-1 text-xs text-stone-500">
                  <p>A — Not proceeding</p>
                  <p>B — Needs more time</p>
                  <p>C — Proceeding</p>
                </div>
              </div>

              {currentStage === 4 && (
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
                      <button onClick={() => markPathway('founding_client_objection_triggered')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-colors">
                        Founding Client — Objection Triggered
                      </button>
                      <button onClick={() => markPathway('founding_client_manual_override')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 hover:bg-violet-500/20 transition-colors">
                        Founding Client — Manual Override
                      </button>
                      <button onClick={() => markPathway('online')} className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-stone-700/50 border border-stone-600 text-stone-300 hover:bg-stone-700 transition-colors">
                        Online
                      </button>
                    </>
                  ) : decisionPath === 'C' && pathwayType && isFoundingClientPathway && !agreementSent ? (
                    <div className="space-y-2">
                      <div className={`text-xs font-bold px-3 py-2 rounded-lg text-center ${
                        pathwayType === 'founding_client_manual_override'
                          ? 'bg-violet-500/10 border border-violet-500/20 text-violet-400'
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                      }`}>
                        {pathwayType === 'founding_client_manual_override' ? 'Manual Override' : 'Objection Triggered'} recorded
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed">Send agreement before any payment link.</p>
                      <button
                        onClick={sendAgreement}
                        disabled={sendingAgreement}
                        className="w-full text-xs font-bold px-3 py-2 rounded-lg bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] hover:bg-[#10E1C2]/20 transition-colors disabled:opacity-50"
                      >
                        {sendingAgreement ? 'Sending...' : 'Send Case Study Agreement'}
                      </button>
                    </div>
                  ) : agreementSent ? (
                    <div className="text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center">
                      Agreement sent — await signature before payment
                    </div>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
