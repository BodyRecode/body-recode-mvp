'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const RRS_LEVELS = [
  { value: 4, label: 'Level 4 — stable, well recovered (allows strong)' },
  { value: 3, label: 'Level 3 — standard (allows moderate)' },
  { value: 2, label: 'Level 2 — stabilisation (gentle only)' },
  { value: 1, label: 'Level 1 — protective (restorative only)' },
  { value: 0, label: 'Level 0 — instability (restorative only)' },
]

const CONTRAINDICATIONS = [
  'low_back_injury', 'knee_injury', 'neck_injury', 'wrist_injury',
  'shoulder_injury', 'high_blood_pressure', 'glaucoma', 'pregnancy',
]

export default function YogaGeneratePanel({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[] | null>(null)

  const [blockName, setBlockName] = useState('Yoga Practice')
  const [minutes, setMinutes] = useState(45)
  const [rrsLevel, setRrsLevel] = useState(3)
  const [flags, setFlags] = useState<string[]>([])
  const [bodyState, setBodyState] = useState('')
  const [guidance, setGuidance] = useState('')

  function toggleFlag(f: string) {
    setFlags((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))
  }

  async function generate() {
    setLoading(true); setError(null); setNotes(null)
    try {
      const res = await fetch('/api/generate-yoga-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          block_name: blockName,
          target_minutes: minutes,
          rrs_level: rrsLevel,
          contraindications: flags,
          body_state_context: bodyState || null,
          coach_guidance: guidance || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      setNotes(data.clamp_notes && data.clamp_notes.length ? data.clamp_notes : ['Practice generated.'])
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Generate a practice
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Generate a yoga practice</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-gray-500 hover:text-gray-800">close</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium text-gray-600">
          Practice name
          <input value={blockName} onChange={(e) => setBlockName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Length (minutes)
          <input type="number" min={15} max={90} step={5} value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-medium text-gray-600 sm:col-span-2">
          Recovery state (sets the intensity ceiling)
          <select value={rrsLevel} onChange={(e) => setRrsLevel(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            {RRS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className="text-xs font-medium text-gray-600">Contraindications</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {CONTRAINDICATIONS.map((f) => (
            <button key={f} type="button" onClick={() => toggleFlag(f)}
              className={`rounded-full border px-3 py-1 text-xs ${flags.includes(f)
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-300 text-gray-600 hover:border-gray-400'}`}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-4 block text-xs font-medium text-gray-600">
        Body state context (optional)
        <textarea value={bodyState} onChange={(e) => setBodyState(e.target.value)} rows={2}
          placeholder="Paste or summarise the client's current reading"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>
      <label className="mt-3 block text-xs font-medium text-gray-600">
        Coach guidance (optional, authoritative)
        <textarea value={guidance} onChange={(e) => setGuidance(e.target.value)} rows={2}
          placeholder="e.g. keep it slow, focus on hips, she has a stiff neck today"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notes && (
        <div className="mt-3 rounded-lg bg-green-50 p-3 text-xs text-green-800">
          {notes.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}

      <button onClick={generate} disabled={loading}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
        {loading ? 'Sequencing...' : 'Generate practice'}
      </button>
    </div>
  )
}
