'use client'

import { useState, useTransition } from 'react'
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
 */
export default function NutritionRegenerateButton({ nutritionPlanId }: { nutritionPlanId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not regenerate')
    } finally {
      setBusy(false)
    }
  }

  return (
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
  )
}
