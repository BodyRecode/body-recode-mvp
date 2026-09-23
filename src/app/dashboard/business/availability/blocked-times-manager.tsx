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
        <div className="bg-[#1A1E26] br-card p-5">
          <p className="text-sm text-[#676D76]">No blocked times.</p>
        </div>
      ) : (
        <div className="bg-[#1A1E26] br-card divide-y divide-[#1F242C]">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <span className="text-sm text-[#FAFAF8]">{formatRange(row.start_at, row.end_at)}</span>
                {row.reason && <span className="text-[12.5px] text-[#8A9099] ml-2">· {row.reason}</span>}
              </div>
              <button
                onClick={() => handleRemove(row.id)}
                disabled={removing === row.id}
                className="text-[#676D76] hover:text-[#D4817E] transition-colors text-[12.5px] ml-4"
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
          className="text-[12.5px] text-[#FAFAF8] hover:text-[#1056D6] transition-colors"
        >
          + Block out time
        </button>
      ) : (
        <div className="bg-[#1A1E26] br-card p-6 space-y-4">
          <p className="text-[12.5px] text-[#8A9099]">Block Out Time</p>

          <div>
            <p className="text-[12.5px] text-[#8A9099] mb-2">Date</p>
            <input
              type="date"
              value={date}
              min={todayBrisbane()}
              onChange={e => setDate(e.target.value)}
              className="bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
            />
          </div>

          <div className="flex gap-4">
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">From</p>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
              />
            </div>
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">To</p>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8]"
              />
            </div>
          </div>

          <div>
            <p className="text-[12.5px] text-[#8A9099] mb-2">Reason (optional)</p>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Doctor appointment"
              className="w-full bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] placeholder-[#676D76] focus:outline-none focus:border-[#FAFAF8]"
            />
          </div>

          {error && <p className="text-[12.5px] text-[#D4817E]">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-[#FAFAF8] text-[#0B0D10] text-[12.5px] font-medium rounded-lg disabled:opacity-40 hover:bg-[#E4E4E0] transition-colors"
            >
              {saving ? 'Saving...' : 'Block time'}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="px-4 py-2 text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
