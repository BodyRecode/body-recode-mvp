'use client'

import { useState } from 'react'
import Link from 'next/link'

const STAGES = [
  {
    id: 1,
    name: 'Performance Check',
    duration: '3-5 min',
    goal: 'Confirm the client is progressing and consistently engaged before raising the conversation.',
    script: `"Before I get into your check-in this week, I want to take a step back and look at the bigger picture for a second.

You've been in this long enough now that I can see some clear patterns - in your training, your check-ins, how your body is responding.

I want to share what I'm seeing and get your read on it too."`,
    prompts: [
      'How are you feeling about the consistency you\'ve been bringing to sessions lately?',
      '↳ What has felt easiest to hold? What has taken more effort?',
      'Looking back from when you started - what\'s the most noticeable shift for you?',
      '↳ Not just physical. Energy, clarity, how you\'re approaching things.',
      'IF THEY ARE POSITIVE → "That\'s consistent with what I\'m seeing in the data. That\'s actually what I wanted to talk to you about."',
      'IF THEY HAVE CONCERNS → Acknowledge them, note them. Address in Stage 3 if relevant. Don\'t skip to the offer until they feel heard.',
    ],
    tips: 'This is not a setup for the pitch. You are genuinely assessing whether they are ready for more volume. If they are struggling to complete 2 sessions, this is not the right time. The conversation should only continue if the client is genuinely progressing.',
    boundary: 'Do not raise the upgrade if the client is inconsistent, stressed, or flagging capacity issues.',
  },
  {
    id: 2,
    name: 'The Case for More',
    duration: '3-5 min',
    goal: 'Frame additional training volume as the natural next step for someone who is responding and ready — not a sales pitch.',
    script: `"Here\'s what I\'m seeing.

You\'re recovering well, your compliance is high, and the body state data is showing the kind of consistency that means your system is adapting.

When that happens, there\'s usually a window - and it\'s not permanent - where adding a third session compounds what\'s already working faster than anything else we could change.

More frequency at the right time isn\'t just more work. It\'s a different category of result."`,
    prompts: [
      'Have you noticed anything in the last few weeks that suggests you\'re recovering faster than early on?',
      '↳ Sleep, soreness, energy between sessions - any of those.',
      'IF YES → "That\'s a physiological signal. It\'s telling us the capacity is there."',
      'IF UNSURE → "That\'s fair - let me look at the CFWS data together with you and show you what I mean."',
      'How do you feel about where your results are heading at the current pace?',
      '↳ IF SATISFIED → "Good. A third session is about compounding that faster, not about something being broken."',
      '↳ IF WANTING MORE → "That\'s exactly what I\'d expect. Let\'s talk about what that looks like."',
    ],
    tips: 'Lead with the data, not the desire to sell. If you can point to CFWS readiness scores or check-in trends, do it. The case is strongest when it comes from observation, not opinion.',
    boundary: null,
  },
  {
    id: 3,
    name: 'Present the Offer',
    duration: '2-3 min',
    goal: 'State the upgrade clearly - what changes, what it costs, what it compounds.',
    script: `"The way this works inside Body Recode is straightforward.

You\'re currently on the 2-session-per-week structure - that\'s $299 per week.

Moving to three sessions is $409 per week. The extra $110 covers the additional session and keeps everything else - the interpretation, the nutrition, the check-ins - exactly as it is. Nothing is removed. You just get more training contact and faster compounding.

There\'s no lock-in. If it doesn\'t feel right at any point, we scale back. But in my experience, once people make this move at the right time, they don\'t go back."`,
    prompts: [
      '↳ PAUSE. Let them respond.',
      'IF IMMEDIATE INTEREST → "Good. I can schedule the third slot this week if there\'s a time that works."',
      'IF HESITATION → Move to Stage 4.',
      'IF THEY ASK WHAT CHANGES → "Just the session frequency. Everything else stays the same - same check-ins, same interpretation cycle, same access."',
    ],
    tips: 'Keep this short. State the current price, the new price, the difference. Don\'t over-explain. The case was made in Stage 2 - this is just the number.',
    boundary: 'Do not justify the price increase by listing features they already have. They know what they\'re getting.',
  },
  {
    id: 4,
    name: 'Objections',
    duration: '3-5 min',
    goal: 'Address hesitation with honest, specific responses. Do not oversell or pressure.',
    prompts: [
      '💬 COST - "The $110 difference per week - over a month that\'s $440. I\'d ask you to weigh that against what an extra year at the current pace costs you in time."',
      '💬 TIME - "Three sessions doesn\'t necessarily mean a longer week. We can swap one of your current slots to a shorter format if that helps the schedule."',
      '💬 NOT SURE IF READY - "I wouldn\'t be raising it if I didn\'t think you were. That\'s why I looked at the data first. You don\'t have to decide today - but I wanted you to know the option is on the table."',
      '💬 WANTING TO STAY AT 2X - "That\'s completely valid. The 2-session structure is a real result-producing model. I just wanted you to know what\'s available when you\'re ready."',
    ],
    tips: 'The goal is not to close at all costs. If they are not ready, accept it gracefully. A client who feels pressured churns. A client who feels respected and informed upgrades when they are ready.',
    boundary: 'Do not use Founding Client framing here. This is an upgrade for an active, paying client - not a discount mechanism.',
  },
  {
    id: 5,
    name: 'Close or Defer',
    duration: '1-2 min',
    goal: 'Get a clear outcome - yes, or a defined revisit point. Do not leave it open-ended.',
    prompts: [
      'PATH A - THEY ARE IN',
      '↳ "Good. I\'ll get the third slot added and update your billing this week."',
      '↳ Action: Update package to 3x in the dashboard. Schedule additional session.',
      '',
      'PATH B - NOT YET',
      '↳ "No problem. I\'ll flag this in your notes and we\'ll revisit at week [X + 4]."',
      '↳ Action: Add a note in the client record. Revisit in 4 weeks.',
      '',
      'PATH C - NEEDS TO THINK',
      '↳ "Take a few days. I\'ll send you a message by [day] so you don\'t have to remember."',
      '↳ Action: Set a follow-up in the CRM.',
    ],
    tips: 'Always leave with a defined next action, even if the answer is no. "Think about it" without a revisit point disappears.',
    boundary: null,
  },
]

