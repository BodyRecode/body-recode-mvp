'use client'

import { useState, useEffect, useRef } from 'react'

type SignalLevel = 1 | 2 | 3
type SignalKey = 'sls' | 'rps' | 'rils'

function buildStages(leadName: string, slsLevel: SignalLevel, rpsLevel: SignalLevel, rilsLevel: SignalLevel, signalPattern: string) {
  const firstName = leadName.split(' ')[0]

  // Stage 4 interpretation — tailored to SLS + RPS combo, with RILS addendum
  const slsDesc = slsLevel === 3
    ? 'The stress and load signals are elevated — the body is already working hard to maintain baseline.'
    : slsLevel === 2
    ? 'There\'s a moderate cumulative load building up — effort is consistently higher than what the body is returning.'
    : 'The load signals are relatively balanced — the system is coping.'

  const rpsDesc = rpsLevel === 3
    ? 'Recovery has become unpredictable — the body can\'t reliably bounce back between sessions.'
    : rpsLevel === 2
    ? 'Recovery is variable — some sessions feel fine, others don\'t land the same way.'
    : 'Recovery is tracking consistently — predictable session to session.'

  const rilsAddendum = rilsLevel === 3
    ? '\n\nAnd on top of that, the regulation signals suggest there\'s a psychological and structural load as well — the pressure around adjustments, external demands, maybe identity tied to getting results. Those compound the physical signals. The body doesn\'t separate them.'
    : rilsLevel === 2
    ? '\n\nThere\'s also a moderate regulation load showing up — some uncertainty, some external pressure. It\'s not the dominant signal but it\'s adding to the overall picture.'
    : ''

  const comboOutcome = (slsLevel >= 2 && rpsLevel >= 2)
    ? 'When those two things overlap, the body shifts into a protective state — it prioritises stability over adaptation. That\'s why effort isn\'t producing the result you\'d expect. It\'s not a fitness problem. It\'s a system response.'
    : 'The system is managing, but there\'s enough accumulation to explain the pattern showing up in the report.'

  return [
    {
      id: 1,
      name: 'Opening Frame',
      duration: '2 min',
      goal: 'Create safety and remove pressure. Establish this is not a sales call.',
      script: `"Thanks for taking the time to jump on today, ${firstName}.

The purpose of this conversation is to talk through what showed up in your check-in — your report came back as a ${signalPattern} pattern — and hear a bit more about your training experience.

There's nothing you need to decide today. We're just looking at whether what the report picked up actually matches what you've been experiencing."`,
      prompts: [
        'How did you find completing the Performance Check-In?',
        'Was there anything that felt straightforward — or anything you weren\'t quite sure about?',
      ],
      tips: 'Slow down. Let them land. Don\'t rush past this stage — the tone you set here carries the whole call.',
      boundary: null,
    },
    {
      id: 2,
      name: 'Report Reflection',
      duration: '5–7 min',
      goal: 'Allow the member to respond to the report before you offer any interpretation.',
      script: `"Before I share any of my own observations, I want to hear from you first.

You had a chance to read the report before today — it came back as a ${signalPattern} pattern, with ${slsLevel === 3 ? 'elevated' : slsLevel === 2 ? 'moderate' : 'balanced'} stress and load signals and ${rpsLevel === 3 ? 'reduced' : rpsLevel === 2 ? 'variable' : 'stable'} recovery predictability.

Just take me through your reaction. What stood out to you when you read it?"`,
      prompts: [
        'When you read the report, what stood out most to you?',
        'Did any part of it feel particularly accurate?',
        'Was there anything that didn\'t quite land for you?',
      ],
      tips: 'Do not explain the report first. Let them tell you what they noticed — their language is the signal. The strongest friction point usually surfaces here.',
      boundary: null,
    },
    {
      id: 3,
      name: 'Context Exploration',
      duration: '10–12 min',
      goal: 'Understand the real training environment behind the report pattern.',
      script: `"Thanks for sharing that. What I want to do now is get a clearer picture of what's actually been happening week to week — because the report flagged ${slsLevel >= 3 ? 'elevated load and stress signals' : slsLevel === 2 ? 'moderate load accumulation' : 'some signal patterns'} and ${rpsLevel >= 3 ? 'significantly reduced recovery predictability' : rpsLevel === 2 ? 'variable recovery' : 'consistent recovery'}, but it doesn't know the context behind those numbers.

So I'm going to ask you a few questions. Just answer as openly as you can — there's no right answer here."`,
      prompts: [
        'Training: "What does your training currently look like week to week?"',
        'Recovery: "How predictable does recovery feel between sessions?"',
        'Consistency: "Is training fairly stable week to week, or does life move around a lot?"',
        'Pressure: "Do you feel like you\'re putting pressure on yourself to get results?"',
        'Duration: "How long has this pattern been showing up for you?"',
      ],
      tips: 'Ask one question at a time. Let silence do work. You\'re listening for SLS, RPS, and RILS signals in their language — not solving anything.',
      boundary: 'No prescriptions. No "you should try…". No training or nutrition advice. Just listening and clarifying.',
    },
    {
      id: 4,
      name: 'Pattern Interpretation',
      duration: '5–7 min',
      goal: 'Translate the signals into a coherent explanation. Clarity — not solution.',
      script: `"Based on what you've described and what showed up in the report, here's what I'm seeing.

${slsDesc} ${rpsDesc} ${comboOutcome}${rilsAddendum}

That's what the ${signalPattern} pattern means in practice — and it's actually one of the more common things we see."`,
      prompts: [
        '"What I\'m noticing across what you\'ve described is…"',
        '"The pattern that tends to show up when these signals combine is…"',
        '"Your body isn\'t broken — it\'s responding. What we\'re looking at is…"',
      ],
      tips: 'Use the Interpretation Language tab for signal-specific phrases. Keep it observational. The goal is to make the pattern feel understandable — not alarming.',
      boundary: 'No medical interpretation. No outcome promises. No training adjustments. Pattern identification only.',
    },
    {
      id: 5,
      name: 'Next Step Invitation',
      duration: '2–3 min',
      goal: 'Offer deeper exploration without pressure. Intellectual curiosity — not pitch.',
      script: `"What we've talked about today is essentially the surface layer of the ${signalPattern} pattern.

If you wanted to explore it more deeply, the next step would be an orientation session — where we go through how the Body Recode process actually works and whether it would be useful given what's showing up for you specifically.

There's no obligation. It's just a more detailed look at what the system would do with your pattern."

Then ask: "Would you like to explore that further?"

→ If YES: book Zoom 2 before ending the call.
→ If NO: close cleanly. No follow-up pressure.`,
      prompts: [
        '"Would you like to explore what that would actually look like in practice?"',
        '"The next step is an orientation session — about 30–45 minutes — where we go deeper into the framework."',
        '"There\'s no commitment involved. It\'s just a clearer look at what support could look like."',
      ],
      tips: 'Don\'t oversell. Don\'t rush. If they\'re not ready, that\'s valid information. Zoom 2 should be booked before this call ends if they say yes.',
      boundary: null,
    },
  ]
}

