'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StickyScrollNav from '@/components/sticky-scroll-nav'
import GenerationProgressOverlay from '@/components/generation-progress-overlay'
import { AlertTriangle } from 'lucide-react'
import { parseApiResponse } from '@/lib/parse-api-response'

const NAV_SECTIONS = [
  { id: 'rationale', title: 'Rationale' },
  { id: 'block-name', title: 'Block Name' },
  { id: 'phase', title: 'Phase' },
  { id: 'goal', title: 'Goal' },
  { id: 'frequency', title: 'Frequency' },
  { id: 'training-age', title: 'Training Age' },
  { id: 'competency', title: 'Competency' },
  { id: 'duration', title: 'Duration' },
  { id: 'equipment', title: 'Equipment' },
]

interface Suggestion {
  block_name: string
  block_name_reason: string
  progression_phase: string
  progression_phase_reason: string
  training_goal: string
  training_goal_reason: string
  training_frequency: number
  training_frequency_reason: string
  concurrent_endurance_sessions: number
  training_age: string
  training_age_reason: string
  movement_competency: string
  movement_competency_reason: string
  week_duration: number
  week_duration_reason: string
  overall_rationale: string
}

interface PlanBlock {
  id: string
  block_name: string
  progression_phase: string
  training_goal: string
  week_duration: number
  phase_category: string | null
  execution_arc: string | null
  phase_objective: string | null
  training_plans: { plan_name: string; macro_objective: string | null } | null
}

const BLOCK_NAME_OPTIONS = [
  'Foundation Strength Block', 'General Strength Accumulation', 'Hypertrophy Accumulation Block',
  'Muscle Building Foundation', 'Work Capacity Accumulation', 'General Physical Preparation (GPP)',
  'Strength Intensification Block', 'Hypertrophy Intensification Block', 'Capacity Intensification Block',
  'Loading Phase Block', 'Progressive Overload Block', 'Strength Realization Block',
  'Peak Performance Block', 'Expression Phase Block', 'Deload / Restoration Block',
  'Active Recovery Block', 'Consolidation Block',
]

const EQUIPMENT_OPTIONS = [
  { value: 'barbell', label: 'Barbell' },
  { value: 'dumbbell', label: 'Dumbbell' },
  { value: 'machine', label: 'Machine' },
  { value: 'cable', label: 'Cable' },
  { value: 'bodyweight', label: 'Bodyweight' },
  { value: 'kettlebell', label: 'Kettlebell' },
  { value: 'specialty', label: 'Specialty (trap bar, sleds, etc.)' },
]

const phaseColour: Record<string, string> = {
  accumulation: 'text-[#1056D6] border-[#5390FF]/40 bg-[rgba(27,109,252,0.08)]',
  intensification: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  realization: 'text-[#C82626] border-red-400/40 bg-[#FDEDED]',
  restoration: 'text-green-400 border-green-400/40 bg-green-400/10',
}
const goalColour: Record<string, string> = {
  strength: 'text-violet-700 border-violet-400/40 bg-violet-50',
  hypertrophy: 'text-pink-400 border-pink-400/40 bg-pink-400/10',
  capacity: 'text-[#1B6DFC] border-[#9CC0FB] bg-[rgba(27,109,252,0.08)]',
}

const inputCls = 'bg-[#EFF1F4] border border-[#E8EAEE] text-[#141821] rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#1B6DFC] focus:border-transparent'

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

function ReasonText({ text }: { text: string }) {
  const { intro, points } = parseReason(text)
  return (
    <div className="space-y-1.5 mt-2">
      {intro && <p className="text-[12.5px] text-[#141821] leading-relaxed">{intro}</p>}
      {points.map((point, i) => (
        <div key={i} className={`flex items-start gap-2 ${points.length > 1 ? '' : ''}`}>
          {points.length > 1 && <span className="text-[#1B6DFC] shrink-0 mt-0.5 text-[10px]">•</span>}
          {points.length === 1 && <span className="text-[#1B6DFC] text-[12.5px] mt-0.5 shrink-0">→</span>}
          <p className="text-[12.5px] text-[#666D7A] leading-relaxed">{point}</p>
        </div>
      ))}
    </div>
  )
}

