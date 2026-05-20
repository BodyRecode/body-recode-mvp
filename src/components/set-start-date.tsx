'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SetStartDate({ clientId, currentDate }: { clientId: string; currentDate?: string }) {
  const router = useRouter()
  const [date, setDate] = useState(currentDate ? currentDate.split('T')[0] : '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!date) return
    setSaving(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coaching_started_at: new Date(date).toISOString() }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3">
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="bg-[#E5E5E5] border border-[#E5E5E5] text-[#1A1A1A] text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-blue-600 transition-colors"
      />
      <button
        onClick={save}
        disabled={saving || !date}
        className="text-sm font-bold px-4 py-2 bg-[#1B6DFC] text-[#1A1A1A] rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : saved ? 'Saved!' : 'Set Date'}
      </button>
    </div>
  )
}
