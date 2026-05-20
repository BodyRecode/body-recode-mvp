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
        className="mt-4 pt-4 border-t border-stone-200 w-full text-left text-xs text-blue-500 hover:text-blue-300 transition-colors"
      >
        + Book a session
      </button>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-stone-200 space-y-3">
      <p className="text-xs text-stone-500 uppercase tracking-wider mb-1">Book a session</p>
      <div className="grid grid-cols-3 gap-2">
        <input
          type="date"
          value={date}
          min={todayBrisbane()}
          onChange={e => setDate(e.target.value)}
          className="col-span-1 bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500 w-full"
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
        />
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
        >
          {[45, 60, 75, 90].map(d => <option key={d} value={d}>{d} min</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-blue-500 text-black text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-blue-500 transition-colors"
        >
          {saving ? 'Saving...' : 'Confirm booking'}
        </button>
        <button
          onClick={() => { setOpen(false); setError('') }}
          className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
