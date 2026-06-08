'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Per-client opt-out toggle for the Weekly Check-In Auto-Response automation.
 * Default-on globally; coach flips off for any client where they want a
 * fully manual touch (high-stakes mid-program client, etc.).
 *
 * Sits inside the Weekly Synthesis MajorSection on /dashboard/clients/[id].
 */
export default function AutoResponseToggle({
  clientId,
  initialEnabled,
}: {
  clientId: string
  initialEnabled: boolean
}) {
  const router = useRouter()
  const [enabled, setEnabled] = useState(initialEnabled)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    const next = !enabled
    setPending(true); setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/auto-checkin-response`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Toggle failed'); return }
      setEnabled(next)
      router.refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="rounded-lg border border-[#E5E5E5] bg-white px-4 py-3 flex items-center justify-between gap-3 flex-wrap mb-4">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B6DFC]">Auto check-in response</p>
        <p className="text-xs text-[#6B6B6B] mt-1 leading-relaxed">
          {enabled
            ? 'On — when this client submits a check-in, an AI draft is generated and auto-sent 4 hours later unless you intervene. You can Edit, Send-now, or Skip from the response form during the window.'
            : 'Off — you write every check-in response manually for this client. The check-in still appears in Today\'s Focus as "needs response".'}
        </p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
          enabled
            ? 'bg-[#1B6DFC] text-white hover:bg-[#1057CC]'
            : 'bg-white border border-[#E5E5E5] text-[#6B6B6B] hover:border-[#1B6DFC] hover:text-[#1B6DFC]'
        }`}
        aria-pressed={enabled}
      >
        <span className={`inline-block w-7 h-4 rounded-full relative transition-colors ${enabled ? 'bg-white/30' : 'bg-[#E5E5E5]'}`}>
          <span className={`absolute top-0.5 ${enabled ? 'left-3.5 bg-white' : 'left-0.5 bg-[#6B6B6B]'} w-3 h-3 rounded-full transition-all`} />
        </span>
        {pending ? 'Working…' : enabled ? 'On' : 'Off'}
      </button>
    </div>
  )
}