interface UpgradeCompanionProps {
  clientName: string
  clientId: string
  weekNumber: number | null
  currentPackage: string
  bodyState: string | null
}

export default function UpgradeCompanion({ clientName, clientId, weekNumber, currentPackage, bodyState }: UpgradeCompanionProps) {
  const [activeStage, setActiveStage] = useState(0)

  const stage = STAGES[activeStage]
  const isFirst = activeStage === 0
  const isLast = activeStage === STAGES.length - 1

  const isUpgradeCandidate = currentPackage === '2x' && (weekNumber ?? 0) >= 8

  return (
    <div className="min-h-screen bg-[#0c0a09] text-white">
      {/* Header */}
      <div className="border-b border-stone-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/clients/${clientId}`} className="text-stone-500 hover:text-white text-sm transition-colors">
            ← {clientName}
          </Link>
          <span className="text-stone-700">·</span>
          <span className="text-stone-400 text-sm font-medium">Upgrade Conversation</span>
        </div>
        <div className="flex items-center gap-3">
          {weekNumber !== null && (
            <span className="text-xs text-stone-500">Week {weekNumber}</span>
          )}
          {bodyState && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-300 border border-stone-700">
              {bodyState}
            </span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
            currentPackage === '3x'
              ? 'bg-teal-900/30 text-teal-400 border-teal-800/50'
              : 'bg-amber-900/30 text-amber-400 border-amber-800/50'
          }`}>
            {currentPackage === '3x' ? '3x - Already upgraded' : '2x - Upgrade candidate'}
          </span>
        </div>
      </div>

      {/* Not yet ready warning */}
      {!isUpgradeCandidate && currentPackage !== '3x' && (
        <div className="mx-6 mt-6 bg-amber-950/40 border border-amber-800/50 rounded-xl px-5 py-4">
          <p className="text-amber-300 text-sm font-medium">Early stage client</p>
          <p className="text-amber-400/70 text-xs mt-1">
            {clientName} is at Week {weekNumber ?? 0}. The upgrade conversation works best at Week 8+ when consistent patterns are visible in the data.
          </p>
        </div>
      )}

      {currentPackage === '3x' && (
        <div className="mx-6 mt-6 bg-teal-950/40 border border-teal-800/50 rounded-xl px-5 py-4">
          <p className="text-teal-300 text-sm font-medium">Already on 3x</p>
          <p className="text-teal-400/70 text-xs mt-1">
            {clientName} is already on the 3-session package. This companion is for the 2x to 3x upgrade conversation.
          </p>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Stage nav */}
        <div className="flex items-center gap-2 mb-8">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveStage(i)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                i === activeStage
                  ? 'bg-teal-500 text-black font-semibold'
                  : 'text-stone-500 hover:text-white hover:bg-stone-800'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                i === activeStage ? 'bg-black/20' : 'bg-stone-800 text-stone-400'
              }`}>{s.id}</span>
              <span className="hidden sm:block">{s.name}</span>
            </button>
          ))}
        </div>

        {/* Stage header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-semibold">{stage.name}</h2>
            <span className="text-xs text-stone-500 bg-stone-800 px-2.5 py-1 rounded-full">{stage.duration}</span>
          </div>
          <p className="text-stone-400 text-sm">{stage.goal}</p>
        </div>

        <div className="grid gap-5">
          {/* Script */}
          {stage.script && (
            <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Script</p>
              <p className="text-stone-200 text-sm leading-relaxed whitespace-pre-line">{stage.script}</p>
            </div>
          )}

          {/* Prompts */}
          {stage.prompts && stage.prompts.length > 0 && (
            <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-3">Prompts</p>
              <ul className="space-y-2">
                {stage.prompts.map((p, i) => {
                  if (p === '') return <li key={i} className="h-2" />
                  const isReframe = p.startsWith('💬')
                  const isIndent = p.startsWith('↳')
                  const isPath = /^PATH [A-C]/.test(p)
                  const isAction = p.startsWith('↳ Action:')
                  return (
                    <li
                      key={i}
                      className={`text-sm leading-relaxed ${
                        isReframe
                          ? 'text-violet-300 font-medium pl-0'
                          : isPath
                          ? 'text-teal-400 font-semibold text-xs uppercase tracking-widest pt-1'
                          : isAction
                          ? 'text-amber-400/80 text-xs pl-4'
                          : isIndent
                          ? 'text-stone-400 pl-4'
                          : 'text-stone-300'
                      }`}
                    >
                      {p}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Tips */}
          {stage.tips && (
            <div className="bg-stone-900/50 border border-stone-800 rounded-xl p-4">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Coach Note</p>
              <p className="text-stone-400 text-sm leading-relaxed">{stage.tips}</p>
            </div>
          )}

          {/* Boundary */}
          {stage.boundary && (
            <div className="bg-red-950/30 border border-red-800/40 rounded-xl p-4">
              <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Boundary</p>
              <p className="text-red-300/80 text-sm leading-relaxed">{stage.boundary}</p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-800">
          <button
            onClick={() => setActiveStage(i => Math.max(0, i - 1))}
            disabled={isFirst}
            className="text-sm text-stone-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-4 py-2 rounded-lg hover:bg-stone-800"
          >
            ← Back
          </button>
          <span className="text-xs text-stone-600">{activeStage + 1} / {STAGES.length}</span>
          {isLast ? (
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="text-sm bg-teal-500 text-black font-semibold px-4 py-2 rounded-lg hover:bg-teal-400 transition-colors"
            >
              Back to client
            </Link>
          ) : (
            <button
              onClick={() => setActiveStage(i => Math.min(STAGES.length - 1, i + 1))}
              className="text-sm text-stone-400 hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-stone-800"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
