'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Trash2, Pause, Play, Check, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import { CATEGORY_LABELS, substanceBySlug, type SupplementSubstance, type SupplementCategory } from '@/lib/supplement-substances-seed'

interface Assignment {
  id: string
  substance_slug: string
  status: 'active' | 'paused' | 'completed'
  coach_note: string | null
  assigned_at: string
  paused_at: string | null
  completed_at: string | null
}

export default function SupplementsManager({
  clientId,
  clientName,
  initialAssignments,
  allSubstances,
}: {
  clientId: string
  clientName: string
  initialAssignments: Assignment[]
  allSubstances: SupplementSubstance[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)

  const activeSlugs = useMemo(
    () => new Set(initialAssignments.filter(a => a.status === 'active').map(a => a.substance_slug)),
    [initialAssignments]
  )

  const activeAssignments = initialAssignments.filter(a => a.status === 'active')
  const pausedAssignments = initialAssignments.filter(a => a.status === 'paused')
  const completedAssignments = initialAssignments.filter(a => a.status === 'completed')

  const assign = async (slug: string) => {
    if (activeSlugs.has(slug)) {
      setError('Client already has an active assignment for this substance.')
      return
    }
    const note = prompt(`Optional note for ${clientName} on this substance (shown on their portal):`)
    setAssigning(slug)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/supplements/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ substance_slug: slug, coach_note: note && note.trim().length > 0 ? note.trim() : null }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign')
    } finally {
      setAssigning(null)
    }
  }

  const update = async (aid: string, patch: { status?: 'active' | 'paused' | 'completed'; coach_note?: string | null }) => {
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/supplements/assignments/${aid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    }
  }

  const del = async (aid: string) => {
    if (!confirm('Delete this assignment permanently? Use Complete if the client finished.')) return
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/supplements/assignments/${aid}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  const editNote = async (a: Assignment) => {
    const next = prompt('Edit coach note (shown to client):', a.coach_note ?? '')
    if (next === null) return
    await update(a.id, { coach_note: next.trim().length > 0 ? next.trim() : null })
  }

  const categories: SupplementCategory[] = [
    'foundational', 'sleep_recovery', 'performance_peri_workout',
    'gut_digestion', 'cognitive_focus', 'womens_specific',
    'mens_specific', 'longevity_inflammation',
  ]

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <p className="text-xs text-amber-800">{error}</p>
        </div>
      )}

      {activeAssignments.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#1A1A1A]">Active for {clientName}</h2>
            <span className="text-[10px] text-stone-500 uppercase tracking-widest">Shown on their portal</span>
          </div>
          <div className="space-y-3">
            {activeAssignments.map(a => (
              <AssignmentRow key={a.id} assignment={a} onEditNote={editNote} onPause={id => update(id, { status: 'paused' })} onComplete={id => update(id, { status: 'completed' })} onDelete={del} />
            ))}
          </div>
        </div>
      )}

      {(pausedAssignments.length > 0 || completedAssignments.length > 0) && (
        <details className="rounded-lg border border-stone-200 bg-white">
          <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-stone-700">
            History: {pausedAssignments.length} paused, {completedAssignments.length} completed
          </summary>
          <div className="px-5 py-3 border-t border-stone-200 space-y-3">
            {pausedAssignments.map(a => (
              <AssignmentRow key={a.id} assignment={a} onEditNote={editNote} onResume={id => update(id, { status: 'active' })} onDelete={del} />
            ))}
            {completedAssignments.map(a => (
              <AssignmentRow key={a.id} assignment={a} onEditNote={editNote} onDelete={del} />
            ))}
          </div>
        </details>
      )}

      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#1A1A1A]">Substance library</h2>
          <p className="text-[11px] text-stone-500 mt-1">
            {allSubstances.length} substance{allSubstances.length === 1 ? '' : 's'} in the library. More added as research completes.
          </p>
        </div>

        {categories.map(cat => {
          const catSubs = allSubstances.filter(s => s.category === cat)
          if (catSubs.length === 0) return null
          return (
            <div key={cat} className="mb-6">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-2">{CATEGORY_LABELS[cat]}</h3>
              <div className="space-y-2">
                {catSubs.map(s => {
                  const isActive = activeSlugs.has(s.slug)
                  const isExpanded = expanded === s.slug
                  return (
                    <div key={s.slug} className={`rounded-xl border overflow-hidden transition-colors ${isActive ? 'border-[#1B6DFC]/30 bg-blue-50/30' : 'border-stone-200 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <button
                          onClick={() => setExpanded(isExpanded ? null : s.slug)}
                          className="flex items-start gap-2 text-left flex-1 min-w-0"
                        >
                          {isExpanded ? <ChevronUp size={14} className="text-stone-400 mt-1 shrink-0" /> : <ChevronDown size={14} className="text-stone-400 mt-1 shrink-0" />}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-[#1A1A1A]">{s.name}</span>
                              {isActive && <span className="text-[9px] font-bold text-[#1B6DFC] uppercase tracking-widest bg-[#1B6DFC]/10 px-1.5 py-0.5 rounded">Active</span>}
                            </div>
                            <p className="text-[12px] text-stone-500 mt-0.5">{s.short_description}</p>
                          </div>
                        </button>
                        <button
                          onClick={() => assign(s.slug)}
                          disabled={isActive || assigning === s.slug}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 border border-[#1B6DFC] text-[#1B6DFC] rounded-lg hover:bg-[#1B6DFC] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {assigning === s.slug ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                          {isActive ? 'Assigned' : 'Assign'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-stone-200 bg-stone-50 space-y-4">
                          <Detail label="What it does" body={s.what_it_does} />
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Three tiers (client picks)</p>
                            <TierCard tier={s.tiers.essential} />
                            <TierCard tier={s.tiers.enhanced} />
                            <TierCard tier={s.tiers.elite} />
                          </div>
                          {s.contraindications.length > 0 && (
                            <div>
                              <p className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-1">Contraindications</p>
                              <ul className="text-[12px] text-stone-700 leading-relaxed space-y-0.5">
                                {s.contraindications.map((c, i) => <li key={i}>- {c}</li>)}
                              </ul>
                            </div>
                          )}
                          <Detail label="Safety" body={s.safety_notes} />
                          <div className="rounded-lg bg-white border border-stone-200 px-3 py-2">
                            <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest mb-1">Coach doctrine</p>
                            <p className="text-[12px] text-stone-700 leading-relaxed">{s.coach_doctrine}</p>
                          </div>
                          {s.research_reference && (
                            <div className="flex items-start gap-2 text-[11px] text-stone-500">
                              <FileText size={12} className="mt-0.5 shrink-0" />
                              <span>Research report: <code className="bg-stone-100 px-1 rounded">{s.research_reference}</code></span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-[12px] text-stone-700 leading-relaxed">{body}</p>
    </div>
  )
}

function TierCard({ tier }: { tier: { label: string; form: string; dose: string; timing: string; notes: string; fits_client_profile: string } }) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white px-3 py-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest">{tier.label}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[12px] text-stone-700">
        <div><span className="text-stone-500 font-medium">Form:</span> {tier.form}</div>
        <div><span className="text-stone-500 font-medium">Dose:</span> {tier.dose}</div>
        <div className="md:col-span-2"><span className="text-stone-500 font-medium">Timing:</span> {tier.timing}</div>
      </div>
      <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">{tier.notes}</p>
      <p className="text-[11px] text-stone-500 mt-1 italic leading-relaxed">Fits: {tier.fits_client_profile}</p>
    </div>
  )
}

function AssignmentRow({ assignment, onEditNote, onPause, onResume, onComplete, onDelete }: {
  assignment: Assignment
  onEditNote: (a: Assignment) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onComplete?: (id: string) => void
  onDelete: (id: string) => void
}) {
  const substance = substanceBySlug(assignment.substance_slug)
  if (!substance) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
        <p className="text-xs text-amber-800">Unknown substance slug: {assignment.substance_slug}</p>
        <button onClick={() => onDelete(assignment.id)} className="text-[11px] text-amber-800 underline mt-1">Delete</button>
      </div>
    )
  }
  const statusColour = assignment.status === 'active' ? 'text-[#1B6DFC]' : assignment.status === 'paused' ? 'text-amber-600' : 'text-stone-500'
  return (
    <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#1A1A1A]">{substance.name}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${statusColour}`}>{assignment.status}</span>
          </div>
          <p className="text-[11px] text-stone-500 mt-0.5">3 tiers visible on portal · Essential / Enhanced / Elite</p>
          {assignment.coach_note && (
            <div className="mt-2 rounded-lg bg-stone-50 border border-stone-200 px-3 py-2">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-0.5">Coach note (shown to client)</p>
              <p className="text-[12px] text-stone-700 leading-relaxed whitespace-pre-line">{assignment.coach_note}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEditNote(assignment)} className="text-[10px] font-medium text-stone-500 hover:text-[#1A1A1A] px-2 py-1">Edit note</button>
          {onPause && <button onClick={() => onPause(assignment.id)} title="Pause" className="p-1.5 text-stone-500 hover:text-amber-700 rounded transition-colors"><Pause size={12} /></button>}
          {onResume && <button onClick={() => onResume(assignment.id)} title="Resume" className="p-1.5 text-stone-500 hover:text-[#1B6DFC] rounded transition-colors"><Play size={12} /></button>}
          {onComplete && <button onClick={() => onComplete(assignment.id)} title="Mark complete" className="p-1.5 text-stone-500 hover:text-green-700 rounded transition-colors"><Check size={12} /></button>}
          <button onClick={() => onDelete(assignment.id)} title="Delete" className="p-1.5 text-stone-500 hover:text-red-700 rounded transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}
