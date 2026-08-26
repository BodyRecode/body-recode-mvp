'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Plus, AlertTriangle, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react'
import { substanceBySlug, type SupplementSubstance } from '@/lib/supplement-substances-seed'

export interface Suggestion {
  slug: string
  name: string
  recommendedTier: 'essential' | 'enhanced' | 'elite'
  rationale: string
  watch: string
  confidence: 'high' | 'moderate' | 'low'
}

export interface NotNow {
  slug: string
  name: string
  reason: string
}

export interface SuggestionSet {
  generated_at: string
  overview: string
  suggestions: Suggestion[]
  not_now: NotNow[]
  gated: Array<{ slug: string; name: string; reason: string }>
}

const TIER_LABEL: Record<Suggestion['recommendedTier'], string> = {
  essential: 'Essential',
  enhanced: 'Enhanced',
  elite: 'Elite',
}

const CONFIDENCE_STYLE: Record<Suggestion['confidence'], string> = {
  high: 'bg-[rgba(27,109,252,0.08)] border-[#B5CFFC] text-[#1056D6]',
  moderate: 'bg-[#F4F6F9] border-[#E8EAEE] text-[#666D7A]',
  low: 'bg-[#FDF6E9] border-[#F1DEB8] text-[#A96A12]',
}

/**
 * Coach-facing supplement suggestion panel.
 *
 * Suggests, never assigns. Every card shows the AI's reasoning next to the
 * library's own contraindications and safety notes, and next to the client's
 * medications, so the coach verifies before clicking Assign rather than
 * trusting the rationale on its own.
 */
