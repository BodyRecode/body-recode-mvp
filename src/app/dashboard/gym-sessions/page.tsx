'use client'

import { useState } from 'react'

const PROGRAM_TYPES = [
  { id: 'machines', label: 'Machines & Weights' },
  { id: 'functional', label: 'Functional' },
  { id: 'mixed', label: 'Mixed' },
]

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
    consult: {
      opening: '"Good to meet you [name]. Amie put us in touch — before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far to try to get there? What has and hasn\'t been working?"',
      ],
      results: [
        '"So your scorecard came back at [score]/15 — that puts you in what I call a Depleted state."',
        '"What that means is your body is currently in protection mode. It is under more physiological stress than it can recover from. Cortisol is likely elevated, metabolism is suppressed, and your biology is actively resisting fat loss and performance gains right now."',
        '"The reason most people in this state do not see results is because they do what seems logical — train harder, eat less. But those are the wrong inputs for this state. Your body reads that as more stress and doubles down on holding onto fat."',
      ],
      whyWeTrainLikeThis: [
        '"So today\'s session is going to look different to what you might expect. The intensity is low and the load is light. That is deliberate."',
        '"I am not taking it easy on you — I am giving your body the right stimulus for its current state. High intensity right now would push cortisol higher and make things worse, not better."',
      ],
      afterToday: [
        '"When you leave today, the most important thing you can do is protect your recovery."',
        '"Sleep — 7 to 8 hours minimum, consistent wake times. That is non-negotiable for this state."',
        '"If you are currently training 5 or more days a week, pull it back. More training is not the answer right now."',
        '"Eat enough. Undereating is one of the fastest ways to deepen this state. We need to bring your body out of protection mode before we can push it."',
      ],
    },
    warmup: [
      '90/90 belly breathing on floor — 60 sec',
      'TRX assisted deep squat hold — 45 sec',
      'Cat-cow on floor — 60 sec',
      'Shoulder circles + arm swings — 45 sec',
    ],
    close: ['Child\'s pose — 60 sec', 'Box breathing 4-4-4-4 — 4 rounds'],
    handoff: 'What we did today is the starting point. The session was built around your state — that is exactly how a program works too. Everything is matched to where your body is at and adjusted as it changes. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: '3 rounds — light load, 3 sec down on every rep, no rush between sets',
        exercises: [
          { name: 'Leg press', detail: '10 reps — light load, 3 sec descent' },
          { name: 'Seated cable row', detail: '10 reps — scapular control, slow return' },
          { name: 'Chest press machine', detail: '10 reps — controlled tempo' },
          { name: 'Leg curl', detail: '10 reps — slow and controlled' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5 — conversational pace' },
        ],
      },
      functional: {
        structure: '3 rounds — low intensity throughout, quality over output',
        exercises: [
          { name: 'TRX assisted squat', detail: '8 reps — slow descent, use the suspension for support' },
          { name: 'TRX row', detail: '10 reps — scapular control focus' },
          { name: 'KB goblet squat', detail: '8 reps — light, 3 sec down' },
          { name: 'Med ball slam', detail: '6 reps — rhythmic, not explosive' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5 — conversational pace' },
        ],
      },
      mixed: {
        structure: '3 rounds — controlled tempo throughout, machines and functional combined',
        exercises: [
          { name: 'Leg press', detail: '10 reps — light load, 3 sec descent' },
          { name: 'TRX row', detail: '10 reps — scapular control' },
          { name: 'KB goblet squat', detail: '8 reps — light, controlled' },
          { name: 'Med ball slam', detail: '6 reps — rhythmic, not explosive' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5 — conversational pace' },
        ],
      },
    },
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
    consult: {
      opening: '"Good to meet you [name]. Amie put us in touch — before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far? What has and hasn\'t been working?"',
      ],
      results: [
        '"Your scorecard came back at [score]/15 — that puts you in what I call a Transitioning state."',
        '"What that tells me is your body has capacity but something is creating friction. You are getting inconsistent results because one specific thing is limiting your response right now — usually sleep consistency, stress load, or a mismatch between how hard you are training and how well you are recovering."',
        '"You are close. But adding more input before we identify that bottleneck just creates more noise."',
      ],
      whyWeTrainLikeThis: [
        '"Today I want to put you under a moderate load and watch how your body responds. I am looking for where your output drops — that drop point is your bottleneck."',
        '"Once we identify it, we know exactly what to fix first. Everything else follows from that."',
      ],
      afterToday: [
        '"When you leave today, I want you to think about what broke down during the session — that is the area to focus on."',
        '"Most people in your state have one specific thing holding everything else back. It is usually sleep consistency or training load. Fix that one thing and you will start seeing results move."',
        '"Do not add more training right now. The answer is not more — it is better matched."',
      ],
    },
    warmup: [
      'Rower or BikeErg easy — 90 sec',
      'World\'s greatest stretch — 3 reps per side',
      'TRX face pull — 10 reps',
    ],
    close: ['Hip flexor stretch — 45 sec per side'],
    handoff: 'What we did today is the starting point. You saw where your output dropped — that is your bottleneck. A program built around your state addresses that specifically and adjusts as it changes. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: 'Strength primer — 2 rounds (not for time), then AMRAP 10 min',
        primer: [
          { name: 'Leg press', detail: '8 reps — moderate load' },
          { name: 'Lat pulldown', detail: '10 reps' },
          { name: 'Seated cable row', detail: '10 reps' },
        ],
        exercises: [
          { name: 'Leg press', detail: '8 reps — moderate' },
          { name: 'Chest press machine', detail: '10 reps' },
          { name: 'Cable face pull', detail: '12 reps' },
          { name: 'Rower', detail: '200m' },
        ],
        note: 'Note how many rounds completed — use this in the handoff conversation.',
      },
      functional: {
        structure: 'Strength primer — 2 rounds (not for time), then AMRAP 10 min',
        primer: [
          { name: 'KB deadlift', detail: '8 reps — moderate load' },
          { name: 'TRX row', detail: '10 reps' },
        ],
        exercises: [
          { name: 'KB swing', detail: '12 reps' },
          { name: 'Box step-up', detail: '8 reps per leg' },
          { name: 'Battle rope', detail: '20 sec' },
          { name: 'SkiErg', detail: '150m' },
        ],
        note: 'Note how many rounds completed — use this in the handoff conversation.',
      },
      mixed: {
        structure: 'Strength primer — 2 rounds (not for time), then AMRAP 10 min',
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
        note: 'Note how many rounds completed — use this in the handoff conversation.',
      },
    },
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
    consult: {
      opening: '"Good to meet you [name]. Amie put us in touch — before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far? What has and hasn\'t been working?"',
      ],
      results: [
        '"Your scorecard came back at [score]/15 — that puts you in what I call a Ready state."',
        '"What that tells me is your body is biologically primed to respond. Your recovery is solid, your stress load is manageable, and your biology is in a position to adapt."',
        '"If fat loss or performance is not happening at this score, it is a prescription problem — the training or nutrition you are using is not matched to what your body can actually do right now. That is fixable."',
      ],
      whyWeTrainLikeThis: [
        '"Today I am going to push you. We are looking at output quality under fatigue — that tells me how well your current approach is working and where the prescription needs to change."',
        '"Watch your output across the rounds. Where it drops, that is the data."',
      ],
      afterToday: [
        '"When you leave today, what you need to look at is your program structure — progressive overload, training intensity, and nutrition timing."',
        '"Your body is ready. It just needs the right prescription. That is exactly what we can work on together."',
        '"The report will give you a written breakdown of what Ready state means for your training and nutrition specifically — it is a good starting point."',
      ],
    },
    warmup: [
      'Rower — 2 min building to 75%',
      'KB halo — 5 reps each direction',
      'Box jump or jump squat — 5 reps (activation)',
    ],
    close: ['Walk + breathe down — 2 min'],
    handoff: 'What we did today is the starting point. Your body responded well — that tells me the problem is not your biology, it is your prescription. A program built around your state fixes that specifically and adjusts as you progress. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: '4 rounds — 35 sec rest between rounds, performance output focus',
        exercises: [
          { name: 'Leg press', detail: '8 reps — challenging load' },
          { name: 'Chest press machine', detail: '8 reps — strong effort' },
          { name: 'Cable pull-through', detail: '12 reps — hip hinge, control the return' },
          { name: 'Seated row', detail: '10 reps — explosive pull, slow return' },
          { name: 'Rower', detail: '30 sec sprint' },
        ],
      },
      functional: {
        structure: '4 rounds — 35 sec rest between rounds, maximum output quality',
        exercises: [
          { name: 'KB clean + press', detail: '5 reps per side' },
          { name: 'Med ball slam', detail: '8 reps — explosive, full reset each rep' },
          { name: 'Battle rope', detail: '20 sec — maximum effort' },
          { name: 'SkiErg', detail: '20 sec sprint' },
        ],
      },
      mixed: {
        structure: '4 rounds — 35 sec rest between rounds, push the output',
        exercises: [
          { name: 'KB clean + press', detail: '5 reps per side' },
          { name: 'Med ball slam', detail: '8 reps — explosive' },
          { name: 'Cable pull-through', detail: '12 reps' },
          { name: 'SkiErg', detail: '20 sec sprint' },
        ],
      },
    },
  },
]

