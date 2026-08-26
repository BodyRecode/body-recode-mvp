'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Plus, AlertTriangle, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react'
import { protocolBySlug, EQUIPMENT_LABELS, type RecoveryProtocol } from '@/lib/recovery-protocols-seed'

export interface RecoverySuggestionItem {
  slug: string
  name: string
  rationale: string
  watch: string
  confidence: 'high' | 'moderate' | 'low'
}

export interface RecoveryPlanSet {
  generated_at: string
  overview: string
  suggestions: RecoverySuggestionItem[]
  not_now: Array<{ slug: string; name: string; reason: string }>
  gated: Array<{ slug: string; name: string; reason: string }>
  rrs_note: string | null
}

const CONFIDENCE_STYLE: Record<RecoverySuggestionItem['confidence'], string> = {
  high: 'bg-blue-50 border-blue-200 text-blue-700',
  moderate: 'bg-[#F4F6F9] border-[#E8EAEE] text-[#666D7A]',
  low: 'bg-amber-50 border-amber-200 text-amber-700',
}

/**
 * Whole-file recovery plan panel.
 *
 * Distinct from the RRS banner above it: that one fires only when a playbook
 * state is active and reflects doctrine for that state. This one works for
 * every client, and folds the RRS state in as an input when there is one.
 */
