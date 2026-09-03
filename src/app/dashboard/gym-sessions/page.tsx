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
    color: '#DC2626',
    bg: 'rgba(239,68,68,0.08)',
    border: 'rgba(239,68,68,0.25)',
    tagBg: 'rgba(239,68,68,0.12)',
    summary: 'Body in protection mode. Cortisol elevated. Metabolism suppressed. Pushing harder makes this worse.',
    warmup: [
      '90/90 belly breathing on floor - 60 sec',
      'TRX assisted deep squat hold - 45 sec',
      'Cat-cow on floor - 60 sec',
      'Shoulder circles + arm swings - 45 sec',
    ],
    close: ['Child\'s pose - 60 sec', 'Box breathing 4-4-4-4 - 4 rounds'],
    handoff: 'Good work. We trained that way deliberately - your body is in a state where pushing harder right now would push it the wrong direction. Let\'s grab a seat and I\'ll walk you through your scorecard properly, what your body just did, and what my coaching would look like for what you told me earlier you want.',
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
    color: '#B7791F',
    bg: 'rgba(245,158,11,0.08)',
    border: 'rgba(245,158,11,0.25)',
    tagBg: 'rgba(245,158,11,0.12)',
    summary: 'Mixed signals. Capacity exists but something is limiting the response - sleep, stress, or a load mismatch.',
    warmup: [
      'Rower or BikeErg easy - 90 sec',
      'World\'s greatest stretch - 3 reps per side',
      'TRX face pull - 10 reps',
    ],
    close: ['Hip flexor stretch - 45 sec per side'],
    handoff: 'Good work. You saw where output dropped during that block - that is the bottleneck your scorecard is pointing at too. Let\'s grab a seat and I\'ll walk you through it properly, the bottleneck specifically, and what my coaching would look like for what you told me earlier you want.',
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
    color: '#1B6DFC',
    bg: 'rgba(27,109,252,0.08)',
    border: 'rgba(27,109,252,0.25)',
    tagBg: 'rgba(27,109,252,0.12)',
    summary: 'Biology is primed. If fat loss or performance is not happening, the issue is in the prescription.',
    warmup: [
      'Rower - 2 min building to 75%',
      'KB halo - 5 reps each direction',
      'Box jump or jump squat - 5 reps (activation)',
    ],
    close: ['Walk + breathe down - 2 min'],
    handoff: 'Good work. Your body responded the way a Ready body should - which tells me what is stopping the result you want is not your biology, it is the prescription. Let\'s grab a seat and I\'ll walk you through your scorecard, what your body just did, and what my coaching would look like for what you told me earlier.',
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
        subtitle="Pick the member's state and program type. Run the session as written. Pre-call brief on the lead profile handles the consult, scorecard read-back, and offer."
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
                active ? '' : 'border-[#E8EAEE] bg-[#FFFFFF] text-[#666D7A] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)]'
              }`}
            >
              <span className="block">{s.label}</span>
              <span
                className="block text-[10px] font-normal mt-0.5 opacity-70"
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
                  ? 'border-[#CFD4DC] text-[#141821] bg-[#EFF1F4]'
                  : 'border-[#E8EAEE] bg-[#FFFFFF] text-[#666D7A] hover:text-[#1B6DFC] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)]'
              }`}
            >
              {p.label}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      <div className="rounded-xl p-4 mb-6 border" style={{ background: state.bg, borderColor: state.border }}>
        <p className="text-[14px] font-medium leading-relaxed" style={{ color: state.color }}>{state.summary}</p>
      </div>

      {/* Session */}
      <ScriptCard label="Session - 20 min">
        <ScriptSection label="Warm-up - 3 min">
          {state.warmup.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#98A0AD] mt-2 shrink-0" />
              <p className="text-[14px] text-[#43474F]">{item}</p>
            </div>
          ))}
        </ScriptSection>
        <ScriptSection label="Working" sublabel={program.structure}>
          {program.primer && (
            <div className="mb-2">
              <p
                className="text-[10px] font-medium text-[#98A0AD] mb-2"
              >
                Strength primer
              </p>
              <div className="space-y-2 mb-4">
                {program.primer.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}
              </div>
              <p
                className="text-[10px] font-medium text-[#98A0AD] mb-2"
              >
                AMRAP
              </p>
            </div>
          )}
          <div className="space-y-2">
            {program.exercises.map((ex, i) => <ExerciseCard key={i} ex={ex} />)}
          </div>
          {program.note && (
            <p className="text-[12px] text-[#98A0AD] mt-3 italic">{program.note}</p>
          )}
        </ScriptSection>
        <ScriptSection label="Close - 2 min">
          {state.close.map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#98A0AD] mt-2 shrink-0" />
              <p className="text-[14px] text-[#43474F]">{item}</p>
            </div>
          ))}
        </ScriptSection>
      </ScriptCard>

      {/* Handoff into the sit-down */}
      <ScriptCard label="Handoff into the sit-down">
        <div className="px-5 py-4">
          <p className="text-[10px] font-medium text-[#98A0AD] mb-2">
            Bridge from training → table
          </p>
          <p className="text-[14px] text-[#43474F] leading-relaxed italic">"{state.handoff}"</p>
        </div>
      </ScriptCard>

      {/* Paths after the sit-down */}
      <ScriptCard label="After the sit-down · paths">
        {/* PATH C — proceeding now */}
        <div className="px-5 py-4 border-b border-[#E8EAEE]">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgba(27,109,252,0.12)] text-[#1B6DFC] border border-[#B5CFFC]"
            >
              Path C
            </span>
            <p
              className="text-[10px] font-medium text-[#666D7A]"
            >
              Locking in now
            </p>
          </div>
          <p className="text-[14px] text-[#43474F] leading-relaxed italic mb-3">"Good. Here's exactly what happens next. I'll send you a link straight to your inbox now for the $297 Foundational Read. Once that's through, three things happen automatically. Welcome email with portal access. Your foundational intake unlocks - 230 questions across 8 areas. And I get notified at every step. Once your intake's in, your CFFS generates. I review it, send you the subscription link at the launch rate, and we lock in your start date. Sound good?"</p>
          <p className="text-[12px] text-[#98A0AD] leading-relaxed">Open the lead in <span className="text-[#666D7A]">/dashboard/leads</span>, run companion → Path C → pick pathway (in-person / online) → Send Foundational Read → Mark Complete. Stripe link goes to her instantly.</p>
        </div>

        {/* PATH B — needs time */}
        <div className="px-5 py-4 border-b border-[#E8EAEE]">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[rgba(245,158,11,0.12)] text-[#B7791F] border border-[#3a2e10]"
            >
              Path B
            </span>
            <p
              className="text-[10px] font-medium text-[#666D7A]"
            >
              Needs time · most common
            </p>
          </div>
          <p className="text-[14px] text-[#43474F] leading-relaxed italic mb-3">"Take whatever time you need to sit with it. The launch rate stays open. If anything comes up between now and when you decide, message me and I'll answer it. No pressure either way."</p>
          <p className="text-[12px] text-[#98A0AD] leading-relaxed">Send the post-session recap email same day (Post Session Email Template). Companion → Path B → Mark Complete. Follow up ~5-7 days out if no reply (Follow-up Email Template).</p>
        </div>

        {/* PATH A — out */}
        <div className="px-5 py-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#FFFFFF] text-[#666D7A] border border-[#E8EAEE]"
            >
              Path A
            </span>
            <p
              className="text-[10px] font-medium text-[#666D7A]"
            >
              Not the right fit
            </p>
          </div>
          <p className="text-[14px] text-[#43474F] leading-relaxed italic mb-3">"All good. The scorecard read still stands on its own and you've got the breakdown to sit with. If anything shifts in your thinking later, the door's open."</p>
          <p className="text-[12px] text-[#98A0AD] leading-relaxed">Companion → Path A → Mark Complete. Click 'Send declined follow-up' to fire the 3-email re-engagement sequence + $97 downsell offer.</p>
        </div>
      </ScriptCard>
    </div>
  )
}

function ScriptCard({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="br-card overflow-hidden mb-4">
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-[#E8EAEE]">
        <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC] shrink-0" />
        <p
          className="text-[10px] font-medium text-[#141821]"
        >
          {label}
        </p>
      </div>
      <div className="divide-y divide-[#EFF1F4]">{children}</div>
    </div>
  )
}

function ScriptSection({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <p
        className="text-[10px] font-medium text-[#98A0AD] mb-2"
      >
        {label}
      </p>
      {sublabel && <p className="text-[12px] text-[#98A0AD] mb-3">{sublabel}</p>}
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function ExerciseCard({ ex }: { ex: Exercise }) {
  return (
    <div className="br-card px-3 py-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[14px] font-semibold text-[#141821]">{ex.name}</span>
        <span
          className="text-[11px] text-[#666D7A] shrink-0"
          style={{ fontFamily: MONO_FONT }}
        >
          {ex.detail}
        </span>
      </div>
      <div className="space-y-1 mb-2">
        {ex.cues.map((cue, i) => (
          <p key={i} className="text-[12px] text-[#666D7A]">→ {cue}</p>
        ))}
      </div>
      <p className="text-[12px] text-[#98A0AD] italic">{ex.why}</p>
    </div>
  )
}
