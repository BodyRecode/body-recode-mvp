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
        <div className="bg-[#1A1E26] br-card p-6">
          <p className="text-sm text-[#676D76]">No availability set up yet. Add a slot below.</p>
        </div>
      ) : (
        <div className="bg-[#1A1E26] br-card divide-y divide-[#1F242C]">
          {rows.map(row => (
            <div key={row.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <span className={`text-sm font-medium ${row.is_active ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}`}>
                  {DAYS[row.day_of_week]}
                </span>
                <span className="text-[12.5px] text-[#8A9099] ml-2">
                  · {formatTime(row.start_time)} to {formatTime(row.end_time)} · {row.slot_duration_minutes} min slots · {row.buffer_minutes} min buffer
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggle(row.id, row.is_active)}
                  disabled={toggling === row.id}
                  className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                    row.is_active
                      ? 'border-[#9CC0FB] text-[#FAFAF8] hover:bg-[rgba(27,109,252,0.06)]'
                      : 'border-[#2A2F39] text-[#8A9099] hover:border-[#2A2F39]'
                  }`}
                >
                  {toggling === row.id ? '...' : row.is_active ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => handleRemove(row.id)}
                  disabled={removing === row.id}
                  className="text-[#676D76] hover:text-[#D4817E] transition-colors text-[12.5px]"
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
          className="text-[12.5px] text-[#FAFAF8] hover:text-[#1056D6] transition-colors"
        >
          + Add availability
        </button>
      ) : (
        <div className="bg-[#1A1E26] br-card p-6 space-y-5">
          <p className="text-[12.5px] text-[#8A9099]">New Availability Window</p>

          <div>
            <p className="text-[12.5px] text-[#8A9099] mb-2">Day</p>
            <div className="flex flex-wrap gap-2">
              {DAY_SHORT.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    day === i
                      ? 'border-[#FAFAF8] bg-[rgba(27,109,252,0.08)] text-[#FAFAF8]'
                      : 'border-[#2A2F39] text-[#8A9099] hover:border-[#2A2F39]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">Start time</p>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8] w-full"
              />
            </div>
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">End time</p>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="bg-[#1F242C] border border-[#2A2F39] rounded-lg px-3 py-2.5 text-sm text-[#FAFAF8] focus:outline-none focus:border-[#FAFAF8] w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">Slot duration (min)</p>
              <div className="flex gap-2">
                {[30, 45, 60].map(d => (
                  <button
                    key={d}
                    onClick={() => setSlotDuration(d)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      slotDuration === d
                        ? 'border-[#FAFAF8] bg-[rgba(27,109,252,0.08)] text-[#FAFAF8]'
                        : 'border-[#2A2F39] text-[#8A9099] hover:border-[#2A2F39]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[12.5px] text-[#8A9099] mb-2">Buffer (min)</p>
              <div className="flex gap-2">
                {[0, 15, 30].map(d => (
                  <button
                    key={d}
                    onClick={() => setBuffer(d)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      buffer === d
                        ? 'border-[#FAFAF8] bg-[rgba(27,109,252,0.08)] text-[#FAFAF8]'
                        : 'border-[#2A2F39] text-[#8A9099] hover:border-[#2A2F39]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-[12.5px] text-[#D4817E]">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-[#FAFAF8] text-[#0B0D10] text-[12.5px] font-medium rounded-lg disabled:opacity-40 hover:bg-[#E4E4E0] transition-colors"
            >
              {saving ? 'Saving...' : 'Add'}
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