const SIGNAL_LABELS = {
  sls: {
    label: 'Stress & Load',
    levels: {
      1: { label: 'Balanced', desc: 'Training and external load are manageable. System is coping well.' },
      2: { label: 'Moderate Cumulative', desc: 'Some accumulation of load signals. Training effort doesn\'t always match result.' },
      3: { label: 'Elevated Cumulative', desc: 'High cumulative demand. System is working hard to keep up. Push harder = worse.' },
    },
  },
  rps: {
    label: 'Recovery Predictability',
    levels: {
      1: { label: 'Stable', desc: 'Recovery is consistent and predictable session to session.' },
      2: { label: 'Variable', desc: 'Recovery varies. Some sessions fine, others harder to bounce back from.' },
      3: { label: 'Reduced', desc: 'Recovery is unpredictable. Hard to know how the body will respond.' },
    },
  },
  rils: {
    label: 'Regulation & Identity Load',
    levels: {
      1: { label: 'Low', desc: 'External and psychological load is well managed. Adjustments feel comfortable.' },
      2: { label: 'Moderate', desc: 'Some uncertainty around adjustments. External demands creating pressure.' },
      3: { label: 'Elevated', desc: 'High regulation demand. Relies on external support. Identity may be tied to performance.' },
    },
  },
}

