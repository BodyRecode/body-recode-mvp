'use client'

import { useState, useEffect, useRef } from 'react'

type SignalLevel = 1 | 2 | 3
type SignalKey = 'sls' | 'rps' | 'rils'

const STAGES = [
  {
    id: 1,
    name: 'Report Review',
    duration: '5-7 min',
    goal: 'Ensure the member is reading the report correctly and safely.',
    script: `"Before we get into anything else, I want to briefly revisit the report you received.

Not to go through it line by line - but to make sure it's landed the way it was intended."`,
    prompts: [
      'INTERPRETIVE BOUNDARIES - "The report is a single-point snapshot. It is not a verdict, a diagnosis, or a directive. It does not prescribe training changes or assess readiness."',
      '↳ Does that make sense in terms of how you read it?',
      'PATTERN LANGUAGE - "Did any of the pattern descriptions feel familiar to you? Or confusing?"',
      '↳ There is no right answer here - mismatch is useful information too.',
      'WHAT IT DID NOT DO - "The report deliberately avoided labelling problems, assigning blame, ranking your performance, or telling you what to do next."',
      '↳ Did you notice that when you read it?',
      'EMOTIONAL RESPONSE - "How did it feel to read it? Relief, frustration, confusion, neutral - all valid."',
      'READINESS CHECK - "One last thing - meaningful interpretation requires observation across time. A single report can\'t tell the full story. That\'s why ongoing synthesis exists inside Body Recode."',
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
    ],
    tips: 'This is observational, not therapeutic. Name it and move on. Don\'t dwell or invite deep emotional processing.',
    boundary: null,
  },
  {
    id: 3,
    name: 'Hot Spot Framing',
    duration: '5-7 min',
    goal: 'Identify the specific point where effort and response stopped feeling aligned.',
    script: `"Before we talk about what support could look like, I want to pause on something important.

When you decided to do the check-in, there was probably something that felt unclear or frustrating.

Not a goal - but a point where things stopped making sense.

What has that been like for you?"`,
    prompts: [
      'What has that been like for you?',
      'How long has it felt that way?',
      'Have you been able to make sense of it on your own?',
      'IF MOTIVATION COMES UP - "That might be true. Inside Body Recode, we treat motivation as information. What matters is why it feels unreliable right now."',
      '↳ "For some people, motivation drops because they\'re avoiding effort. For others, it drops because they\'ve been putting effort in without clear feedback or trust. Those require different responses."',
      'IF ENGAGEMENT APPEARS LOW - "If someone isn\'t in a place to engage consistently right now, coaching doesn\'t change that. What coaching can do is remove confusion so that, when engagement is there, it\'s used well."',
    ],
    tips: 'A hot spot is not a goal or outcome. It is the point where effort and response no longer feel aligned. You need this clearly articulated before moving to pricing.',
    boundary: 'Do not move to pricing until the hot spot is clearly named and the member feels understood.',
  },
  {
    id: 4,
    name: 'Pricing',
    duration: '5-10 min',
    goal: 'Present the coaching structure and packages as information, not persuasion.',
    script: `"Based on what you've described, it might be useful to explain how support is structured - just so you have the full picture. There's no expectation to decide today.

We structure coaching around a minimum 12-week interpretive window.

Most meaningful patterns don't actually settle until closer to six months - but that's not something we ask for upfront. We start with enough time to see clearly, and then decide together whether continuing makes sense.

What coaching actually covers is ongoing interpretation across time - governing stress, load, and recovery, and reducing the need to constantly second-guess what you're seeing or feeling. It's not about motivation, intensity, or pushing for outcomes.

Inside Body Recode, coaching is structured weekly and there are two entry options."`,
    prompts: [
      'ONLINE - $149/week - "Everything the coaching system includes - weekly check-ins, interpretation, performance synthesis, and ongoing support. No in-person sessions. Same 12-week minimum."',
      'IN-PERSON - $299/week - "Two one-to-one sessions per week, plus the full coaching and interpretation layer alongside that. This is the standard entry structure."',
      '↳ "Most people who continue do so because things start to make more sense - not because anything dramatic has changed."',
      '↳ "If at any point this stops feeling like the right fit, we stop. That applies on both sides."',
      '↳ "You don\'t need to decide now. Take some time to sit with it."',
    ],
    tips: 'Present pricing as information. Do not use urgency, scarcity, or pressure. Session frequency is coach-recommended, not client-selected.',
    boundary: 'No discounts. No promotions. No urgency framing. A no or not yet is a complete and valid outcome.',
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
      'PATH A - NOT PROCEEDING: Acknowledge without persuasion. Reinforce the clarity gained. Leave the door open professionally.',
      'PATH B - NEEDS TIME: "What would you need to feel certain?" Offer a clean timeframe for reflection. Confirm next check-in point if any.',
      'PATH C - PROCEEDING: Confirm commencement fee and what it covers. Confirm the Deliberate Start Window (3-7 days). Confirm the formal commencement trigger (fee paid). Send intake link after fee is received.',
    ],
    tips: 'Identify the path calmly without pressure. Document the decision category, key hesitation or drivers, agreed next step, and commencement trigger status.',
    boundary: 'No urgency manipulation. No discount framing. No exaggerated claims. Non-enrolment is an acceptable outcome.',
  },
]

