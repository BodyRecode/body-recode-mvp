'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

type Row = {
  id: string
  day_of_week: number
  start_time: string
  end_time: string
  slot_duration_minutes: number
  buffer_minutes: number
  session_type: string
  is_active: boolean
  coach_id?: string
}

function formatTime(t: string) {
  return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-AU', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

export default function AvailabilityManager({ rows }: { rows: Row[] }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)
  const [error, setError] = useState('')

  const [day, setDay] = useState(1)
  const [startTime, setStartTime] = useState('07:00')
  const [endTime, setEndTime] = useState('11:00')
  const [slotDuration, setSlotDuration] = useState(30)
  const [buffer, setBuffer] = useState(15)

  async function handleAdd() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayOfWeek: day,
          startTime,
          endTime,
          slotDurationMinutes: slotDuration,
          bufferMinutes: buffer,
          sessionType: 'zoom',
        }),
      })
      if (res.ok) {
        setAdding(false)
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
    await fetch(`/api/dashboard/availability?id=${id}`, { method: 'DELETE' })
    router.refresh()
    setRemoving(null)
  }

  async function handleToggle(id: string, current: boolean) {
    setToggling(id)
    await fetch('/api/dashboard/availability', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive: !current }),
    })
    router.refresh()
    setToggling(null)
  }

  return (
    <div className="space-y-4">
      {rows.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
          <p className="text-sm text-stone-600">No availability set up yet. Add a slot below.</p>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl divide-y divide-stone-800">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <span className={`text-sm font-medium ${row.is_active ? 'text-white' : 'text-stone-500'}`}>
                  {DAYS[row.day_of_week]}
                </span>
                <span className="text-xs text-stone-500 ml-2">
                  · {formatTime(row.start_time)} to {formatTime(row.end_time)} · {row.slot_duration_minutes} min slots · {row.buffer_minutes} min buffer
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(row.id, row.is_active)}
                  disabled={toggling === row.id}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    row.is_active
                      ? 'border-teal-500/40 text-teal-400 hover:bg-teal-500/10'
                      : 'border-stone-700 text-stone-500 hover:border-stone-600'
                  }`}
                >
                  {toggling === row.id ? '...' : row.is_active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => handleRemove(row.id)}
                  disabled={removing === row.id}
                  className="text-stone-600 hover:text-red-400 transition-colors text-xs"
                >
                  {removing === row.id ? '...' : '✕'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
        >
          + Add availability
        </button>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
          <p className="text-xs uppercase tracking-wider text-stone-500">New Availability Window</p>

          <div>
            <p className="text-xs text-stone-500 mb-2">Day</p>
            <div className="flex flex-wrap gap-2">
              {DAY_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    day === i
                      ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                      : 'border-stone-700 text-stone-400 hover:border-stone-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-2">Start time</p>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 w-full"
              />
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">End time</p>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-stone-800 border border-stone-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-stone-500 mb-2">Slot duration (min)</p>
              <div className="flex gap-2">
                {[30, 45, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setSlotDuration(d)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      slotDuration === d
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-500 mb-2">Buffer (min)</p>
              <div className="flex gap-2">
                {[0, 15, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setBuffer(d)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      buffer === d
                        ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                        : 'border-stone-700 text-stone-400 hover:border-stone-600'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-teal-500 text-black text-xs font-bold rounded-lg disabled:opacity-40 hover:bg-teal-400 transition-colors"
            >
              {saving ? 'Saving...' : 'Add'}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="px-4 py-2 text-xs text-stone-500 hover:text-stone-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
