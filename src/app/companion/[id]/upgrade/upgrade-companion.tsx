'use client'

import { useState } from 'react'
import Link from 'next/link'
import { TWO_SESSION_PACKAGE_VALUES, THREE_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'

const STAGES = [
  {
    id: 1,
    name: 'Performance Check',
    duration: '3-5 min',
    goal: 'Confirm the client is progressing and consistently engaged before raising the conversation.',
    prompts: [
      'How are they feeling about their consistency lately?',
      '↳ What has felt easiest to hold? What has taken more effort?',
      'Looking back from when they started - what is the most noticeable shift?',
      '↳ Not just physical. Energy, clarity, approach to training.',
      'IF POSITIVE → they are showing the patterns you want to see before continuing.',
      'IF CONCERNS → acknowledge, note, address in Stage 3 if relevant. Do not move forward until they feel heard.',
    ],
    tips: 'This is a genuine readiness check, not a setup. If they are struggling to complete 2 sessions consistently, this is not the right time. Only continue if they are clearly progressing.',
    boundary: 'Do not raise the upgrade if the client is inconsistent, stressed, or flagging capacity issues.',
  },
  {
    id: 2,
    name: 'The Case for More',
    duration: '3-5 min',
    goal: 'Frame additional training volume as the natural next step for someone who is responding and ready.',
    prompts: [
      'Have they noticed faster recovery over the last few weeks?',
      '↳ Sleep quality, soreness between sessions, energy levels.',
      'IF YES → point to it as a physiological signal - capacity is there.',
      'IF UNSURE → walk through the CFWS readiness data together.',
      'How do they feel about where results are heading at the current pace?',
      '↳ IF SATISFIED → a third session is about compounding that faster.',
      '↳ IF WANTING MORE → that is exactly what more frequency addresses.',
    ],
    tips: 'Lead with the data, not the desire to sell. Point to CFWS readiness scores or check-in trends. The case is strongest when it comes from observation, not opinion.',
    boundary: null,
  },
  {
    id: 3,
    name: 'Present the Offer',
    duration: '2-3 min',
    goal: 'State the upgrade clearly - what changes, what it costs, what it compounds.',
    prompts: [
      'State the current package and what moves to 3x.',
      'Cover: what stays the same (check-ins, interpretation, nutrition), what changes (session frequency).',
      'Mention no lock-in - if it does not feel right, they scale back.',
      '↳ PAUSE. Let them respond.',
      'IF IMMEDIATE INTEREST → lock in the third slot.',
      'IF HESITATION → move to Stage 4.',
      'IF THEY ASK WHAT CHANGES → session frequency only. Everything else stays identical.',
    ],
    tips: 'Keep this short. State the current package, the new package, the difference. The case was made in Stage 2 - this is just the clarity conversation.',
    boundary: 'Do not justify the upgrade by listing features they already have. They know what they are getting.',
  },
  {
    id: 4,
    name: 'Objections',
    duration: '3-5 min',
    goal: 'Address hesitation with honest, specific responses. Do not oversell or pressure.',
    prompts: [
      '💬 COST - Reframe weekly cost increase against the time cost of a slower result.',
      '💬 TIME - Three sessions does not necessarily mean a longer week. One slot can be shortened.',
      '💬 NOT SURE IF READY - You would not raise this if the data did not support it. They do not have to decide today.',
      '💬 WANTING TO STAY AT 2X - Completely valid. The 2x model produces results. This is just an option when they are ready.',
    ],
    tips: 'The goal is not to close at all costs. A client who feels pressured churns. A client who feels respected and informed upgrades when they are ready.',
    boundary: 'Do not use Founding Client framing here. This is an upgrade for an active client, not a discount mechanism.',
  },
  {
    id: 5,
    name: 'Close or Defer',
    duration: '1-2 min',
    goal: 'Get a clear outcome - yes, or a defined revisit point. Do not leave it open-ended.',
    prompts: [
      'PATH A - THEY ARE IN',
      '↳ Lock in the third session slot and update billing.',
      '↳ Action: Update package to 3x in the dashboard. Schedule additional session.',
      '',
      'PATH B - NOT YET',
      '↳ Acknowledge it and set a specific revisit point (4 weeks).',
      '↳ Action: Add a note in the client record. Revisit in 4 weeks.',
      '',
      'PATH C - NEEDS TO THINK',
      '↳ Give them a few days and commit to following up by a specific day.',
      '↳ Action: Set a follow-up reminder.',
    ],
    tips: 'Always leave with a defined next action, even if the answer is no. An open-ended "think about it" disappears.',
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

  const isUpgradeCandidate = TWO_SESSION_PACKAGE_VALUES.includes(currentPackage as never) && (weekNumber ?? 0) >= 8
  const isThreeSession = THREE_SESSION_PACKAGE_VALUES.includes(currentPackage as never)

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
            isThreeSession
              ? 'bg-teal-900/30 text-teal-400 border-teal-800/50'
              : 'bg-amber-900/30 text-amber-400 border-amber-800/50'
          }`}>
            {isThreeSession ? '3x - Already upgraded' : '2x - Upgrade candidate'}
          </span>
        </div>
      </div>

      {/* Not yet ready warning */}
      {!isUpgradeCandidate && !isThreeSession && (
        <div className="mx-6 mt-6 bg-amber-950/40 border border-amber-800/50 rounded-xl px-5 py-4">
          <p className="text-amber-300 text-sm font-medium">Early stage client</p>
          <p className="text-amber-400/70 text-xs mt-1">
            {clientName} is at Week {weekNumber ?? 0}. The upgrade conversation works best at Week 8+ when consistent patterns are visible in the data.
          </p>
        </div>
      )}

      {isThreeSession && (
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
