'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw } from 'lucide-react'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

/**
 * RegenerateButton
 *
 * One-click regeneration of the current draft program. Calls
 * /api/regenerate-program with the program_id; the route re-derives all
 * generation inputs server-side from the existing program row + linked
 * plan_block + latest intake/cffs, then forwards to /api/generate-program.
 * Coach guidance saved on the parent training_plan is read on that pass and
 * steers the new draft.
 *
 * Generate-program already auto-replaces the draft for the client, so this
 * button doesn't need to delete anything first.
 *
 * 2026-07-05: added GenerationProgressOverlay to match every other
 * generator surface in the dashboard. Previously the only feedback was a
 * 12px inline spinner on the button itself, so the coach had no clear
 * signal that anything was happening during the 60-120s Sonnet call.
 * Kade hit this on Amanda's Block 2 regen with new coach guidance —
 * clicked, waited, thought it was frozen.
 */
export default function RegenerateButton({ programId }: { programId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const regenerate = async () => {
    if (busy) return
    if (!confirm('Regenerate this draft? The current draft will be replaced. Coach guidance on the macro arc will be applied.')) return
    setError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/regenerate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
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
      <GenerationProgressOverlay
        active={busy}
        title="Regenerating Training Program"
        stages={[
          { start: 0,   label: 'Reading CFFS, active recovery state, intake, and coach guidance' },
          { start: 6,   label: 'Drafting per-session structure (primaries, accessories, sets / reps / RPE)' },
          { start: 40,  label: 'Applying coach guidance and RRS clamps to the prescription' },
          { start: 70,  label: 'Validating against doctrine ceilings and eligibility floors' },
          { start: 90,  label: 'Replacing the previous draft and redirecting to the program view' },
          { start: 130, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Program regeneration uses Claude Sonnet 4.6 for high-accuracy constraint satisfaction across exercise selection, set / rep design, RPE, and RRS recovery clamps. Typical: 60 to 120 seconds. The page is not frozen, please don't refresh."
      />
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
