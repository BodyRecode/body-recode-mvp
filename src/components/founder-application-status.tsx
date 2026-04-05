'use client'

import { useState } from 'react'

const STATUSES = [
  { value: 'under_review', label: 'Under Review', style: 'border-stone-700 text-stone-300 bg-stone-800' },
  { value: 'accepted', label: 'Accepted', style: 'border-teal-700 text-teal-300 bg-teal-950' },
  { value: 'declined', label: 'Declined', style: 'border-red-900 text-red-400 bg-red-950/40' },
  { value: 'waitlisted', label: 'Waitlisted', style: 'border-amber-800 text-amber-300 bg-amber-950/40' },
]

export default function FounderApplicationStatus({
  leadId,
  current,
}: {
  leadId: string
  current: string | null
}) {
  const [status, setStatus] = useState(current ?? 'under_review')
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)

  async function update(value: string) {
    setSaving(true)
    setOpen(false)
    try {
      await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ founder_application_status: value }),
      })
      setStatus(value)
    } catch {
      // revert on error
    } finally {
      setSaving(false)
    }
  }

  const current_style = STATUSES.find(s => s.value === status)?.style ?? STATUSES[0].style
  const current_label = STATUSES.find(s => s.value === status)?.label ?? 'Under Review'

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        disabled={saving}
        className={`text-xs font-bold px-3 py-1.5 rounded-full border uppercase tracking-wider transition-colors disabled:opacity-50 ${current_style}`}
      >
        {saving ? 'Saving...' : current_label}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 bg-stone-900 border border-stone-700 rounded-xl overflow-hidden shadow-xl z-10 min-w-[160px]">
          {STATUSES.map(s => (
            <button
              key={s.value}
              onClick={() => update(s.value)}
              className={`w-full text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-stone-800 ${
                s.value === status ? 'text-white' : 'text-stone-400'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
