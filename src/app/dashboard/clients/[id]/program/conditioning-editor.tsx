'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Coach-editable Conditioning / Cardio prescription for a program. Interim home
 * for cardio (running etc.) until the conditioning modality generates it.
 * Renders on the coach program page; the saved text also shows in the client
 * portal alongside the sessions.
 */
export default function ConditioningEditor({
  clientId,
  programId,
  initial,
}: {
  clientId: string
  programId: string
  initial: string | null
}) {
  const router = useRouter()
  const [value, setValue] = useState(initial ?? '')
  const [saved, setSaved] = useState(initial ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const dirty = value !== saved

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/program-conditioning`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId, conditioning: value }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error || `HTTP ${res.status}`)
      }
      setSaved(value)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        <p className="text-[10px] font-medium text-[#1B6DFC]">Conditioning / Cardio</p>
        <span className="text-[10px] text-[#98A0AD]">shown to the client with their program</span>
      </div>
      <textarea
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        placeholder="e.g. 1-2 easy runs per week, 5-6km, conversational pace, on non-lifting days. No intervals, tempo, or long runs this phase. Ease off if the Achilles complains."
        className="w-full resize-none text-sm text-[#141821] border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
      />
      {error && <p className="text-[12.5px] text-red-600 mt-1">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          onClick={save}
          disabled={!dirty || saving || isPending}
          className="text-[13px] font-semibold px-4 py-2 rounded-lg bg-[#1B6DFC] text-[#FFFFFF] hover:bg-[#1560E0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? 'Saving…' : dirty ? 'Save conditioning' : 'Saved'}
        </button>
      </div>
    </div>
  )
}
