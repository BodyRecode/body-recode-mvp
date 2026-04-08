'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AddSessionForm({ clientId, defaultDuration }: { clientId: string; defaultDuration: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('07:00')
  const [duration, setDuration] = useState(defaultDuration)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!date || !time) return
    setSaving(true)
    setError('')
    try {
      // Convert Brisbane date+time to UTC ISO
      const brisbaneIso = `${date}T${time}:00+10:00`
      const utcIso = new Date(brisbaneIso).toISOString()

      const res = await fetch('/api/dashboard/clients/add-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, scheduledAt: utcIso, durationMinutes: duration }),
      })
      if (res.ok) {
        setOpen(false)
        setDate('')
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
        className="mt-4 pt-4 border-t border-stone-800 w-full text-left text-xs text-teal-400 hover:text-teal-300 transition-colors"
      >
        + Book a session
      </button>
    )
  }

  return (
    <div className="mt-4 pt-4 border-t border-stone-800 space-y-3">
      <p className="text-xs text-stone-500 uppercase tracking-wider">Book a session</p>
      <div className="flex gap-2">
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="flex-1 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
        />
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
        />
        <select
          value={duration}
          onChange={e => setDuration(Number(e.target.value))}
          className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-teal-500"
        >
          {[45, 60, 75, 90].map(d => <option key={d} value={d}>{d}m</option>)}
        </select>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={!date || saving}
          className="px-4 py-2 bg-teal-500 text-black text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-teal-400 transition-colors"
        >
          {saving ? 'Saving...' : 'Confirm'}
        </button>
        <button
          onClick={() => { setOpen(false); setError('') }}
          className="px-4 py-2 text-xs text-stone-500 hover:text-stone-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
