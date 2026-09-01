'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { checkPrescriptionFeasibility, humaniseValidationIssue } from '@/lib/nutrition-validation'

function parseReason(text: string): { intro: string | null; points: string[] } {
  if (/\(\d+\)/.test(text)) {
    const firstIdx = text.search(/\(\d+\)/)
    const intro = firstIdx > 0 ? text.slice(0, firstIdx).trim() : null
    const rest = firstIdx > 0 ? text.slice(firstIdx) : text
    const points = rest.split(/\s*\(\d+\)\s*/).map(s => s.trim()).filter(Boolean)
    return { intro, points }
  }
  const sentences = text.replace(/([.!?])\s+(?=[A-Z-])/g, '$1|||').split('|||').map(s => s.trim()).filter(s => s.length > 10)
  if (sentences.length >= 3) return { intro: null, points: sentences }
  return { intro: null, points: [text] }
}

function ReasonDisplay({ text }: { text: string }) {
  const { intro, points } = parseReason(text)
  return (
    <div className="space-y-1.5 mt-2">
      {intro && <p className="text-[12.5px] text-[#141821] leading-relaxed">{intro}</p>}
      {points.map((point, i) => (
        <div key={i} className="flex items-start gap-2">
          {points.length > 1 && <span className="text-[#1B6DFC] shrink-0 mt-0.5 text-[10px]">•</span>}
          {points.length === 1 && <span className="text-[#1B6DFC] text-[12.5px] mt-0.5 shrink-0">→</span>}
          <p className="text-[12.5px] text-[#666D7A] leading-relaxed">{point}</p>
        </div>
      ))}
    </div>
  )
}

const NAV_SECTIONS = [
  { id: 'rationale', title: 'Rationale' },
  { id: 'plan-name', title: 'Plan Name' },
  { id: 'entry-state', title: 'Entry State' },
  { id: 'body-state', title: 'Body State' },
  { id: 'pts-phase', title: 'PTS Phase' },
  { id: 'protein', title: 'Protein' },
  { id: 'carbs', title: 'Carbs' },
  { id: 'meals', title: 'Meals' },
  { id: 'training-days', title: 'Training Days' },
  { id: 'signals', title: 'Signals' },
  { id: 'exclusions', title: 'Exclusions' },
]

interface Suggestion {
  plan_name: string
  plan_name_reason: string
  entry_state: string
  entry_state_reason: string
  body_state: string
  body_state_reason: string
  pts_phase: string
  pts_phase_reason: string
  constraint_level: string
  constraint_level_reason: string
  recovery_status: string
  recovery_status_reason: string
  uncertainty_level: string
  uncertainty_level_reason: string
  protein_anchor_g: number
  protein_anchor_g_reason: string
  carb_demand_level: string
  carb_demand_level_reason: string
  meal_frequency: number
  meal_frequency_reason: string
  training_days_per_week: number
  training_days_per_week_reason: string
  food_exclusions: string[]
  food_exclusions_reason: string
  overall_rationale: string
}

const ENTRY_STATE_OPTIONS = [
  { value: 'stabilisation', label: 'Stabilisation', desc: 'Instability, high constraints, recovery impaired' },
  { value: 'training_support', label: 'Training Support', desc: 'Stable + training demand present' },
  { value: 'high_output_support', label: 'High Output Support', desc: 'Consistent stability + strong recovery' },
  { value: 'recovery_reset', label: 'Recovery Reset', desc: 'Fatigue accumulation, declining recovery' },
]

const CARB_OPTIONS = ['low', 'moderate', 'high']
const CONSTRAINT_OPTIONS = ['low', 'moderate', 'high']
const RECOVERY_OPTIONS = ['stable', 'impaired', 'strong']
const UNCERTAINTY_OPTIONS = ['low', 'moderate', 'high']
const BODY_STATE_OPTIONS = ['remediation', 'optimisation', 'post_optimisation']

function ReasonCard({
  label,
  value,
  reason,
  editing,
  onEdit,
  children,
}: {
  label: string
  value: string | number
  reason: string
  editing: boolean
  onEdit: () => void
  children?: React.ReactNode
}) {
  const displayValue = typeof value === 'string'
    ? value.replace(/_/g, ' ')
    : value

  return (
    <div className="bg-[#F4F6F9] br-card overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4 mb-3">
          <p className="text-[10px] font-medium text-[#666D7A]">{label}</p>
          <button
            onClick={onEdit}
            className="text-[10px] text-[#98A0AD] hover:text-[#1B6DFC] transition-colors shrink-0"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {!editing && (
          <span className="inline-block text-sm font-semibold text-[#141821] bg-[#EFF1F4] border border-[#E8EAEE] px-3 py-1 rounded-lg capitalize mb-3">
            {displayValue}
          </span>
        )}

        {editing && children}

        <ReasonDisplay text={reason} />
      </div>
    </div>
  )
}