function ReasonCard({
  label,
  value,
  reason,
  colour,
  children,
}: {
  label: string
  value: string
  reason: string
  colour?: string
  children?: React.ReactNode
}) {
  const [editing, setEditing] = useState(false)
  return (
    <div className="bg-[#F4F6F9] br-card p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-medium text-[#666D7A]">{label}</p>
        <button
          onClick={() => setEditing(e => !e)}
          className="text-[10px] text-[#98A0AD] hover:text-[#1B6DFC] transition-colors"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <div className="mb-2">{children}</div>
      ) : (
        <p className={`text-sm font-semibold mb-2 px-2.5 py-1 rounded-full border inline-block capitalize ${colour || 'text-[#141821] border-[#E8EAEE] bg-[#EFF1F4]'}`}>
          {value}
        </p>
      )}
      <ReasonText text={reason} />
    </div>
  )
}

interface RecoveryNotice {
  playbookId: string
  playbookName: string
  playbookSource: string
  tier: number
  purpose: string
  daysActive: number
  enforcementMode: 'soft' | 'hard'
  constraintsSummary: {
    loadReductionPct: readonly [number, number] | null
    sessionsPerWeekCap: number | null
    sessionsRemovedPerWeek: readonly [number, number] | null
    progressionLocked: boolean
    conditioningBlocked: boolean
    testingBlocked: boolean
  }
}

interface ReadinessNotice {
  weeksExamined: number[]
  domains: { domain: string; foundational: string | null; weekly: string | null; carried: boolean; heldReason: string | null }[]
  hasChange: boolean
}

interface ReScoreNotice {
  publicLabel: string
  internalLabel: string
  cffsLabel: string
  direction: string | null
  rationale: string | null
  fromBlock: string | null
}

