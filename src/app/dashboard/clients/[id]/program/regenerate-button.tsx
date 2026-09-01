'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, RefreshCcw } from 'lucide-react'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { parseApiResponse } from '@/lib/parse-api-response'

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
 * generator surface in the dashboard.
 *
 * 2026-07-20: switched from blocking fetch to fire-and-poll UX. The
 * server can take 60-120s, and browsers (or the Vercel edge) frequently
 * abort long-idle fetches around 60s with a "failed to fetch" — but the
 * server keeps running and saves the draft. Previously the coach saw
 * "Could not regenerate" while the draft was actually landing behind
 * them. Now: fire the POST, and REGARDLESS of whether it succeeds or
 * fails at the network layer, poll the page state every 15s until either
 *  (a) the fetch returns with a real response, or
 *  (b) 3 minutes pass without a resolution.
 * The coach sees the progress overlay throughout and the draft appears
 * on the page when the server finishes.
 */
export default function RegenerateButton({ programId }: { programId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timersRef = useRef<{ pollId: ReturnType<typeof setInterval> | null; giveUpId: ReturnType<typeof setTimeout> | null }>({ pollId: null, giveUpId: null })

  useEffect(() => {
    return () => {
      if (timersRef.current.pollId !== null) clearInterval(timersRef.current.pollId)
      if (timersRef.current.giveUpId !== null) clearTimeout(timersRef.current.giveUpId)
    }
  }, [])

  const stopTimers = () => {
    if (timersRef.current.pollId !== null) {
      clearInterval(timersRef.current.pollId)
      timersRef.current.pollId = null
    }
    if (timersRef.current.giveUpId !== null) {
      clearTimeout(timersRef.current.giveUpId)
      timersRef.current.giveUpId = null
    }
  }

  const regenerate = async () => {
    if (busy) return
    if (!confirm('Regenerate this draft? The current draft will be replaced. Coach guidance on the macro arc will be applied.')) return
    setError(null)
    setBusy(true)

    // Fire-and-poll: refresh every 15s so the draft appears as soon as
    // the server saves it, and hard-give-up at 3 minutes.
    timersRef.current.pollId = setInterval(() => {
      startTransition(() => router.refresh())
    }, 15_000)
    timersRef.current.giveUpId = setTimeout(() => {
      stopTimers()
      startTransition(() => router.refresh())
      setBusy(false)
    }, 3 * 60 * 1000)

    try {
      const res = await fetch('/api/regenerate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
      })
      stopTimers()
      if (!res.ok) {
        const { data, error: apiError } = await parseApiResponse<any>(res)
        setError(apiError || data?.error || `Server returned ${res.status}`)
        setBusy(false)
        return
      }
      startTransition(() => router.refresh())
      setBusy(false)
    } catch (e) {
      // Network-layer failure (browser aborted long fetch, connection
      // dropped, etc). Server likely still running. Do NOT clear timers
      // and do NOT show an error — the polling above continues and the
      // draft will appear when the server saves it. Overlay stays up.
      void e
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
        disclaimer="Program regeneration uses Claude Sonnet 5 for high-accuracy constraint satisfaction across exercise selection, set / rep design, RPE, and RRS recovery clamps. Typical: 60 to 120 seconds. The page is not frozen, please don't refresh."
      />
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
  )
}
