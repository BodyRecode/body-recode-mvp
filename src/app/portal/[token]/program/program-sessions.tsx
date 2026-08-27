'use client'

/**
 * Collapsible session list for the client program viewer. Each session is a
 * card that shows day + focus + exercise count; tapping it expands the full
 * workout (movement prep, blocks, exercises) in place. Keeps the page
 * scannable instead of dumping the whole block at once. First session is
 * expanded by default.
 */

import { useState } from 'react'

interface Exercise {
  exercise_name: string
  sets: number
  reps: string
  rpe: number | null
  rest: string
  notes: string
}
interface Block {
  block_label: string
  exercises: Exercise[]
}
interface Session {
  day_label: string
  skeleton: string
  movement_prep: string[]
  blocks: Block[]
}

function exerciseCount(s: Session): number {
  return (s.blocks ?? []).reduce((n, b) => n + (b.exercises?.length ?? 0), 0)
}

export default function ProgramSessions({ sessions }: { sessions: Session[] }) {
  const [open, setOpen] = useState<Set<number>>(() => new Set(sessions.length > 0 ? [0] : []))

  const toggle = (i: number) =>
    setOpen(prev => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div className="space-y-3">
      <p className="text-[12.5px] font-medium text-[#98A0AD]">Sessions</p>
      {sessions.map((session, si) => {
        const isOpen = open.has(si)
        const count = exerciseCount(session)
        return (
          <div key={si} className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-2xl overflow-hidden">
            {/* Header — tap to expand */}
            <button
              type="button"
              onClick={() => toggle(si)}
              aria-expanded={isOpen}
              className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-[#FAFAF7] transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#141821]">{session.day_label}</p>
                <p className="text-xs text-[#98A0AD] mt-0.5">{session.skeleton}{count > 0 ? ` · ${count} exercise${count === 1 ? '' : 's'}` : ''}</p>
              </div>
              <svg
                className={`w-4 h-4 text-[#98A0AD] shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="border-t border-[#E8EAEE]">
                {/* Movement prep */}
                {/* "3 sets" is ambiguous without this. See program-prompt SETS ARE WORKING SETS. */}
                <p className="text-xs text-[#666D7A] mb-3">
                  Sets shown are working sets. Warm-up sets are extra.
                </p>
                {session.movement_prep && session.movement_prep.length > 0 && (
                  <div className="px-5 py-3 border-b border-[#E8EAEE]/60">
                    <p className="text-[12.5px] font-semibold text-[#98A0AD] mb-2">Movement Preparation</p>
                    <ul className="space-y-1">
                      {session.movement_prep.map((item, i) => (
                        <li key={i} className="text-xs text-[#666D7A] flex gap-2">
                          <span className="text-[#98A0AD] shrink-0">·</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Blocks */}
                {session.blocks.map((block, bi) => (
                  <div key={bi} className="px-5 py-3 border-b border-[#E8EAEE]/40 last:border-0">
                    <p className="text-xs font-bold text-[#1B6DFC] uppercase tracking-widest mb-2">{block.block_label}</p>
                    <div className="space-y-3">
                      {block.exercises.map((ex, ei) => (
                        <div key={ei} className="flex flex-col gap-1">
                          <p className="text-sm font-semibold text-[#141821]">{ex.exercise_name}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className="text-xs bg-[#E8EAEE] text-[#43474F] px-2 py-0.5 rounded-lg">{ex.sets} × {ex.reps}</span>
                            {ex.rpe && <span className="text-xs bg-[#E8EAEE] text-[#666D7A] px-2 py-0.5 rounded-lg">RPE {ex.rpe}</span>}
                            {ex.rest && <span className="text-xs bg-[#E8EAEE] text-[#666D7A] px-2 py-0.5 rounded-lg">{ex.rest} rest</span>}
                          </div>
                          {ex.notes && <p className="text-xs text-[#98A0AD] leading-relaxed">{ex.notes}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
