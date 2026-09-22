'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Plus, Trash2, Pause, Play, Home, Dumbbell, ChevronDown, ChevronUp, AlertTriangle, X } from 'lucide-react'
import { RECOVERY_PROTOCOLS, EQUIPMENT_LABELS, CATEGORY_LABELS, protocolBySlug, protocolsAvailableForAccess, type EquipmentTag, type RecoveryCategory, type RecoveryProtocol } from '@/lib/recovery-protocols-seed'
import { sbstActionLabel, type SbstAction } from '@/lib/rrs-protocol-suggestions'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'

export interface RrsSuggestionProp {
  playbook_id: RecoveryPlaybookId
  playbook_name: string
  days_active: number
  entered_at: string
  suggested_protocol_slugs: string[]
  sbst_action: SbstAction | null
  rationale: string
  do_not_suggest: string[]
}

interface Assignment {
  id: string
  protocol_slug: string
  status: 'active' | 'paused' | 'completed'
  coach_note: string | null
  custom_dosing: unknown
  assigned_at: string
  paused_at: string | null
  completed_at: string | null
}

const HOME_EQUIPMENT: EquipmentTag[] = ['ice_water_bowl', 'shower', 'magnesium_bath', 'red_light_panel', 'compression_boots', 'massage_gun', 'sleep_breathing_kit']
const GYM_EQUIPMENT: EquipmentTag[] = ['sauna_traditional', 'sauna_infrared', 'steam_room', 'cold_plunge_full', 'cryo_chamber', 'red_light_bed', 'vibration_plate']

