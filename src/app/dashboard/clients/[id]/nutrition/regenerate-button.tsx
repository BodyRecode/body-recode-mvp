'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw } from 'lucide-react'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { parseApiResponse } from '@/lib/parse-api-response'

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
 * While busy, surfaces the shared GenerationProgressOverlay with stages
 * matched to the nutrition pipeline (Sonnet 5, 60-90s typical, includes
 * validator escalation).
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
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) throw new Error(apiError || data?.error || `Server returned ${res.status}`)
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
      <GenerationProgressOverlay
        active={busy}
        title="Regenerating Nutrition Plan"
        stages={[
          { start: 0,   label: 'Reading existing plan inputs (entry state, body state, anchors, overrides)' },
          { start: 3,   label: 'Reading latest CFFS, medications, dietary context, coach guidance' },
          { start: 8,   label: 'Drafting 3 candidate plans in parallel (Claude Haiku 4.5)' },
          { start: 40,  label: 'Validating each candidate against doctrine rules' },
          { start: 50,  label: 'Escalating to Claude Sonnet 5 if no candidate passed' },
          { start: 95,  label: 'Polishing the higher-accuracy plan' },
          { start: 135, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Nutrition regeneration uses Claude Haiku 4.5 with Sonnet 5 escalation for high-accuracy constraint satisfaction. Typical: 60 to 90 seconds. The page is not frozen, please don't refresh."
      />

      <div className="flex flex-col items-end gap-1">
        <button
          onClick={regenerate}
          disabled={busy || isPending}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 border border-[#E8EAEE] text-[#141821] rounded-lg hover:border-[#CFD4DC] hover:text-[#141821] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy || isPending ? <Loader2 size={12} className="animate-spin" /> : <RefreshCcw size={12} />}
          {busy ? 'Regenerating...' : isPending ? 'Loading...' : 'Regenerate with guidance'}
        </button>
        {error && <p className="text-[11px] text-[#A96A12]">{error}</p>}
      </div>
    </>
  )
}
