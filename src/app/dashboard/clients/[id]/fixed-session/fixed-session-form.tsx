'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const DURATIONS = [45, 60, 75, 90]

export default function FixedSessionForm({
  clientId,
  currentDay,
  currentTime,
  currentDuration,
  currentSessionType,
}: {
  clientId: string
  currentDay: number | null
  currentTime: string | null
  currentDuration: number
  currentSessionType: string | null
}) {
  const router = useRouter()
  const [day, setDay] = useState<number>(currentDay ?? 1)
  const [time, setTime] = useState(currentTime ?? '06:00')
  const [duration, setDuration] = useState(currentDuration)
  const [sessionType, setSessionType] = useState(currentSessionType ?? 'face_to_face')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/dashboard/clients/fixed-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, day, time, duration, sessionType }),
      })
      if (res.ok) {
        setSaved(true)
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

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-5">
      {/* Session type */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">Session Type</label>
        <div className="flex gap-2">
          {[{ value: 'face_to_face', label: 'Face-to-Face' }, { value: 'zoom', label: 'Zoom' }].map(opt => (
            <button
              key={opt.value}
              onClick={() => setSessionType(opt.value)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                sessionType === opt.value
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Day */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">Day of Week</label>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d, i) => (
            <button
              key={i}
              onClick={() => setDay(i)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                day === i
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {d.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Time */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">Session Time (Brisbane)</label>
        <input
          type="time"
          value={time}
          onChange={e => setTime(e.target.value)}
          className="bg-stone-800 border border-stone-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-teal-500 transition-colors"
        />
      </div>

      {/* Duration */}
      <div>
        <label className="block text-xs text-stone-500 uppercase tracking-wider mb-2">Duration</label>
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                duration === d
                  ? 'border-teal-500 bg-teal-500/10 text-teal-400'
                  : 'border-stone-700 text-stone-400 hover:border-stone-600'
              }`}
            >
              {d} min
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-teal-400">Saved.</p>}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl bg-teal-500 text-black text-sm font-bold disabled:opacity-40 hover:bg-teal-400 transition-colors"
      >
        {saving ? 'Saving...' : 'Save Fixed Slot'}
      </button>
    </div>
  )
}
