'use client'

import { useState, useEffect, useRef } from 'react'

type BodyState = 'Depleted State' | 'Transitioning State' | 'Ready State'

const SECTION_LABELS: Record<string, string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress Load',
  '04': 'Training Response',
  '05': 'Fat Loss Response',
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

function buildStages(leadName: string, bodyState: string, totalScore: number | null, sectionScores: Record<string, number> | null) {
  const firstName = leadName.split(' ')[0]
  const stateInfo = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']

  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  return [
    {
      id: 1,
      name: 'Opening Frame',
      duration: '2-3 min',
      goal: 'Create safety and remove pressure. Establish this is not a sales call.',
      script: `"Thanks for jumping on today, ${firstName}.

The purpose of this conversation is to talk through what showed up in your scorecard and hear a bit more about what\'s actually been happening for you.

There\'s nothing you need to decide today. I just want to make sure the patterns the scorecard picked up actually match what you\'ve been experiencing."`,
      prompts: [
        { type: 'prompt', text: 'How did you find doing the scorecard?' },
        { type: 'prompt', text: 'Was it straightforward to answer?' },
        { type: 'prompt', text: 'Did anything make you stop and think?' },
      ],
      tips: 'Slow down. Let them land. The tone you set here carries the whole call.',
      boundary: null,
    },
    {
      id: 2,
      name: 'Scorecard Reflection',
      duration: '4-6 min',
      goal: 'Let them respond to their result before you interpret it. Their reaction is the signal.',
      script: `"Before I share anything, I want to hear your take first.

Your scorecard came back as ${bodyState}${scoreDisplay}. You\'ve had a chance to sit with that.

What was your reaction when you saw the result?"`,
      prompts: [
        { type: 'prompt', text: 'What stood out to you most when you saw your result?' },
        { type: 'prompt', text: 'Did it feel accurate to where you\'re at right now?' },
        { type: 'prompt', text: 'Was there anything that surprised you, or anything that didn\'t land?' },
        { type: 'prompt', text: 'Had you considered any of those areas as a factor before?' },
      ],
      tips: 'Do not explain the result first. Their reaction surfaces the real friction point. The strongest insight usually appears here.',
      boundary: null,
    },
    {
      id: 3,
      name: 'Context Exploration',
      duration: '10-12 min',
      goal: 'Understand the real picture behind the section scores. The scorecard gives the signal — the conversation gives the context.',
      script: `"What I want to do now is get a clearer picture of what\'s actually been going on — because the scorecard shows the pattern, but it doesn\'t know the context behind it.

I\'m going to ask you a few questions. Just answer as openly as you can."`,
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
      ],
      tips: 'Ask one question at a time. Let silence do work. You\'re building context — not solving anything yet.',
      boundary: 'No prescriptions. No "you should try...". No training or nutrition advice. Just listening and clarifying.',
    },
    {
      id: 4,
      name: 'Pattern Interpretation',
      duration: '5-7 min',
      goal: 'Name the pattern clearly. Clarity — not solution. Make it feel understandable, not alarming.',
      script: `"Based on what you\'ve just described and what showed up in the scorecard, here\'s what I\'m hearing.

${stateInfo.interpretation}

That\'s not a personal failing — it\'s a system response. And it\'s one of the more common patterns we see."`,
      prompts: [
        { type: 'prompt', text: 'Does that explanation feel like it reflects what you\'ve been experiencing?' },
        { type: 'prompt', text: 'Does it help make sense of what you\'ve noticed?' },
        { type: 'prompt', text: 'Did anything in that surprise you?' },
        { type: 'prompt', text: 'Has it changed the way you\'re thinking about it?' },
      ],
      tips: 'Keep it observational. The goal is to make the pattern feel understandable — not alarming, not overwhelming.',
      boundary: 'No medical interpretation. No outcome promises. No training adjustments. Pattern identification only.',
    },
    {
      id: 5,
      name: 'Next Step Invitation',
      duration: '2-3 min',
      goal: 'Offer deeper exploration without pressure. Intellectual curiosity, not pitch.',
      script: `"What we\'ve covered today is essentially the surface layer of the pattern.

If you wanted to explore it more deeply, the next step is to look at how the Body Recode coaching process would actually work for your situation specifically. We can walk through that now if you\'re open to it.

There\'s no obligation. It\'s just a more detailed look at what the system would do with your pattern."

Then ask: "Would you like to walk through that now?"

──────────────────────────────────────

IF YES → Move into the pricing and decision stages within this same call. The funnel is single-call now.

──────────────────────────────────────

IF NO → Use this close:

"Completely understood. These things only work when the timing is right for you, not when they fit someone else\'s timeline.

The patterns we talked through today don\'t go anywhere. If anything shifts, whether that\'s in a few weeks or further down the track, the conversation is still here.

I\'ll send you a quick email after this just to close the loop. No pressure, no follow-up after that unless you reach out."

Then use the "Send declined follow-up" button in the panel on the right.`,
      prompts: [
        { type: 'prompt', text: 'Would you like to walk through that now?' },
        { type: 'prompt', text: 'Would it be helpful to see how the coaching process works?' },
        { type: 'prompt', text: 'Are you open to walking through the Body Recode approach?' },
      ],
      tips: 'Don\'t oversell. Don\'t rush. If they\'re not ready, that\'s valid information. If they say yes, transition straight into the pricing and decision stages within this same call. If no, close warmly and trigger the declined sequence.',
      boundary: null,
    },
  ]
}

