'use client'

import { useState } from 'react'

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
            '90/90 breathing or crocodile breathing — 2 to 3 min',
            'Hip rockbacks',
            'T-spine rotation',
            'Light glute + core activation',
          ],
          b: [
            '90/90 breathing or crocodile breathing — 2 to 3 min',
            'Hip openers',
            'T-spine rotation',
            'Light glute + core activation',
          ],
        },
      },
      {
        title: 'Build',
        time: '10 - 15 min',
        objective: 'Introduce and rehearse foundational patterns.',
        coachingFocus: ['Position over reps', 'Control over load', 'Hands-on cueing where possible'],
        format: '2 to 3 sets — 5 to 8 reps per movement — full coaching between sets',
        days: {
          a: [
            'Box squat',
            'KB deadlift (from floor or elevated)',
            'TRX row',
            'Incline push-up',
          ],
          b: [
            'Split squat (assisted)',
            'Cable row',
            'Elevated push-up',
            'KB hinge variation',
          ],
        },
      },
      {
        title: 'Main Work',
        time: '20 - 25 min',
        objective: 'Controlled circuit — not conditioning.',
        coachingFocus: ['Move at own pace', 'Rest allowed at any time', 'Quality always overrides quantity'],
        format: '3 to 4 rounds — coach controls tempo — no timers forcing speed',
        days: {
          a: [
            'Station 1 — KB Deadlift x 8',
            'Station 2 — Box Squat x 8',
            'Station 3 — TRX Row x 8',
            'Station 4 — Incline Push-Up x 8',
          ],
          b: [
            'Station 1 — KB Hinge variation x 8',
            'Station 2 — Split Squat (assisted) x 8/leg',
            'Station 3 — Cable Row x 8',
            'Station 4 — Elevated Push-Up x 8',
          ],
        },
      },
      {
        title: 'Close',
        time: '3 - 5 min',
        objective: 'Reinforce posture and calm the system.',
        coachingFocus: [],
        days: {
          a: ['Light farmer carry — 20 to 30m', 'Static KB hold', 'Breathing reset'],
          b: ['Static hold (KB hold)', 'Breathing reset', 'Light stretching'],
        },
      },
    ],
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
            'Supine breathing — 90/90 position',
            'Dead bug (basic)',
            'Glute bridge',
            'Light mobility',
          ],
          b: [
            'Supine breathing — 90/90 position',
            'Dead bug (basic)',
            'Glute bridge',
            'Light mobility',
          ],
        },
      },
      {
        title: 'Build',
        time: '10 - 15 min',
        objective: 'Teach core stability patterns.',
        coachingFocus: ['Alignment', 'Stillness', 'Breathing under tension'],
        format: '2 to 3 sets — 15 to 30 sec holds or 6 to 8 reps',
        days: {
          a: [
            'Front plank — short holds',
            'Side plank',
            'Pallof press (cable)',
            'Bird dog',
          ],
          b: [
            'Dead bug progression',
            'Cable anti-rotation',
            'Bird dog',
            'Side plank',
          ],
        },
      },
      {
        title: 'Main Work',
        time: '20 - 25 min',
        objective: 'Structured stability circuit.',
        coachingFocus: ['Holds must be clean', 'Reduce time if position breaks', 'No holding on for dear life'],
        format: '3 to 4 rounds — controlled transitions — no rushing',
        days: {
          a: [
            'Station 1 — Front plank 20 to 30 sec',
            'Station 2 — Pallof press 8/side',
            'Station 3 — KB carry 20 to 30m',
            'Station 4 — Side plank 20 sec/side',
          ],
          b: [
            'Station 1 — Dead bug x 6/side',
            'Station 2 — Cable anti-rotation 8/side',
            'Station 3 — Suitcase carry 20 to 30m',
            'Station 4 — Bird dog x 6/side',
          ],
        },
      },
      {
        title: 'Close',
        time: '3 - 5 min',
        objective: 'Down-regulate and reset.',
        coachingFocus: [],
        days: {
          a: ['Breathing reset', 'Light stretching', 'Walking'],
          b: ['Breathing reset', 'Light stretching', 'Walking'],
        },
      },
    ],
    principles: [
      'Stability over fatigue',
      'Alignment over duration',
      'Breathing always maintained',
    ],
    cues: ['"Stay stacked"', '"Don\'t let that move"', '"Breathe through it"'],
  },
]