export default function RecoveryManager({
  clientId,
  clientName,
  initialAccess,
  initialAssignments,
  rrsSuggestion,
}: {
  clientId: string
  clientName: string
  initialAccess: EquipmentTag[]
  initialAssignments: Assignment[]
  allProtocols: RecoveryProtocol[]
  rrsSuggestion: RrsSuggestionProp | null
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [access, setAccess] = useState<EquipmentTag[]>(initialAccess)
  const [savingAccess, setSavingAccess] = useState(false)
  const [accessSavedAt, setAccessSavedAt] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [expandedProtocol, setExpandedProtocol] = useState<string | null>(null)

  const availableProtocols = useMemo(() => protocolsAvailableForAccess(access), [access])
  const activeSlugs = useMemo(() => new Set(initialAssignments.filter(a => a.status === 'active').map(a => a.protocol_slug)), [initialAssignments])

  const activeAssignments = initialAssignments.filter(a => a.status === 'active')
  const pausedAssignments = initialAssignments.filter(a => a.status === 'paused')
  const completedAssignments = initialAssignments.filter(a => a.status === 'completed')

  const toggleAccess = (tag: EquipmentTag) => {
    setAccess(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const saveAccess = async () => {
    setSavingAccess(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery/access`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      setAccessSavedAt(new Date())
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save access')
    } finally {
      setSavingAccess(false)
    }
  }

  const assignProtocol = async (slug: string) => {
    if (activeSlugs.has(slug)) {
      setError('Client already has an active assignment for this protocol.')
      return
    }
    const note = prompt(`Optional note for ${clientName} on this protocol (shown on their portal):`)
    setAssigning(slug)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_slug: slug, coach_note: note && note.trim().length > 0 ? note.trim() : null }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign')
    } finally {
      setAssigning(null)
    }
  }

  const updateAssignment = async (id: string, patch: { status?: 'active' | 'paused' | 'completed'; coach_note?: string | null }) => {
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery/assignments/${id}`, {
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

  const deleteAssignment = async (id: string) => {
    if (!confirm('Delete this assignment permanently? Use Complete if the client finished the protocol.')) return
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery/assignments/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  const editCoachNote = async (assignment: Assignment) => {
    const next = prompt('Edit coach note (shown to client under this protocol):', assignment.coach_note ?? '')
    if (next === null) return
    await updateAssignment(assignment.id, { coach_note: next.trim().length > 0 ? next.trim() : null })
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-[#EADCC4] bg-[linear-gradient(180deg,#FDF8F1,#FDF8F1)] px-4 py-3">
          <p className="text-[12.5px] text-[#B06E1F]">{error}</p>
        </div>
      )}

      {/* RRS state-driven suggestions */}
      {rrsSuggestion && (
        <RrsSuggestionBanner
          clientId={clientId}
          clientName={clientName}
          suggestion={rrsSuggestion}
          activeSlugs={activeSlugs}
          onAssign={assignProtocol}
          assigning={assigning}
        />
      )}

      {/* Equipment access */}
      <div className="rounded-xl border border-[#E4E4E0] bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E4E4E0]">
          <div>
            <h2 className="text-base font-semibold text-[#0F1115]">Equipment access</h2>
            <p className="text-[11px] text-[#6E747D]">Tag what {clientName} can actually do. Protocol library filters to match.</p>
          </div>
          <div className="flex items-center gap-3">
            {accessSavedAt && !savingAccess && (
              <span className="text-[11px] text-[#6E747D] inline-flex items-center gap-1">
                <Check size={11} /> Saved
              </span>
            )}
            <button
              onClick={saveAccess}
              disabled={savingAccess}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-4 py-2 bg-[#0F1115] text-white rounded-lg hover:bg-[#000000] disabled:opacity-40 transition-colors"
            >
              {savingAccess ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {savingAccess ? 'Saving...' : 'Save access'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-[#EDEDEA]">
          <AccessGroup title="At home" icon={<Home size={12} />} tags={HOME_EQUIPMENT} access={access} onToggle={toggleAccess} />
          <AccessGroup title="At the gym" icon={<Dumbbell size={12} />} tags={GYM_EQUIPMENT} access={access} onToggle={toggleAccess} />
        </div>
      </div>

      {/* Active assignments */}
      {activeAssignments.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-3">
            <h2 className="text-base font-semibold text-[#0F1115]">Active for {clientName}</h2>
            <span className="text-[10px] text-[#6E747D]">Shown on their portal</span>
          </div>
          <div className="space-y-3">
            {activeAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a} onEditNote={editCoachNote} onPause={id => updateAssignment(id, { status: 'paused' })} onComplete={id => updateAssignment(id, { status: 'completed' })} onDelete={deleteAssignment} />
            ))}
          </div>
        </div>
      )}

      {/* Paused / completed */}
      {(pausedAssignments.length > 0 || completedAssignments.length > 0) && (
        <details className="rounded-lg border border-[#E4E4E0] bg-white">
          <summary className="cursor-pointer px-5 py-3 text-sm font-medium text-[#0F1115]">
            History: {pausedAssignments.length} paused, {completedAssignments.length} completed
          </summary>
          <div className="px-5 py-3 border-t border-[#E4E4E0] space-y-3">
            {pausedAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a} onEditNote={editCoachNote} onResume={id => updateAssignment(id, { status: 'active' })} onDelete={deleteAssignment} />
            ))}
            {completedAssignments.map(a => (
              <AssignmentCard key={a.id} assignment={a} onEditNote={editCoachNote} onDelete={deleteAssignment} />
            ))}
          </div>
        </details>
      )}

      {/* Protocol library */}
      <div>
        <div className="mb-3">
          <h2 className="text-base font-semibold text-[#0F1115]">Protocol library</h2>
          <p className="text-[11px] text-[#6E747D] mt-1">
            {availableProtocols.length} of {RECOVERY_PROTOCOLS.length} protocols available given {clientName}&apos;s equipment access. Add access above to unlock more.
          </p>
        </div>

        {/* Derived from CATEGORY_LABELS, not hardcoded (2026-08-17). This was
            an `as` cast, so adding the 'movement' category would have silently
            hidden every movement protocol from the coach library with no
            compiler error. */}
        {(Object.keys(CATEGORY_LABELS) as RecoveryCategory[]).map(cat => {
          const catProtocols = availableProtocols.filter(p => p.category === cat)
          if (catProtocols.length === 0) return null
          // Sort so progression-grouped protocols cluster together, ordered by level;
          // non-progression protocols keep their seed order.
          const sortedProtocols = [...catProtocols].sort((a, b) => {
            if (a.progression && b.progression && a.progression.group === b.progression.group) {
              return a.progression.level - b.progression.level
            }
            if (a.progression && !b.progression) return 1
            if (!a.progression && b.progression) return -1
            return 0
          })
          let lastProgressionGroup: string | null = null
          return (
            <div key={cat} className="mb-6">
              <h3 className="text-[10px] font-medium text-[#6E747D] mb-2">{CATEGORY_LABELS[cat]}</h3>
              <div className="space-y-2">
                {sortedProtocols.map(p => {
                  const isActive = activeSlugs.has(p.slug)
                  const isExpanded = expandedProtocol === p.slug
                  const isNewProgressionGroup = p.progression && p.progression.group !== lastProgressionGroup
                  if (p.progression) lastProgressionGroup = p.progression.group
                  else lastProgressionGroup = null
                  return (
                    <div key={p.slug}>
                      {isNewProgressionGroup && p.progression && (
                        <div className="rounded-xl border border-[#EADCC4] bg-[linear-gradient(180deg,#FDF8F1,#FDF8F1)]/50 px-4 py-3 mb-2">
                          <p className="text-[10px] font-medium text-[#B06E1F] mb-1">{p.progression.group_label} - tiered progression</p>
                          <p className="text-[12px] text-[#8A5514] leading-relaxed">{p.progression.group_rule}</p>
                        </div>
                      )}
                    <div className={`rounded-xl border overflow-hidden transition-colors ${isActive ? 'border-[#0F1115]/30 bg-[rgba(27,109,252,0.08)]/30' : 'border-[#E4E4E0] bg-white'}`}>
                      <div className="flex items-start justify-between gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => setExpandedProtocol(isExpanded ? null : p.slug)}
                            className="flex items-start gap-2 text-left w-full"
                          >
                            {isExpanded ? <ChevronUp size={14} className="text-[#9CA2AB] mt-1 shrink-0" /> : <ChevronDown size={14} className="text-[#9CA2AB] mt-1 shrink-0" />}
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                {p.progression && (
                                  <span className="text-[9px] font-medium text-[#B06E1F] bg-[#FDF8F1] border border-[#EADCC4] px-1.5 py-0.5 rounded">
                                    Level {p.progression.level}
                                  </span>
                                )}
                                <span className="text-sm font-semibold text-[#0F1115]">{p.name}</span>
                                {isActive && <span className="text-[9px] font-medium text-[#0F1115] bg-[#0F1115]/10 px-1.5 py-0.5 rounded">Active</span>}
                              </div>
                              <p className="text-[12px] text-[#6E747D] mt-0.5">{p.short_description}</p>
                            </div>
                          </button>
                        </div>
                        <button
                          onClick={() => assignProtocol(p.slug)}
                          disabled={isActive || assigning === p.slug}
                          className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 border border-[#0F1115] text-[#0F1115] rounded-lg hover:bg-[#0F1115] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          {assigning === p.slug ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                          {isActive ? 'Assigned' : 'Assign'}
                        </button>
                      </div>

                      {isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-[#E4E4E0] bg-[#FAFAF8] space-y-3">
                          <ProtocolDetail label="What it does" body={p.what_it_does} />
                          <div>
                            <p className="text-[10px] font-medium text-[#6E747D] mb-1">Steps</p>
                            <ol className="space-y-1">
                              {p.steps.map((s, i) => (
                                <li key={i} className="text-[12px] text-[#0F1115] leading-relaxed flex gap-2">
                                  <span className="text-[#9CA2AB]">{i + 1}.</span>
                                  <span>{s}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <ProtocolDetail label="Frequency" body={p.dosing.frequency} />
                            <ProtocolDetail label="Duration" body={p.dosing.duration} />
                            {p.dosing.timing && <ProtocolDetail label="Timing" body={p.dosing.timing} />}
                            {p.dosing.intensity_notes && <ProtocolDetail label="Intensity" body={p.dosing.intensity_notes} />}
                          </div>
                          {p.contraindications.length > 0 && (
                            <div>
                              <p className="text-[10px] font-medium text-[#8F2D2D] mb-1">Contraindications</p>
                              <ul className="text-[12px] text-[#0F1115] leading-relaxed space-y-0.5">
                                {p.contraindications.map((c, i) => <li key={i}>- {c}</li>)}
                              </ul>
                            </div>
                          )}
                          <ProtocolDetail label="Safety" body={p.safety_notes} />
                          <div className="rounded-lg bg-white border border-[#E4E4E0] px-3 py-2">
                            <p className="text-[10px] font-medium text-[#0F1115] mb-1">Coach doctrine</p>
                            <p className="text-[12px] text-[#0F1115] leading-relaxed">{p.coach_doctrine}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {availableProtocols.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E4E4E0] bg-[#FAFAF8] px-6 py-8 text-center">
            <p className="text-sm text-[#6E747D]">No protocols available. Tag {clientName}&apos;s equipment access above to unlock the library.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function RrsSuggestionBanner({
  clientId,
  clientName,
  suggestion,
  activeSlugs,
  onAssign,
  assigning,
}: {
  clientId: string
  clientName: string
  suggestion: RrsSuggestionProp
  activeSlugs: Set<string>
  onAssign: (slug: string) => void
  assigning: string | null
}) {
  const [dismissed, setDismissed] = useState(false)
  const [sbstRemovalConfirmed, setSbstRemovalConfirmed] = useState(false)
  const [logging, setLogging] = useState(false)

  if (dismissed) return null

  const suggestedProtocols = suggestion.suggested_protocol_slugs
    .map(slug => protocolBySlug(slug))
    .filter((p): p is RecoveryProtocol => p !== null)

  const showSbstRemovalAlert = suggestion.sbst_action === 'remove'

  const dismiss = async () => {
    setLogging(true)
    try {
      await fetch(`/api/clients/${clientId}/recovery/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rrs_playbook_id: suggestion.playbook_id,
          suggested_protocol_slugs: suggestion.suggested_protocol_slugs,
          sbst_action: suggestion.sbst_action,
        }),
      }).then(r => r.json()).then(data => {
        if (data?.log_id) {
          return fetch(`/api/clients/${clientId}/recovery/suggestions`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: data.log_id, action_taken: 'dismissed' }),
          })
        }
      })
    } catch (e) {
      void e
    } finally {
      setLogging(false)
      setDismissed(true)
    }
  }

  const markSbstRemoved = () => {
    if (!confirm(`Confirm you have removed any active SBST assignments (nose tape, mouth tape, or airway mouthpiece) from ${clientName}.\n\nPer 13D_16 doctrine, SBST must be removed when the client enters ns_overload state. This does not un-assign the protocols in the database - use the History section below to Pause any active SBST assignments.`)) return
    setSbstRemovalConfirmed(true)
  }

  const bannerBorder = showSbstRemovalAlert ? 'border-[#D4817E]' : 'border-[#EADCC4]'
  const bannerBg = showSbstRemovalAlert ? 'bg-[#FBF1F1]' : 'bg-[#FDF8F1]'
  const textColour = showSbstRemovalAlert ? 'text-[#8A1919]' : 'text-[#8A5514]'
  const eyebrowColour = showSbstRemovalAlert ? 'text-[#8F2D2D]' : 'text-[#B06E1F]'

  return (
    <div className={`rounded-xl border ${bannerBorder} ${bannerBg} overflow-hidden`}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-start gap-2 flex-1">
            <AlertTriangle size={18} className={`${textColour} mt-0.5 shrink-0`} />
            <div className="flex-1 min-w-0">
              <p className={`text-[10px] font-bold ${eyebrowColour} uppercase tracking-widest`}>
                RRS state active - {suggestion.days_active} day{suggestion.days_active === 1 ? '' : 's'}
              </p>
              <h2 className={`text-base font-semibold ${textColour} mt-0.5`}>
                {suggestion.playbook_name} ({suggestion.playbook_id})
              </h2>
            </div>
          </div>
          <button
            onClick={dismiss}
            disabled={logging}
            className={`shrink-0 p-1 ${textColour} hover:opacity-70 disabled:opacity-40 transition-opacity`}
            title="Dismiss banner (logged)"
          >
            <X size={16} />
          </button>
        </div>
        <p className={`text-[13px] ${textColour} leading-relaxed mb-3 pl-6`}>{suggestion.rationale}</p>

        {/* SBST-specific alert */}
        {suggestion.sbst_action && (
          <div className={`ml-6 mb-3 rounded-lg border ${showSbstRemovalAlert ? 'border-red-400 bg-white' : 'border-[#EADCC4] bg-white'} px-3 py-2`}>
            <p className={`text-[10px] font-bold ${eyebrowColour} uppercase tracking-widest mb-1`}>SBST action required</p>
            <p className={`text-[12px] ${textColour} leading-relaxed`}>{sbstActionLabel(suggestion.sbst_action)}</p>
            {showSbstRemovalAlert && !sbstRemovalConfirmed && (
              <button
                onClick={markSbstRemoved}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium px-3 py-1.5 bg-[#8F2D2D] text-white rounded-lg hover:bg-[#8F2D2D] transition-colors"
              >
                <Check size={12} /> Mark SBST removed
              </button>
            )}
            {sbstRemovalConfirmed && (
              <p className="mt-2 text-[11px] text-[#2B5E45] inline-flex items-center gap-1">
                <Check size={11} /> Confirmed. Now pause any active SBST assignments in the History section below.
              </p>
            )}
          </div>
        )}

        {/* Suggested protocols */}
        {suggestedProtocols.length > 0 && (
          <div className="ml-6 space-y-1.5">
            <p className={`text-[10px] font-bold ${eyebrowColour} uppercase tracking-widest`}>Suggested protocols (coach decides)</p>
            {suggestedProtocols.map(p => {
              const isActive = activeSlugs.has(p.slug)
              return (
                <div key={p.slug} className="flex items-center justify-between gap-3 rounded-lg bg-white border border-[#E4E4E0] px-3 py-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-[#0F1115]">{p.name}</p>
                    <p className="text-[11px] text-[#6E747D] mt-0.5 line-clamp-1">{p.short_description}</p>
                  </div>
                  <button
                    onClick={() => onAssign(p.slug)}
                    disabled={isActive || assigning === p.slug}
                    className="shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1.5 border border-[#0F1115] text-[#0F1115] rounded-lg hover:bg-[#0F1115] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    {assigning === p.slug ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {isActive ? 'Assigned' : 'Assign'}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {/* Do-not-suggest list */}
        {suggestion.do_not_suggest.length > 0 && (
          <div className="ml-6 mt-3">
            <p className={`text-[10px] font-bold ${eyebrowColour} uppercase tracking-widest`}>Do not suggest in this state</p>
            <p className="text-[11px] text-[#6E747D] mt-1 leading-relaxed">
              {suggestion.do_not_suggest.map(slug => protocolBySlug(slug)?.name).filter(Boolean).join(' · ')}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function ProtocolDetail({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium text-[#6E747D] mb-1">{label}</p>
      <p className="text-[12px] text-[#0F1115] leading-relaxed">{body}</p>
    </div>
  )
}

function AccessGroup({ title, icon, tags, access, onToggle }: { title: string; icon: React.ReactNode; tags: EquipmentTag[]; access: EquipmentTag[]; onToggle: (t: EquipmentTag) => void }) {
  return (
    <div className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[#6E747D]">{icon}</span>
        <span className="text-[10px] font-medium text-[#6E747D]">{title}</span>
      </div>
      <div className="space-y-1.5">
        {tags.map(tag => (
          <label key={tag} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={access.includes(tag)}
              onChange={() => onToggle(tag)}
              className="w-4 h-4 rounded border-[#E4E4E0] text-[#0F1115] focus:ring-[#0F1115]"
            />
            <span className="text-[13px] text-[#0F1115] group-hover:text-[#0F1115]">{EQUIPMENT_LABELS[tag]}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function AssignmentCard({ assignment, onEditNote, onPause, onResume, onComplete, onDelete }: {
  assignment: Assignment
  onEditNote: (a: Assignment) => void
  onPause?: (id: string) => void
  onResume?: (id: string) => void
  onComplete?: (id: string) => void
  onDelete: (id: string) => void
}) {
  const protocol = protocolBySlug(assignment.protocol_slug)
  if (!protocol) {
    return (
      <div className="rounded-xl border border-[#EADCC4] bg-[linear-gradient(180deg,#FDF8F1,#FDF8F1)] px-4 py-3">
        <p className="text-[12.5px] text-[#B06E1F]">Unknown protocol slug: {assignment.protocol_slug}</p>
        <button onClick={() => onDelete(assignment.id)} className="text-[11px] text-[#B06E1F] underline mt-1">Delete</button>
      </div>
    )
  }
  const statusColour = assignment.status === 'active' ? 'text-[#0F1115]' : assignment.status === 'paused' ? 'text-[#B06E1F]' : 'text-[#6E747D]'
  return (
    <div className="rounded-xl border border-[#E4E4E0] bg-white overflow-hidden">
      <div className="flex items-start justify-between gap-3 px-4 py-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#0F1115]">{protocol.name}</span>
            <span className={`text-[9px] font-bold uppercase tracking-widest ${statusColour}`}>{assignment.status}</span>
          </div>
          <p className="text-[11px] text-[#6E747D] mt-0.5">{protocol.dosing.frequency} · {protocol.dosing.duration}</p>
          {assignment.coach_note && (
            <div className="mt-2 rounded-lg bg-[#FAFAF8] border border-[#E4E4E0] px-3 py-2">
              <p className="text-[10px] font-medium text-[#6E747D] mb-0.5">Coach note (shown to client)</p>
              <p className="text-[12px] text-[#0F1115] leading-relaxed whitespace-pre-line">{assignment.coach_note}</p>
            </div>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEditNote(assignment)} className="text-[10px] font-medium text-[#6E747D] hover:text-[#0F1115] px-2 py-1">Edit note</button>
          {onPause && <button onClick={() => onPause(assignment.id)} title="Pause" className="p-1.5 text-[#6E747D] hover:text-[#B06E1F] rounded transition-colors"><Pause size={12} /></button>}
          {onResume && <button onClick={() => onResume(assignment.id)} title="Resume" className="p-1.5 text-[#6E747D] hover:text-[#0F1115] rounded transition-colors"><Play size={12} /></button>}
          {onComplete && <button onClick={() => onComplete(assignment.id)} title="Mark complete" className="p-1.5 text-[#6E747D] hover:text-[#2B5E45] rounded transition-colors"><Check size={12} /></button>}
          <button onClick={() => onDelete(assignment.id)} title="Delete" className="p-1.5 text-[#6E747D] hover:text-[#8F2D2D] rounded transition-colors"><Trash2 size={12} /></button>
        </div>
      </div>
    </div>
  )
}
