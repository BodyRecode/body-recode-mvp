'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Pose {
  name: string
  sanskrit_name?: string | null
  side?: string | null
  hold_seconds?: number | null
  breaths?: number | null
  cue?: string | null
}
interface Segment { key: string; label: string; poses: Pose[] }
interface Session { day_label: string; intention?: string | null; ceiling?: string; segments: Segment[] }
interface LibraryItem { id: string; name: string; sanskrit_name: string | null; family: string }

const inp = 'bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC] focus:border-transparent'

export default function YogaDraftEditor({
  clientId, clientName, program,
}: {
  clientId: string
  clientName: string
  program: { id: string; block_name: string; sessions: Session[]; status: string }
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>(program.sessions ?? [])
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedNote, setSavedNote] = useState(false)

  useEffect(() => {
    fetch('/api/yoga-movements').then((r) => r.json()).then((d) => setLibrary(d.movements ?? [])).catch(() => {})
  }, [])

  function mutatePose(si: number, segi: number, pi: number, updates: Partial<Pose>) {
    setSessions((prev) => prev.map((s, a) => a !== si ? s : {
      ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : {
        ...seg, poses: seg.poses.map((p, c) => c !== pi ? p : { ...p, ...updates }),
      }),
    }))
    setSavedNote(false)
  }
  function removePose(si: number, segi: number, pi: number) {
    setSessions((prev) => prev.map((s, a) => a !== si ? s : {
      ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : {
        ...seg, poses: seg.poses.filter((_, c) => c !== pi),
      }),
    }))
    setSavedNote(false)
  }
  function addPose(si: number, segi: number, name: string) {
    const lib = library.find((l) => l.name === name)
    setSessions((prev) => prev.map((s, a) => a !== si ? s : {
      ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : {
        ...seg, poses: [...seg.poses, { name, sanskrit_name: lib?.sanskrit_name ?? null, side: null, hold_seconds: 30, breaths: null, cue: '' }],
      }),
    }))
    setSavedNote(false)
  }

  async function handleSave(): Promise<boolean> {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Save failed'); return false }
      setSavedNote(true)
      return true
    } catch { setError('Save failed'); return false } finally { setSaving(false) }
  }

  async function approve() {
    setBusy('approve')
    if (!(await handleSave())) { setBusy(null); return }
    try {
      const res = await fetch(`/api/programs/${program.id}/promote`, { method: 'POST' })
      if (!res.ok) { setError((await res.json()).error || 'Approve failed'); return }
      router.push(`/dashboard/clients/${clientId}/program`)
    } finally { setBusy(null) }
  }
  async function discard() {
    if (!confirm('Discard this draft block? This cannot be undone.')) return
    setBusy('discard')
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: 'DELETE' })
      if (res.ok) router.push(`/dashboard/clients/${clientId}/program`)
    } finally { setBusy(null) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${clientId}/program`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
            <span>/</span>
            <span className="text-stone-700">Edit Practices</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">{program.block_name}</h1>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={handleSave} disabled={saving} className="text-xs font-semibold px-3 py-1.5 rounded-md border border-stone-300 text-stone-700 hover:border-stone-500 disabled:opacity-40">
            {saving ? 'Saving…' : savedNote ? 'Saved ✓' : 'Save'}
          </button>
          {program.status === 'draft' && (
            <button onClick={approve} disabled={busy === 'approve'} className="text-xs font-semibold px-3 py-1.5 rounded-md bg-[#1B6DFC] text-white hover:bg-[#5390FF] disabled:opacity-40">
              {busy === 'approve' ? 'Approving…' : 'Approve Program'}
            </button>
          )}
          <button onClick={discard} disabled={busy === 'discard'} className="text-xs font-medium px-3 py-1.5 rounded-md text-stone-500 hover:text-red-700">Discard</button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <div className="space-y-5">
        {sessions.map((s, si) => (
          <div key={si} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-200">
              <h3 className="font-semibold text-stone-900 text-sm">{s.day_label}</h3>
              {s.intention && <p className="text-xs text-stone-500 mt-0.5">{s.intention}</p>}
            </div>
            <div className="divide-y divide-stone-200/60">
              {s.segments.map((seg, segi) => (
                <div key={segi} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">{seg.label}</p>
                  <div className="space-y-3">
                    {seg.poses.map((p, pi) => (
                      <div key={pi} className="bg-white border border-stone-200 rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <select value={p.name} onChange={(e) => { const lib = library.find((l) => l.name === e.target.value); mutatePose(si, segi, pi, { name: e.target.value, sanskrit_name: lib?.sanskrit_name ?? null }) }}
                            className={`${inp} flex-1 font-medium`}>
                            {!library.some((l) => l.name === p.name) && <option value={p.name}>{p.name}</option>}
                            {library.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                          </select>
                          <button onClick={() => removePose(si, segi, pi)} className="text-xs text-stone-400 hover:text-red-700 px-2 shrink-0">Remove</button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <select value={p.side ?? ''} onChange={(e) => mutatePose(si, segi, pi, { side: e.target.value || null })} className={inp}>
                            <option value="">both sides</option>
                            <option value="left">left</option>
                            <option value="right">right</option>
                          </select>
                          <input type="number" value={p.hold_seconds ?? ''} placeholder="hold s"
                            onChange={(e) => mutatePose(si, segi, pi, { hold_seconds: e.target.value ? Number(e.target.value) : null, breaths: null })}
                            className={`${inp} w-24`} />
                          <input type="number" value={p.breaths ?? ''} placeholder="breaths"
                            onChange={(e) => mutatePose(si, segi, pi, { breaths: e.target.value ? Number(e.target.value) : null, hold_seconds: null })}
                            className={`${inp} w-24`} />
                          <input value={p.cue ?? ''} placeholder="cue" onChange={(e) => mutatePose(si, segi, pi, { cue: e.target.value })}
                            className={`${inp} flex-1 min-w-[160px]`} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3">
                    <select defaultValue="" onChange={(e) => { if (e.target.value) { addPose(si, segi, e.target.value); e.target.value = '' } }}
                      className={`${inp} text-stone-500`}>
                      <option value="">+ Add a pose…</option>
                      {library.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