export default function RecoveryPlanSuggestionPanel({
  clientId,
  clientName,
  initialSet,
  clientMedications,
  activeSlugs,
  hasEquipmentTagged,
}: {
  clientId: string
  clientName: string
  initialSet: RecoveryPlanSet | null
  clientMedications: string | null
  activeSlugs: string[]
  hasEquipmentTagged: boolean
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [set, setSet] = useState<RecoveryPlanSet | null>(initialSet)
  const [generating, setGenerating] = useState(false)
  const [approving, setApproving] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [openDetail, setOpenDetail] = useState<string | null>(null)
  const [showNotNow, setShowNotNow] = useState(false)

  const unassigned = (set?.suggestions ?? []).filter(s => !activeSlugs.includes(s.slug))

  const generate = async () => {
    setGenerating(true); setError(null); setStatus(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery-plan-suggestions`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server returned ${res.status}`)
      setSet({
        generated_at: json.generated_at,
        overview: json.overview ?? '',
        suggestions: json.suggestions ?? [],
        not_now: json.not_now ?? [],
        gated: json.gated ?? [],
        rrs_note: json.rrs_note ?? null,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate the plan')
    } finally {
      setGenerating(false)
    }
  }

  const approvePlan = async () => {
    if (unassigned.length === 0) return
    const names = unassigned.map(s => s.name).join(', ')
    if (!confirm(`Assign all ${unassigned.length} protocols to ${clientName}?\n\n${names}\n\nThey appear in ${clientName}'s portal immediately.`)) return
    const note = prompt(`Optional note shown to ${clientName} on every protocol in this plan (leave blank for none):`)
    setApproving(true); setError(null); setStatus(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/suggestions/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'recovery',
          slugs: unassigned.map(s => s.slug),
          coach_note: note && note.trim() ? note.trim() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server returned ${res.status}`)
      setStatus(
        `Assigned ${json.assigned.length} protocol${json.assigned.length === 1 ? '' : 's'}.` +
        (json.skipped.length > 0 ? ` Skipped ${json.skipped.length}: ${json.skipped.map((s: { slug: string; reason: string }) => `${s.slug} (${s.reason})`).join(', ')}.` : '')
      )
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve the plan')
    } finally {
      setApproving(false)
    }
  }

  const assignOne = async (s: RecoverySuggestionItem) => {
    const note = prompt(`Optional note for ${clientName} on ${s.name} (shown on their portal):`)
    setAssigning(s.slug); setError(null); setStatus(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/recovery/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ protocol_slug: s.slug, coach_note: note && note.trim() ? note.trim() : null }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Server returned ${res.status}`)
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not assign')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="mb-6 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8EAEE] flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-blue-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested recovery plan
          </p>
          <p className="text-[12.5px] text-[#666D7A] mt-1.5 leading-relaxed max-w-2xl">
            Reads {clientName}&apos;s foundational synthesis, intake domain scores, recent syntheses and check-ins, active program, medications and equipment access, then builds a plan from the protocols they can actually do. Works whether or not they are in a recovery state. Suggestions only until you approve.
          </p>
          {set && (
            <p className="text-[11px] text-[#666D7A] mt-1.5">
              Generated {new Date(set.generated_at).toLocaleString('en-AU', {
                timeZone: 'Australia/Brisbane', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
              })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {set && unassigned.length > 0 && (
            <button
              type="button"
              onClick={approvePlan}
              disabled={approving || generating}
              className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {approving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning…</> : <><CheckCheck className="w-3.5 h-3.5" /> Approve plan ({unassigned.length})</>}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={generating || approving}
            className="px-3 py-2 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-700 text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading their file…</> : set ? 'Regenerate' : 'Build a plan'}
          </button>
        </div>
      </div>

      {!hasEquipmentTagged && !set && (
        <p className="px-5 py-3 text-[12.5px] text-amber-800 bg-amber-50 border-b border-amber-200 leading-relaxed">
          No equipment access tagged yet. Tag what {clientName} can access below first, otherwise everything needing kit is filtered out and you will only get the no-equipment protocols.
        </p>
      )}

      {generating && (
        <p className="px-5 py-4 text-[12.5px] text-[#666D7A] leading-relaxed">
          Holding their whole picture in one pass on the clinical model. 30 to 60 seconds. The page is not frozen, please don&apos;t refresh.
        </p>
      )}

      {error && <p className="px-5 py-3 text-[12.5px] text-red-700">{error}</p>}
      {status && <p className="px-5 py-3 text-[12.5px] text-blue-600">{status}</p>}

      {set && !generating && (
        <div className="px-5 py-4">
          {set.rrs_note && (
            <div className="mb-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5">
              <p className="text-[11.5px] font-medium text-blue-700 mb-1">Recovery state in force</p>
              <p className="text-[12.5px] text-blue-900 leading-relaxed">{set.rrs_note}</p>
            </div>
          )}

          {set.overview && (
            <p className="text-sm text-[#141821] leading-relaxed mb-4 whitespace-pre-wrap">{set.overview}</p>
          )}

          {clientMedications?.trim() && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[11.5px] font-medium text-amber-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                On medication, verify every contraindication yourself
              </p>
              <p className="text-[12.5px] text-amber-900 leading-relaxed whitespace-pre-wrap">{clientMedications.trim()}</p>
            </div>
          )}

          {set.suggestions.length === 0 ? (
            <p className="text-sm text-[#666D7A] leading-relaxed">No protocols suggested for {clientName} right now.</p>
          ) : (
            <div className="space-y-3">
              {set.suggestions.map((s, i) => {
                const protocol: RecoveryProtocol | null = protocolBySlug(s.slug)
                const already = activeSlugs.includes(s.slug)
                const open = openDetail === s.slug
                return (
                  <div key={s.slug} className="rounded-lg border border-[#E8EAEE] bg-white p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-[10px] font-medium text-[#98A0AD]">{i + 1}</span>
                        <p className="text-sm font-semibold text-[#141821]">{s.name}</p>
                        {protocol && (
                          <span className="text-[11.5px] font-medium px-2 py-0.5 rounded bg-[#F4F6F9] border border-[#E8EAEE] text-[#666D7A]">
                            {protocol.category}
                          </span>
                        )}
                        <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded border ${CONFIDENCE_STYLE[s.confidence]}`}>
                          {s.confidence} confidence
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => assignOne(s)}
                        disabled={assigning === s.slug || already || approving}
                        className="shrink-0 px-3 py-1.5 border border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {assigning === s.slug
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Assigning…</>
                          : already ? 'Assigned' : <><Plus className="w-3 h-3" /> Assign</>}
                      </button>
                    </div>

                    <p className="text-sm text-[#141821] leading-relaxed mt-2.5">{s.rationale}</p>

                    {s.watch && (
                      <div className="mt-2.5 rounded border border-[#E8EAEE] bg-[#FBFCFD] px-3 py-2">
                        <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Watch</p>
                        <p className="text-[12.5px] text-[#141821] leading-relaxed">{s.watch}</p>
                      </div>
                    )}

                    {protocol && (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenDetail(open ? null : s.slug)}
                          className="mt-2.5 text-[11px] font-medium text-[#666D7A] hover:text-[#141821] transition-colors flex items-center gap-1"
                        >
                          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Dosing, equipment and safety record
                        </button>
                        {open && (
                          <div className="mt-2 space-y-2.5 text-[12.5px]">
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Dosing</p>
                              <p className="text-[#141821] leading-relaxed">
                                {protocol.dosing.frequency}. {protocol.dosing.duration}.
                                {protocol.dosing.timing ? ` ${protocol.dosing.timing}.` : ''}
                                {protocol.dosing.intensity_notes ? ` ${protocol.dosing.intensity_notes}` : ''}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Equipment</p>
                              <p className="text-[#141821] leading-relaxed">
                                {protocol.required_equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}
                              </p>
                            </div>
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Contraindications</p>
                              {protocol.contraindications.length > 0 ? (
                                <ul className="list-disc list-inside text-[#141821] leading-relaxed space-y-0.5">
                                  {protocol.contraindications.map(c => <li key={c}>{c}</li>)}
                                </ul>
                              ) : <p className="text-[#666D7A]">None listed.</p>}
                            </div>
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Safety notes</p>
                              <p className="text-[#141821] leading-relaxed">{protocol.safety_notes}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {set.not_now.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowNotNow(!showNotNow)}
                className="text-[11px] font-medium text-[#666D7A] hover:text-[#141821] transition-colors flex items-center gap-1"
              >
                {showNotNow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Considered and ruled out ({set.not_now.length})
              </button>
              {showNotNow && (
                <ul className="mt-2 space-y-1.5">
                  {set.not_now.map(n => (
                    <li key={n.slug} className="text-[12.5px] text-[#666D7A] leading-relaxed">
                      <span className="font-semibold text-[#141821]">{n.name}:</span> {n.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!set && !generating && !error && (
        <p className="px-5 py-4 text-[12.5px] text-[#666D7A] leading-relaxed">
          No plan built yet for {clientName}.
        </p>
      )}
    </div>
  )
}
