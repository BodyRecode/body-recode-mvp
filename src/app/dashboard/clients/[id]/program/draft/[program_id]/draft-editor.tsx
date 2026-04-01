'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Exercise {
  exercise_name: string
  sets: number
  reps: string
  rpe: number | null
  rest: string
  notes: string
}

interface Block {
  block_label: string
  exercises: Exercise[]
}

interface Session {
  day_label: string
  skeleton: string
  movement_prep: string[]
  blocks: Block[]
}

interface LibraryExercise {
  name: string
  primary_pattern: string
  secondary_pattern: string | null
  mechanical_bias: string
  primary_joint_stress: string
  equipment: string
  tier: number
  stability_demand: string
}

interface Program {
  id: string
  client_id: string
  block_name: string
  progression_phase: string
  training_goal: string
  training_frequency: number
  training_age: string
  week_duration: number
  equipment_access: string[]
  sessions: Session[]
}

interface EditingPath {
  sessionIdx: number
  blockIdx: number
  exerciseIdx: number
}

export default function DraftEditor({
  clientId,
  clientName,
  program,
}: {
  clientId: string
  clientName: string
  program: Program
}) {
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>(program.sessions)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [promoting, setPromoting] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingPath, setEditingPath] = useState<EditingPath | null>(null)
  const [swapPath, setSwapPath] = useState<EditingPath | null>(null)
  const [swapSearch, setSwapSearch] = useState('')
  const [library, setLibrary] = useState<LibraryExercise[]>([])
  const [libraryLoaded, setLibraryLoaded] = useState(false)

  useEffect(() => {
    fetch(`/api/exercises?equipment=${program.equipment_access.join(',')}`)
      .then(r => r.json())
      .then(d => {
        setLibrary(d.exercises ?? [])
        setLibraryLoaded(true)
      })
      .catch(() => setLibraryLoaded(true))
  }, [program.equipment_access])

  function updateExercise(
    sessionIdx: number,
    blockIdx: number,
    exerciseIdx: number,
    patch: Partial<Exercise>
  ) {
    setSessions(prev => {
      const next = prev.map((s, si) => {
        if (si !== sessionIdx) return s
        return {
          ...s,
          blocks: s.blocks.map((b, bi) => {
            if (bi !== blockIdx) return b
            return {
              ...b,
              exercises: b.exercises.map((ex, ei) => {
                if (ei !== exerciseIdx) return ex
                return { ...ex, ...patch }
              }),
            }
          }),
        }
      })
      return next
    })
    setDirty(true)
  }

  const getExercise = useCallback(
    (path: EditingPath) =>
      sessions[path.sessionIdx]?.blocks[path.blockIdx]?.exercises[path.exerciseIdx],
    [sessions]
  )

  async function handleSave(): Promise<boolean> {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/programs/${program.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessions }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Save failed')
        return false
      }
      setDirty(false)
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      return false
    } finally {
      setSaving(false)
    }
  }

  async function handlePromote() {
    setPromoting(true)
    setError(null)
    // Save first if dirty
    if (dirty) {
      const saved = await handleSave()
      if (!saved) {
        setPromoting(false)
        return
      }
    }
    try {
      const res = await fetch(`/api/programs/${program.id}/promote`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Promote failed')
        return
      }
      router.push(`/dashboard/clients/${clientId}/program`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Promote failed')
    } finally {
      setPromoting(false)
    }
  }

  async function handleDiscard() {
    if (!confirm('Discard this draft? This cannot be undone.')) return
    setDiscarding(true)
    setError(null)
    try {
      const res = await fetch(`/api/programs/${program.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Discard failed')
        return
      }
      router.push(`/dashboard/clients/${clientId}/program`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discard failed')
    } finally {
      setDiscarding(false)
    }
  }

  function openSwap(path: EditingPath) {
    setSwapPath(path)
    setSwapSearch('')
  }

  function closeSwap() {
    setSwapPath(null)
    setSwapSearch('')
  }

  function selectSwapExercise(ex: LibraryExercise, path: EditingPath) {
    updateExercise(path.sessionIdx, path.blockIdx, path.exerciseIdx, {
      exercise_name: ex.name,
    })
    closeSwap()
  }

  const phaseColour: Record<string, string> = {
    accumulation: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
    intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
    realization: 'text-red-400 bg-red-400/10 border-red-400/30',
    restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
  }
  const goalColour: Record<string, string> = {
    strength: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
    hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
    capacity: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
  }

  const inputCls =
    'bg-stone-800 border border-stone-700 text-stone-100 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[#10E1C2] focus:border-transparent'

  // Filtered swap results
  const currentPatterns = swapPath
    ? (() => {
        const ex = getExercise(swapPath)
        if (!ex) return []
        // Find the library entry to get pattern
        const lib = library.find(l => l.name === ex.exercise_name)
        return lib ? [lib.primary_pattern] : []
      })()
    : []

  const swapResults = library.filter(l => {
    const search = swapSearch.toLowerCase()
    if (!search) return currentPatterns.length === 0 || currentPatterns.includes(l.primary_pattern)
    return l.name.toLowerCase().includes(search)
  }).slice(0, 20)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-300 transition-colors">{clientName}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${clientId}/program`} className="hover:text-stone-300 transition-colors">Training Program</Link>
          <span>/</span>
          <span className="text-stone-300">Draft Review</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">{program.block_name}</h1>
            <p className="text-sm text-amber-400 mt-1">Draft — pending coach review</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDiscard}
              disabled={discarding || promoting}
              className="text-xs px-3 py-1.5 border border-stone-700 text-stone-500 rounded-lg hover:border-red-800 hover:text-red-400 transition-colors disabled:opacity-40"
            >
              {discarding ? 'Discarding…' : 'Discard Draft'}
            </button>
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving || promoting}
                className="text-xs px-3 py-1.5 border border-stone-600 text-stone-300 rounded-lg hover:border-stone-400 transition-colors disabled:opacity-40"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
            <button
              onClick={handlePromote}
              disabled={promoting || saving || discarding}
              className="text-xs px-4 py-1.5 bg-[#10E1C2] text-stone-900 font-semibold rounded-lg hover:bg-[#0dcfb2] transition-colors disabled:opacity-40"
            >
              {promoting ? 'Promoting…' : 'Promote to Active'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2 mb-4">
          {error}
        </p>
      )}

      {dirty && (
        <div className="mb-4 text-xs text-amber-400 bg-amber-950/30 border border-amber-800/50 rounded-lg px-3 py-2">
          You have unsaved changes. Save before promoting or your edits will be lost.
        </div>
      )}

      {/* Program identity */}
      <div className="bg-stone-900 border border-amber-800/40 rounded-xl p-5 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-xs text-stone-500 mb-1 capitalize">
              {program.training_frequency}x/week · {program.week_duration} weeks · {program.training_age}
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${phaseColour[program.progression_phase] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
              {program.progression_phase}
            </span>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${goalColour[program.training_goal] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
              {program.training_goal}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {program.equipment_access.map(eq => (
            <span key={eq} className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded capitalize">{eq}</span>
          ))}
        </div>
      </div>

      {/* Editing hint */}
      <p className="text-xs text-stone-600 mb-4 px-1">
        Click any exercise row to edit. Use &ldquo;Swap&rdquo; to replace an exercise from the approved library.
      </p>

      {/* Sessions */}
      <div className="space-y-3">
        {sessions.map((session, sIdx) => (
          <div key={sIdx} className="bg-stone-900 border border-stone-800 rounded-xl overflow-hidden">
            {/* Session header */}
            <div className="px-5 py-3 border-b border-stone-800 flex items-center justify-between">
              <h3 className="font-semibold text-stone-100 text-sm">{session.day_label}</h3>
              <span className="text-[10px] text-stone-600 uppercase tracking-wide">{session.skeleton}</span>
            </div>

            <div className="divide-y divide-stone-800/60">
              {/* Movement Prep — read-only */}
              {session.movement_prep?.length > 0 && (
                <div className="px-5 py-4 bg-stone-800/30">
                  <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-widest mb-1">
                    Preparatory Entry — Movement Preparation
                  </p>
                  <p className="text-[10px] text-stone-600 mb-3">Non-Slot · Prepare joints, tissues, and coordination</p>
                  <div className="space-y-1.5">
                    {session.movement_prep.map((item, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-stone-600 mt-0.5">•</span>
                        <p className="text-sm text-stone-300">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blocks */}
              {session.blocks.map((block, bIdx) => (
                <div key={bIdx} className="px-5 py-4">
                  <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-widest mb-3">{block.block_label}</p>
                  <div className="space-y-2">
                    {block.exercises.map((ex, eIdx) => {
                      const path: EditingPath = { sessionIdx: sIdx, blockIdx: bIdx, exerciseIdx: eIdx }
                      const isEditing =
                        editingPath?.sessionIdx === sIdx &&
                        editingPath?.blockIdx === bIdx &&
                        editingPath?.exerciseIdx === eIdx
                      const isSwapping =
                        swapPath?.sessionIdx === sIdx &&
                        swapPath?.blockIdx === bIdx &&
                        swapPath?.exerciseIdx === eIdx

                      return (
                        <div key={eIdx} className={`rounded-lg border transition-colors ${isEditing ? 'border-stone-600 bg-stone-800/50' : 'border-transparent hover:border-stone-700 cursor-pointer'}`}>
                          {/* Collapsed row */}
                          {!isEditing ? (
                            <div
                              className="flex items-center gap-3 text-sm px-3 py-2"
                              onClick={() => setEditingPath(path)}
                            >
                              <span className="flex-1 text-stone-200 font-medium">{ex.exercise_name}</span>
                              <span className="text-stone-400 whitespace-nowrap tabular-nums">
                                {ex.sets}×{ex.reps}
                                {ex.rpe !== null && <span className="text-stone-600"> · RPE {ex.rpe}</span>}
                              </span>
                              <span className="text-stone-600 whitespace-nowrap text-xs w-16 text-right">{ex.rest}</span>
                            </div>
                          ) : (
                            /* Expanded edit row */
                            <div className="px-3 py-3 space-y-3">
                              {/* Exercise name + swap */}
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-stone-100 flex-1">{ex.exercise_name}</span>
                                <button
                                  onClick={() => isSwapping ? closeSwap() : openSwap(path)}
                                  className="text-xs px-2.5 py-1 border border-stone-600 text-stone-400 rounded hover:border-[#10E1C2] hover:text-[#10E1C2] transition-colors"
                                >
                                  {isSwapping ? 'Cancel' : 'Swap'}
                                </button>
                                <button
                                  onClick={() => { setEditingPath(null); closeSwap() }}
                                  className="text-xs text-stone-600 hover:text-stone-400 transition-colors"
                                >
                                  Done
                                </button>
                              </div>

                              {/* Swap panel */}
                              {isSwapping && (
                                <div className="border border-stone-700 rounded-lg bg-stone-900 overflow-hidden">
                                  <div className="p-2 border-b border-stone-800">
                                    <input
                                      type="text"
                                      placeholder="Search exercises…"
                                      value={swapSearch}
                                      onChange={e => setSwapSearch(e.target.value)}
                                      className="w-full bg-stone-800 border border-stone-700 text-stone-100 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#10E1C2]"
                                      autoFocus
                                    />
                                    {!libraryLoaded && <p className="text-xs text-stone-600 mt-1 px-1">Loading library…</p>}
                                    {libraryLoaded && !swapSearch && currentPatterns.length > 0 && (
                                      <p className="text-[10px] text-stone-600 mt-1 px-1">Showing same pattern. Type to search all.</p>
                                    )}
                                  </div>
                                  <div className="max-h-48 overflow-y-auto divide-y divide-stone-800">
                                    {swapResults.length === 0 && (
                                      <p className="text-xs text-stone-600 px-3 py-2">No matches found.</p>
                                    )}
                                    {swapResults.map(lib => (
                                      <button
                                        key={lib.name}
                                        onClick={() => selectSwapExercise(lib, path)}
                                        className="w-full text-left px-3 py-2 hover:bg-stone-800 transition-colors"
                                      >
                                        <span className="text-sm text-stone-200 block">{lib.name}</span>
                                        <span className="text-[10px] text-stone-600">
                                          T{lib.tier} · {lib.primary_pattern} · {lib.equipment}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Edit fields */}
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="block text-[10px] text-stone-500 mb-1">Sets</label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={ex.sets}
                                    onChange={e =>
                                      updateExercise(sIdx, bIdx, eIdx, { sets: parseInt(e.target.value) || 1 })
                                    }
                                    className={`w-full ${inputCls}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-stone-500 mb-1">Reps</label>
                                  <input
                                    type="text"
                                    value={ex.reps}
                                    onChange={e => updateExercise(sIdx, bIdx, eIdx, { reps: e.target.value })}
                                    className={`w-full ${inputCls}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-stone-500 mb-1">RPE</label>
                                  <input
                                    type="number"
                                    min={5}
                                    max={10}
                                    placeholder="—"
                                    value={ex.rpe ?? ''}
                                    onChange={e => {
                                      const val = e.target.value
                                      updateExercise(sIdx, bIdx, eIdx, {
                                        rpe: val === '' ? null : parseInt(val),
                                      })
                                    }}
                                    className={`w-full ${inputCls}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-stone-500 mb-1">Rest</label>
                                  <input
                                    type="text"
                                    value={ex.rest}
                                    onChange={e => updateExercise(sIdx, bIdx, eIdx, { rest: e.target.value })}
                                    className={`w-full ${inputCls}`}
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] text-stone-500 mb-1">Notes</label>
                                <input
                                  type="text"
                                  value={ex.notes}
                                  onChange={e => updateExercise(sIdx, bIdx, eIdx, { notes: e.target.value })}
                                  placeholder="Technical cue or empty"
                                  className={`w-full ${inputCls}`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom actions */}
      <div className="mt-6 flex items-center justify-between">
        <button
          onClick={handleDiscard}
          disabled={discarding || promoting}
          className="text-xs px-3 py-1.5 border border-stone-700 text-stone-500 rounded-lg hover:border-red-800 hover:text-red-400 transition-colors disabled:opacity-40"
        >
          {discarding ? 'Discarding…' : 'Discard Draft'}
        </button>
        <div className="flex items-center gap-2">
          {dirty && (
            <button
              onClick={handleSave}
              disabled={saving || promoting}
              className="text-xs px-3 py-1.5 border border-stone-600 text-stone-300 rounded-lg hover:border-stone-400 transition-colors disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          )}
          <button
            onClick={handlePromote}
            disabled={promoting || saving || discarding}
            className="text-xs px-4 py-1.5 bg-[#10E1C2] text-stone-900 font-semibold rounded-lg hover:bg-[#0dcfb2] transition-colors disabled:opacity-40"
          >
            {promoting ? 'Promoting…' : 'Promote to Active'}
          </button>
        </div>
      </div>
    </div>
  )
}
