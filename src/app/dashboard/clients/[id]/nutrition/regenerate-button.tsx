'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw } from 'lucide-react'

/**
 * NutritionRegenerateButton
 *
 * One-click regeneration of a nutrition plan (draft or active). Calls
 * /api/regenerate-nutrition with the plan_id; the route re-derives generation
 * inputs server-side from the existing plan row + latest intake, then
 * forwards to /api/generate-nutrition. coach_guidance saved on the plan
 * (via the inline editor) is inherited on that pass and steers the new draft.
 *
 * generate-nutrition auto-replaces any existing draft for the client, so this
 * button doesn't need to delete anything first.
 *
 * Mirrors src/app/dashboard/clients/[id]/program/regenerate-button.tsx.
 *
 * While busy, surfaces a full-screen overlay with a synthetic staged
 * timeline + elapsed-seconds counter — same pattern as the Generate flow
 * (see nutrition-suggest.tsx). Nutrition regen runs through the full
 * Sonnet 4.6 pipeline (60-90s typical) and a silent wait read as a frozen
 * page.
 */
export default function NutritionRegenerateButton({ nutritionPlanId }: { nutritionPlanId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)

  // Tick a 1Hz timer while regenerating so the overlay shows elapsed seconds
  // and progresses through synthetic stages. Sonnet 4.6 emits the plan in one
  // shot (no streaming), so we can't show real progress — but a staged
  // timeline based on elapsed seconds gives the same psychological affordance
  // and stops the wait from feeling broken.
  useEffect(() => {
    if (!busy) {
      setElapsed(0)
      return
    }
    const t = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(t)
  }, [busy])

  const stages: Array<{ start: number; label: string }> = [
    { start: 0, label: 'Reading existing plan inputs (entry state, body state, anchors, overrides)' },
    { start: 3, label: 'Reading latest CFFS, medications, dietary context, coach guidance' },
    { start: 8, label: 'Drafting 3 candidate plans in parallel (fast model)' },
    { start: 40, label: 'Validating each candidate against doctrine rules' },
    { start: 50, label: 'Escalating to higher-accuracy model if no candidate passed' },
    { start: 95, label: 'Polishing the higher-accuracy plan' },
    { start: 135, label: 'Taking longer than usual, give it another moment' },
  ]
  const currentStage = [...stages].reverse().find(s => elapsed >= s.start) ?? stages[0]

  const regenerate = async () => {
    if (busy) return
    if (!confirm('Regenerate this nutrition plan? Any existing draft will be replaced. Coach guidance on the plan will be applied.')) return
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/regenerate-nutrition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nutrition_plan_id: nutritionPlanId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      // Scroll to top BEFORE refresh so the coach lands on the new Draft
      // banner. Without this the page re-renders in place and the coach keeps
      // looking at the (now superseded) active plan they clicked from — read
      // as "regen didn't change anything".
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not regenerate')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {busy && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center px-6">
          <div className="bg-white border border-stone-200 rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative w-3 h-3">
                <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
                <div className="relative w-3 h-3 bg-blue-500 rounded-full" />
              </div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Regenerating Plan</p>
              <span className="ml-auto text-xs font-mono text-stone-500 tabular-nums">{elapsed}s</span>
            </div>
            <p className="text-sm text-stone-700 leading-relaxed mb-4 min-h-[2.5rem]">
              {currentStage.label}…
            </p>
            <div className="space-y-1.5">
              {stages.filter(s => s.start < 100).map((s, i) => {
                const done = elapsed >= (stages[i + 1]?.start ?? Infinity)
                const active = currentStage.start === s.start
                return (
                  <div key={s.start} className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${done ? 'bg-blue-500' : active ? 'bg-blue-300 animate-pulse' : 'bg-stone-300'}`} />
                    <span className={`text-xs ${done ? 'text-stone-500 line-through' : active ? 'text-stone-800' : 'text-stone-400'}`}>{s.label}</span>
                  </div>
                )
              })}
            </div>
            <p className="text-[11px] text-stone-400 mt-4 leading-relaxed">
              Nutrition regeneration uses Claude Sonnet 4.6 for high-accuracy constraint satisfaction. Typical regen: 60 to 90 seconds. The page is not frozen. Please don&apos;t refresh.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col items-end gap-1">
        <button
          onClick={regenerate}
          disabled={busy || isPending}
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 border border-stone-300 text-stone-700 rounded-lg hover:border-stone-500 hover:text-[#1A1A1A] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy || isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
          {busy ? 'Regenerating...' : isPending ? 'Loading...' : 'Regenerate with guidance'}
        </button>
        {error && <p className="text-[11px] text-amber-700">{error}</p>}
      </div>
    </>
  )
}
