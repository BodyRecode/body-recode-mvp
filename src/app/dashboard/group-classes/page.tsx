'use client'

import { useState } from 'react'
import { PageHeader, MONO_FONT } from '@/components/dashboard/ui'

interface Exercise {
  name: string
  cues: string[]
  why: string
}

interface Section {
  title: string
  time: string
  objective: string
  coachingFocus: string[]
  format?: string
  days: {
    a: Exercise[]
    b: Exercise[]
  }
}

const CLASSES = [
  {
    id: 'foundations',
    label: 'Foundations',
    objective: 'Develop baseline movement competency, positional awareness, and confidence through controlled, low-complexity patterns.',
    goal: 'Teach the body how to move before asking it to perform.',
    targetMember: ['New to training', 'Returning after time off', 'Low confidence in gym', 'Poor movement awareness', 'Deconditioned'],
    memberExperience: '"I understand what I\'m doing now."',
    duration: '45 min',
    sections: [
      {
        title: 'Prep',
        time: '5 - 8 min',
        objective: 'Reduce tension, establish breathing, prepare joints.',
        coachingFocus: ['Slow pace', 'Clear instruction', 'No intensity'],
        days: {
          a: [
            {
              name: '90/90 breathing or crocodile breathing - 2 to 3 min',
              cues: ['Feel the floor push back against you', 'Breathe into your belly, not your chest', 'Each exhale, let your ribs drop down'],
              why: 'Shifts the nervous system out of fight-or-flight before asking the body to do anything. Sets the tone for a controlled session.',
            },
            {
              name: 'Hip rockbacks',
              cues: ['Keep your lower back flat throughout', 'Push your hips back like you\'re trying to touch a wall behind you', 'Don\'t let the lower back round at the end range'],
              why: 'Rehearses the hinge pattern and creates hip mobility needed for squatting and deadlifting patterns later in the session.',
            },
            {
              name: 'T-spine rotation',
              cues: ['Keep your hips still - this is a thoracic movement only', 'Follow your hand with your eyes', 'Pause at the top for a breath'],
              why: 'Opens up the mid-back before loading. Tight thoracic spine shifts load to the lower back and shoulders - we prevent that here.',
            },
            {
              name: 'Light glute and core activation',
              cues: ['Squeeze the glute fully before releasing', 'Don\'t let your lower back compensate', 'This is gentle - not a workout'],
              why: 'Wakes up the glutes and deep core before they\'re needed under load. Lazy glutes in beginners is extremely common.',
            },
          ],
          b: [
            {
              name: '90/90 breathing or crocodile breathing - 2 to 3 min',
              cues: ['Feel the floor push back against you', 'Breathe into your belly, not your chest', 'Each exhale, let your ribs drop down'],
              why: 'Shifts the nervous system out of fight-or-flight before asking the body to do anything. Sets the tone for a controlled session.',
            },
            {
              name: 'Hip openers',
              cues: ['Move slowly - this isn\'t stretching for the sake of it', 'Breathe into the tight areas', 'Go only as far as your position stays clean'],
              why: 'Reduces hip restriction that limits split squat depth and single leg stability. Critical for Day B lower body work.',
            },
            {
              name: 'T-spine rotation',
              cues: ['Keep your hips still - this is a thoracic movement only', 'Follow your hand with your eyes', 'Pause at the top for a breath'],
              why: 'Opens up the mid-back before loading. Tight thoracic spine shifts load to the lower back and shoulders - we prevent that here.',
            },
            {
              name: 'Light glute and core activation',
              cues: ['Squeeze the glute fully before releasing', 'Don\'t let your lower back compensate', 'This is gentle - not a workout'],
              why: 'Wakes up the glutes and deep core before they\'re needed under load. Lazy glutes in beginners is extremely common.',
            },
          ],
        },
      },
      {
        title: 'Build',
        time: '10 - 15 min',
        objective: 'Introduce and rehearse foundational patterns.',
        coachingFocus: ['Position over reps', 'Control over load', 'Hands-on cueing where possible'],
        format: '2 to 3 sets - 5 to 8 reps per movement - full coaching between sets',
        days: {
          a: [
            {
              name: 'Box squat',
              cues: ['Feet shoulder width, toes out slightly', 'Push your knees out over your little toe', 'Sit back and down - don\'t just drop', 'Touch the box, pause, then drive through your heels'],
              why: 'The box removes the guessing - they know exactly how deep to go. Builds confidence and teaches weight shift into the hips before self-regulating depth.',
            },
            {
              name: 'KB deadlift (from floor or elevated)',
              cues: ['Hinge at the hips first, then bend the knees', 'Keep the bell close to your shins', 'Squeeze your glutes at the top - stand tall', 'Drive the floor away from you'],
              why: 'Teaches the posterior chain to load and extend safely. Most beginners squat when they should hinge - this pattern corrects that.',
            },
            {
              name: 'TRX row',
              cues: ['Pull your elbows to your ribs - not above them', 'Keep your body in one straight line', 'Squeeze your shoulder blades together at the top', 'Don\'t shrug your shoulders to your ears'],
              why: 'Introduces pulling mechanics with a scalable load. Body angle controls difficulty - makes it accessible for everyone while still challenging the upper back.',
            },
            {
              name: 'Incline push-up',
              cues: ['Lower your chest - not your face', 'Elbows at 45 degrees from your body', 'Keep your hips in line - don\'t sag or pike', 'Full range - all the way down, all the way up'],
              why: 'Builds pushing mechanics and shoulder stability with a reduced bodyweight load. Incline makes it achievable while still requiring real effort.',
            },
          ],
          b: [
            {
              name: 'Split squat (assisted)',
              cues: ['Front foot flat on floor, back foot on toes', 'Drop the back knee straight down', 'Keep your torso upright - don\'t lean forward', 'Drive through the front heel to stand'],
              why: 'Single leg work exposes side-to-side imbalances. Assisted version allows beginners to learn the position without fear of falling.',
            },
            {
              name: 'Cable row',
              cues: ['Sit tall - don\'t round your lower back', 'Pull the handle to your belly button', 'Drive your elbows back behind you', 'Controlled on the way out - don\'t let it pull you forward'],
              why: 'Machine-based pulling is more accessible than TRX - gives members tactile feedback and a stable environment to learn rowing mechanics.',
            },
            {
              name: 'Elevated push-up',
              cues: ['Lower your chest - not your face', 'Elbows at 45 degrees from your body', 'Keep your hips in line', 'Full range - all the way down, all the way up'],
              why: 'Continues push pattern development. Elevating the surface reduces load further for those who struggled with the bench press or incline push-up on Day A.',
            },
            {
              name: 'KB hinge variation',
              cues: ['Push your hips back - don\'t bend at the knees first', 'Feel the stretch in your hamstrings', 'Keep the bell close to your body throughout', 'Squeeze your glutes hard at the top'],
              why: 'Reinforces the hinge pattern introduced in Day A. Slight variation keeps the body adapting while the motor pattern is still being established.',
            },
          ],
        },
      },
      {
        title: 'Main Work',
        time: '20 - 25 min',
        objective: 'Controlled circuit - not conditioning.',
        coachingFocus: ['Move at own pace', 'Rest allowed at any time', 'Quality always overrides quantity'],
        format: '3 to 4 rounds - coach controls tempo - no timers forcing speed',
        days: {
          a: [
            {
              name: 'Station 1 - KB Deadlift x 8',
              cues: ['Hinge first, then knee bend', 'Chest proud at the top', 'Take your time between reps'],
              why: 'Anchors the session around the most fundamental loaded hinge pattern. Repetition builds the motor program.',
            },
            {
              name: 'Station 2 - Box Squat x 8',
              cues: ['Use the box - it\'s not a trick', 'Knees track over toes', 'Sit deliberately, don\'t drop'],
              why: 'Pairs with the deadlift to develop both squat and hinge in the same session - two movement patterns, not just one.',
            },
            {
              name: 'Station 3 - TRX Row x 8',
              cues: ['Control the lowering phase', 'Elbows drive back - not out', 'Shoulders stay down'],
              why: 'Upper body pulling balances the session. Builds scapular stability and postural muscles that most beginners are lacking.',
            },
            {
              name: 'Station 4 - Incline Push-Up x 8',
              cues: ['Chest to the bench', 'Elbows at 45 degrees', 'Breathe out on the push'],
              why: 'Completes the push-pull balance. Full session covers hinge, squat, pull, and push - the four fundamental patterns.',
            },
          ],
          b: [
            {
              name: 'Station 1 - KB Hinge variation x 8',
              cues: ['Push the hips back first', 'Feel the hamstring load before you lower further', 'Squeeze and stand tall'],
              why: 'Reinforces Day A hinge in a slightly different variation - neural adaptation requires repetition with variation.',
            },
            {
              name: 'Station 2 - Split Squat (assisted) x 8 per leg',
              cues: ['Use the assistance - don\'t fight it', 'Back knee drops straight down', 'Front heel stays down throughout'],
              why: 'Single leg strength and stability is critical for real-world function. Most gym programs neglect this - we build it from day one.',
            },
            {
              name: 'Station 3 - Cable Row x 8',
              cues: ['Sit tall throughout the pull', 'No swinging or momentum', 'Feel your upper back working'],
              why: 'Machine row provides a more supported environment - good for those who found TRX row too unstable on Day A.',
            },
            {
              name: 'Station 4 - Elevated Push-Up x 8',
              cues: ['Chest touches the surface', 'Don\'t rush - slow and controlled', 'Full lockout at the top'],
              why: 'Continues push pattern development. Consistent repetition across both days builds confidence in the movement.',
            },
          ],
        },
      },
      {
        title: 'Close',
        time: '3 - 5 min',
        objective: 'Reinforce posture and calm the system.',
        coachingFocus: [],
        days: {
          a: [
            {
              name: 'Light farmer carry - 20 to 30m',
              cues: ['Stand tall - shoulders back and down', 'Walk slowly and deliberately', 'Don\'t let the weight pull you sideways'],
              why: 'Carries build grip, core, and posture simultaneously. The walking nature makes it accessible and calming as a closer.',
            },
            {
              name: 'Static KB hold',
              cues: ['Hold tall - don\'t dump the weight into your hips', 'Breathe steadily', 'Feel your core working to stay upright'],
              why: 'Static holds reinforce posture and teach members what it feels like to brace without moving. Builds body awareness.',
            },
            {
              name: 'Breathing reset',
              cues: ['In through the nose for 4 counts', 'Out through the mouth for 6 counts', 'Let your shoulders relax on each exhale'],
              why: 'Returns the nervous system toward rest. Signals the body that training is over and recovery begins.',
            },
          ],
          b: [
            {
              name: 'Static hold (KB hold)',
              cues: ['Hold tall - don\'t dump the weight into your hips', 'Breathe steadily', 'Feel your core working to stay upright'],
              why: 'Static holds reinforce posture and teach members what it feels like to brace without moving. Builds body awareness.',
            },
            {
              name: 'Breathing reset',
              cues: ['In through the nose for 4 counts', 'Out through the mouth for 6 counts', 'Let your shoulders relax on each exhale'],
              why: 'Returns the nervous system toward rest. Signals the body that training is over and recovery begins.',
            },
            {
              name: 'Light stretching',
              cues: ['Hold each position for a full breath in and out', 'Don\'t force the range - breathe into it', 'Let gravity do the work'],
              why: 'Gentle end-of-session mobility work improves long-term flexibility and helps members associate training with feeling better.',
            },
          ],
        },
      },
    ] as Section[],
    principles: [
      'No rushing members',
      'No high intensity cues',
      'No "push through" language',
      'Constant regression available',
    ],
    cues: ['"Slow it down"', '"Control that position"', '"That\'s the shape we want"'],
  },
  {
    id: 'core',
    label: 'Core',
    objective: 'Build trunk stability, positional control, and force transfer through anti-movement training and controlled loading.',
    goal: 'Create internal stability before increasing external load.',
    targetMember: ['Beginner to intermediate', 'Injury-prone', 'Low core awareness', 'Postural issues', 'General population'],
    memberExperience: '"I feel more stable and in control."',
    duration: '45 min',
    sections: [
      {
        title: 'Prep',
        time: '5 - 8 min',
        objective: 'Establish breathing and bracing.',
        coachingFocus: ['Ribcage position', 'Slow breathing', 'No rushing'],
        days: {
          a: [
            {
              name: 'Supine breathing - 90/90 position',
              cues: ['Feet on the bench, hips at 90 degrees', 'Feel your lower back flatten to the floor', 'Breathe into your belly and sides - not just your chest'],
              why: 'The 90/90 position is the most neutral lumbar position available. Breathing here teaches rib control and diaphragm engagement that underlies every core exercise.',
            },
            {
              name: 'Dead bug (basic)',
              cues: ['Press your lower back into the floor before you move', 'Move only as far as your back stays flat', 'Exhale fully as the limbs extend'],
              why: 'Teaches the core to resist extension under limb load - the exact demand of every carry, plank, and lift. A foundational movement for true core control.',
            },
            {
              name: 'Glute bridge',
              cues: ['Drive through your heels - not your toes', 'Squeeze the glutes at the top - don\'t hyperextend the lower back', 'Control the lowering phase'],
              why: 'Activates the posterior chain before it\'s needed in loaded carries and standing exercises. Lazy glutes shift load to the lower back.',
            },
            {
              name: 'Light mobility',
              cues: ['Keep it easy - this is preparation, not a workout', 'Breathe through each position', 'Focus on areas that feel restricted'],
              why: 'Ensures joints are prepared to work through the ranges required in the session. Prevents injury and improves quality of movement.',
            },
          ],
          b: [
            {
              name: 'Supine breathing - 90/90 position',
              cues: ['Feet on the bench, hips at 90 degrees', 'Feel your lower back flatten to the floor', 'Breathe into your belly and sides - not just your chest'],
              why: 'The 90/90 position is the most neutral lumbar position available. Breathing here teaches rib control and diaphragm engagement that underlies every core exercise.',
            },
            {
              name: 'Dead bug (basic)',
              cues: ['Press your lower back into the floor before you move', 'Move only as far as your back stays flat', 'Exhale fully as the limbs extend'],
              why: 'Teaches the core to resist extension under limb load - the exact demand of every carry, plank, and lift. A foundational movement for true core control.',
            },
            {
              name: 'Glute bridge',
              cues: ['Drive through your heels - not your toes', 'Squeeze the glutes at the top - don\'t hyperextend the lower back', 'Control the lowering phase'],
              why: 'Activates the posterior chain before it\'s needed in loaded carries and standing exercises. Lazy glutes shift load to the lower back.',
            },
            {
              name: 'Light mobility',
              cues: ['Keep it easy - this is preparation, not a workout', 'Breathe through each position', 'Focus on areas that feel restricted'],
              why: 'Ensures joints are prepared to work through the ranges required in the session. Prevents injury and improves quality of movement.',
            },
          ],
        },
      },
      {
        title: 'Build',
        time: '10 - 15 min',
        objective: 'Teach core stability patterns.',
        coachingFocus: ['Alignment', 'Stillness', 'Breathing under tension'],
        format: '2 to 3 sets - 15 to 30 sec holds or 6 to 8 reps',
        days: {
          a: [
            {
              name: 'Front plank - short holds',
              cues: ['Elbows under your shoulders - not in front', 'Squeeze your glutes and quads', 'Don\'t hold your breath - breathe through it', 'Think "long" - from head to heel'],
              why: 'Anti-extension training - teaches the core to resist the spine arching under load. The most fundamental trunk stability pattern.',
            },
            {
              name: 'Side plank',
              cues: ['Stack your feet or stagger them for stability', 'Drive your hip up - don\'t let it sag', 'Keep your body in one straight line from head to feet', 'Breathe normally'],
              why: 'Anti-lateral flexion training - the core\'s job of resisting side bending under load. Critical for walking, carrying, and any asymmetrical task.',
            },
            {
              name: 'Pallof press (cable)',
              cues: ['Stand tall - don\'t rotate toward the cable', 'Press straight out and hold', 'Exhale as you press - don\'t hold your breath', 'The resistance is pulling you sideways - resist it'],
              why: 'Anti-rotation training - teaches the core to stop unwanted rotation. This is the most overlooked core function and most relevant to real-world performance.',
            },
            {
              name: 'Bird dog',
              cues: ['Don\'t let your lower back arch when you extend the leg', 'Move the arm and leg slowly and deliberately', 'Keep your hips level throughout', 'Think about keeping a water glass balanced on your lower back'],
              why: 'Trains spinal stability under alternating limb load. Develops the coordination between the deep stabilisers and the movement muscles.',
            },
          ],
          b: [
            {
              name: 'Dead bug progression',
              cues: ['Lower back pressed firmly to the floor before any movement', 'Breathe out as the limb extends', 'Move only as far as position holds', 'Opposite arm and leg extend together'],
              why: 'Progresses from the prep dead bug with greater coordination demand. Trains deep core engagement while the limbs are moving - mirrors real life.',
            },
            {
              name: 'Cable anti-rotation',
              cues: ['Feet shoulder width, sideways to the cable', 'Resist rotation - your torso stays square', 'Control the return - don\'t let it pull you', 'Breathe steadily throughout'],
              why: 'Directly trains rotational stability - the core\'s most important job in sport, lifting, and daily life. Most members have never trained this.',
            },
            {
              name: 'Bird dog',
              cues: ['Don\'t let your lower back arch when you extend the leg', 'Move the arm and leg slowly and deliberately', 'Keep your hips level throughout', 'Think about keeping a water glass balanced on your lower back'],
              why: 'Trains spinal stability under alternating limb load. Develops the coordination between the deep stabilisers and the movement muscles.',
            },
            {
              name: 'Side plank',
              cues: ['Stack your feet or stagger them for stability', 'Drive your hip up - don\'t let it sag', 'Keep your body in one straight line from head to feet', 'Breathe normally'],
              why: 'Anti-lateral flexion training - the core\'s job of resisting side bending under load. Critical for walking, carrying, and any asymmetrical task.',
            },
          ],
        },
      },
      {
        title: 'Main Work',
        time: '20 - 25 min',
        objective: 'Structured stability circuit.',
        coachingFocus: ['Holds must be clean', 'Reduce time if position breaks', 'No holding on for dear life'],
        format: '3 to 4 rounds - controlled transitions - no rushing',
        days: {
          a: [
            {
              name: 'Station 1 - Front plank 20 to 30 sec',
              cues: ['Glutes and quads squeezed throughout', 'Breathe - don\'t grip and hold your breath', 'Stop if your hips drop - quality over time'],
              why: 'Repeated bouts of anti-extension build the endurance of the stabilising muscles. The circuit format means cumulative volume without extreme fatigue.',
            },
            {
              name: 'Station 2 - Pallof press 8 per side',
              cues: ['Stand tall - resist the pull', 'Pause at full extension for a breath', 'Don\'t let the cable rotate your torso'],
              why: 'Anchors the circuit with the anti-rotation pattern. By the second or third round, members begin to feel this deeply.',
            },
            {
              name: 'Station 3 - KB carry 20 to 30m',
              cues: ['Shoulder packed - don\'t let it shrug up', 'Walk tall - posture doesn\'t change with the load', 'Breathe normally while you walk'],
              why: 'Loaded carries are anti-lateral flexion under locomotion. They\'re also a mental test - maintaining posture when tired is a skill.',
            },
            {
              name: 'Station 4 - Side plank 20 sec per side',
              cues: ['Hip drives up - doesn\'t sag or pike', 'Stagger feet if needed for stability', 'Breathe through it'],
              why: 'Closes each round with a lateral stability hold. Combines with the carry to make lateral anti-flexion the dominant theme of the session.',
            },
          ],
          b: [
            {
              name: 'Station 1 - Dead bug x 6 per side',
              cues: ['Lower back stays flat - that\'s the only rule', 'Exhale as the limb extends', 'No rushing - each rep is deliberate'],
              why: 'Anti-extension training under moving limb load. Each round adds neural fatigue, making the lower back flat requirement more challenging and more valuable.',
            },
            {
              name: 'Station 2 - Cable anti-rotation 8 per side',
              cues: ['Stay square - the resistance is the whole point', 'Pause with arms extended', 'Same speed in both directions'],
              why: 'The most direct rotational stability training available. Builds the deep oblique slings that protect the spine under load and rotation.',
            },
            {
              name: 'Station 3 - Suitcase carry 20 to 30m',
              cues: ['Don\'t lean away from the weight - resist it', 'Shoulder stays down and back', 'Walk with intention - tall and controlled'],
              why: 'Single-arm carry creates a lateral load demand that the core must resist constantly. One of the best core exercises available while also training grip and shoulder stability.',
            },
            {
              name: 'Station 4 - Bird dog x 6 per side',
              cues: ['Extend slowly - don\'t kick the leg out', 'Lower back stays still throughout', 'Return to start before the next rep'],
              why: 'Coordination under fatigue. By rounds 3 and 4, maintaining form on bird dog becomes increasingly challenging - that\'s the adaptation we\'re after.',
            },
          ],
        },
      },
      {
        title: 'Close',
        time: '3 - 5 min',
        objective: 'Down-regulate and reset.',
        coachingFocus: [],
        days: {
          a: [
            {
              name: 'Breathing reset',
              cues: ['In through the nose for 4 counts', 'Out through the mouth for 6 counts', 'Let your shoulders relax on each exhale'],
              why: 'Returns the nervous system toward rest after sustained stabilisation work. Signals the body that the effort is done.',
            },
            {
              name: 'Light stretching',
              cues: ['Hold each position for a full breath in and out', 'Don\'t force the range - breathe into it', 'Let gravity do the work'],
              why: 'Gentle end-of-session mobility work improves long-term flexibility and helps members associate training with feeling better.',
            },
            {
              name: 'Walking',
              cues: ['Walk slowly and relaxed', 'Let your arms swing naturally', 'Focus on your breathing returning to normal'],
              why: 'Low-intensity movement accelerates recovery by keeping blood moving without taxing the system further.',
            },
          ],
          b: [
            {
              name: 'Breathing reset',
              cues: ['In through the nose for 4 counts', 'Out through the mouth for 6 counts', 'Let your shoulders relax on each exhale'],
              why: 'Returns the nervous system toward rest after sustained stabilisation work. Signals the body that the effort is done.',
            },
            {
              name: 'Light stretching',
              cues: ['Hold each position for a full breath in and out', 'Don\'t force the range - breathe into it', 'Let gravity do the work'],
              why: 'Gentle end-of-session mobility work improves long-term flexibility and helps members associate training with feeling better.',
            },
            {
              name: 'Walking',
              cues: ['Walk slowly and relaxed', 'Let your arms swing naturally', 'Focus on your breathing returning to normal'],
              why: 'Low-intensity movement accelerates recovery by keeping blood moving without taxing the system further.',
            },
          ],
        },
      },
    ] as Section[],
    principles: [
      'Stability over fatigue',
      'Alignment over duration',
      'Breathing always maintained',
    ],
    cues: ['"Stay stacked"', '"Don\'t let that move"', '"Breathe through it"'],
  },
]

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-3">
      <p className="text-[14px] font-semibold text-[#1A1A1A] mb-2">{exercise.name}</p>
      <div className="space-y-1 mb-2">
        {exercise.cues.map((cue, i) => (
          <p key={i} className="text-[12px] text-[#6B6B6B]">
            <span className="text-[#1B6DFC] mr-1">→</span>{cue}
          </p>
        ))}
      </div>
      <p className="text-[12px] text-[#999999] italic">{exercise.why}</p>
    </div>
  )
}

