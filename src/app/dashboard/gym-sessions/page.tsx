'use client'

import { useState } from 'react'
import { PageHeader, MONO_FONT } from '@/components/dashboard/ui'

const PROGRAM_TYPES = [
  { id: 'machines', label: 'Machines & Weights' },
  { id: 'functional', label: 'Functional' },
  { id: 'mixed', label: 'Mixed' },
]

type Exercise = { name: string; detail: string; cues: string[]; why: string }
type Program = { structure: string; primer?: Exercise[]; exercises: Exercise[]; note?: string }

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
      opening: '"Good to meet you [name]. Amie put us in touch - before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far to try to get there? What has and hasn\'t been working?"',
      ],
      results: [
        '"So your scorecard came back at [score]/15 - that puts you in what I call a Depleted state."',
        '"What that means is your body is currently in protection mode. It is under more physiological stress than it can recover from. Cortisol is likely elevated, metabolism is suppressed, and your biology is actively resisting fat loss and performance gains right now."',
        '"The reason most people in this state do not see results is because they do what seems logical - train harder, eat less. But those are the wrong inputs for this state. Your body reads that as more stress and doubles down on holding onto fat."',
      ],
      whyWeTrainLikeThis: [
        '"So today\'s session is going to look different to what you might expect. The intensity is low and the load is light. That is deliberate."',
        '"I am not taking it easy on you - I am giving your body the right stimulus for its current state. High intensity right now would push cortisol higher and make things worse, not better."',
      ],
      afterToday: [
        '"When you leave today, the most important thing you can do is protect your recovery."',
        '"Sleep - 7 to 8 hours minimum, consistent wake times. That is non-negotiable for this state."',
        '"If you are currently training 5 or more days a week, pull it back. More training is not the answer right now."',
        '"Eat enough. Undereating is one of the fastest ways to deepen this state. We need to bring your body out of protection mode before we can push it."',
      ],
    },
    warmup: [
      '90/90 belly breathing on floor - 60 sec',
      'TRX assisted deep squat hold - 45 sec',
      'Cat-cow on floor - 60 sec',
      'Shoulder circles + arm swings - 45 sec',
    ],
    close: ['Child\'s pose - 60 sec', 'Box breathing 4-4-4-4 - 4 rounds'],
    handoff: 'What we did today is the starting point. The session was built around your state - that is exactly how a program works too. Everything is matched to where your body is at and adjusted as it changes. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: '3 rounds - light load, 3 sec down on every rep, no rush between sets',
        exercises: [
          { name: 'Leg press', detail: '10 reps', cues: ['Feet hip-width, toes slightly out', '3 sec descent - control it', 'Press through the whole foot'], why: 'Machine removes the stability demand. Lower body stimulus without taxing the nervous system.' },
          { name: 'Seated cable row', detail: '10 reps', cues: ['Shoulder blades together first, then elbows', 'Slow return - don\'t let it yank you', 'Stay tall through the torso'], why: 'Upper back and scapular work in a fixed path. Keeps systemic stress low.' },
          { name: 'Chest press machine', detail: '10 reps', cues: ['Shoulders back and down before you press', 'Don\'t shrug at the top', '3 sec down'], why: 'Horizontal push in a fixed path. Pressing strength without CNS cost.' },
          { name: 'Leg curl', detail: '10 reps', cues: ['Hips stay flat on the pad', 'Curl to 90 degrees', '3 sec back down'], why: 'Hamstring isolation with no spinal loading. Complements the leg press pattern.' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5', cues: ['Upright posture', 'Pace you could hold a conversation at - no harder'], why: 'Low-impact aerobic work. Moves blood and increases circulation without spiking cortisol.' },
        ],
      } as Program,
      functional: {
        structure: '3 rounds - low intensity throughout, quality over output',
        exercises: [
          { name: 'TRX assisted squat', detail: '8 reps', cues: ['Hold the straps lightly - support not momentum', 'Sit back into the hips', 'Chest tall throughout'], why: 'TRX offloads bodyweight, reducing joint stress while still training the squat pattern.' },
          { name: 'TRX row', detail: '10 reps', cues: ['Body in a straight line - don\'t pike', 'Pull chest to hands', '1 sec pause at the top'], why: 'Horizontal pull with bodyweight. Zero spinal compression, adjustable to any level.' },
          { name: 'KB goblet squat', detail: '8 reps', cues: ['Bell at chest height', 'Elbows inside knees at the bottom', '3 sec controlled descent'], why: 'Front-loaded squat teaches upright torso and hip mobility with minimal load.' },
          { name: 'Med ball slam', detail: '6 reps', cues: ['Full overhead reach before every slam', 'Let the ball drop - don\'t force it', 'Full reset between reps - no rushing'], why: 'Rhythmic power expression. Non-explosive keeps cortisol from spiking.' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5', cues: ['Upright posture', 'Pace you could hold a conversation at - no harder'], why: 'Low-impact aerobic work. Moves blood without spiking cortisol.' },
        ],
      } as Program,
      mixed: {
        structure: '3 rounds - controlled tempo throughout',
        exercises: [
          { name: 'Leg press', detail: '10 reps', cues: ['Feet hip-width, toes slightly out', '3 sec descent', 'Press through the whole foot'], why: 'Machine removes stability demand. Lower body stimulus without taxing the nervous system.' },
          { name: 'TRX row', detail: '10 reps', cues: ['Body in a straight line', 'Pull chest to hands', '1 sec pause at the top'], why: 'Horizontal pull with zero spinal compression. Balances the pressing pattern.' },
          { name: 'KB goblet squat', detail: '8 reps', cues: ['Bell at chest height', 'Elbows inside knees at the bottom', '3 sec down'], why: 'Front-loaded squat builds positional awareness with a light load.' },
          { name: 'Med ball slam', detail: '6 reps', cues: ['Full overhead reach before every slam', 'Reset completely between reps'], why: 'Rhythmic power - non-explosive. Expresses force without cortisol spike.' },
          { name: 'BikeErg', detail: '60 sec @ RPE 4-5', cues: ['Upright posture', 'Conversational pace only'], why: 'Aerobic circulation without cortisol impact.' },
        ],
      } as Program,
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
    summary: 'Mixed signals. Capacity exists but something is limiting the response - sleep, stress, or a load mismatch.',
    consult: {
      opening: '"Good to meet you [name]. Amie put us in touch - before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far? What has and hasn\'t been working?"',
      ],
      results: [
        '"Your scorecard came back at [score]/15 - that puts you in what I call a Transitioning state."',
        '"What that tells me is your body has capacity but something is creating friction. You are getting inconsistent results because one specific thing is limiting your response right now - usually sleep consistency, stress load, or a mismatch between how hard you are training and how well you are recovering."',
        '"You are close. But adding more input before we identify that bottleneck just creates more noise."',
      ],
      whyWeTrainLikeThis: [
        '"Today I want to put you under a moderate load and watch how your body responds. I am looking for where your output drops - that drop point is your bottleneck."',
        '"Once we identify it, we know exactly what to fix first. Everything else follows from that."',
      ],
      afterToday: [
        '"When you leave today, I want you to think about what broke down during the session - that is the area to focus on."',
        '"Most people in your state have one specific thing holding everything else back. It is usually sleep consistency or training load. Fix that one thing and you will start seeing results move."',
        '"Do not add more training right now. The answer is not more - it is better matched."',
      ],
    },
    warmup: [
      'Rower or BikeErg easy - 90 sec',
      'World\'s greatest stretch - 3 reps per side',
      'TRX face pull - 10 reps',
    ],
    close: ['Hip flexor stretch - 45 sec per side'],
    handoff: 'What we did today is the starting point. You saw where your output dropped - that is your bottleneck. A program built around your state addresses that specifically and adjusts as it changes. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: 'Strength primer - 2 rounds (not for time), then AMRAP 10 min',
        primer: [
          { name: 'Leg press', detail: '8 reps', cues: ['Moderate load - working but not grinding', 'Full range every rep', 'Controlled descent'], why: 'Primes the nervous system for the AMRAP. Not for fatigue - just activation.' },
          { name: 'Lat pulldown', detail: '10 reps', cues: ['Elbows drive down and back', 'Pull to upper chest', 'Slow on the way up - don\'t let it yank you'], why: 'Vertical pull primer. Activates lats and upper back before the circuit.' },
          { name: 'Seated cable row', detail: '10 reps', cues: ['Chest tall', 'Drive elbows back past the torso', 'Pause at end range'], why: 'Horizontal pull to complement the lat pulldown. Full upper back primed.' },
        ],
        exercises: [
          { name: 'Leg press', detail: '8 reps', cues: ['Maintain full range - depth is your quality marker', 'Watch for pace dropping across rounds'], why: 'Lower body output marker. Range or pace drop tells you where fatigue is hitting first.' },
          { name: 'Chest press machine', detail: '10 reps', cues: ['Consistent tempo across every round', 'Note when pressing starts to feel significantly heavier'], why: 'Upper body push output. Decline across rounds shows recovery capacity.' },
          { name: 'Cable face pull', detail: '12 reps', cues: ['Pull to nose height', 'Elbows stay high', 'Thumbs back at end range'], why: 'Rear delt and upper back work. Keeps the circuit balanced and shoulder health in check.' },
          { name: 'Rower', detail: '200m', cues: ['Legs first, then lean, then arms', 'Hold a sustainable pace', 'Note if your split time drops across rounds'], why: 'Full body output marker. Pace degradation across rounds reveals the bottleneck.' },
        ],
        note: 'Note how many rounds completed - use this in the handoff conversation.',
      } as Program,
      functional: {
        structure: 'Strength primer - 2 rounds (not for time), then AMRAP 10 min',
        primer: [
          { name: 'KB deadlift', detail: '8 reps', cues: ['Push the floor away - don\'t pull the bell up', 'Squeeze glutes at the top', 'Bell stays close to the shins'], why: 'Posterior chain primer. Hip hinge activation before the AMRAP.' },
          { name: 'TRX row', detail: '10 reps', cues: ['Body straight', 'Pull chest to hands', 'Squeeze at the top'], why: 'Upper back primer. Gets pulling muscles firing before the circuit.' },
        ],
        exercises: [
          { name: 'KB swing', detail: '12 reps', cues: ['Hinge - not a squat', 'Drive through the hips - not the arms', 'Let the bell float to shoulder height'], why: 'Hip power output. Watch for the hinge pattern breaking down as fatigue builds - that is the bottleneck signal.' },
          { name: 'Box step-up', detail: '8 reps per leg', cues: ['Drive through the heel of the working leg', 'Don\'t push off the back foot', 'Controlled step down'], why: 'Single leg strength output. Asymmetry in quality across rounds reveals a weakness.' },
          { name: 'Battle rope', detail: '20 sec', cues: ['Soft knees, slight hip hinge', 'Full arm range on each wave', 'Consistent rhythm - don\'t die at 10 sec'], why: 'Upper body and conditioning output. Fade in power across rounds reveals aerobic ceiling.' },
          { name: 'SkiErg', detail: '150m', cues: ['Hinge at the hips as you pull', 'Full extension overhead between reps', 'Note your time across rounds'], why: 'Full body pulling output. Time degradation across rounds shows aerobic capacity limits.' },
        ],
        note: 'Note how many rounds completed - use this in the handoff conversation.',
      } as Program,
      mixed: {
        structure: 'Strength primer - 2 rounds (not for time), then AMRAP 10 min',
        primer: [
          { name: 'Leg press', detail: '8 reps', cues: ['Moderate load - working but not grinding', 'Full range every rep'], why: 'Primes the nervous system for the AMRAP. Not for fatigue - just activation.' },
          { name: 'Lat pulldown', detail: '10 reps', cues: ['Elbows drive down and back', 'Slow on the way up'], why: 'Vertical pull primer. Activates lats and upper back.' },
        ],
        exercises: [
          { name: 'KB swing', detail: '12 reps', cues: ['Hinge - not a squat', 'Drive through the hips', 'Let the bell float to shoulder height'], why: 'Hip power output marker. Pattern breakdown signals the bottleneck.' },
          { name: 'Box step-up', detail: '8 reps per leg', cues: ['Drive through the heel of the working leg', 'Don\'t push off the back foot'], why: 'Single leg strength output. Asymmetry across rounds reveals a weakness.' },
          { name: 'Cable face pull', detail: '12 reps', cues: ['Pull to nose height', 'Elbows high', 'Thumbs back at end range'], why: 'Rear delt and upper back. Balances the circuit and keeps shoulders healthy.' },
          { name: 'SkiErg', detail: '150m', cues: ['Hinge at the hips as you pull', 'Full overhead extension between reps'], why: 'Full body pulling output. Time across rounds reveals aerobic capacity.' },
        ],
        note: 'Note how many rounds completed - use this in the handoff conversation.',
      } as Program,
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
      opening: '"Good to meet you [name]. Amie put us in touch - before we get into anything I just want to sit down for a few minutes and get a clear picture of where you\'re at."',
      goals: [
        '"What are you actually trying to achieve? What does success look like for you over the next few months?"',
        '[Listen, acknowledge. Then:] "And what have you been doing so far? What has and hasn\'t been working?"',
      ],
      results: [
        '"Your scorecard came back at [score]/15 - that puts you in what I call a Ready state."',
        '"What that tells me is your body is biologically primed to respond. Your recovery is solid, your stress load is manageable, and your biology is in a position to adapt."',
        '"If fat loss or performance is not happening at this score, it is a prescription problem - the training or nutrition you are using is not matched to what your body can actually do right now. That is fixable."',
      ],
      whyWeTrainLikeThis: [
        '"Today I am going to push you. We are looking at output quality under fatigue - that tells me how well your current approach is working and where the prescription needs to change."',
        '"Watch your output across the rounds. Where it drops, that is the data."',
      ],
      afterToday: [
        '"When you leave today, what you need to look at is your program structure - progressive overload, training intensity, and nutrition timing."',
        '"Your body is ready. It just needs the right prescription. That is exactly what we can work on together."',
        '"The report will give you a written breakdown of what Ready state means for your training and nutrition specifically - it is a good starting point."',
      ],
    },
    warmup: [
      'Rower - 2 min building to 75%',
      'KB halo - 5 reps each direction',
      'Box jump or jump squat - 5 reps (activation)',
    ],
    close: ['Walk + breathe down - 2 min'],
    handoff: 'What we did today is the starting point. Your body responded well - that tells me the problem is not your biology, it is your prescription. A program built around your state fixes that specifically and adjusts as you progress. If you want to keep that going, that is what the coaching is. Want to set up a proper conversation about it?',
    programs: {
      machines: {
        structure: '4 rounds - 35 sec rest between rounds, performance output focus',
        exercises: [
          { name: 'Leg press', detail: '8 reps', cues: ['Challenging load - you should be working hard', 'Full range every rep', 'Note when depth starts to drop - that is fatigue'], why: 'Heavy lower body stimulus. Output quality across 4 rounds shows your current strength-endurance capacity.' },
          { name: 'Chest press machine', detail: '8 reps', cues: ['Shoulders back before every set', 'Press with intent - no grinding', 'If it significantly slows, stop the set and note the round'], why: 'Upper body push under load. Decline across rounds shows a prescription mismatch.' },
          { name: 'Cable pull-through', detail: '12 reps', cues: ['Hinge back into the cable', 'Drive hips forward to stand - not a back extension', 'Control the return slowly'], why: 'Hip hinge under tension with no spinal compression. Keeps the posterior chain in the circuit.' },
          { name: 'Seated row', detail: '10 reps', cues: ['Explosive pull', '3 sec controlled return', 'Drive elbows hard past your torso'], why: 'Upper back power output. Explosive intent tests rate of force development.' },
          { name: 'Rower', detail: '30 sec sprint', cues: ['All-out effort', 'Note your distance each round - look for drops'], why: 'Full body power output marker. Distance per round tells you how well you are recovering between rounds.' },
        ],
      } as Program,
      functional: {
        structure: '4 rounds - 35 sec rest between rounds, maximum output quality',
        exercises: [
          { name: 'KB clean + press', detail: '5 reps per side', cues: ['Clean from the hip - don\'t curl it', 'Punch palm to ceiling at the top', 'Reset fully at the bottom each rep'], why: 'Full body power and overhead strength. Complex movement that shows coordination under fatigue.' },
          { name: 'Med ball slam', detail: '8 reps', cues: ['Full overhead extension before every slam', 'Whole body drives the slam - not just arms', 'Complete reset between reps - quality over speed'], why: 'Explosive power output. Fade in force across rounds shows energy system limits.' },
          { name: 'Battle rope', detail: '20 sec sprint', cues: ['Athletic position - soft knees, slight hinge', 'Full arm range on each wave', 'Max effort for the full 20 sec'], why: 'Upper body power and conditioning. Tests repeated power output under fatigue.' },
          { name: 'SkiErg', detail: '20 sec sprint', cues: ['Max effort', 'Full overhead extension between reps', 'Note your distance each round'], why: 'Full body pulling power. Distance across 4 rounds reveals your aerobic ceiling.' },
        ],
      } as Program,
      mixed: {
        structure: '4 rounds - 35 sec rest between rounds, push the output',
        exercises: [
          { name: 'KB clean + press', detail: '5 reps per side', cues: ['Clean from the hip - don\'t curl it', 'Punch palm to ceiling at the top', 'Reset fully at the bottom'], why: 'Full body power and overhead strength. Coordination under fatigue is the marker.' },
          { name: 'Med ball slam', detail: '8 reps', cues: ['Full overhead extension before every slam', 'Whole body drives it - not just arms', 'Complete reset between reps'], why: 'Explosive power output. Force fade across rounds shows energy system limits.' },
          { name: 'Cable pull-through', detail: '12 reps', cues: ['Hinge back into the cable', 'Drive hips forward to stand', 'Slow controlled return'], why: 'Hip hinge under tension with no spinal compression. Posterior chain stays in the circuit.' },
          { name: 'SkiErg', detail: '20 sec sprint', cues: ['Max effort', 'Full overhead extension between reps', 'Note distance each round'], why: 'Full body pulling power output. Distance across 4 rounds reveals the aerobic ceiling.' },
        ],
      } as Program,
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
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Templates"
        title="Gym Session Templates"
        subtitle="Select the member's body state and session type."
      />

      {/* State tabs */}
      <div className="flex gap-2 mb-3">
        {STATES.map(s => {
          const active = activeState === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveState(s.id)}
              style={active ? { borderColor: s.border, color: s.color, background: s.bg } : undefined}
              className={`flex-1 py-3 px-4 rounded-xl border text-[13px] font-semibold transition-colors ${
                active ? '' : 'border-[#1c1917] bg-[#111110] text-[#a8a29e] hover:text-white hover:border-[#292524]'
              }`}
            >
              <span className="block">{s.label}</span>
              <span
                className="block text-[10px] font-normal mt-0.5 opacity-70"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em' }}
              >
                {s.score}
              </span>
            </button>
          )
        })}
      </div>

      {/* Program type tabs */}
      <div className="flex gap-2 mb-6">
        {PROGRAM_TYPES.map(p => {
          const active = activeProgram === p.id
          return (
            <button
              key={p.id}
              onClick={() => setActiveProgram(p.id as ProgramType)}
              className={`flex-1 py-2 px-3 rounded-lg border text-[11px] font-semibold transition-colors ${
                active
                  ? 'border-[#292524] text-white bg-[#1c1917]'
                  : 'border-[#1c1917] bg-[#111110] text-[#a8a29e] hover:text-white hover:border-[#292524]'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-2xl p-4 mb-6 border" style={{ background: state.bg, borderColor: state.border }}>
        <p className="text-[14px] font-medium leading-relaxed" style={{ color: state.color }}>{state.summary}</p>
      </div>

      {/* Consult */}
      <ScriptCard label={`Consult - 10 min · ${state.label}`}>
        <ScriptSection label="Opening">
          <ScriptLine>{state.consult.opening}</ScriptLine>
        </ScriptSection>
        <ScriptSection label="Their Goals">
          {state.consult.goals.map((line, i) => <ScriptLine key={i}>{line}</ScriptLine>)}
        </ScriptSection>
        <ScriptSection label="Explain Their Results">
          {state.consult.results.map((line, i) => <ScriptLine key={i}>{line}</ScriptLine>)}
        </ScriptSection>
        <ScriptSection label="Why We Train Like This">
          {state.consult.whyWeTrainLikeThis.map((line, i) => <ScriptLine key={i}>{line}</ScriptLine>)}
        </ScriptSection>
        <ScriptSection label="What To Do After Today">
          {state.consult.afterToday.map((line, i) => <ScriptLine key={i}>{line}</ScriptLine>)}
        </ScriptSection>
      </ScriptCard>

      {/* Session */}
      <ScriptCard label="Session - 20 min">
        <ScriptSection label="Warm-up - 3 min">
          {state.warmup.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#57534e] mt-2 shrink-0" />
              <p className="text-[14px] text-[#d4cfc9]">{item}</p>
            </div>
          ))}
        </ScriptSection>
        <ScriptSection label="Working" sublabel={program.structure}>
          {program.primer && (
            <div className="mb-2">
              <p
                className="text-[10px] font-medium text-[#57534e] uppercase mb-2"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
              >
                Strength primer
              </p>
              <div className="space-y-2 mb-4">
                {program.primer.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}
              </div>
              <p
                className="text-[10px] font-medium text-[#57534e] uppercase mb-2"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.1em' }}
              >
                AMRAP
              </p>
            </div>
          )}
          <div className="space-y-2">
            {program.exercises.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}
          </div>
          {program.note && (
            <p className="text-[12px] text-[#57534e] mt-3 italic">{program.note}</p>
          )}
        </ScriptSection>
        <ScriptSection label="Close - 2 min">
          {state.close.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#57534e] mt-2 shrink-0" />
              <p className="text-[14px] text-[#d4cfc9]">{item}</p>
            </div>
          ))}
        </ScriptSection>
      </ScriptCard>

      {/* Handoff */}
      <ScriptCard label="Handoff script">
        <div className="px-5 py-4">
          <p className="text-[14px] text-[#d4cfc9] leading-relaxed italic">"{state.handoff}"</p>
        </div>
      </ScriptCard>

      {/* Next steps */}
      <ScriptCard label="Next Steps">
        <div className="px-5 py-4 border-b border-[#1c1917]">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[rgba(20,184,166,0.12)] text-[#14b8a6] border border-[#0d2d29] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Yes
            </span>
            <p
              className="text-[10px] font-bold text-[#a8a29e] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              They want to know more
            </p>
          </div>
          <p className="text-[14px] text-[#d4cfc9] leading-relaxed mb-3">Book a Zoom on the spot or take their number and follow up same day. Do not leave it open-ended.</p>
          <a
            href="https://bodyrecode.au/book"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#14b8a6] hover:bg-[#5eead4] text-[#0c0a09] text-[13px] font-bold px-4 py-2 rounded-lg transition-colors"
          >
            Book a call
          </a>
        </div>
        <div className="px-5 py-4 border-b border-[#1c1917]">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0c0a09] text-[#a8a29e] border border-[#1c1917] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Not right now
            </span>
            <p
              className="text-[10px] font-bold text-[#a8a29e] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              Pivot to the report
            </p>
          </div>
          <p className="text-[14px] text-[#d4cfc9] leading-relaxed italic mb-2">"No problem - the scorecard report is a good next step. It covers everything we touched on today in detail. Keep an eye on your inbox."</p>
          <p className="text-[12px] text-[#57534e]">The follow-up sequence has already sent the link. Day 2 email is a dedicated report offer - you do not need to do anything.</p>
        </div>
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#0c0a09] text-[#a8a29e] border border-[#1c1917] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
            >
              Close
            </span>
            <p
              className="text-[10px] font-bold text-[#a8a29e] uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
            >
              Wrap up
            </p>
          </div>
          <p className="text-[14px] text-[#d4cfc9] leading-relaxed italic">"Really good to meet you [name]. I enjoyed that - you worked hard today. Whatever you decide to do next, you have got something useful out of today. Check your inbox, have a read through the results, and if anything comes up just reach out. Take care of yourself."</p>
        </div>
      </ScriptCard>
    </div>
  )
}

function ScriptCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-2xl overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#1c1917]">
        <span className="w-7 h-[3px] rounded-full bg-[#14b8a6] shrink-0" />
        <p
          className="text-[10px] font-bold text-white uppercase"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          {label}
        </p>
      </div>
      <div className="divide-y divide-[#1c1917]">{children}</div>
    </div>
  )
}

function ScriptSection({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p
        className="text-[10px] font-bold text-[#57534e] uppercase mb-2"
        style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
      >
        {label}
      </p>
      {sublabel && <p className="text-[12px] text-[#57534e] mb-3">{sublabel}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ScriptLine({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-[#d4cfc9] leading-relaxed italic">{children}</p>
}

function ExerciseCard({ ex }: { ex: Exercise }) {
  return (
    <div className="bg-[#0c0a09] border border-[#1c1917] rounded-xl px-3 py-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[14px] font-semibold text-white">{ex.name}</span>
        <span
          className="text-[11px] text-[#a8a29e] shrink-0"
          style={{ fontFamily: MONO_FONT }}
        >
          {ex.detail}
        </span>
      </div>
      <div className="space-y-1 mb-2">
        {ex.cues.map((cue, i) => (
          <p key={i} className="text-[12px] text-[#a8a29e]">→ {cue}</p>
        ))}
      </div>
      <p className="text-[12px] text-[#57534e] italic">{ex.why}</p>
    </div>
  )
}
