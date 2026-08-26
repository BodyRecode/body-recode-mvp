'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function todayBrisbane(): string {
  // Returns YYYY-MM-DD in Brisbane time
  return new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

export default function AddSessionForm({ clientId, defaultDuration }: { clientId: string; defaultDuration: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState(todayBrisbane)
  const [time, setTime] = useState('07:00')
  const [duration, setDuration] = useState(defaultDuration)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!date || !time) return
    setSaving(true)
    setError('')
    try {
      const brisbaneIso = `${date}T${time}:00+10:00`
      const utcIso = new Date(brisbaneIso).toISOString()

      const res = await fetch('/api/dashboard/clients/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, scheduledAt: utcIso, durationMinutes: duration }),
      })
      if (res.ok) {
        setOpen(false)
        setDate(todayBrisbane())
        setTime('07:00')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed to save.')
      }
    } catch {
      setError('Something went wrong.')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-4 pt-4 border-t border-[#E8EAEE] w-full text-left text-[12.5px] text-[#1B6DFC] hover:text-[#1056D6] transition-colors"
      >
        + Book a session
      </button>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-[#E8EAEE] space-y-3">
      <p className="text-[12.5px] text-[#666D7A] mb-1">Book a session</p>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="date"
          value={date}
          min={todayBrisbane()}
          onChange={e => setDate(e.target.value)}
          className="col-span-1 bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC] w-full"
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
        />
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-sm text-[#141821] focus:outline-none focus:border-[#1B6DFC]"
        >
          {[45, 60, 75, 90].map(d => <option key={d} value={d}>{d} min</option>)}
        </select>
      </div>
      {error && <p className="text-[12.5px] text-[#C82626]">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-[#1B6DFC] text-white text-[12.5px] font-medium rounded-lg disabled:opacity-40 hover:bg-[#1560E0] transition-colors"
        >
          {saving ? 'Saving...' : 'Confirm booking'}
        </button>
        <button
          onClick={() => { setOpen(false); setError('') }}
          className="px-4 py-2 text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