export default function GroupClassesPage() {
  const [activeClass, setActiveClass] = useState('foundations')
  const [activeDay, setActiveDay] = useState<'a' | 'b'>('a')

  const cls = CLASSES.find(c => c.id === activeClass)!

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Group Class Templates</h1>
        <p className="text-stone-400 text-sm">Select the class and day variation.</p>
      </div>

      {/* Class tabs */}
      <div className="flex gap-2 mb-3">
        {CLASSES.map(c => (
          <button
            key={c.id}
            onClick={() => setActiveClass(c.id)}
            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-semibold transition-all ${
              activeClass === c.id
                ? 'border-teal-500/40 text-teal-400 bg-teal-500/08'
                : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
            style={activeClass === c.id ? { background: 'rgba(20,184,166,0.08)' } : {}}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Day toggle */}
      <div className="flex gap-2 mb-6">
        {(['a', 'b'] as const).map(day => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
              activeDay === day
                ? 'border-stone-500 text-white bg-stone-800'
                : 'border-stone-800 text-stone-500 hover:text-stone-300 hover:border-stone-700'
            }`}
          >
            Day {day.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Overview */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Class Overview</p>
          <span className="text-xs text-stone-500">{cls.duration}</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Objective</p>
            <p className="text-sm text-stone-300 leading-relaxed">{cls.objective}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">Primary Goal</p>
            <p className="text-sm text-stone-300 leading-relaxed">{cls.goal}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Target Member</p>
            <div className="flex flex-wrap gap-2">
              {cls.targetMember.map((t, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-400 border border-stone-700">{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Session sections */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Session Plan — Day {activeDay.toUpperCase()}</p>
        </div>
        <div className="divide-y divide-stone-800/60">
          {cls.sections.map((section, i) => (
            <div key={i} className="px-5 py-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-bold text-white">{section.title}</p>
                <span className="text-xs text-stone-500">{section.time}</span>
              </div>
              <p className="text-xs text-stone-500 mb-3">{section.objective}</p>

              {'format' in section && section.format && (
                <p className="text-xs text-teal-400/70 mb-3">{section.format}</p>
              )}

              <div className="space-y-2 mb-3">
                {section.days[activeDay].map((item, j) => (
                  <div key={j} className="flex items-start gap-3 bg-stone-800/50 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-stone-300">{item}</p>
                  </div>
                ))}
              </div>

              {section.coachingFocus.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-stone-600 uppercase tracking-wider mb-2">Coaching focus</p>
                  <div className="flex flex-wrap gap-2">
                    {section.coachingFocus.map((f, j) => (
                      <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-400 border border-stone-700">{f}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Coaching principles */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden mb-4">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Coaching Principles</p>
        </div>
        <div className="px-5 py-4 space-y-2">
          {cls.principles.map((p, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 rounded-full bg-stone-600 mt-2 shrink-0" />
              <p className="text-sm text-stone-300">{p}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Primary cues + member experience */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-800">
          <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Primary Cues</p>
        </div>
        <div className="px-5 py-4 space-y-2 border-b border-stone-800/60">
          {cls.cues.map((c, i) => (
            <p key={i} className="text-sm text-stone-300 italic">{c}</p>
          ))}
        </div>
        <div className="px-5 py-4">
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">Member Experience Goal</p>
          <p className="text-sm text-teal-400 font-medium italic">{cls.memberExperience}</p>
        </div>
      </div>
    </div>
  )
}