type Prompt = { type: 'prompt' | 'sub' | 'category'; text: string }

interface ZoomCompanionProps {
  leadName: string
  bodyState: string
  totalScore: number | null
  sectionScores: Record<string, number> | null
  leadId: string
  initialNotes: string
}

export default function ZoomCompanion({
  leadName,
  bodyState,
  totalScore,
  sectionScores,
  leadId,
  initialNotes,
}: ZoomCompanionProps) {
  const [currentStage, setCurrentStage] = useState(0)
  const [seconds, setSeconds] = useState(0)
  const [running, setRunning] = useState(false)
  const [notes, setNotes] = useState(initialNotes)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'prompts' | 'scorecard' | 'language'>('prompts')
  const [view, setView] = useState<'live' | 'postcall'>('live')
  const [transcript, setTranscript] = useState('')
  const [summary, setSummary] = useState('')
  const [generating, setGenerating] = useState(false)
  const [savingSummary, setSavingSummary] = useState(false)
  const [summarySaved, setSummarySaved] = useState(false)
  const [statusUpdated, setStatusUpdated] = useState(false)
  const [declinedSent, setDeclinedSent] = useState(false)
  const [sendingDeclined, setSendingDeclined] = useState(false)
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

  const sectionColour = (score: number) =>
    score === 1 ? 'text-red-400 border-red-400/30 bg-red-400/10'
    : score === 2 ? 'text-amber-400 border-amber-400/30 bg-amber-400/10'
    : 'text-teal-400 border-teal-400/30 bg-teal-400/10'

  const sectionDot = (score: number) =>
    score === 1 ? 'bg-red-400' : score === 2 ? 'bg-amber-400' : 'bg-teal-400'

  const generateSummary = async () => {
    if (!transcript.trim()) return
    setGenerating(true)
    const res = await fetch(`/api/leads/${leadId}/zoom-summary`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, memberName: leadName, bodyState, totalScore, sectionScores }),
    })
    const data = await res.json()
    setSummary(data.summary ?? '')
    setGenerating(false)
  }

  const saveSummaryToNotes = async () => {
    if (!summary) return
    setSavingSummary(true)
    const combined = notes ? `${notes}\n\n--- Zoom 1 AI Summary ---\n${summary}` : `--- Zoom 1 AI Summary ---\n${summary}`
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: combined }),
    })
    setNotes(combined)
    setSavingSummary(false)
    setSummarySaved(true)
    setTimeout(() => setSummarySaved(false), 3000)
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

  const markZoom1Complete = async () => {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'zoom_1_completed' }),
    })
    setStatusUpdated(true)
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

  const sectionEntries = sectionScores
    ? Object.entries(sectionScores).sort(([a], [b]) => a.localeCompare(b))
    : null

  function renderPrompt(p: Prompt, i: number) {
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
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">

      {/* Top bar */}
      <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-stone-500 uppercase tracking-widest font-semibold mb-0.5">Zoom 1 - Companion</p>
            <p className="text-lg font-bold text-white">{leadName}</p>
          </div>
          {/* Body state + score */}
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${stateInfo.colour}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${stateInfo.badge}`} />
              {bodyState}
            </div>
            {totalScore && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border border-stone-700 text-stone-400">
                {totalScore} / 15
              </div>
            )}
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
                  placeholder="Paste your Zoom transcript here..."
                  className="w-full h-72 bg-stone-900 border border-stone-800 rounded-xl p-4 text-stone-300 text-sm leading-relaxed resize-none focus:outline-none focus:border-stone-600 placeholder-stone-700"
                />
                <button
                  onClick={generateSummary}
                  disabled={!transcript.trim() || generating}
                  className="bg-[#10E1C2] text-black font-bold px-6 py-3 rounded-lg text-sm hover:bg-[#0ecfb2] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {generating ? 'Generating summary...' : 'Generate Summary'}
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
                    onClick={saveSummaryToNotes}
                    disabled={savingSummary || summarySaved}
                    className="bg-[#10E1C2] text-black font-bold px-5 py-2.5 rounded-lg text-sm hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
                  >
                    {summarySaved ? 'Saved to notes' : savingSummary ? 'Saving...' : 'Save to lead notes'}
                  </button>
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
                {(['prompts', 'scorecard', 'language'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-xs font-semibold px-3 py-2 capitalize border-b-2 -mb-px transition-colors ${
                      activeTab === tab ? 'border-[#10E1C2] text-[#10E1C2]' : 'border-transparent text-stone-500 hover:text-stone-300'
                    }`}
                  >
                    {tab === 'prompts' ? 'Prompts' : tab === 'scorecard' ? 'Scorecard Breakdown' : 'Interpretation Language'}
                  </button>
                ))}
              </div>

              {activeTab === 'prompts' && (
                <div className="space-y-2">
                  {stage.script && (
                    <div className="bg-[#10E1C2]/5 border border-[#10E1C2]/30 rounded-xl p-5 mb-4">
                      <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-3">Script</p>
                      <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
                    </div>
                  )}
                  {(stage.prompts as Prompt[]).map((p, i) => renderPrompt(p, i))}
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

              {activeTab === 'scorecard' && (
                <div className="space-y-3">
                  {/* Body state summary */}
                  <div className={`border rounded-xl p-4 ${stateInfo.colour}`}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold uppercase tracking-wider">{bodyState}</p>
                      {totalScore && <span className="text-xs font-bold">{totalScore} / 15</span>}
                    </div>
                    <p className="text-sm leading-relaxed opacity-80">{stateInfo.opening}</p>
                  </div>

                  {/* Section scores */}
                  {sectionEntries ? sectionEntries.map(([key, score]) => (
                    <div key={key} className={`border rounded-xl p-4 ${sectionColour(score)}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${sectionDot(score)}`} />
                          <p className="text-xs font-bold uppercase tracking-wider">{SECTION_LABELS[key] ?? key}</p>
                        </div>
                        <span className="text-xs font-bold">{score} / 3</span>
                      </div>
                      <p className="text-sm leading-relaxed opacity-80">{SECTION_INTERPRETATIONS[key]?.[score] ?? ''}</p>
                    </div>
                  )) : (
                    <p className="text-stone-500 text-sm">Section scores not available — lead may not have purchased the Body Decode Report. Body state and total score are pulled from the scorecard event.</p>
                  )}
                </div>
              )}

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
                  {sectionEntries && sectionEntries.filter(([, s]) => s === 1).length > 0 && (
                    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
                      <p className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-3">Low Section Language</p>
                      <div className="space-y-3">
                        {sectionEntries.filter(([, s]) => s === 1).map(([key]) => (
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

              {/* Readiness Check */}
              <div className="bg-stone-900 border border-stone-800 rounded-lg p-3">
                <p className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">Readiness</p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-[10px] font-bold text-emerald-400">A</span>
                    <span className="text-xs text-stone-400">Ready, wants to proceed</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[10px] font-bold text-amber-400">B</span>
                    <span className="text-xs text-stone-400">Interested but hesitant</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-[10px] font-bold text-red-400">C</span>
                    <span className="text-xs text-stone-400">Not ready / not right fit</span>
                  </div>
                </div>
              </div>

              {/* Mark complete */}
              <button
                onClick={markZoom1Complete}
                disabled={statusUpdated}
                className={`w-full text-xs font-bold px-3 py-2 rounded-lg transition-colors ${statusUpdated ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-stone-800 border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white'}`}
              >
                {statusUpdated ? 'Zoom 1 Marked Complete' : 'Mark Zoom 1 Complete'}
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
                  Sends 3-email re-engagement sequence + $97 self-guided program offer automatically
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