export default function NutritionPrescriptionSuggest({
  clientId,
  clientName,
  activeBridge,
}: {
  clientId: string
  clientName: string
  /**
   * When the active nutrition plan has bridge mode active, surface its
   * current floor + justification so the coach can offer a one-click
   * "step up by +200 kcal" preset instead of removing the override entirely.
   * Null when this is a fresh prescription or the active plan isn't a bridge.
   */
  activeBridge: { floorKcal: number; justification: string } | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [medications, setMedications] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  // Transitional override (Phase 3A bridge mode). When enabled, replaces the
  // bodyweight-derived carb / fat floors with an explicit kcal floor. Required
  // for chronic under-eaters whose actual intake is far below their bodyweight
  // floor (e.g. Vyvanse + GLP-1 stack producing ~1,400 kcal/day intake despite
  // a 1,900 kcal floor). Auto-expires 4 weeks after generation.
  const [overrideActive, setOverrideActive] = useState(false)
  const [overrideFloorKcal, setOverrideFloorKcal] = useState<number>(1600)
  const [overrideJustification, setOverrideJustification] = useState('')
  // Bridge-mode AI prefill state. When the coach toggles bridge mode on, we
  // fetch a context-aware suggestion (floor kcal + drafted justification
  // pulled from medications + baseline + recent check-ins) so a coach who
  // doesn't write clinical justifications daily can ship a defensible plan.
  const [bridgeSuggesting, setBridgeSuggesting] = useState(false)
  const [bridgeSuggestionMeta, setBridgeSuggestionMeta] = useState<{
    standard_floor_kcal: number | null
    standard_protein_anchor_g: number | null
    suggested_protein_anchor_g: number | null
    // When prefill scales the anchor down, capture the from→to so the UI
    // can warn the coach that bridge mode adjusted the anchor (audit
    // finding #9). Null means no scaling happened.
    anchor_scaled_from: number | null
    evidence_summary: string
  } | null>(null)
  const [bridgePrefillDone, setBridgePrefillDone] = useState(false)
  // Remember the standard (non-bridge) protein anchor so we can restore it if
  // the coach toggles bridge mode OFF after it auto-scaled the anchor down.
  const [proteinAnchorBeforeBridge, setProteinAnchorBeforeBridge] = useState<number | null>(null)
  const [editingField, setEditingField] = useState<string | null>(null)
  // Elapsed-seconds counter + staged readout now live inside the shared
  // GenerationProgressOverlay (src/components/generation-progress-overlay.tsx).
  // This page was the original source of the pattern; refactored 2026-06-22
  // to consume the shared component so every generation surface looks identical.

  // Module-level ref so we can abort an in-flight fetch when the coach toggles
  // bridge mode OFF mid-fetch. Without this, the fetch resolves and stomps
  // freshly-cleared UI state. Audit finding #8 on 2026-05-25.
  const bridgeFetchAbortRef = useRef<AbortController | null>(null)

  async function fetchBridgeSuggestion(force: boolean = false) {
    if (bridgeSuggesting) return
    // Abort any prior fetch still in flight
    bridgeFetchAbortRef.current?.abort()
    const controller = new AbortController()
    bridgeFetchAbortRef.current = controller
    setBridgeSuggesting(true)
    // 2026-07-06 (Bug 5 fix): mark prefill-done at fetch START, not complete.
    // Prev logic marked at complete, which left an open race window between
    // fetch start and complete during which coach edits (step-up presets,
    // manual field edits) could be silently overwritten when the async
    // response landed with stale suggestions. Setting at start closes the
    // window: any coach action during the in-flight fetch takes priority
    // over the AI suggestion when it eventually returns. On `force=true`
    // (explicit "Regenerate suggestion" click) the guard on individual
    // setters still allows overwrite.
    if (!force) setBridgePrefillDone(true)
    try {
      const res = await fetch('/api/suggest-bridge-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
        signal: controller.signal,
      })
      const data = await res.json()
      // Defence: if the coach toggled OFF while we were in flight, do nothing
      // with the response. AbortController catches most cases but this is the
      // belt-and-braces backstop.
      if (!overrideActive) return
      // 2026-07-06 (Bug 5 fix): floor now guarded same as justification and
      // anchor. Previously any fetch overwrote the floor which meant a coach
      // clicking "Step up +200 kcal → 1900" during the in-flight prefill
      // would see the floor revert to whatever the AI suggested when the
      // response landed. Amanda 2026-07-06 hit this repeatedly.
      if (data?.suggested_floor_kcal && (force || !bridgePrefillDone)) {
        setOverrideFloorKcal(data.suggested_floor_kcal)
      }
      // Only overwrite the justification on first fetch (toggle-on) or when
      // the coach explicitly clicks "Regenerate suggestion". Don't clobber
      // edits the coach has typed.
      if (data?.suggested_justification && (force || !bridgePrefillDone)) {
        setOverrideJustification(data.suggested_justification)
      }
      // Also scale the protein anchor down when bridge mode is on. Without
      // this the engine balloons the plan above the bridge target (165g
      // protein × 4 = 660 kcal alone forces total > 2,000+). The suggested
      // anchor is clamped to ≥1.2 g/kg bodyweight for muscle preservation.
      // Capture the from→to so the UI can warn if the coach had hand-edited
      // the anchor before enabling bridge mode (audit #9).
      let anchorScaledFrom: number | null = null
      const suggestedAnchor = data?.suggested_protein_anchor_g
      if (suggestedAnchor && (force || !bridgePrefillDone) && suggestedAnchor !== proteinAnchorG) {
        if (proteinAnchorBeforeBridge === null) setProteinAnchorBeforeBridge(proteinAnchorG)
        anchorScaledFrom = proteinAnchorG
        setProteinAnchorG(suggestedAnchor)
      }
      setBridgeSuggestionMeta({
        standard_floor_kcal: data?.standard_floor_kcal ?? null,
        standard_protein_anchor_g: data?.standard_protein_anchor_g ?? null,
        suggested_protein_anchor_g: data?.suggested_protein_anchor_g ?? null,
        anchor_scaled_from: anchorScaledFrom,
        evidence_summary: data?.evidence_summary ?? '',
      })
      setBridgePrefillDone(true)
    } catch (err) {
      // Silent on abort — expected when the coach toggles off mid-fetch.
      if ((err as { name?: string })?.name === 'AbortError') return
      console.warn('Bridge suggestion fetch failed:', err)
    } finally {
      setBridgeSuggesting(false)
      if (bridgeFetchAbortRef.current === controller) bridgeFetchAbortRef.current = null
    }
  }

  // Auto-fetch the bridge suggestion the first time the coach toggles
  // bridge mode ON. Doesn't refetch on subsequent toggles (state persists).
  // When toggling OFF, restore the pre-bridge protein anchor so the standard
  // prescription resumes.
  useEffect(() => {
    if (overrideActive && !bridgePrefillDone && !bridgeSuggesting) {
      fetchBridgeSuggestion(false)
    } else if (!overrideActive) {
      // Abort any in-flight prefill fetch so it can't stomp the cleared UI
      // state. Restore the pre-bridge anchor if we have one stored.
      bridgeFetchAbortRef.current?.abort()
      if (proteinAnchorBeforeBridge !== null) {
        setProteinAnchorG(proteinAnchorBeforeBridge)
        setProteinAnchorBeforeBridge(null)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [overrideActive])

  // Editable values
  const [planName, setPlanName] = useState('')
  const [entryState, setEntryState] = useState('')
  const [bodyState, setBodyState] = useState('')
  const [ptsPhase, setPtsPhase] = useState('')
  const [constraintLevel, setConstraintLevel] = useState('')
  const [recoveryStatus, setRecoveryStatus] = useState('')
  const [uncertaintyLevel, setUncertaintyLevel] = useState('')
  const [proteinAnchorG, setProteinAnchorG] = useState(0)
  const [carbDemandLevel, setCarbDemandLevel] = useState('')
  const [mealFrequency, setMealFrequency] = useState(4)
  const [trainingDaysPerWeek, setTrainingDaysPerWeek] = useState(3)
  const [foodExclusions, setFoodExclusions] = useState<string[]>([])
  const [foodExclusionsText, setFoodExclusionsText] = useState('')

  useEffect(() => {
    // AbortController guards against React Strict Mode firing the effect
    // twice and leaving stale error state from a cancelled call.
    const ac = new AbortController()
    fetch('/api/suggest-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ client_id: clientId }),
      signal: ac.signal,
    })
      .then(r => r.json())
      .then(data => {
        if (ac.signal.aborted) return
        if (data.error) { setError(data.error); setLoading(false); return }
        const s: Suggestion = data.suggestion
        setSuggestion(s)
        setMedications(typeof data.medications === 'string' ? data.medications : null)
        setPlanName(s.plan_name)
        setEntryState(s.entry_state)
        setBodyState(s.body_state)
        setPtsPhase(s.pts_phase)
        setConstraintLevel(s.constraint_level)
        setRecoveryStatus(s.recovery_status)
        setUncertaintyLevel(s.uncertainty_level)
        setProteinAnchorG(s.protein_anchor_g)
        setCarbDemandLevel(s.carb_demand_level)
        setMealFrequency(s.meal_frequency)
        setTrainingDaysPerWeek(s.training_days_per_week)
        setFoodExclusions(s.food_exclusions || [])
        setFoodExclusionsText((s.food_exclusions || []).join(', '))
        setError(null)
        setLoading(false)
      })
      .catch(err => {
        if (err?.name === 'AbortError') return
        setError('Failed to load suggestion')
        setLoading(false)
      })
    return () => ac.abort()
  }, [clientId])

  async function handleGenerate() {
    setGenerating(true)
    const exclusions = foodExclusionsText
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const res = await fetch('/api/generate-nutrition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        plan_name: planName,
        entry_state: entryState,
        body_state: bodyState,
        pts_phase: ptsPhase,
        constraint_level: constraintLevel,
        recovery_status: recoveryStatus,
        uncertainty_level: uncertaintyLevel,
        protein_anchor_g: proteinAnchorG,
        carb_demand_level: carbDemandLevel,
        meal_frequency: mealFrequency,
        training_days_per_week: trainingDaysPerWeek,
        food_exclusions: exclusions,
        transitional_override_active: overrideActive,
        transitional_override_floor_kcal: overrideActive ? overrideFloorKcal : null,
        transitional_override_justification: overrideActive ? overrideJustification : null,
      }),
    })

    const data = await res.json()
    setGenerating(false)

    if (data.error) {
      // 422 validation failures include an `issues` array — surface every
      // issue in coach-friendly language (humaniseValidationIssue explains
      // WHY each rule exists, not just the raw code). Raw codes are kept
      // in a small grey footer for our debugging.
      const issues = Array.isArray(data.issues) ? data.issues as Array<{ code: string; message: string }> : []
      const detail = issues.length > 0
        ? `${data.error}\n\n${issues.map(i => `• ${humaniseValidationIssue(i)}`).join('\n')}`
        : data.error
      setError(detail)
      return
    }
    router.push(`/dashboard/clients/${clientId}/nutrition`)
  }

  // Pre-flight feasibility — recomputes whenever the protein anchor or meal
  // frequency changes. Returns the same shape as the server validator's
  // appetite-suppression rules. We use this to BLOCK the Generate button
  // and surface a banner with one-click fixes when the prescription is
  // mathematically infeasible (e.g. anchor 165g + 4 meals + stimulant).
  // MUST live above the early returns below — Rules of Hooks.
  const feasibility = useMemo(
    () => checkPrescriptionFeasibility({
      protein_anchor_g: proteinAnchorG,
      meal_frequency: mealFrequency,
      medications,
    }),
    [proteinAnchorG, mealFrequency, medications]
  )

  if (loading) {
    return (
      <GenerationProgressOverlay
        active={true}
        title="Generating Nutrition Prescription"
        stages={[
          { start: 0,  label: 'Reading CFFS, intake, baseline, medications, dietary context' },
          { start: 6,  label: 'Synthesising entry state, body state, PTS phase' },
          { start: 14, label: 'Drafting protein anchor, carb tier, meal frequency, exclusions' },
          { start: 28, label: 'Validating feasibility against appetite-suppression doctrine' },
          { start: 40, label: 'Returning the prescription suggestion for your review' },
          { start: 60, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Prescription suggestion uses Claude Sonnet 5 for the full interpretive synthesis (body state, PTS phase, anchor, carb tier, feasibility checks). Typical: 45 to 90 seconds, and it can run longer on a first request. Measured at 49s server-side on 1 Sep 2026, so treat anything under two minutes as still working. The page is not frozen, please don't refresh."
      />
    )
  }

  if (error) {
    return (
      <div className="bg-[#FDEDED] border border-[#F5C9C9] rounded-xl p-5">
        <p className="text-[#C82626] text-sm">{error}</p>
        <a href={`/dashboard/clients/${clientId}/nutrition/generate`} className="text-[12.5px] text-[#666D7A] hover:text-[#141821] mt-3 inline-block">
          Fill in manually instead →
        </a>
      </div>
    )
  }

  if (!suggestion) return null

  const toggle = (field: string) => setEditingField(editingField === field ? null : field)

  function applyFeasibilityPatch(patch: Partial<{ protein_anchor_g: number; meal_frequency: number }>) {
    if (typeof patch.protein_anchor_g === 'number') setProteinAnchorG(patch.protein_anchor_g)
    if (typeof patch.meal_frequency === 'number') setMealFrequency(patch.meal_frequency)
  }

  return (
    <div className="flex gap-8 max-w-5xl relative">
      <GenerationProgressOverlay
        active={generating}
        title="Generating Nutrition Plan"
        stages={[
          { start: 0,   label: 'Reading client context (CFFS, intake, baseline, medications, dietary)' },
          { start: 5,   label: 'Drafting 3 candidate plans in parallel (Claude Haiku 4.5)' },
          { start: 40,  label: 'Validating each candidate against doctrine rules' },
          { start: 50,  label: 'Escalating to Claude Sonnet 5 if no candidate passed' },
          { start: 95,  label: 'Polishing the higher-accuracy plan' },
          { start: 135, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Nutrition plan generation uses Claude Haiku 4.5 with Sonnet 5 escalation for high-accuracy constraint satisfaction. Typical: 60 to 90 seconds. The page is not frozen, please don't refresh."
      />
      <StickyScrollNav sections={NAV_SECTIONS} />
      <div className="flex-1 min-w-0 space-y-4">

      {/* Overall rationale */}
      <div id="rationale" className="scroll-mt-8 bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC]/40 rounded-xl px-5 py-4">
        <p className="text-[10px] font-medium text-[#1B6DFC] mb-3">Overall Rationale</p>
        {(() => {
          const { intro, points } = parseReason(suggestion.overall_rationale)
          return (
            <div className="space-y-2">
              {intro && <p className="text-sm text-[#141821] leading-relaxed">{intro}</p>}
              {points.length > 1 ? (
                <div className="space-y-2 mt-1">
                  {points.map((point, i) => (
                    <div key={i} className="flex items-start gap-2.5 border-l-2 border-[#B5CFFC]/40 pl-3">
                      <p className="text-sm text-[#141821] leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[#141821] leading-relaxed">{points[0]}</p>
              )}
            </div>
          )
        })()}
      </div>

      {/* Plan Name */}
      <div id="plan-name" className="scroll-mt-8">
      <ReasonCard
        label="Plan Name"
        value={planName}
        reason={suggestion.plan_name_reason}
        editing={editingField === 'plan_name'}
        onEdit={() => toggle('plan_name')}
      >
        <input
          value={planName}
          onChange={e => setPlanName(e.target.value)}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] mb-3"
        />
      </ReasonCard>
      </div>

      {/* Entry State */}
      <div id="entry-state" className="scroll-mt-8">
      <ReasonCard
        label="Entry State"
        value={entryState}
        reason={suggestion.entry_state_reason}
        editing={editingField === 'entry_state'}
        onEdit={() => toggle('entry_state')}
      >
        <div className="grid grid-cols-2 gap-2 mb-3">
          {ENTRY_STATE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setEntryState(opt.value)}
              className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${
                entryState === opt.value
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              <p className="font-semibold capitalize">{opt.label}</p>
              <p className="text-[#666D7A] mt-0.5">{opt.desc}</p>
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Body State */}
      <div id="body-state" className="scroll-mt-8">
      <ReasonCard
        label="Body State"
        value={bodyState}
        reason={suggestion.body_state_reason}
        editing={editingField === 'body_state'}
        onEdit={() => toggle('body_state')}
      >
        <div className="flex gap-2 mb-3">
          {BODY_STATE_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setBodyState(opt)}
              className={`px-3 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
                bodyState === opt
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {opt.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* PTS Phase */}
      <div id="pts-phase" className="scroll-mt-8">
      <ReasonCard
        label="PTS Phase (Training Context)"
        value={ptsPhase}
        reason={suggestion.pts_phase_reason}
        editing={editingField === 'pts_phase'}
        onEdit={() => toggle('pts_phase')}
      >
        <input
          value={ptsPhase}
          onChange={e => setPtsPhase(e.target.value)}
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] mb-3"
        />
      </ReasonCard>
      </div>

      {/* Protein Anchor */}
      <div id="protein" className="scroll-mt-8">
      <ReasonCard
        label="Protein Anchor (g/day)"
        value={`${proteinAnchorG}g`}
        reason={suggestion.protein_anchor_g_reason}
        editing={editingField === 'protein_anchor'}
        onEdit={() => toggle('protein_anchor')}
      >
        <div className="flex items-center gap-3 mb-3">
          <input
            type="number"
            value={proteinAnchorG}
            onChange={e => setProteinAnchorG(Number(e.target.value))}
            className="w-28 bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821]"
            min={80}
            max={300}
            step={5}
          />
          <span className="text-[#666D7A] text-sm">grams/day</span>
        </div>
      </ReasonCard>
      </div>

      {/* Carb Demand Level */}
      <div id="carbs" className="scroll-mt-8">
      <ReasonCard
        label="Carbohydrate Demand Level"
        value={carbDemandLevel}
        reason={suggestion.carb_demand_level_reason}
        editing={editingField === 'carb_demand'}
        onEdit={() => toggle('carb_demand')}
      >
        <div className="flex gap-2 mb-3">
          {CARB_OPTIONS.map(opt => (
            <button
              key={opt}
              onClick={() => setCarbDemandLevel(opt)}
              className={`px-4 py-1.5 rounded-lg border text-xs capitalize transition-colors ${
                carbDemandLevel === opt
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Meal Frequency */}
      <div id="meals" className="scroll-mt-8">
      <ReasonCard
        label="Meal Frequency"
        value={`${mealFrequency} meals/day`}
        reason={suggestion.meal_frequency_reason}
        editing={editingField === 'meal_frequency'}
        onEdit={() => toggle('meal_frequency')}
      >
        <div className="flex gap-2 mb-3">
          {[3, 4, 5].map(n => (
            <button
              key={n}
              onClick={() => setMealFrequency(n)}
              className={`px-4 py-1.5 rounded-lg border text-xs transition-colors ${
                mealFrequency === n
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {n} meals
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Training Days */}
      <div id="training-days" className="scroll-mt-8">
      <ReasonCard
        label="Training Days Per Week"
        value={`${trainingDaysPerWeek}x/week`}
        reason={suggestion.training_days_per_week_reason}
        editing={editingField === 'training_days'}
        onEdit={() => toggle('training_days')}
      >
        <div className="flex gap-2 mb-3">
          {[2, 3, 4, 5, 6].map(n => (
            <button
              key={n}
              onClick={() => setTrainingDaysPerWeek(n)}
              className={`px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                trainingDaysPerWeek === n
                  ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                  : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
              }`}
            >
              {n}x
            </button>
          ))}
        </div>
      </ReasonCard>
      </div>

      {/* Constraint / Recovery / Uncertainty */}
      <div id="signals" className="scroll-mt-8 grid grid-cols-3 gap-3">
        {[
          { label: 'Constraint Level', value: constraintLevel, field: 'constraint', options: CONSTRAINT_OPTIONS, setter: setConstraintLevel, reason: suggestion.constraint_level_reason },
          { label: 'Recovery Status', value: recoveryStatus, field: 'recovery', options: RECOVERY_OPTIONS, setter: setRecoveryStatus, reason: suggestion.recovery_status_reason },
          { label: 'Uncertainty Level', value: uncertaintyLevel, field: 'uncertainty', options: UNCERTAINTY_OPTIONS, setter: setUncertaintyLevel, reason: suggestion.uncertainty_level_reason },
        ].map(({ label, value, field, options, setter, reason }) => (
          <div key={field} className="bg-[#F4F6F9] br-card p-4">
            <p className="text-[10px] font-medium text-[#666D7A] mb-2">{label}</p>
            <div className="flex flex-col gap-1.5 mb-3">
              {options.map(opt => (
                <button
                  key={opt}
                  onClick={() => setter(opt)}
                  className={`px-3 py-1 rounded-lg border text-xs capitalize transition-colors ${
                    value === opt
                      ? 'border-[#1B6DFC] bg-[rgba(27,109,252,0.08)] text-[#1056D6]'
                      : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#98A0AD] leading-relaxed">{reason}</p>
          </div>
        ))}
      </div>

      {/* Food Exclusions */}
      <div id="exclusions" className="scroll-mt-8 bg-[#F4F6F9] br-card p-5">
        <p className="text-[10px] font-medium text-[#666D7A] mb-2">Food Exclusions</p>
        <input
          value={foodExclusionsText}
          onChange={e => setFoodExclusionsText(e.target.value)}
          placeholder="e.g. dairy, shellfish (comma separated)"
          className="w-full bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD]"
        />
        <ReasonDisplay text={suggestion.food_exclusions_reason} />
      </div>

      {/* When the active plan is a bridge, show step-up presets up top so the
          coach can ramp incrementally without losing the override entirely. */}
      {activeBridge && (
        <div className="scroll-mt-8 bg-teal-50 border border-teal-300 rounded-xl p-5">
          <div className="flex items-start gap-3 mb-3">
            <svg className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-black text-teal-700 mb-1">Existing bridge plan — step up</p>
              <p className="text-sm text-[#141821] leading-relaxed">
                Active plan is at <span className="font-semibold tabular-nums">{activeBridge.floorKcal} kcal</span> bridge floor. Pick a step-up preset (keeps bridge mode on but increases the floor), or remove the override entirely.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pl-8 mt-3">
            <button
              type="button"
              onClick={() => {
                setOverrideActive(true)
                setOverrideFloorKcal(activeBridge.floorKcal + 200)
                if (!overrideJustification.trim() && activeBridge.justification) {
                  setOverrideJustification(`${activeBridge.justification}\n\n[Step-up from ${activeBridge.floorKcal} to ${activeBridge.floorKcal + 200} kcal — eating consistency markers in recent check-ins support increase.]`)
                }
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[12.5px] font-semibold rounded-lg transition-colors"
            >
              Step up +200 kcal → {activeBridge.floorKcal + 200}
            </button>
            <button
              type="button"
              onClick={() => {
                setOverrideActive(true)
                setOverrideFloorKcal(activeBridge.floorKcal + 300)
                if (!overrideJustification.trim() && activeBridge.justification) {
                  setOverrideJustification(`${activeBridge.justification}\n\n[Step-up from ${activeBridge.floorKcal} to ${activeBridge.floorKcal + 300} kcal — eating consistency markers in recent check-ins support increase.]`)
                }
              }}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[12.5px] font-semibold rounded-lg transition-colors"
            >
              Step up +300 kcal → {activeBridge.floorKcal + 300}
            </button>
            <button
              type="button"
              onClick={() => setOverrideActive(false)}
              className="px-3 py-1.5 border border-[#CFD4DC] hover:border-[#666D7A] text-[#141821] text-[12.5px] font-semibold rounded-lg transition-colors"
            >
              Remove override (apply standard floors)
            </button>
          </div>
        </div>
      )}

      {/* Transitional override (bridge mode). For chronic under-eaters whose
          actual intake is far below their bodyweight-derived floor — coach
          explicitly prescribes a sub-floor calorie target with documented
          justification. Validator skips the standard carb/fat g/kg floors
          when this is on. Auto-expires after 4 weeks. */}
      <div id="bridge-mode" className="scroll-mt-8 bg-[#F4F6F9] br-card p-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={overrideActive}
            onChange={e => setOverrideActive(e.target.checked)}
            className="mt-0.5 w-4 h-4 accent-[#1560E0]"
          />
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium text-[#666D7A] mb-1">Transitional plan (bridge mode)</p>
            <p className="text-[12.5px] text-[#666D7A] leading-relaxed">
              Enable when the client cannot physically execute the bodyweight-derived calorie floor (chronic under-eating, severe appetite suppression, post-illness recovery). Replaces the standard carb / fat g/kg floors with an explicit kcal floor you set. Auto-expires after 4 weeks — regenerate then.
            </p>
          </div>
        </label>
        {overrideActive && (
          <div className="mt-4 pl-7 space-y-3">
            {bridgeSuggesting && (
              <div className="flex items-center gap-2 text-[12.5px] text-[#1560E0] bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-lg px-3 py-2">
                <div className="w-2 h-2 bg-[#1B6DFC] rounded-full animate-pulse" />
                Reading client medications, baseline and recent check-ins to suggest a floor and draft a justification…
              </div>
            )}
            {bridgeSuggestionMeta && !bridgeSuggesting && (
              <div className="text-[12.5px] text-[#666D7A] bg-[#FBFCFD] border border-[#E8EAEE] rounded-lg px-3 py-2 leading-relaxed">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <p className="font-semibold text-[#141821]">AI prefill (you can edit)</p>
                  <button
                    type="button"
                    onClick={() => fetchBridgeSuggestion(true)}
                    disabled={bridgeSuggesting}
                    className="text-[11px] text-[#1560E0] hover:text-[#1056D6] font-semibold disabled:opacity-50"
                  >
                    Regenerate suggestion ↻
                  </button>
                </div>
                {bridgeSuggestionMeta.standard_floor_kcal && (
                  <p className="text-[#666D7A]">
                    Standard bodyweight-derived floor (would apply without override): <span className="font-mono text-[#141821]">{bridgeSuggestionMeta.standard_floor_kcal} kcal</span>. Bridge mode replaces this.
                  </p>
                )}
                {bridgeSuggestionMeta.anchor_scaled_from !== null && bridgeSuggestionMeta.suggested_protein_anchor_g && (
                  <p className="text-[#A96A12] mt-1">
                    <span className="font-semibold">Protein anchor adjusted:</span>{' '}
                    <span className="font-mono">{bridgeSuggestionMeta.anchor_scaled_from}g</span> → <span className="font-mono">{bridgeSuggestionMeta.suggested_protein_anchor_g}g</span>
                    {' '}(scaled to fit the bridge kcal budget). Edit the anchor field below if you want to keep your original value — bridge mode won&apos;t override it again.
                  </p>
                )}
                {bridgeSuggestionMeta.evidence_summary && (
                  <p className="text-[#666D7A] mt-1 italic">{bridgeSuggestionMeta.evidence_summary}</p>
                )}
              </div>
            )}
            <div>
              <label className="block text-[10px] font-medium text-[#666D7A] mb-1.5">
                Minimum daily kcal floor
              </label>
              <input
                type="number"
                min={800}
                max={4000}
                step={50}
                value={overrideFloorKcal}
                onChange={e => setOverrideFloorKcal(parseInt(e.target.value) || 0)}
                className="w-32 bg-white border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821]"
              />
              <p className="text-[11px] text-[#666D7A] mt-1">
                Between 800 and 4,000. Validator enforces this in place of the bodyweight carb/fat floors.
              </p>
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#666D7A] mb-1.5">
                Justification (required, ≥20 characters)
              </label>
              <textarea
                value={overrideJustification}
                onChange={e => setOverrideJustification(e.target.value)}
                rows={5}
                placeholder="e.g. Client is on Vyvanse + GLP-1 + Brintellix stack with documented actual intake ~1,400 kcal/day for 6+ weeks. Bridging from current capacity to bodyweight floor over 4 weeks; reassess at Week 4 check-in."
                className="w-full bg-white border border-[#E8EAEE] rounded-lg px-3 py-2 text-sm text-[#141821] placeholder-[#98A0AD] leading-relaxed"
              />
              <p className="text-[11px] text-[#666D7A] mt-1">
                {overrideJustification.length}/20 characters minimum. Documented for audit and licensee review.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Pre-flight feasibility banner — blocks Generate when the prescription
          is mathematically infeasible under the appetite-suppression hard
          rules, with one-click fixes for the smallest viable adjustment. */}
      {!feasibility.ok && (
        <div className="bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] rounded-xl px-5 py-4">
          <div className="flex items-start gap-3 mb-3">
            <svg className="w-5 h-5 text-[#A96A12] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-[#A96A12] mb-1">Prescription can&apos;t be generated as-is</p>
              <p className="text-[12.5px] text-[#8A5A14] leading-relaxed">
                This combination violates the appetite-suppression hard rules. The engine would burn a generation attempt only to fail validation. Adjust before clicking Generate.
              </p>
            </div>
          </div>
          <ul className="text-[12.5px] text-[#8A5A14] leading-relaxed space-y-1 mb-3 ml-8 list-disc">
            {feasibility.reasons.map((r, i) => <li key={i}>{r}</li>)}
          </ul>
          {feasibility.suggestions.length > 0 && (
            <div className="ml-8 flex flex-wrap gap-2">
              {feasibility.suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => applyFeasibilityPatch(s.patch)}
                  className="px-3 py-1.5 bg-[#A96A12] hover:bg-[#A96A12] text-white text-[12.5px] font-semibold rounded-lg transition-colors"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <a
          href={`/dashboard/clients/${clientId}/nutrition/generate`}
          className="text-[12.5px] text-[#98A0AD] hover:text-[#666D7A] transition-colors"
        >
          Fill in manually instead
        </a>
        <button
          onClick={handleGenerate}
          disabled={
            generating ||
            !feasibility.ok ||
            (overrideActive && (overrideJustification.trim().length < 20 || overrideFloorKcal < 800 || overrideFloorKcal > 4000))
          }
          title={
            !feasibility.ok ? 'Prescription is mathematically infeasible — see the amber banner above' :
            (overrideActive && overrideJustification.trim().length < 20) ? 'Bridge mode requires a justification of at least 20 characters' :
            (overrideActive && (overrideFloorKcal < 800 || overrideFloorKcal > 4000)) ? 'Bridge mode floor must be between 800 and 4,000 kcal' :
            undefined
          }
          className="px-5 py-2.5 bg-[#1B6DFC] hover:bg-[#1560E0] disabled:bg-[#E8EAEE] disabled:text-[#666D7A] disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg transition-colors"
        >
          {generating ? 'Generating plan...' : 'Approve & Generate Plan'}
        </button>
      </div>

      {error && (
        <div className="bg-[#FDEDED] border border-[#F5C9C9] rounded-lg px-4 py-3">
          <p className="text-[#C82626] text-sm whitespace-pre-wrap">{error}</p>
        </div>
      )}
      </div>
    </div>
  )
}
