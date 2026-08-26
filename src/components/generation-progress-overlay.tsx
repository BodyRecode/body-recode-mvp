'use client'

import { useEffect, useState } from 'react'

/**
 * Full-screen generation progress overlay.
 *
 * Wraps the existing pattern from the nutrition Generate flow into a reusable
 * shape so PR, FR, NR, and any future LLM-backed Generate / Regenerate can
 * surface the same "what's happening right now" affordance instead of a
 * silent button-spinner that reads as a frozen page.
 *
 * Stages are derived from elapsed time, not real streaming progress — the
 * underlying calls don't stream and we can't truly know which stage the
 * pipeline is in. But a staged readout matched to the actual pipeline shape
 * gives the same psychological affordance and stops the wait from feeling
 * broken.
 *
 * Usage:
 *   <GenerationProgressOverlay
 *     active={generating}
 *     title="Program Reading"
 *     stages={[
 *       { start: 0,  label: 'Reading CFFS + active program block' },
 *       { start: 5,  label: 'Drafting the 5 reading sections' },
 *       { start: 20, label: 'Scanning for banned client-facing terms' },
 *       { start: 25, label: 'Auto-retrying if any leaks were caught' },
 *       { start: 45, label: 'Taking longer than usual, give it another moment' },
 *     ]}
 *     disclaimer="Reading generation uses Claude Haiku 4.5. Typical: 20 to 40 seconds. The page is not frozen, please don't refresh."
 *   />
 */
export interface GenerationStage {
  /** Seconds elapsed at which this stage label takes over. Sorted ascending. */
  start: number
  label: string
}

export default function GenerationProgressOverlay({
  active,
  title,
  stages,
  disclaimer,
}: {
  active: boolean
  title: string
  stages: GenerationStage[]
  disclaimer?: string
}) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!active) {
      setElapsed(0)
      return
    }
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [active])

  if (!active) return null

  const currentStage = [...stages].reverse().find(s => elapsed >= s.start) ?? stages[0]
  // The bullet list shows every stage with a "tail" stage that fires when
  // the run is taking unusually long. We hide that tail stage in the bullet
  // list so the list reads as the expected pipeline, not as a stretch zone.
  const visibleStages = stages.filter((s, i, arr) => i < arr.length - 1)

  return (
    <div className="fixed inset-0 z-50 bg-[#141821]/60 backdrop-blur-sm flex items-center justify-center px-6">
      <div className="bg-white border border-[#EFF1F4] rounded-xl shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="relative w-3 h-3">
            <div className="absolute inset-0 bg-[#1B6DFC] rounded-full animate-ping opacity-75" />
            <div className="relative w-3 h-3 bg-[#1B6DFC] rounded-full" />
          </div>
          <p className="text-[12px] font-medium text-[#1560E0]">{title}</p>
          <span className="ml-auto text-[12.5px] font-mono text-[#666D7A] tabular-nums">{elapsed}s</span>
        </div>
        <p className="text-sm text-[#43474F] leading-relaxed mb-4 min-h-[2.5rem]">
          {currentStage.label}…
        </p>
        <div className="space-y-1.5">
          {visibleStages.map((s, i) => {
            const done = elapsed >= (stages[i + 1]?.start ?? Infinity)
            const active = currentStage.start === s.start
            return (
              <div key={s.start} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-[#1B6DFC]' : active ? 'bg-[#9CC0FB] animate-pulse' : 'bg-[#E8EAEE]'}`} />
                <span className={`text-xs ${done ? 'text-[#666D7A] line-through' : active ? 'text-[#141821]' : 'text-[#98A0AD]'}`}>{s.label}</span>
              </div>
            )
          })}
        </div>
        {disclaimer && (
          <p className="text-[11px] text-[#98A0AD] mt-4 leading-relaxed">{disclaimer}</p>
        )}
      </div>
    </div>
  )
}