export default function SuggestionPanel({
  clientId,
  clientName,
  initialSet,
  clientMedications,
  activeSlugs,
}: {
  clientId: string
  clientName: string
  initialSet: SuggestionSet | null
  clientMedications: string | null
  activeSlugs: string[]
}) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [set, setSet] = useState<SuggestionSet | null>(initialSet)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [approving, setApproving] = useState(false)
  const [openSafety, setOpenSafety] = useState<string | null>(null)
  const [showNotNow, setShowNotNow] = useState(false)

  const unassigned = (set?.suggestions ?? []).filter(s => !activeSlugs.includes(s.slug))

  /**
   * Approve the whole stack in one action. Per-card Assign stays for partial
   * approval; this is the "the plan is right, ship it" path. The batch API is
   * idempotent per slug, so anything already active is skipped rather than
   * failing the rest.
   */
  const approvePlan = async () => {
    if (unassigned.length === 0) return
    const names = unassigned.map(s => `${s.name} (${TIER_LABEL[s.recommendedTier]})`).join(', ')
    if (!confirm(`Assign all ${unassigned.length} substances to ${clientName}?\n\n${names}\n\nThey appear in ${clientName}'s portal immediately, with all three tiers visible per substance.`)) return
    const note = prompt(`Optional note shown to ${clientName} on every substance in this stack (leave blank for none):`)
    setApproving(true); setError(null); setStatus(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/suggestions/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'supplement',
          slugs: unassigned.map(s => s.slug),
          coach_note: note && note.trim() ? note.trim() : null,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server returned ${res.status}`)
      setStatus(
        `Assigned ${json.assigned.length} substance${json.assigned.length === 1 ? '' : 's'}.` +
        (json.skipped.length > 0 ? ` Skipped ${json.skipped.length}: ${json.skipped.map((s: { slug: string; reason: string }) => `${s.slug} (${s.reason})`).join(', ')}.` : '')
      )
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not approve the stack')
    } finally {
      setApproving(false)
    }
  }

  const generate = async () => {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/supplement-suggestions`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? `Server returned ${res.status}`)
      setSet({
        generated_at: json.generated_at,
        overview: json.overview ?? '',
        suggestions: json.suggestions ?? [],
        not_now: json.not_now ?? [],
        gated: json.gated ?? [],
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate suggestions')
    } finally {
      setGenerating(false)
    }
  }

  const assign = async (s: Suggestion) => {
    const note = prompt(
      `Optional note for ${clientName} on ${s.name} (shown on their portal). Suggested starting tier: ${TIER_LABEL[s.recommendedTier]}.`
    )
    setAssigning(s.slug)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/supplements/assignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substance_slug: s.slug,
          coach_note: note && note.trim().length > 0 ? note.trim() : null,
        }),
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
    <div className="mb-8 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8EAEE] flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-[12px] font-medium text-[#1B6DFC] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested for {clientName}
          </p>
          <p className="text-[12.5px] text-[#666D7A] mt-1.5 leading-relaxed max-w-2xl">
            Reads their foundational synthesis, medications and medication analysis, bloods, intake domain scores, active recovery state, nutrition plan and recent check-ins, then shortlists from the library. Suggestions only. Nothing is assigned until you click Assign.
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
              className="px-3 py-2 bg-[#1B6DFC] hover:bg-[#1560E0] text-white text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {approving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Assigning…</> : <><CheckCheck className="w-3.5 h-3.5" /> Approve stack ({unassigned.length})</>}
            </button>
          )}
          <button
            type="button"
            onClick={generate}
            disabled={generating || approving}
            className="px-3 py-2 bg-[rgba(27,109,252,0.08)] border border-[#9CC0FB] hover:bg-[#DDE9FD] text-[#1056D6] text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading their file…</> : set ? 'Regenerate' : 'Suggest a stack'}
          </button>
        </div>
      </div>

      {generating && (
        <p className="px-5 py-4 text-[12.5px] text-[#666D7A] leading-relaxed">
          Holding their whole picture in one pass on the clinical model. This takes 30 to 60 seconds. The page is not frozen, please don&apos;t refresh.
        </p>
      )}

      {error && <p className="px-5 py-3 text-[12.5px] text-[#C82626]">{error}</p>}
      {status && <p className="px-5 py-3 text-[12.5px] text-[#1560E0]">{status}</p>}

      {set && !generating && (
        <div className="px-5 py-4">
          {set.overview && (
            <p className="text-sm text-[#141821] leading-relaxed mb-4 whitespace-pre-wrap">{set.overview}</p>
          )}

          {clientMedications?.trim() && (
            <div className="mb-4 rounded-lg border border-[#F1DEB8] bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] px-3 py-2.5">
              <p className="text-[11.5px] font-medium text-[#A96A12] mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                On medication, verify every interaction yourself
              </p>
              <p className="text-[12.5px] text-[#8A5A14] leading-relaxed whitespace-pre-wrap">{clientMedications.trim()}</p>
            </div>
          )}

          {set.suggestions.length === 0 ? (
            <p className="text-sm text-[#666D7A] leading-relaxed">No substances suggested for {clientName} right now.</p>
          ) : (
            <div className="space-y-3">
              {set.suggestions.map((s, i) => {
                const substance: SupplementSubstance | null = substanceBySlug(s.slug)
                const already = activeSlugs.includes(s.slug)
                const safetyOpen = openSafety === s.slug
                return (
                  <div key={s.slug} className="rounded-lg border border-[#E8EAEE] bg-white p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-medium text-[#98A0AD]">{i + 1}</span>
                          <p className="text-sm font-semibold text-[#141821]">{s.name}</p>
                          <span className="text-[11.5px] font-medium px-2 py-0.5 rounded bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] text-[#1056D6]">
                            Start at {TIER_LABEL[s.recommendedTier]}
                          </span>
                          <span className={`text-[11.5px] font-medium px-2 py-0.5 rounded border ${CONFIDENCE_STYLE[s.confidence]}`}>
                            {s.confidence} confidence
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => assign(s)}
                        disabled={assigning === s.slug || already}
                        className="shrink-0 px-3 py-1.5 bg-[#1B6DFC] hover:bg-[#1560E0] text-white text-[12.5px] font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {assigning === s.slug
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Assigning…</>
                          : already ? 'Already assigned' : <><Plus className="w-3 h-3" /> Assign</>}
                      </button>
                    </div>

                    <p className="text-sm text-[#141821] leading-relaxed mt-2.5">{s.rationale}</p>

                    {s.watch && (
                      <div className="mt-2.5 rounded border border-[#E8EAEE] bg-[#FBFCFD] px-3 py-2">
                        <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Watch</p>
                        <p className="text-[12.5px] text-[#141821] leading-relaxed">{s.watch}</p>
                      </div>
                    )}

                    {substance && (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenSafety(safetyOpen ? null : s.slug)}
                          className="mt-2.5 text-[11px] font-medium text-[#666D7A] hover:text-[#141821] transition-colors flex items-center gap-1"
                        >
                          {safetyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Library safety record and {TIER_LABEL[s.recommendedTier]} protocol
                        </button>
                        {safetyOpen && (
                          <div className="mt-2 space-y-2.5 text-[12.5px]">
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">{TIER_LABEL[s.recommendedTier]} protocol</p>
                              <p className="text-[#141821] leading-relaxed">
                                {substance.tiers[s.recommendedTier].form}. {substance.tiers[s.recommendedTier].dose}, {substance.tiers[s.recommendedTier].timing}.
                              </p>
                            </div>
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Contraindications</p>
                              {substance.contraindications.length > 0 ? (
                                <ul className="list-disc list-inside text-[#141821] leading-relaxed space-y-0.5">
                                  {substance.contraindications.map(c => <li key={c}>{c}</li>)}
                                </ul>
                              ) : <p className="text-[#666D7A]">None listed.</p>}
                            </div>
                            <div>
                              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Safety notes</p>
                              <p className="text-[#141821] leading-relaxed">{substance.safety_notes}</p>
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
          No suggestions generated yet for {clientName}.
        </p>
      )}
    </div>
  )
}
