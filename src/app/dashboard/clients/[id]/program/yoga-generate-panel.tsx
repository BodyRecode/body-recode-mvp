'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'

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

const inputClass = 'w-full bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC] focus:border-transparent'
const labelClass = 'block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2'

export default function YogaGeneratePanel({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notes, setNotes] = useState<string[] | null>(null)

  const [minutes, setMinutes] = useState(45)
  const [rrsLevel, setRrsLevel] = useState(3)
  const [weeks, setWeeks] = useState(4)
  const [perWeek, setPerWeek] = useState(2)
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
          target_minutes: minutes,
          rrs_level: rrsLevel,
          week_duration: weeks,
          practices_per_week: perWeek,
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
        className="w-full sm:w-auto py-3 px-5 bg-[#1B6DFC] text-white font-semibold rounded-md hover:bg-[#5390FF] transition-colors"
      >
        Generate a block
      </button>
    )
  }

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
      <GenerationProgressOverlay
        active={loading}
        title="Sequencing the practice"
        stages={[
          { start: 0,  label: 'Reading the recovery state and setting the intensity ceiling' },
          { start: 4,  label: 'Filtering the library by ceiling and contraindications' },
          { start: 8,  label: 'Sequencing the practice through the arc, breath to movement' },
          { start: 22, label: 'Applying the doctrine clamp: allowed poses, symmetry, closing rest' },
          { start: 30, label: 'Saving the practice' },
          { start: 50, label: 'Taking a little longer, give it another moment' },
        ]}
      />
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">Generate a yoga block</h3>
        <button onClick={() => setOpen(false)} className="text-xs text-stone-500 hover:text-stone-800">close</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className={labelClass}>Block length
          <select value={weeks} onChange={(e) => setWeeks(Number(e.target.value))} className={`${inputClass} mt-1 normal-case`}>
            <option value={4}>4 weeks</option>
            <option value={6}>6 weeks</option>
            <option value={8}>8 weeks</option>
          </select>
        </label>
        <label className={labelClass}>Practices / week
          <select value={perWeek} onChange={(e) => setPerWeek(Number(e.target.value))} className={`${inputClass} mt-1 normal-case`}>
            <option value={2}>2 per week</option>
            <option value={3}>3 per week</option>
            <option value={4}>4 per week</option>
          </select>
        </label>
        <label className={labelClass}>Length each (min)
          <input type="number" min={15} max={90} step={5} value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))} className={`${inputClass} mt-1`} />
        </label>
        <label className={`${labelClass} sm:col-span-3`}>Recovery state (sets the intensity ceiling)
          <select value={rrsLevel} onChange={(e) => setRrsLevel(Number(e.target.value))} className={`${inputClass} mt-1 normal-case`}>
            {RRS_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-4">
        <span className={labelClass}>Contraindications</span>
        <div className="flex flex-wrap gap-2">
          {CONTRAINDICATIONS.map((f) => (
            <button key={f} type="button" onClick={() => toggleFlag(f)}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${flags.includes(f)
                ? 'border-[#1B6DFC] bg-blue-50 text-[#1B6DFC]'
                : 'border-stone-300 text-stone-600 hover:border-stone-400'}`}>
              {f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <label className={`${labelClass} mt-4`}>Body state context (optional)
        <textarea value={bodyState} onChange={(e) => setBodyState(e.target.value)} rows={2}
          placeholder="Paste or summarise the client's current reading"
          className={`${inputClass} mt-1 normal-case`} />
      </label>
      <label className={`${labelClass} mt-3`}>Coach guidance (optional, authoritative)
        <textarea value={guidance} onChange={(e) => setGuidance(e.target.value)} rows={2}
          placeholder="e.g. keep it slow, focus on hips, she has a stiff neck today"
          className={`${inputClass} mt-1 normal-case`} />
      </label>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {notes && (
        <div className="mt-3 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-[#3A3A3A]">
          {notes.map((n, i) => <p key={i}>{n}</p>)}
        </div>
      )}

      <button onClick={generate} disabled={loading}
        className="mt-4 w-full sm:w-auto py-3 px-5 bg-[#1B6DFC] text-white font-semibold rounded-md hover:bg-[#5390FF] disabled:opacity-40 transition-colors">
        {loading ? 'Sequencing…' : 'Generate block'}
      </button>
    </div>
  )
}