function ScriptCard({ label, meta, children }: { label: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-7 h-[3px] rounded-full bg-[#1B6DFC] shrink-0" />
          <p
            className="text-[10px] font-bold text-[#1A1A1A] uppercase truncate"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
          >
            {label}
          </p>
        </div>
        {meta && (
          <span
            className="text-[10px] text-[#999999] shrink-0"
            style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em' }}
          >
            {meta}
          </span>
        )}
      </div>
      <div className="divide-y divide-[#E5E5E5]">{children}</div>
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-bold text-[#999999] uppercase mb-2"
      style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
    >
      {children}
    </p>
  )
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t, i) => (
        <span
          key={i}
          className="text-[11px] px-2.5 py-1 rounded-full bg-[#FFFFFF] text-[#6B6B6B] border border-[#E5E5E5]"
        >
          {t}
        </span>
      ))}
    </div>
  )
}

export default function GroupClassesPage() {
  const [activeClass, setActiveClass] = useState('foundations')
  const [activeDay, setActiveDay] = useState<'a' | 'b'>('a')

  const cls = CLASSES.find(c => c.id === activeClass)!

  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Templates"
        title="Group Class Templates"
        subtitle="Select the class and day variation."
      />

      {/* Class tabs */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {CLASSES.map(c => {
          const active = activeClass === c.id
          return (
            <button
              key={c.id}
              onClick={() => setActiveClass(c.id)}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl border text-[13px] font-semibold transition-colors ${
                active
                  ? 'border-[#B5CFFC] text-[#1B6DFC] bg-[rgba(20,184,166,0.08)]'
                  : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#D4D4D4]'
              }`}
            >
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 mb-6">
        {(['a', 'b'] as const).map(day => {
          const active = activeDay === day
          return (
            <button
              key={day}
              onClick={() => setActiveDay(day)}
              className={`flex-1 py-2 px-3 rounded-lg border text-[11px] font-semibold transition-colors ${
                active
                  ? 'border-[#D4D4D4] text-[#1A1A1A] bg-[#E5E5E5]'
                  : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#6B6B6B] hover:text-[#1A1A1A] hover:border-[#D4D4D4]'
              }`}
            >
              Day {day.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Overview */}
      <ScriptCard label="Class Overview" meta={cls.duration}>
        <div className="px-5 py-4 space-y-4">
          <div>
            <FieldLabel>Objective</FieldLabel>
            <p className="text-[14px] text-[#3A3A3A] leading-relaxed">{cls.objective}</p>
          </div>
          <div>
            <FieldLabel>Primary Goal</FieldLabel>
            <p className="text-[14px] text-[#3A3A3A] leading-relaxed">{cls.goal}</p>
          </div>
          <div>
            <FieldLabel>Target Member</FieldLabel>
            <TagList items={cls.targetMember} />
          </div>
        </div>
      </ScriptCard>

      {/* Session sections */}
      <ScriptCard label={`Session Plan - Day ${activeDay.toUpperCase()}`}>
        {cls.sections.map((section, i) => (
          <div key={i} className="px-5 py-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[14px] font-bold text-[#1A1A1A]">{section.title}</p>
              <span
                className="text-[11px] text-[#999999]"
                style={{ fontFamily: MONO_FONT, letterSpacing: '0.06em' }}
              >
                {section.time}
              </span>
            </div>
            <p className="text-[12px] text-[#999999] mb-3">{section.objective}</p>

            {'format' in section && section.format && (
              <p className="text-[12px] text-[#1B6DFC] mb-3">{section.format}</p>
            )}

            <div className="space-y-2 mb-3">
              {section.days[activeDay].map((exercise, j) => (
                <ExerciseCard key={j} exercise={exercise} />
              ))}
            </div>

            {section.coachingFocus.length > 0 && (
              <div>
                <FieldLabel>Coaching focus</FieldLabel>
                <TagList items={section.coachingFocus} />
              </div>
            )}
          </div>
        ))}
      </ScriptCard>

      {/* Coaching principles */}
      <ScriptCard label="Coaching Principles">
        <div className="px-5 py-4 space-y-2">
          {cls.principles.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-[#999999] mt-2 shrink-0" />
              <p className="text-[14px] text-[#3A3A3A]">{p}</p>
            </div>
          ))}
        </div>
      </ScriptCard>

      {/* Primary cues + member experience */}
      <ScriptCard label="Primary Cues">
        <div className="px-5 py-4 space-y-2">
          {cls.cues.map((c, i) => (
            <p key={i} className="text-[14px] text-[#3A3A3A] italic">{c}</p>
          ))}
        </div>
        <div className="px-5 py-4">
          <FieldLabel>Member Experience Goal</FieldLabel>
          <p className="text-[14px] text-[#1B6DFC] font-medium italic">{cls.memberExperience}</p>
        </div>
      </ScriptCard>
    </div>
  )
}
