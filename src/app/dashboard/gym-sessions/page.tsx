'use client'

import { useState } from 'react'

const STATES = [
  {
    id: 'depleted',
    label: 'Depleted',
    score: '5 - 8',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    tagBg: 'rgba(239,68,68,0.12)',
    summary: 'Body in protection mode. Cortisol elevated. Metabolism suppressed. Pushing harder makes this worse.',
    consult: [
      'Their score tells you their body is in a state where it is actively resisting change. Not a willpower problem — a biology problem.',
      'When cortisol is chronically elevated, the body holds onto fat as a survival mechanism. More training and less food makes this state worse, not better.',
      'Today\'s session is going to feel lighter than what they\'re used to. That is the point — show them what appropriate stimulus looks like for where they\'re at.',
      'Cover: sleep quality, stress load, training history, what they have tried that is not working.',
    ],
    warmup: [
      '90/90 belly breathing on floor — 60 sec',
      'TRX assisted deep squat hold — 45 sec',
      'Cat-cow on floor — 60 sec',
      'Shoulder circles + arm swings — 45 sec',
    ],
    working: {
      structure: '3 rounds — controlled tempo throughout, no rush between sets',
      exercises: [
        { name: 'Leg press', detail: '10 reps — light load, 3 sec down. Machine removes stability demand.' },
        { name: 'Seated cable row', detail: '10 reps — scapular control, slow return' },
        { name: 'Lat pulldown', detail: '10 reps — full range, controlled' },
        { name: 'Med ball slam', detail: '6 reps — rhythmic, not explosive' },
        { name: 'BikeErg', detail: '60 sec @ RPE 4-5 — conversational pace' },
      ],
    },
    close: [
      'Child\'s pose — 60 sec',
      'Box breathing 4-4-4-4 — 4 rounds',
    ],
    handoff: 'Today\'s session was built for your state. That is the difference between a program that works and one that makes things worse. Your report goes deeper on exactly what is keeping you in this state.',
  },
  {
    id: 'transitioning',
    label: 'Transitioning',
    score: '9 - 11',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    tagBg: 'rgba(245,158,11,0.12)',
    summary: 'Mixed signals. Capacity exists but something is limiting the response — sleep, stress, or a load mismatch.',
    consult: [
      'Their score tells you the body has capacity but is not converting it consistently. Something is creating friction — usually sleep, stress load, or a mismatch between training intensity and recovery.',
      'They are close. But adding more input before identifying the bottleneck just creates more noise.',
      'Today\'s session puts them under a moderate load to watch how their body responds. You are looking for where output drops — that is their bottleneck.',
      'Cover: sleep consistency, stress sources, training frequency, nutrition timing.',
    ],
    warmup: [
      'Rower or BikeErg easy — 90 sec',
      'World\'s greatest stretch — 3 reps per side',
      'TRX face pull — 10 reps',
    ],
    working: {
      structure: 'Strength primer (2 rounds, not for time) then AMRAP 10 min',
      primer: [
        { name: 'Leg press', detail: '8 reps — moderate load' },
        { name: 'Lat pulldown', detail: '10 reps' },
      ],
      exercises: [
        { name: 'KB swing', detail: '12 reps' },
        { name: 'Box step-up', detail: '8 reps per leg' },
        { name: 'Cable face pull', detail: '12 reps' },
        { name: 'SkiErg', detail: '150m' },
      ],
      note: 'Note how many rounds completed — use this as the conversation starter for the handoff.',
    },
    close: [
      'Hip flexor stretch — 45 sec per side',
    ],
    handoff: 'You can see where your output dropped — that is your bottleneck. Your report maps out what is causing that specifically and what to address first.',
  },
  {
    id: 'ready',
    label: 'Ready',
    score: '12 - 15',
    color: '#14b8a6',
    bg: 'rgba(20,184,166,0.08)',
    border: 'rgba(20,184,166,0.25)',
    tagBg: 'rgba(20,184,166,0.12)',
    summary: 'Biology is primed. If fat loss or performance is not happening, the issue is in the prescription.',
    consult: [
      'Their score tells you their body is ready to respond. If fat loss or performance is not happening at this score, it is a prescription problem — training or nutrition is not matched to what their biology can do right now.',
      'They have the foundation. Today you are finding out how well their current approach is matched to their output capacity.',
      'You are going to push them today. Watch their output — you are measuring quality under fatigue.',
      'Cover: current training structure, progressive overload, nutrition strategy, results relative to effort.',
    ],
    warmup: [
      'Rower — 2 min building to 75%',
      'KB halo — 5 reps each direction',
      'Box jump or jump squat — 5 reps (activation)',
    ],
    working: {
      structure: '4 rounds — 35 sec rest between rounds',
      exercises: [
        { name: 'KB clean + press', detail: '5 reps per side' },
        { name: 'Med ball slam', detail: '8 reps — explosive, full reset each rep' },
        { name: 'Cable pull-through', detail: '12 reps' },
        { name: 'SkiErg', detail: '20 sec sprint' },
      ],
    },
    close: [
      'Walk + breathe down — 2 min',
    ],
    handoff: 'Your body responded well. That tells me the problem is not your biology — it is your program. Your report breaks down exactly what needs to change in your prescription.',
  },
]