export default function PrescriptionSuggest({
  clientId,
  clientName,
  planBlock,
  planBlockId,
  recoveryNotice,
  reScoreNotice,
  readinessNotice,
}: {
  clientId: string
  clientName: string
  planBlock: PlanBlock | null
  planBlockId: string | null
  recoveryNotice: RecoveryNotice | null
  reScoreNotice: ReScoreNotice | null
  readinessNotice: ReadinessNotice | null
}) {
  const router = useRouter()
  const [overrideMode, setOverrideMode] = useState<'apply' | 'override'>('apply')
  const [overrideReason, setOverrideReason] = useState('')
  // Default ON when a re-score is pending: the Progress Check was collected to
  // inform this block, so carrying it is the expected path and ignoring it is
  // the deliberate one.
  const [carryReScore, setCarryReScore] = useState(true)
  const [reScoreReason, setReScoreReason] = useState('')
  // Default ON: the weekly syntheses are the live reading of readiness, and the
  // intake-era values are the stale ones. Opting out is the deliberate choice.
  const [carryReadiness, setCarryReadiness] = useState(true)
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Errors render once, in a banner at the top, not inline in the form. The
  // inline copy sat between the equipment checkboxes and the generate button,
  // so a two-sentence message (a timeout, say) reflowed the whole section and
  // squeezed the controls above it. A failure should never rearrange the form
  // the coach is still working in.
  const errorRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (error) errorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [error])
  const [generating, setGenerating] = useState(false)

  // Editable prescription fields
  const [form, setForm] = useState({
    block_name: '',
    progression_phase: 'accumulation',
    training_goal: 'strength',
    training_frequency: 3,
    concurrent_endurance_sessions: 0,
    training_age: 'intermediate',
    movement_competency: 'developing',
    week_duration: 4 as 4 | 6 | 8,
    equipment_access: ['barbell', 'dumbbell', 'bodyweight'] as string[],
  })

  useEffect(() => {
    // AbortController guards against React Strict Mode firing the effect
    // twice and leaving stale error state from a cancelled call.
    const ac = new AbortController()
    async function fetchSuggestion() {
      try {
        const res = await fetch('/api/suggest-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, plan_block_id: planBlockId }),
          signal: ac.signal,
        })
        const { data, error: apiError } = await parseApiResponse<any>(res)
        if (ac.signal.aborted) return
        if (!res.ok) { setError(apiError || data?.error || 'Suggestion failed'); return }
        const s: Suggestion = data.suggestion
        setSuggestion(s)
        setForm(prev => ({
          ...prev,
          block_name: s.block_name,
          progression_phase: s.progression_phase,
          training_goal: s.training_goal,
          training_frequency: s.training_frequency,
          training_age: s.training_age,
          movement_competency: s.movement_competency,
          week_duration: s.week_duration as 4 | 6 | 8,
        }))
        setError(null)
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Failed to load suggestion')
      } finally {
        if (!ac.signal.aborted) setLoading(false)
      }
    }
    fetchSuggestion()
    return () => ac.abort()
  }, [clientId, planBlockId])

  function toggleEquipment(value: string) {
    setForm(prev => ({
      ...prev,
      equipment_access: prev.equipment_access.includes(value)
        ? prev.equipment_access.filter(e => e !== value)
        : [...prev.equipment_access, value],
    }))
  }

  async function handleGenerate() {
    if (!form.block_name) { setError('Block name required'); return }
    if (form.equipment_access.length === 0) { setError('Select at least one equipment type'); return }
    setGenerating(true)
    setError(null)
    // Phase 3 — if a recovery state is active and the coach chose to override,
    // require a documented reason so the audit trail captures it.
    if (recoveryNotice && overrideMode === 'override' && overrideReason.trim().length < 10) {
      setError('Override requires a documented reason (at least 10 characters)')
      setGenerating(false)
      return
    }
    try {
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          plan_block_id: planBlockId,
          prescription_rationale: suggestion?.overall_rationale ?? null,
          ...form,
          ...(recoveryNotice && overrideMode === 'override' ? { recovery_override_reason: overrideReason.trim() } : {}),
          ...(readinessNotice && carryReadiness ? { carry_readiness: true } : {}),
          ...(reScoreNotice && carryReScore
            ? {
                body_state_override: reScoreNotice.internalLabel,
                body_state_override_reason:
                  reScoreReason.trim() ||
                  `Carried forward from the Progress Read re-score: ${reScoreNotice.cffsLabel} to ${reScoreNotice.publicLabel}.`,
              }
            : {}),
        }),
      })
      const { data, error: apiError } = await parseApiResponse<any>(res)
      if (!res.ok) { setError(apiError || data?.error || 'Generation failed'); return }
      router.push(`/dashboard/clients/${clientId}/program`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <GenerationProgressOverlay
        active={generating}
        title="Generating Training Program"
        stages={[
          { start: 0,   label: 'Reading CFFS, active recovery state, intake, and macro arc context' },
          { start: 6,   label: 'Drafting per-session structure (primaries, accessories, sets / reps / RPE)' },
          { start: 40,  label: 'Applying coach guidance and RRS clamps to the prescription' },
          { start: 70,  label: 'Validating against doctrine ceilings and eligibility floors' },
          { start: 90,  label: 'Saving the draft and redirecting to the program view' },
          { start: 130, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="Program generation uses Claude Sonnet 5 for high-accuracy constraint satisfaction across exercise selection, set / rep design, RPE, and RRS recovery clamps. Typical: 60 to 120 seconds. The page is not frozen, please don't refresh."
      />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#666D7A] text-sm mb-3">
          <Link href={`/dashboard/clients/${clientId}`} className="hover:text-[#141821] transition-colors">{clientName}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${clientId}/program`} className="hover:text-[#141821] transition-colors">Program</Link>
          <span>/</span>
          <span className="text-[#141821]">Prescription Suggestion</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Prescription Suggestion</h1>
        <p className="text-sm text-[#666D7A] mt-1">
          Generated from CFFS, intake, and training history. Review the reasoning, edit if needed, then approve to generate the program.
        </p>
      </div>

      {/* Phase 3 — Active recovery state notice */}
      {readinessNotice && (
        <div className="mb-6 rounded-lg border border-[#1B6DFC]/30 bg-[#1B6DFC]/[0.04] p-5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1B6DFC] mb-2">
            Readiness has moved since the foundational read
          </div>
          <p className="text-[12.5px] text-[#666D7A] mb-3">
            The foundational read scores readiness once, at intake, and it never moves again.
            The weekly syntheses re-score it every week. A domain is only carried when the last
            three weeks agree unanimously, so one disrupted week cannot shift a constraint.
            Weeks used: {readinessNotice.weeksExamined.slice().sort((a, b) => a - b).join(', ')}.
          </p>
          <table className="w-full text-[12.5px] mb-3">
            <thead>
              <tr className="text-[#666D7A] text-left">
                <th className="font-medium pb-1">Domain</th>
                <th className="font-medium pb-1">Foundational</th>
                <th className="font-medium pb-1">Last 3 weeks</th>
                <th className="font-medium pb-1"></th>
              </tr>
            </thead>
            <tbody>
              {readinessNotice.domains.map(d => (
                <tr key={d.domain} className="border-t border-[#E8EAEE]">
                  <td className="py-1 capitalize text-[#141821]">{d.domain}</td>
                  <td className="py-1 text-[#666D7A]">{d.foundational ?? '—'}</td>
                  <td className="py-1 text-[#141821]">{d.weekly ?? 'not unanimous'}</td>
                  <td className="py-1 text-[#666D7A]">
                    {d.carried
                      ? <span className="font-semibold text-[#1B6DFC]">will carry</span>
                      : d.heldReason === 'weeks_disagree' ? 'held, weeks disagree'
                      : d.heldReason === 'insufficient_weeks' ? 'held, under 3 weeks'
                      : 'unchanged'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[12.5px] text-[#141821]">
              <input type="radio" checked={carryReadiness} onChange={() => setCarryReadiness(true)} />
              Clamp this block on the re-scored readiness
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-[#141821]">
              <input type="radio" checked={!carryReadiness} onChange={() => setCarryReadiness(false)} />
              Use the foundational readiness from intake
            </label>
          </div>
        </div>
      )}

      {reScoreNotice && (
        <div className="mb-6 rounded-lg border border-[#1B6DFC]/30 bg-[#1B6DFC]/[0.04] p-5">
          <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#1B6DFC] mb-2">
            Progress Read re-score not yet carried into a block
          </div>
          <h2 className="text-base font-bold text-[#141821] mb-1">
            {reScoreNotice.cffsLabel} &rarr; {reScoreNotice.publicLabel}
            {reScoreNotice.direction ? ` · ${reScoreNotice.direction}` : ''}
          </h2>
          {reScoreNotice.rationale && (
            <p className="text-[12.5px] text-[#141821] mb-3">{reScoreNotice.rationale}</p>
          )}
          <p className="text-[12.5px] text-[#666D7A] mb-3">
            The foundational read still says <strong>{reScoreNotice.cffsLabel}</strong> and is not changed by this.
            Only a full re-intake can revise it. Carrying the re-score forward affects this block only.
            Readiness signals were not re-scored, so the tighter constraint still wins.
          </p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-[12.5px] text-[#141821]">
              <input type="radio" checked={carryReScore} onChange={() => setCarryReScore(true)} />
              Build this block on the re-scored state ({reScoreNotice.internalLabel})
            </label>
            <label className="flex items-center gap-2 text-[12.5px] text-[#141821]">
              <input type="radio" checked={!carryReScore} onChange={() => setCarryReScore(false)} />
              Ignore the re-score and use the foundational read ({reScoreNotice.cffsLabel})
            </label>
          </div>
          {carryReScore && (
            <input
              type="text"
              value={reScoreReason}
              onChange={e => setReScoreReason(e.target.value)}
              placeholder="Optional note on why the state moved (recorded on the block)"
              className="mt-3 w-full rounded border border-[#D8DBE2] px-3 py-2 text-[12.5px]"
            />
          )}
        </div>
      )}

      {recoveryNotice && (
        <div className="mb-8 rounded-xl border border-[#E5C98F] bg-gradient-to-br from-[#B7791F]/15 to-[#B7791F]/5 px-5 py-4">
          <div className="flex items-center gap-2 text-[10px] text-[#A96A12] font-semibold mb-2">
            <AlertTriangle size={13} strokeWidth={2.5} className="shrink-0" /> Active recovery state · {recoveryNotice.playbookSource} · Tier {recoveryNotice.tier} · {recoveryNotice.enforcementMode === 'hard' ? 'HARD GATE' : 'SOFT GATE'}
          </div>
          <h2 className="text-base font-bold text-[#141821] mb-1">{recoveryNotice.playbookName}</h2>
          <p className="text-[12.5px] text-[#141821] mb-3">{recoveryNotice.purpose}</p>
          <p className="text-[12.5px] text-[#666D7A] mb-3">Day {recoveryNotice.daysActive} of state. Constraints that will be auto-applied to this generation:</p>
          <ul className="text-[12.5px] text-[#141821] space-y-1 mb-4 list-disc list-inside">
            {recoveryNotice.constraintsSummary.loadReductionPct && (
              <li>Load reduction <strong>{recoveryNotice.constraintsSummary.loadReductionPct[0]}–{recoveryNotice.constraintsSummary.loadReductionPct[1]}%</strong> (RPE drops 1–2 points across exercises)</li>
            )}
            {recoveryNotice.constraintsSummary.sessionsPerWeekCap != null && (
              <li>Weekly session cap: <strong>{recoveryNotice.constraintsSummary.sessionsPerWeekCap}</strong></li>
            )}
            {recoveryNotice.constraintsSummary.sessionsRemovedPerWeek && recoveryNotice.constraintsSummary.sessionsRemovedPerWeek[0] > 0 && (
              <li>Sessions removed: <strong>{recoveryNotice.constraintsSummary.sessionsRemovedPerWeek[0]}–{recoveryNotice.constraintsSummary.sessionsRemovedPerWeek[1]}</strong> per week</li>
            )}
            {recoveryNotice.constraintsSummary.progressionLocked && <li><strong>Progression locked</strong> for the duration of this state</li>}
            {recoveryNotice.constraintsSummary.conditioningBlocked && <li>Conditioning / capacity / cardio blocks <strong>removed</strong></li>}
            {recoveryNotice.constraintsSummary.testingBlocked && <li>Testing / 1RM / max-effort exercises <strong>removed</strong></li>}
          </ul>

          <div className="flex flex-col gap-2">
            <label className="flex items-start gap-2 text-[12.5px] text-[#141821] cursor-pointer">
              <input
                type="radio"
                name="recovery_mode"
                checked={overrideMode === 'apply'}
                onChange={() => { setOverrideMode('apply'); setOverrideReason('') }}
                className="mt-0.5 accent-[#1B6DFC]"
              />
              <span>
                <strong className="text-[#1B6DFC]">Apply constraints (recommended)</strong>
                <span className="block text-[#666D7A] mt-0.5">Generate the program with the recovery clamp applied. Doctrinally correct path.</span>
              </span>
            </label>
            <label className="flex items-start gap-2 text-[12.5px] text-[#141821] cursor-pointer">
              <input
                type="radio"
                name="recovery_mode"
                checked={overrideMode === 'override'}
                onChange={() => setOverrideMode('override')}
                className="mt-0.5 accent-[#C08A2D]"
              />
              <span>
                <strong className="text-[#A96A12]">Override constraints (documented)</strong>
                <span className="block text-[#666D7A] mt-0.5">Skip the recovery clamp. Requires a written reason. Logged to recovery_adjustments audit trail.</span>
              </span>
            </label>
            {overrideMode === 'override' && (
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Why is the recovery clamp being skipped? (audit trail will record this)"
                rows={3}
                className="mt-1 w-full rounded-lg bg-[#F4F6F9] border border-[#E8EAEE] text-[#141821] text-[12.5px] px-3 py-2 focus:outline-none focus:border-[#B7791F]"
              />
            )}
          </div>
        </div>
      )}

      {/* Plan block context */}
      {planBlock && (
        <div className="mb-6 bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] rounded-xl p-4">
          <p className="text-[12.5px] font-medium text-[#1B6DFC] mb-1">From Macro Plan</p>
          <p className="text-sm text-[#141821]">{planBlock.training_plans?.plan_name}</p>
          {planBlock.training_plans?.macro_objective && (
            <p className="text-[12.5px] text-[#666D7A] mt-0.5">{planBlock.training_plans.macro_objective}</p>
          )}
        </div>
      )}

      <GenerationProgressOverlay
        active={loading}
        title="Suggesting prescription"
        stages={[
          { start: 0,  label: 'Reading CFFS, intake, injury history, and recent training' },
          { start: 5,  label: 'Selecting phase, goal, frequency, and training age' },
          { start: 12, label: 'Calibrating RPE ceilings and volume to his readiness' },
          { start: 30, label: 'Writing the prescription rationale' },
          { start: 50, label: 'Taking longer than usual, give it another moment' },
        ]}
        disclaimer="The prescription engine reads his full context and proposes the block's phase, goal, frequency and effort ceilings for you to review. Typical: 20 to 40 seconds. The page is not frozen, please don't refresh."
      />

      {error && !loading && (
        <div ref={errorRef} className="bg-[#FDEDED] border border-[#F5C9C9] rounded-xl p-4 mb-4">
          <p className="text-sm font-semibold text-[#A11D1D] mb-1">Could not complete</p>
          <p className="text-sm text-[#C82626] leading-relaxed">{error}</p>
          <Link
            href={`/dashboard/clients/${clientId}/program/generate${planBlockId ? `?plan_block_id=${planBlockId}` : ''}`}
            className="text-[12.5px] text-[#666D7A] hover:text-[#141821] mt-2 block"
          >
            Fill in manually instead →
          </Link>
        </div>
      )}

      {suggestion && !loading && (
        <div className="flex gap-8">
          <StickyScrollNav sections={NAV_SECTIONS} />

          <div className="flex-1 min-w-0 space-y-4">
            {/* Overall rationale */}
            <div id="rationale" className="scroll-mt-8 bg-[#F4F6F9] border border-[#B5CFFC] rounded-xl p-5">
              <p className="text-[10px] font-medium text-[#1B6DFC] mb-3">Prescription Rationale</p>
              {(() => {
                const { intro, points } = parseReason(suggestion.overall_rationale)
                return (
                  <div className="space-y-2">
                    {intro && <p className="text-sm text-[#141821] leading-relaxed">{intro}</p>}
                    {points.length > 1 ? (
                      <div className="space-y-2 mt-1">
                        {points.map((point, i) => (
                          <div key={i} className="flex items-start gap-2.5 border-l-2 border-[#B5CFFC] pl-3">
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

            {/* Block Name */}
            <div id="block-name" className="scroll-mt-8">
              <ReasonCard label="Block Name" value={form.block_name} reason={suggestion.block_name_reason}>
                <select value={form.block_name} onChange={e => setForm(p => ({ ...p, block_name: e.target.value }))} className={`w-full ${inputCls}`}>
                  <option value="" disabled>Select…</option>
                  {BLOCK_NAME_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </ReasonCard>
            </div>

            {/* Progression Phase */}
            <div id="phase" className="scroll-mt-8">
              <ReasonCard label="Progression Phase" value={form.progression_phase} reason={suggestion.progression_phase_reason} colour={phaseColour[form.progression_phase]}>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['accumulation', 'intensification', 'realization', 'restoration'] as const).map(p => (
                    <button key={p} type="button" onClick={() => setForm(prev => ({ ...prev, progression_phase: p }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.progression_phase === p ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]' : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE]'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Training Goal */}
            <div id="goal" className="scroll-mt-8">
              <ReasonCard label="Training Goal" value={form.training_goal} reason={suggestion.training_goal_reason} colour={goalColour[form.training_goal]}>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['strength', 'hypertrophy', 'capacity'] as const).map(g => (
                    <button key={g} type="button" onClick={() => setForm(prev => ({ ...prev, training_goal: g }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.training_goal === g ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]' : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE]'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Training Frequency */}
            <div id="frequency" className="scroll-mt-8">
              <ReasonCard label={`Training Frequency - ${form.training_frequency} sessions/week`} value={`${form.training_frequency}x / week`} reason={suggestion.training_frequency_reason}>
                <input type="range" min={2} max={6} value={form.training_frequency}
                  onChange={e => setForm(p => ({ ...p, training_frequency: parseInt(e.target.value) }))}
                  className="w-full accent-[#1B6DFC]" />
                <div className="flex justify-between text-[12.5px] text-[#98A0AD] mt-1">
                  <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                </div>
              </ReasonCard>
            </div>

            {/* Concurrent endurance load. Coach-declared: nothing in the schema
                records it, and the doctrine set range assumes lifting is the
                client's whole training load. */}
            <div id="endurance" className="scroll-mt-8">
              <ReasonCard
                label={`Endurance sessions in their week - ${form.concurrent_endurance_sessions}`}
                value={form.concurrent_endurance_sessions === 0 ? 'none, pure strength block' : `${form.concurrent_endurance_sessions} / week`}
                reason="Runs, rides or swims the client is doing alongside this block. The set range assumes lifting is their whole training load, which is wrong for anyone doing real endurance work. Above zero, sets aim at the floor of the range for their phase and tier instead of the middle. The ceiling does not move, so writing more deliberately is still allowed."
              >
                <input type="range" min={0} max={7} value={form.concurrent_endurance_sessions}
                  onChange={e => setForm(p => ({ ...p, concurrent_endurance_sessions: parseInt(e.target.value) }))}
                  className="w-full accent-[#1B6DFC]" />
                <div className="flex justify-between text-[12.5px] text-[#98A0AD] mt-1">
                  <span>0</span><span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span>
                </div>
              </ReasonCard>
            </div>

            {/* Training Age */}
            <div id="training-age" className="scroll-mt-8">
              <ReasonCard label="Training Age" value={form.training_age} reason={suggestion.training_age_reason}>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(a => (
                    <button key={a} type="button" onClick={() => setForm(prev => ({ ...prev, training_age: a }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.training_age === a ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]' : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE]'}`}>
                      {a}
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Movement Competency */}
            <div id="competency" className="scroll-mt-8">
              <ReasonCard label="Movement Competency" value={form.movement_competency} reason={suggestion.movement_competency_reason}>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['limited', 'developing', 'proficient'] as const).map(c => (
                    <button key={c} type="button" onClick={() => setForm(prev => ({ ...prev, movement_competency: c }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.movement_competency === c ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]' : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Week Duration */}
            <div id="duration" className="scroll-mt-8">
              <ReasonCard label="Block Duration" value={`${form.week_duration} weeks`} reason={suggestion.week_duration_reason}>
                <div className="grid grid-cols-3 gap-1.5">
                  {([4, 6, 8] as const).map(w => (
                    <button key={w} type="button" onClick={() => setForm(prev => ({ ...prev, week_duration: w }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors ${form.week_duration === w ? 'bg-[#1B6DFC] text-white border-[#1B6DFC]' : 'bg-[#EFF1F4] text-[#141821] border-[#E8EAEE]'}`}>
                      {w} weeks
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Equipment Access */}
            <div id="equipment" className="scroll-mt-8 bg-[#F4F6F9] br-card p-4">
              <p className="text-[10px] font-medium text-[#666D7A] mb-3">Equipment Access</p>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.equipment_access.includes(opt.value)} onChange={() => toggleEquipment(opt.value)}
                      className="rounded border-[#CFD4DC] bg-[#EFF1F4] accent-[#1B6DFC]" />
                    <span className={`text-sm transition-colors ${form.equipment_access.includes(opt.value) ? 'text-[#141821]' : 'text-[#666D7A]'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 px-4 bg-[#1B6DFC] text-white font-semibold rounded-md hover:bg-[#1560E0] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating program… this may take 30–60s' : 'Approve & Generate Program'}
            </button>

            <p className="text-[12.5px] text-[#98A0AD] text-center">
              Or{' '}
              <Link href={`/dashboard/clients/${clientId}/program/generate${planBlockId ? `?plan_block_id=${planBlockId}` : ''}`} className="hover:text-[#666D7A] underline">
                fill in manually
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