type ProgramType = 'machines' | 'functional' | 'mixed'

export default function GymSessionsPage() {
  const [activeState, setActiveState] = useState('depleted')
  const [activeProgram, setActiveProgram] = useState<ProgramType>('machines')

  const state = STATES.find(s => s.id === activeState)!
  const program = state.programs[activeProgram]

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Gym Session Templates</h1>
        <p className="text-stone-400 text-sm">Select the member's body state and session type.</p>
      </div>

      {/* State tabs */}
      <div className="flex gap-2 mb-3">
        {STATES.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveState(s.id)}
            style={{
              borderColor: activeState === s.id ? s.border : undefined,
              color: activeState === s.id ? s.color : undefined,
              background: activeState === s.id ? s.bg : undefined,
            }}
            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
              activeState === s.id ? '' : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
          >
            <span className="block">{s.label}</span>
            <span className="block text-xs font-normal mt-0.5 opacity-70">{s.score}</span>
          </button>
        ))}
      </div>

      {/* Program type tabs */}
      <div className="flex gap-2 mb-6">
        {PROGRAM_TYPES.map(p => (
          <button
            key={p.id}
            onClick={() => setActiveProgram(p.id as ProgramType)}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
              activeProgram === p.id
                ? 'border-stone-500 text-white bg-stone-800'
                : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="rounded-xl p-4 mb-6 border" style={{ background: state.bg, borderColor: state.border }}>
        <p className="text-sm font-medium" style={{ color: state.color }}>{state.summary}</p>
      </div>

      {/* Consult */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Consult — 10 min</p>
        </div>
        <div className="divide-y divide-stone-800/60">

          {/* Opening */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Opening</p>
            <p className="text-sm text-stone-300 leading-relaxed italic">{state.consult.opening}</p>
          </div>

          {/* Goals */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Their Goals</p>
            <div className="space-y-2">
              {state.consult.goals.map((line, i) => (
                <p key={i} className="text-sm text-stone-300 leading-relaxed italic">{line}</p>
              ))}
            </div>
          </div>

          {/* Results */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Explain Their Results</p>
            <div className="space-y-2">
              {state.consult.results.map((line, i) => (
                <p key={i} className="text-sm text-stone-300 leading-relaxed italic">{line}</p>
              ))}
            </div>
          </div>

          {/* Why */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Why We Train Like This</p>
            <div className="space-y-2">
              {state.consult.whyWeTrainLikeThis.map((line, i) => (
                <p key={i} className="text-sm text-stone-300 leading-relaxed italic">{line}</p>
              ))}
            </div>
          </div>

          {/* After today */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">What To Do After Today</p>
            <div className="space-y-2">
              {state.consult.afterToday.map((line, i) => (
                <p key={i} className="text-sm text-stone-300 leading-relaxed italic">{line}</p>
              ))}
            </div>
          </div>

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
          <p className="text-xs text-stone-500 mb-4">{program.structure}</p>

          {'primer' in program && program.primer && (
            <div className="mb-4">
              <p className="text-xs font-medium text-stone-600 mb-2">Strength primer</p>
              <div className="space-y-2 mb-3">
                {program.primer.map((ex, i) => (
                  <div key={i} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
                    <span className="text-sm font-semibold text-white shrink-0 w-36">{ex.name}</span>
                    <span className="text-sm text-stone-400">{ex.detail}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs font-medium text-stone-600 mb-2">AMRAP</p>
            </div>
          )}

          <div className="space-y-2">
            {program.exercises.map((ex, i) => (
              <div key={i} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
                <span className="text-sm font-semibold text-white shrink-0 w-36">{ex.name}</span>
                <span className="text-sm text-stone-400">{ex.detail}</span>
              </div>
            ))}
          </div>

          {'note' in program && program.note && (
            <p className="text-xs text-stone-500 mt-3 italic">{program.note}</p>
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
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Handoff script</p>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-stone-300 leading-relaxed italic">"{state.handoff}"</p>
        </div>
      </div>

      {/* Next steps */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Next Steps</p>
        </div>
        <div className="divide-y divide-stone-800/60">
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20">Yes</span>
              <p className="text-xs font-semibold text-stone-400">They want to know more</p>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed">Book a Zoom on the spot or take their number and follow up same day. Do not leave it open-ended.</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-stone-700/50 text-stone-400 border border-stone-700">Not right now</span>
              <p className="text-xs font-semibold text-stone-400">Pivot to the report</p>
            </div>
            <p className="text-sm text-stone-300 leading-relaxed italic mb-2">"No problem — the scorecard report is a good next step. It covers everything we touched on today in detail. I will send you the link."</p>
            <p className="text-xs text-stone-500">The follow-up sequence has already sent the link to their inbox. You do not need to do anything.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