const SIGNAL_LABELS = {
  sls: {
    label: 'Stress & Load',
    levels: {
      1: { label: 'Balanced', desc: 'Training and external load are manageable.' },
      2: { label: 'Moderate Cumulative', desc: 'Demand accumulating. Effort higher than result.' },
      3: { label: 'Elevated', desc: 'High cumulative demand. System prioritising stability.' },
    },
  },
  rps: {
    label: 'Recovery Predictability',
    levels: {
      1: { label: 'Stable', desc: 'Recovery consistent and predictable session to session.' },
      2: { label: 'Variable', desc: 'Some sessions fine, others harder to bounce back from.' },
      3: { label: 'Reduced', desc: 'Recovery unpredictable. Hard to know how body will respond.' },
    },
  },
  rils: {
    label: 'Regulation & Identity Load',
    levels: {
      1: { label: 'Low', desc: 'External and psychological load well managed.' },
      2: { label: 'Moderate', desc: 'Some uncertainty and external pressure adding to picture.' },
      3: { label: 'Elevated', desc: 'High regulation demand. Identity may be tied to performance.' },
    },
  },
}

interface Zoom2CompanionProps {
  leadName: string
  slsLevel: SignalLevel
  rpsLevel: SignalLevel
  rilsLevel: SignalLevel
  leadId: string
  initialNotes: string
}

export default function Zoom2Companion({
  leadName,
  slsLevel,
  rpsLevel,
  rilsLevel,
  leadId,
  initialNotes,
}: Zoom2CompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'prompts' | 'signals'>('prompts')
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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

  const levelColour = (level: number) =>
    level === 1 ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
    : level === 2 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    : 'text-red-400 border-red-400/30 bg-red-400/10'

  const levelDot = (level: number) =>
    level === 1 ? 'bg-emerald-400' : level === 2 ? 'bg-amber-400' : 'bg-red-400'

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
  const signals: { key: SignalKey; level: SignalLevel }[] = [
    { key: 'sls', level: slsLevel },
    { key: 'rps', level: rpsLevel },
    { key: 'rils', level: rilsLevel },
  ]
  const firstName = leadName.split(' ')[0]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-0.5">Zoom 2 - Companion</p>
            <p className="text-lg font-bold text-white">{leadName}</p>
          </div>

          {/* Signal levels */}
          <div className="flex items-center gap-3">
            {signals.map(({ key, level }) => (
              <div key={key} className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${levelColour(level)}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${levelDot(level)}`} />
                {SIGNAL_LABELS[key].label} {level}
              </div>
            ))}
          </div>
        </div>

        {/* Timer */}
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
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-widest">Stage {stage.id}</span>
                <span className="text-xs text-stone-600">{stage.duration}</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-3">{stage.name}</h2>
              <p className="text-stone-400 text-sm leading-relaxed mb-6">{stage.goal}</p>

              {/* Tabs */}
              <div className="flex gap-1 mb-5 border-b border-white/10">
                {(['prompts', 'signals'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-semibold px-3 py-2 capitalize border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? 'border-[#10E1C2] text-[#10E1C2]' : 'border-transparent text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tab === 'prompts' ? 'Script & Prompts' : 'Signal Reference'}
                  </button>
                ))}
              </div>

              {activeTab === 'prompts' && (
                <div className="space-y-3">
                  {stage.script && (
                    <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/30 rounded-xl p-5 mb-2">
                      <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-3">Script</p>
                      <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
                    </div>
                  )}
                  {stage.prompts.map((p, i) => (
                    <div key={i} className={`rounded-xl p-4 ${
                      p.startsWith('PATH') ? 'bg-amber-400/5 border border-amber-400/20' :
                      p.startsWith('IF ') ? 'bg-stone-800 border border-stone-700' :
                      p.startsWith('↳') ? 'bg-transparent border border-stone-800 ml-4' :
                      p.includes(' - $') ? 'bg-stone-900 border border-stone-700' :
                      'bg-stone-900 border border-stone-800'
                    }`}>
                      <p className="text-white text-sm leading-relaxed">{p}</p>
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

              {activeTab === 'signals' && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500 mb-2">{firstName}&apos;s signal profile from the Initial Performance Check-In.</p>
                  {signals.map(({ key, level }) => {
                    const info = SIGNAL_LABELS[key]
                    const levelInfo = info.levels[level as 1 | 2 | 3]
                    return (
                      <div key={key} className={`border rounded-xl p-4 ${levelColour(level)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider">{info.label}</p>
                          <span className="text-xs font-bold">Level {level} - {levelInfo.label}</span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">{levelInfo.desc}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Notes panel */}
          <div className="w-72 border-l border-white/10 flex flex-col">
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
            <div className="p-4 border-t border-white/10">
              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Decision Path</p>
                <div className="space-y-1.5 text-xs text-stone-500">
                  <p>A - Not proceeding</p>
                  <p>B - Needs more time</p>
                  <p>C - Proceeding to commencement</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
