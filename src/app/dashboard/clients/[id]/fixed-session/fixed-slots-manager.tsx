'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DURATIONS = [45, 60, 75, 90]

type Slot = {
  id: string
  day_of_week: number
  session_time: string
  duration_minutes: number
}

export default function FixedSlotsManager({
  clientId,
  slots,
}: {
  clientId: string
  slots: Slot[]
}) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [day, setDay] = useState(1)
  const [time, setTime] = useState('07:00')
  const [duration, setDuration] = useState(60)
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function handleAdd() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/clients/fixed-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, dayOfWeek: day, sessionTime: time, durationMinutes: duration }),
      })
      if (res.ok) {
        setAdding(false)
        setDay(1)
        setTime('07:00')
        setDuration(60)
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
    try {
      await fetch(`/api/dashboard/clients/fixed-slots?id=${id}`, { method: 'DELETE' })
      router.refresh()
    } catch {
      // ignore
    }
    setRemoving(null)
  }

  function formatTime(t: string) {
    return new Date(`1970-01-01T${t}`).toLocaleTimeString('en-AU', {
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  return (
    <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-6">
      <p className="text-[12.5px] text-[#666D7A] mb-4">Fixed Weekly Slots</p>

      {slots.length === 0 ? (
        <p className="text-sm text-[#98A0AD] mb-4">No fixed slots set up yet.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {slots.map(slot => (
            <div key={slot.id} className="flex items-center justify-between rounded-lg bg-[#EFF1F4] px-4 py-3">
              <div>
                <span className="text-sm font-medium text-[#141821]">{DAYS[slot.day_of_week]}</span>
                <span className="text-sm text-[#666D7A] ml-2">· {formatTime(slot.session_time)} · {slot.duration_minutes} min</span>
              </div>
              <button
                onClick={() => handleRemove(slot.id)}
                disabled={removing === slot.id}
                className="text-[#98A0AD] hover:text-red-700 transition-colors text-[12.5px] disabled:opacity-40"
              >
                {removing === slot.id ? '...' : '✕'}
              </button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button
          onClick={() => setAdding(true)}
          className="text-[12.5px] text-blue-500 hover:text-blue-700 transition-colors"
        >
          + Add slot
        </button>
      ) : (
        <div className="border-t border-[#E8EAEE] pt-4 mt-2 space-y-4">
          <div>
            <p className="text-[12.5px] text-[#666D7A] mb-2">Day</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, i) => (
                <button
                  key={i}
                  onClick={() => setDay(i)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    day === i
                      ? 'border-blue-500 bg-blue-50 text-blue-500'
                      : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 items-end">
            <div>
              <p className="text-[12.5px] text-[#666D7A] mb-2">Time</p>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2.5 text-sm text-[#141821] focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <p className="text-[12.5px] text-[#666D7A] mb-2">Duration</p>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      duration === d
                        ? 'border-blue-500 bg-blue-50 text-blue-500'
                        : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-[12.5px] text-red-700">{error}</p>}

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-2 bg-blue-500 text-white text-[12.5px] font-medium rounded-lg disabled:opacity-40 hover:bg-blue-500 transition-colors"
            >
              {saving ? 'Saving...' : 'Add slot'}
            </button>
            <button
              onClick={() => { setAdding(false); setError('') }}
              className="px-4 py-2 text-[12.5px] text-[#666D7A] hover:text-[#141821] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