export default function GymSessionsPage() {
  const [active, setActive] = useState('depleted')
  const state = STATES.find(s => s.id === active)!

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Gym Session Templates</h1>
        <p className="text-stone-400 text-sm">Complimentary session guide — select the member's body state to load the template.</p>
      </div>

      {/* State tabs */}
      <div className="flex gap-2 mb-8">
        {STATES.map(s => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            style={{
              borderColor: active === s.id ? s.border : undefined,
              color: active === s.id ? s.color : undefined,
              background: active === s.id ? s.bg : undefined,
            }}
            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
              active === s.id
                ? 'border-opacity-100'
                : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
          >
            <span className="block">{s.label}</span>
            <span className="block text-xs font-normal mt-0.5 opacity-70">{s.score}</span>
          </button>
        ))}
      </div>

      {/* Summary */}
      <div
        className="rounded-xl p-4 mb-6 border"
        style={{ background: state.bg, borderColor: state.border }}
      >
        <p className="text-sm font-medium" style={{ color: state.color }}>{state.summary}</p>
      </div>

      {/* Consult */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Consult — 10 min</p>
        </div>
        <div className="px-5 py-4 space-y-4">
          {state.consult.map((point, i) => (
            <div key={i} className="flex gap-3">
              <span
                className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mt-0.5"
                style={{ background: state.tagBg, color: state.color }}
              >
                {i + 1}
              </span>
              <p className="text-stone-300 text-sm leading-relaxed">{point}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Session */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Session — 20 min</p>
        </div>

        {/* Warm-up */}
        <div className="px-5 py-4 border-b border-stone-800/60">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Warm-up — 3 min</p>
          <div className="space-y-2">
            {state.warmup.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-stone-600 mt-2 shrink-0" />
                <p className="text-sm text-stone-300">{item}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Working */}
        <div className="px-5 py-4 border-b border-stone-800/60">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Working</p>
          <p className="text-xs text-stone-500 mb-4">{state.working.structure}</p>

          {'primer' in state.working && state.working.primer && (
            <div className="mb-4">
              <p className="text-xs font-medium text-stone-600 mb-2">Strength primer</p>
              <div className="space-y-2">
                {state.working.primer.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
                    <span className="text-sm font-semibold text-white shrink-0 w-36">{ex.name}</span>
                    <span className="text-sm text-stone-400">{ex.detail}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 mb-1">
                <p className="text-xs font-medium text-stone-600">AMRAP</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {state.working.exercises.map((ex, i) => (
              <div key={i} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-semibold text-white shrink-0 w-36">{ex.name}</span>
                <span className="text-sm text-stone-400">{ex.detail}</span>
              </div>
            ))}
          </div>

          {'note' in state.working && state.working.note && (
            <p className="text-xs text-stone-500 mt-3 italic">{state.working.note}</p>
          )}
        </div>

        {/* Close */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Close — 2 min</p>
          <div className="space-y-2">
            {state.close.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-1 h-1 rounded-full bg-stone-600 mt-2 shrink-0" />
                <p className="text-sm text-stone-300">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Handoff */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Handoff script</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-stone-300 leading-relaxed italic">"{state.handoff}"</p>
        </div>
      </div>
    </div>
  )
}
