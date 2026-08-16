'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Sparkles, Plus, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
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
  high: 'bg-blue-50 border-blue-200 text-blue-700',
  moderate: 'bg-stone-100 border-stone-300 text-stone-600',
  low: 'bg-amber-50 border-amber-200 text-amber-700',
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
  const [assigning, setAssigning] = useState<string | null>(null)
  const [openSafety, setOpenSafety] = useState<string | null>(null)
  const [showNotNow, setShowNotNow] = useState(false)

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
    <div className="mb-8 rounded-xl border border-stone-200 bg-stone-50 overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-200 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Suggested for {clientName}
          </p>
          <p className="text-xs text-stone-600 mt-1.5 leading-relaxed max-w-2xl">
            Reads their foundational synthesis, medications and medication analysis, bloods, intake domain scores, active recovery state, nutrition plan and recent check-ins, then shortlists from the library. Suggestions only. Nothing is assigned until you click Assign.
          </p>
          {set && (
            <p className="text-[11px] text-stone-500 mt-1.5">
              Generated {new Date(set.generated_at).toLocaleString('en-AU', {
                timeZone: 'Australia/Brisbane', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true,
              })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="shrink-0 px-3 py-2 bg-blue-50 border border-blue-300 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1.5"
        >
          {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Reading their file…</> : set ? 'Regenerate' : 'Suggest a stack'}
        </button>
      </div>

      {generating && (
        <p className="px-5 py-4 text-xs text-stone-500 leading-relaxed">
          Holding their whole picture in one pass on the clinical model. This takes 30 to 60 seconds. The page is not frozen, please don&apos;t refresh.
        </p>
      )}

      {error && <p className="px-5 py-3 text-xs text-red-700">{error}</p>}

      {set && !generating && (
        <div className="px-5 py-4">
          {set.overview && (
            <p className="text-sm text-stone-800 leading-relaxed mb-4 whitespace-pre-wrap">{set.overview}</p>
          )}

          {clientMedications?.trim() && (
            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                On medication, verify every interaction yourself
              </p>
              <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{clientMedications.trim()}</p>
            </div>
          )}

          {set.suggestions.length === 0 ? (
            <p className="text-sm text-stone-600 leading-relaxed">No substances suggested for {clientName} right now.</p>
          ) : (
            <div className="space-y-3">
              {set.suggestions.map((s, i) => {
                const substance: SupplementSubstance | null = substanceBySlug(s.slug)
                const already = activeSlugs.includes(s.slug)
                const safetyOpen = openSafety === s.slug
                return (
                  <div key={s.slug} className="rounded-lg border border-stone-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-stone-400">{i + 1}</span>
                          <p className="text-sm font-semibold text-[#1A1A1A]">{s.name}</p>
                          <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-700">
                            Start at {TIER_LABEL[s.recommendedTier]}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${CONFIDENCE_STYLE[s.confidence]}`}>
                            {s.confidence} confidence
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => assign(s)}
                        disabled={assigning === s.slug || already}
                        className="shrink-0 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        {assigning === s.slug
                          ? <><Loader2 className="w-3 h-3 animate-spin" /> Assigning…</>
                          : already ? 'Already assigned' : <><Plus className="w-3 h-3" /> Assign</>}
                      </button>
                    </div>

                    <p className="text-sm text-stone-700 leading-relaxed mt-2.5">{s.rationale}</p>

                    {s.watch && (
                      <div className="mt-2.5 rounded border border-stone-200 bg-stone-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Watch</p>
                        <p className="text-xs text-stone-700 leading-relaxed">{s.watch}</p>
                      </div>
                    )}

                    {substance && (
                      <>
                        <button
                          type="button"
                          onClick={() => setOpenSafety(safetyOpen ? null : s.slug)}
                          className="mt-2.5 text-[11px] font-bold text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
                        >
                          {safetyOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          Library safety record and {TIER_LABEL[s.recommendedTier]} protocol
                        </button>
                        {safetyOpen && (
                          <div className="mt-2 space-y-2.5 text-xs">
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">{TIER_LABEL[s.recommendedTier]} protocol</p>
                              <p className="text-stone-700 leading-relaxed">
                                {substance.tiers[s.recommendedTier].form}. {substance.tiers[s.recommendedTier].dose}, {substance.tiers[s.recommendedTier].timing}.
                              </p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Contraindications</p>
                              {substance.contraindications.length > 0 ? (
                                <ul className="list-disc list-inside text-stone-700 leading-relaxed space-y-0.5">
                                  {substance.contraindications.map(c => <li key={c}>{c}</li>)}
                                </ul>
                              ) : <p className="text-stone-600">None listed.</p>}
                            </div>
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1">Safety notes</p>
                              <p className="text-stone-700 leading-relaxed">{substance.safety_notes}</p>
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
                className="text-[11px] font-bold text-stone-500 hover:text-stone-700 transition-colors flex items-center gap-1"
              >
                {showNotNow ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                Considered and ruled out ({set.not_now.length})
              </button>
              {showNotNow && (
                <ul className="mt-2 space-y-1.5">
                  {set.not_now.map(n => (
                    <li key={n.slug} className="text-xs text-stone-600 leading-relaxed">
                      <span className="font-semibold text-stone-700">{n.name}:</span> {n.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {!set && !generating && !error && (
        <p className="px-5 py-4 text-xs text-stone-500 leading-relaxed">
          No suggestions generated yet for {clientName}.
        </p>
      )}
    </div>
  )
}