const PATTERN_LANGUAGE: Record<string, Record<number, string>> = {
  sls: {
    1: 'Your training load signals are balanced — the system is managing demand well.',
    2: 'There\'s a cumulative load building up. Effort feels higher relative to what the body is returning. This isn\'t about fitness — it\'s about system demand.',
    3: 'The stress and load signals are elevated. The body is in a state where adding more stimulus typically produces less, not more. This pattern usually explains why harder isn\'t working.',
  },
  rps: {
    1: 'Recovery is tracking well — predictable and consistent from session to session.',
    2: 'Recovery variability is showing up. Some sessions feel fine, others don\'t land the same way. The unpredictability itself is the signal.',
    3: 'Recovery predictability is reduced significantly. When the body can\'t predict its own recovery, it\'s usually managing something underneath that training alone won\'t fix.',
  },
  rils: {
    1: 'Regulation and identity load is low — adjustments feel manageable and external pressure isn\'t compounding the picture.',
    2: 'There\'s a moderate regulation load present. The uncertainty around adjustments, combined with external demand, is adding to the overall picture.',
    3: 'Regulation demand is elevated. This often means the body is managing psychological and structural pressures alongside physical ones — and they compound each other.',
  },
}

const COMBO_PATTERNS: Record<string, string> = {
  '3-3': 'System Overload: When SLS and RPS are both at Level 3, the body is in a state of significant depletion. More training doesn\'t help here — the system is already operating at capacity.',
  '3-2': 'Cumulative Accumulation: High load with variable recovery. The body is absorbing demand but recovery can\'t keep pace. Classic frustration pattern.',
  '2-3': 'Recovery Collapse: Moderate load but recovery has become unpredictable. Often means the body is managing something outside of training that\'s using recovery capacity.',
  '2-2': 'Managed Accumulation: Both load and recovery are in moderate territory. System is coping but not thriving. Progress will feel inconsistent.',
}

interface ZoomCompanionProps {
  leadName: string
  signalPattern: string
  slsLevel: SignalLevel
  rpsLevel: SignalLevel
  rilsLevel: SignalLevel
  leadId: string
  initialNotes: string
}

