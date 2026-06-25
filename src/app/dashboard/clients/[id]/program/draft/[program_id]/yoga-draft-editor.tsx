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

const ceilingColour: Record<string, string> = {
  restorative: 'text-green-600 bg-green-50 border-green-200',
  gentle: 'text-blue-400 bg-blue-50 border-blue-200',
  moderate: 'text-blue-600 bg-blue-50 border-blue-200',
  strong: 'text-violet-700 bg-violet-50 border-violet-200',
}

function holdText(p: Pose): string {
  if (p.hold_seconds) return `${p.hold_seconds}s`
  if (p.breaths) return `${p.breaths} breaths`
  return ''
}

export default function YogaDraftEditor({
  clientId, clientName, program,
}: {
  clientId: string
  clientName: string
  program: {
    id: string; block_name: string; sessions: Session[]; status: string
    training_frequency?: number | null; week_duration?: number | null
  }
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>(program.sessions ?? [])
  const [library, setLibrary] = useState<LibraryItem[]>([])
  const [editing, setEditing] = useState<string | null>(null) // "si-segi-pi"
  const [swapping, setSwapping] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isActive = program.status === 'active'
  const ceiling = sessions[0]?.ceiling

  useEffect(() => {
    fetch('/api/yoga-movements').then((r) => r.json()).then((d) => setLibrary(d.movements ?? [])).catch(() => {})
  }, [])

  function mutatePose(si: number, segi: number, pi: number, u: Partial<Pose>) {
    setSessions((prev) => prev.map((s, a) => a !== si ? s : { ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : { ...seg, poses: seg.poses.map((p, c) => c !== pi ? p : { ...p, ...u }) }) }))
    setDirty(true)
  }
  function removePose(si: number, segi: number, pi: number) {
    setSessions((prev) => prev.map((s, a) => a !== si ? s : { ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : { ...seg, poses: seg.poses.filter((_, c) => c !== pi) }) }))
    setDirty(true); setEditing(null)
  }
  function addPose(si: number, segi: number, name: string) {
    const lib = library.find((l) => l.name === name)
    setSessions((prev) => prev.map((s, a) => a !== si ? s : { ...s, segments: s.segments.map((seg, b) => b !== segi ? seg : { ...seg, poses: [...seg.poses, { name, sanskrit_name: lib?.sanskrit_name ?? null, side: null, hold_seconds: 30, breaths: null, cue: '' }] }) }))
    setDirty(true)
  }

  async function handleSave(): Promise<boolean> {
    setSaving(true); setError(null)
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      })
      if (!res.ok) { setError((await res.json()).error || 'Save failed'); return false }
      setDirty(false); return true
    } catch { setError('Save failed'); return false } finally { setSaving(false) }
  }
  async function handlePromote() {
    setBusy('promote')
    if (dirty && !(await handleSave())) { setBusy(null); return }
    try {
      const res = await fetch(`/api/programs/${program.id}/promote`, { method: 'POST' })
      if (!res.ok) { setError((await res.json()).error || 'Promote failed'); return }
      router.push(`/dashboard/clients/${clientId}/program`)
    } finally { setBusy(null) }
  }
  async function handleDiscard() {
    if (!confirm('Discard this draft block? This cannot be undone.')) return
    setBusy('discard')
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: 'DELETE' })
      if (res.ok) router.push(`/dashboard/clients/${clientId}/program`)
    } finally { setBusy(null) }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${clientId}/program`} className="hover:text-stone-700 transition-colors">Yoga Block</Link>
          <span>/</span>
          <span className="text-stone-700">{isActive ? 'Edit Practices' : 'Draft Review'}</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-[#1A1A1A]">{program.block_name}</h1>
            <p className={`text-sm mt-1 ${isActive ? 'text-stone-500' : 'text-amber-700'}`}>
              {isActive ? 'Editing active block - changes save in place' : 'Draft - pending coach review'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isActive && (
              <button onClick={handleDiscard} disabled={busy === 'discard' || busy === 'promote'}
                className="text-xs px-3 py-1.5 border border-stone-300 text-stone-500 rounded-lg hover:border-red-200 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-40">
                {busy === 'discard' ? 'Discarding…' : 'Discard Draft'}
              </button>
            )}
            {dirty && (
              <button onClick={handleSave} disabled={saving || busy === 'promote'}
                className={`text-xs px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${isActive ? 'bg-[#1B6DFC] text-white font-semibold hover:bg-[#5390FF]' : 'border border-stone-400 text-stone-700 hover:border-stone-600'}`}>
                {saving ? 'Saving…' : isActive ? 'Save' : 'Save Changes'}
              </button>
            )}
            {!isActive && (
              <button onClick={handlePromote} disabled={busy === 'promote' || saving || busy === 'discard'}
                className="text-xs px-4 py-1.5 bg-[#1B6DFC] text-white font-semibold rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-40">
                {busy === 'promote' ? 'Promoting…' : 'Promote to Active'}
              </button>
            )}
            {isActive && (
              <Link href={`/dashboard/clients/${clientId}/program`}
                className="text-xs px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-stone-500 hover:text-stone-800 transition-colors">
                Done
              </Link>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-2 mb-4">{error}</p>}
      {dirty && (
        <div className="mb-4 text-xs text-amber-700 bg-amber-50 border border-amber-200/50 rounded-lg px-3 py-2">
          You have unsaved changes. Save before promoting or your edits will be lost.
        </div>
      )}

      {/* Block identity */}
      <div className="bg-stone-100 border border-amber-200/40 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between">
          <p className="text-xs text-stone-500 capitalize">
            {(program.training_frequency ?? sessions.length)}x/week · {program.week_duration ?? 4} weeks
          </p>
          {ceiling && (
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${ceilingColour[ceiling] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>{ceiling}</span>
          )}
        </div>
      </div>

      {/* Editing hint */}
      <p className="text-xs text-stone-400 mb-4 px-1">
        Click any pose row to edit. Use &ldquo;Swap&rdquo; to replace a pose from the library.
      </p>

      {/* Practices */}
      <div className="space-y-3">
        {sessions.map((session, si) => (
          <div key={si} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-stone-200">
              <h3 className="font-semibold text-stone-900 text-sm">{session.day_label}</h3>
              {session.intention && <p className="text-xs text-stone-500 mt-0.5">{session.intention}</p>}
            </div>
            <div className="divide-y divide-stone-200/60">
              {session.segments.map((seg, segi) => (
                <div key={segi} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-3">{seg.label}</p>
                  <div className="space-y-2">
                    {seg.poses.map((p, pi) => {
                      const key = `${si}-${segi}-${pi}`
                      const isEditing = editing === key
                      const isSwapping = swapping === key
                      return (
                        <div key={pi} className={`rounded-lg border transition-colors ${isEditing ? 'border-stone-400 bg-stone-200/50' : 'border-transparent hover:border-stone-300 cursor-pointer'}`}>
                          {!isEditing ? (
                            <div className="flex items-center gap-3 text-sm px-3 py-2" onClick={() => setEditing(key)}>
                              <span className="flex-1 text-stone-800 font-medium">
                                {p.name}
                                {p.side && p.side !== 'both' ? <span className="text-stone-400 font-normal"> ({p.side})</span> : null}
                              </span>
                              <span className="text-stone-400 whitespace-nowrap text-xs w-20 text-right">{holdText(p)}</span>
                            </div>
                          ) : (
                            <div className="px-3 py-3 space-y-3">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-stone-900 flex-1">
                                  {p.name}{p.sanskrit_name && <span className="ml-1.5 text-xs italic text-stone-400">{p.sanskrit_name}</span>}
                                </span>
                                <button onClick={() => setSwapping(isSwapping ? null : key)} className="text-xs px-2.5 py-1 border border-stone-400 text-stone-600 rounded hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">{isSwapping ? 'Cancel' : 'Swap'}</button>
                                <button onClick={() => { setEditing(null); setSwapping(null) }} className="text-xs text-stone-400 hover:text-stone-600 transition-colors">Done</button>
                              </div>
                              {isSwapping && (
                                <select defaultValue="" onChange={(e) => { if (e.target.value) { const lib = library.find((l) => l.name === e.target.value); mutatePose(si, segi, pi, { name: e.target.value, sanskrit_name: lib?.sanskrit_name ?? null }); setSwapping(null) } }} className={`${inp} w-full`}>
                                  <option value="">Choose a pose to swap in…</option>
                                  {library.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                                </select>
                              )}
                              <div className="flex flex-wrap items-center gap-2">
                                <select value={p.side ?? ''} onChange={(e) => mutatePose(si, segi, pi, { side: e.target.value || null })} className={inp}>
                                  <option value="">both sides</option>
                                  <option value="left">left</option>
                                  <option value="right">right</option>
                                </select>
                                <input type="number" value={p.hold_seconds ?? ''} placeholder="hold s"
                                  onChange={(e) => mutatePose(si, segi, pi, { hold_seconds: e.target.value ? Number(e.target.value) : null, breaths: null })} className={`${inp} w-24`} />
                                <input type="number" value={p.breaths ?? ''} placeholder="breaths"
                                  onChange={(e) => mutatePose(si, segi, pi, { breaths: e.target.value ? Number(e.target.value) : null, hold_seconds: null })} className={`${inp} w-24`} />
                                <input value={p.cue ?? ''} placeholder="cue" onChange={(e) => mutatePose(si, segi, pi, { cue: e.target.value })} className={`${inp} flex-1 min-w-[160px]`} />
                                <button onClick={() => removePose(si, segi, pi)} className="text-xs text-stone-400 hover:text-red-700 px-2">Remove</button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-3">
                    <select defaultValue="" onChange={(e) => { if (e.target.value) { addPose(si, segi, e.target.value); e.target.value = '' } }} className={`${inp} text-stone-500`}>
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
