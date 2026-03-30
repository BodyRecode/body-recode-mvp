'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Status = 'active' | '12_week_complete' | 'extended' | 'withdrawn'

const STATUSES: { value: Status; label: string; colour: string }[] = [
  { value: 'active', label: 'Active', colour: 'text-teal-400 bg-teal-400/10 border-teal-400/30 hover:bg-teal-400/20' },
  { value: '12_week_complete', label: '12 Weeks Complete', colour: 'text-blue-300 bg-blue-400/10 border-blue-400/30 hover:bg-blue-400/20' },
  { value: 'extended', label: 'Extended', colour: 'text-violet-300 bg-violet-400/10 border-violet-400/30 hover:bg-violet-400/20' },
  { value: 'withdrawn', label: 'Withdrawn', colour: 'text-stone-400 bg-stone-800 border-stone-700 hover:bg-stone-700' },
]

export default function FoundingClientStatusManager({
  clientId,
  currentStatus,
}: {
  clientId: string
  currentStatus: string
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  async function updateStatus(status: Status) {
    if (status === currentStatus) { setOpen(false); return }
    setSaving(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ founding_client_status: status }),
    })
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs text-violet-400/60 hover:text-violet-400 transition-colors"
      >
        Update status
      </button>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-violet-400/10">
      <p className="text-xs text-stone-500 uppercase tracking-wider mb-2">Update status</p>
      <div className="grid grid-cols-2 gap-2">
        {STATUSES.map(s => (
          <button
            key={s.value}
            onClick={() => updateStatus(s.value)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 ${
              s.value === currentStatus
                ? s.colour + ' ring-1 ring-offset-1 ring-offset-stone-900 ring-current'
                : s.colour
            }`}
          >
            {s.value === currentStatus ? '✓ ' : ''}{s.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-stone-600 hover:text-stone-400 transition-colors mt-2"
      >
        Cancel
      </button>
    </div>
  )
}