export default function ZoomCompanion({
  leadName,
  signalPattern,
  slsLevel,
  rpsLevel,
  rilsLevel,
  leadId,
  initialNotes,
}: ZoomCompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'prompts' | 'signals' | 'language'>('prompts')
  const [view, setView] = useState<'live' | 'postcall'>('live')
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [generating, setGenerating] = useState(false)
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

  const generateSummary = async () => {
    if (!transcript.trim()) return
    setGenerating(true)
    const res = await fetch(`/api/leads/${leadId}/zoom-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, memberName: leadName, signalPattern, slsLevel, rpsLevel, rilsLevel }),
    })
    const data = await res.json()
    setSummary(data.summary ?? '')
    setGenerating(false)
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

  const STAGES = buildStages(leadName, slsLevel, rpsLevel, rilsLevel, signalPattern)
  const stage = STAGES[currentStage]
  const comboKey = `${slsLevel}-${rpsLevel}`
  const comboPattern = COMBO_PATTERNS[comboKey]

  const signals: { key: SignalKey; level: SignalLevel }[] = [
    { key: 'sls', level: slsLevel },
    { key: 'rps', level: rpsLevel },
    { key: 'rils', level: rilsLevel },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-0.5">Zoom 1 — Companion</p>
            <p className="text-lg font-bold text-white">{leadName}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            signalPattern === 'Remediation' ? 'text-red-400 border-red-400/30 bg-red-400/10'
            : signalPattern === 'Optimisation' ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
            : 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10'
          }`}>
            {signalPattern}
          </span>

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

        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
            <button
              onClick={() => setView('live')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${view === 'live' ? 'bg-[#10E1C2] text-black' : 'text-stone-400 hover:text-white'}`}
            >
              Live
            </button>
            <button
              onClick={() => setView('postcall')}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${view === 'postcall' ? 'bg-[#10E1C2] text-black' : 'text-stone-400 hover:text-white'}`}
            >
              Post-Call
            </button>
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
      </div>

      {view === 'postcall' && (
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-2">Post-Call Summary</h2>
            <p className="text-stone-500 text-sm mb-8">Paste the Zoom transcript below and generate an AI summary based on the Zoom 1 framework.</p>

            {!summary ? (
              <div className="space-y-4">
                <textarea
                  value={transcript}
                  onChange={e => setTranscript(e.target.value)}
                  placeholder="Paste your Zoom transcript here…"
                  className="w-full h-72 bg-stone-900 border border-stone-800 rounded-xl p-4 text-stone-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-stone-600 placeholder-stone-700"
                />
                <button
                  onClick={generateSummary}
                  disabled={!transcript.trim() || generating}
                  className="bg-[#10E1C2] text-black font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#0ecfb2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating summary…' : 'Generate Summary'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
                  <div className="prose prose-invert prose-sm max-w-none">
                    {summary.split('\n').map((line, i) => {
                      if (line.startsWith('## ')) return <h3 key={i} className="text-white font-bold text-base mt-6 mb-2 first:mt-0">{line.replace('## ', '')}</h3>
                      if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-white font-semibold text-sm">{line.replace(/\*\*/g, '')}</p>
                      if (line.trim() === '') return <div key={i} className="h-2" />
                      return <p key={i} className="text-stone-400 text-sm leading-relaxed">{line}</p>
                    })}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setSummary(''); setTranscript('') }}
                    className="text-xs text-stone-500 hover:text-white border border-stone-800 hover:border-stone-600 px-4 py-2 rounded-lg transition-colors"
                  >
                    Re-generate
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {view === 'live' && (
      <div className="flex flex-1 overflow-hidden">

        {/* Stage nav - left sidebar */}
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
                  ← Back
                </button>
              )}
              {currentStage < STAGES.length - 1 && (
                <button onClick={() => setCurrentStage(s => s + 1)} className="flex-1 text-xs text-[#10E1C2] py-1.5 rounded-lg border border-[#10E1C2]/30 hover:bg-[#10E1C2]/10 transition-colors">
                  Next →
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
                {(['prompts', 'signals', 'language'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-semibold px-3 py-2 capitalize border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? 'border-[#10E1C2] text-[#10E1C2]' : 'border-transparent text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tab === 'prompts' ? 'Prompts' : tab === 'signals' ? 'Signal Cheat Sheet' : 'Interpretation Language'}
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
                    <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                      <p className="text-white text-sm leading-relaxed">&ldquo;{p}&rdquo;</p>
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
                  {signals.map(({ key, level }) => {
                    const info = SIGNAL_LABELS[key]
                    const levelInfo = info.levels[level as 1 | 2 | 3]
                    return (
                      <div key={key} className={`border rounded-xl p-4 ${levelColour(level)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-bold uppercase tracking-wider">{info.label}</p>
                          <span className="text-xs font-bold">Level {level} — {levelInfo.label}</span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-80">{levelInfo.desc}</p>
                      </div>
                    )
                  })}
                  {comboPattern && (
                    <div className="bg-stone-900 border border-stone-700 rounded-xl p-4">
                      <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Combined Pattern</p>
                      <p className="text-stone-300 text-sm leading-relaxed">{comboPattern}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'language' && (
                <div className="space-y-4">
                  <p className="text-xs text-stone-500 mb-4">Pre-written interpretation language based on {leadName}&apos;s signal levels. Use naturally — not verbatim.</p>
                  {signals.map(({ key, level }) => (
                    <div key={key} className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">{SIGNAL_LABELS[key].label} — Level {level}</p>
                      <p className="text-stone-300 text-sm leading-relaxed italic">&ldquo;{PATTERN_LANGUAGE[key][level]}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Notes panel - right */}
          <div className="w-72 border-l border-white/10 flex flex-col">
            <div className="p-4 border-b border-white/10 flex items-center justify-between">
              <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold">Live Notes</p>
              <button
                onClick={saveNotes}
                className="text-xs text-[#10E1C2] hover:text-white transition-colors font-semibold"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Type observations as the call unfolds…"
              className="flex-1 bg-transparent text-stone-300 text-sm p-4 resize-none focus:outline-none placeholder-stone-700 leading-relaxed"
            />
            <div className="p-4 border-t border-white/10">
              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
                <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">Readiness Check</p>
                <div className="space-y-1.5 text-xs text-stone-500">
                  <p>A — Ready, wants to proceed</p>
                  <p>B — Interested but hesitant</p>
                  <p>C — Not ready / not right fit</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
