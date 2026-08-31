'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { parseApiResponse } from '@/lib/parse-api-response'

/**
 * Per-client switch for daily meal-adherence logging.
 *
 * OFF by default (clients.meal_logging_enabled, 2026-07-30). It used to be on
 * for everyone, and across the system's whole history it had been used once:
 * one client, one day, three entries. A daily food log is the most
 * surveillance-shaped thing in the portal, and on a stabilisation plan whose own
 * text calls repetition and low decision burden the mechanism, a daily logging
 * task works directly against the prescription.
 *
 * It is worth switching on for one situation, which the weekly check-in cannot
 * cover: a plan that is failing where the coach needs to know WHICH meal fails
 * and when. "She struggled this week" is a summary; "meal 3 gets skipped on
 * office days" is something you can act on.
 */
export default function MealLoggingToggle({
  clientId, enabled, clientFirstName,
}: {
  clientId: string
  enabled: boolean
  clientFirstName: string
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle() {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meal_logging_enabled: !enabled }),
      })
      const { ok, data, error: apiError } = await parseApiResponse<{ error?: string }>(res)
      if (!ok) { setError(apiError || data?.error || 'Could not save'); return }
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E8EAEE] bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#141821]">Daily meal logging</p>
          <p className="text-[12.5px] text-[#666D7A] mt-1 leading-relaxed">
            {enabled
              // No pronoun: this said "her nutrition plan" for every client,
              // including the men. The client's own name and "their" carry it.
              ? `${clientFirstName} sees a "Log today's meals" button on their nutrition plan and can mark each meal as eaten, swapped or skipped.`
              : 'Off. The weekly check-in already asks whether the plan was followed. Switch this on only when a plan is failing and you need to know which meal, and when.'}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={busy}
          className={`flex-none px-4 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-40 ${
            enabled
              ? 'bg-[#EFF1F4] text-[#141821] hover:bg-[#E8EAEE]'
              : 'bg-[#1B6DFC] text-white hover:bg-[#1560E0]'
          }`}
        >
          {busy ? 'Saving…' : enabled ? 'Turn off' : 'Turn on'}
        </button>
      </div>
      {error && <p className="text-[12.5px] text-[#C82626] mt-3">{error}</p>}
    </div>
  )
}
