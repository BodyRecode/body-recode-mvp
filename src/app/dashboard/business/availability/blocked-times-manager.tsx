'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Row = {
  id: string
  start_at: string
  end_at: string
  reason: string | null
}

function todayBrisbane() {
  return new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString().slice(0, 10)
}

function formatRange(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const date = s.toLocaleDateString('en-AU', { timeZone: 'Australia/Brisbane', weekday: 'short', day: 'numeric', month: 'short' })
  const from = s.toLocaleTimeString('en-AU', { timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true })
  const to = e.toLocaleTimeString('en-AU', { timeZone: 'Australia/Brisbane', hour: 'numeric', minute: '2-digit', hour12: true })
  return `${date} · ${from} to ${to}`
}

export default function BlockedTimesManager({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [date, setDate] = useState(todayBrisbane())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('17:00')
  const [reason, setReason] = useState('')

  async function handleAdd() {
    setSaving(true)
    setError('')
    try {
      const startAt = new Date(`${date}T${startTime}:00+10:00`).toISOString()
      const endAt = new Date(`${date}T${endTime}:00+10:00`).toISOString()
      const res = await fetch('/api/dashboard/blocked-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startAt, endAt, reason }),
      })
      if (res.ok) {
        setAdding(false)
        setReason('')
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

  async function handleRemove(id: string) {
    setRemoving(id)
    await fetch(`/api/dashboard/blocked-times?id=${id}`, { method: 'DELETE' })
    router.refresh()
    setRemoving(null)
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <p className="text-sm text-stone-400">No blocked times.</p>
        </div>
      ) : (
        <div className="bg-stone-100 border border-stone-200 rounded-xl divide-y divide-stone-200">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <span className="text-sm text-[#1A1A1A]">{formatRange(row.start_at, row.end_at)}</span>
                {row.reason && <span className="text-xs text-stone-500 ml-2">· {row.reason}</span>}
              </div>
              <button
                onClick={() => handleRemove(row.id)}
                disabled={removing === row.id}
                className="text-stone-400 hover:text-red-400 transition-colors text-xs ml-4"
              >
                {removing === row.id ? '...' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-blue-500 hover:text-blue-300 transition-colors"
        >
          + Block out time
        </button>
      ) : (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-6 space-y-4">
          <p className="text-xs uppercase tracking-wider text-stone-500">Block Out Time</p>

          <div>
            <p className="text-xs text-stone-500 mb-2">Date</p>
            <input
              type="date"
              value={date}
              min={todayBrisbane()}
              onChange={e => setDate(e.target.value)}
              className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-2">From</p>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">To</p>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <p className="text-xs text-stone-500 mb-2">Reason (optional)</p>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Doctor appointment"
              className="w-full bg-stone-200 border border-stone-300 rounded-lg px-3 py-2.5 text-sm text-[#1A1A1A] placeholder-stone-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-black text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-blue-500 transition-colors"
            >
              {saving ? 'Saving...' : 'Block time'}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="px-4 py-2 text-xs text-stone-500 hover:text-stone-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
