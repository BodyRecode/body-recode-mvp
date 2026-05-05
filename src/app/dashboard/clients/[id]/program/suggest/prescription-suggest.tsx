'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StickyScrollNav from '@/components/sticky-scroll-nav'

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
  accumulation: 'text-blue-400 border-blue-400/40 bg-blue-400/10',
  intensification: 'text-orange-400 border-orange-400/40 bg-orange-400/10',
  realization: 'text-red-400 border-red-400/40 bg-red-400/10',
  restoration: 'text-green-400 border-green-400/40 bg-green-400/10',
}
const goalColour: Record<string, string> = {
  strength: 'text-violet-400 border-violet-400/40 bg-violet-400/10',
  hypertrophy: 'text-pink-400 border-pink-400/40 bg-pink-400/10',
  capacity: 'text-teal-400 border-teal-400/40 bg-teal-400/10',
}

const inputCls = 'bg-stone-800 border border-stone-700 text-stone-100 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-[#10E1C2] focus:border-transparent'

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
      {intro && <p className="text-xs text-stone-300 leading-relaxed">{intro}</p>}
      {points.map((point, i) => (
        <div key={i} className={`flex items-start gap-2 ${points.length > 1 ? '' : ''}`}>
          {points.length > 1 && <span className="text-[#10E1C2] shrink-0 mt-0.5 text-[10px]">•</span>}
          {points.length === 1 && <span className="text-[#10E1C2] text-xs mt-0.5 shrink-0">→</span>}
          <p className="text-xs text-stone-400 leading-relaxed">{point}</p>
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
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">{label}</p>
        <button
          onClick={() => setEditing(e => !e)}
          className="text-[10px] text-stone-600 hover:text-[#10E1C2] transition-colors"
        >
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      {editing ? (
        <div className="mb-2">{children}</div>
      ) : (
        <p className={`text-sm font-semibold mb-2 px-2.5 py-1 rounded-full border inline-block capitalize ${colour || 'text-stone-200 border-stone-700 bg-stone-800'}`}>
          {value}
        </p>
      )}
      <ReasonText text={reason} />
    </div>
  )
}

export default function PrescriptionSuggest({
  clientId,
  clientName,
  planBlock,
  planBlockId,
}: {
  clientId: string
  clientName: string
  planBlock: PlanBlock | null
  planBlockId: string | null
}) {
  const router = useRouter()
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)

  // Editable prescription fields
  const [form, setForm] = useState({
    block_name: '',
    progression_phase: 'accumulation',
    training_goal: 'strength',
    training_frequency: 3,
    training_age: 'intermediate',
    movement_competency: 'developing',
    week_duration: 4 as 4 | 6 | 8,
    equipment_access: ['barbell', 'dumbbell', 'bodyweight'] as string[],
  })

  useEffect(() => {
    async function fetchSuggestion() {
      try {
        const res = await fetch('/api/suggest-prescription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ client_id: clientId, plan_block_id: planBlockId }),
        })
        const data = await res.json()
        if (!res.ok) { setError(data.error || 'Suggestion failed'); return }
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load suggestion')
      } finally {
        setLoading(false)
      }
    }
    fetchSuggestion()
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
    try {
      const res = await fetch('/api/generate-program', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          plan_block_id: planBlockId,
          prescription_rationale: suggestion?.overall_rationale ?? null,
          ...form,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Generation failed'); return }
      router.push(`/dashboard/clients/${clientId}/program`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-3">
          <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-300 transition-colors">{clientName}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${clientId}/program`} className="hover:text-stone-300 transition-colors">Program</Link>
          <span>/</span>
          <span className="text-stone-300">Prescription Suggestion</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Prescription Suggestion</h1>
        <p className="text-sm text-stone-400 mt-1">
          Generated from CFFS, intake, and training history. Review the reasoning, edit if needed, then approve to generate the program.
        </p>
      </div>

      {/* Plan block context */}
      {planBlock && (
        <div className="mb-6 bg-[#10E1C2]/5 border border-[#10E1C2]/20 rounded-xl p-4">
          <p className="text-xs font-bold text-[#10E1C2] uppercase tracking-wider mb-1">From Macro Plan</p>
          <p className="text-sm text-stone-200">{planBlock.training_plans?.plan_name}</p>
          {planBlock.training_plans?.macro_objective && (
            <p className="text-xs text-stone-500 mt-0.5">{planBlock.training_plans.macro_objective}</p>
          )}
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-stone-900 border border-stone-800 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-stone-800 rounded w-24 mb-3" />
              <div className="h-5 bg-stone-800 rounded w-40 mb-3" />
              <div className="h-3 bg-stone-800 rounded w-full" />
              <div className="h-3 bg-stone-800 rounded w-3/4 mt-1" />
            </div>
          ))}
          <p className="text-xs text-stone-600 text-center pt-2">Analysing client context and generating prescription…</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-950/50 border border-red-800 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-400">{error}</p>
          <Link
            href={`/dashboard/clients/${clientId}/program/generate${planBlockId ? `?plan_block_id=${planBlockId}` : ''}`}
            className="text-xs text-stone-400 hover:text-stone-200 mt-2 block"
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
            <div id="rationale" className="scroll-mt-8 bg-stone-900 border border-[#10E1C2]/20 rounded-xl p-5">
              <p className="text-[10px] font-bold text-[#10E1C2] uppercase tracking-widest mb-3">Prescription Rationale</p>
              {(() => {
                const { intro, points } = parseReason(suggestion.overall_rationale)
                return (
                  <div className="space-y-2">
                    {intro && <p className="text-sm text-stone-200 leading-relaxed">{intro}</p>}
                    {points.length > 1 ? (
                      <div className="space-y-2 mt-1">
                        {points.map((point, i) => (
                          <div key={i} className="flex items-start gap-2.5 border-l-2 border-[#10E1C2]/20 pl-3">
                            <p className="text-sm text-stone-300 leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-stone-200 leading-relaxed">{points[0]}</p>
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
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.progression_phase === p ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
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
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.training_goal === g ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
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
                  className="w-full accent-[#10E1C2]" />
                <div className="flex justify-between text-xs text-stone-600 mt-1">
                  <span>2</span><span>3</span><span>4</span><span>5</span><span>6</span>
                </div>
              </ReasonCard>
            </div>

            {/* Training Age */}
            <div id="training-age" className="scroll-mt-8">
              <ReasonCard label="Training Age" value={form.training_age} reason={suggestion.training_age_reason}>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['beginner', 'intermediate', 'advanced'] as const).map(a => (
                    <button key={a} type="button" onClick={() => setForm(prev => ({ ...prev, training_age: a }))}
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.training_age === a ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
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
                      className={`py-2 rounded-md text-xs font-medium border transition-colors capitalize ${form.movement_competency === c ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
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
                      className={`py-2 rounded-md text-xs font-medium border transition-colors ${form.week_duration === w ? 'bg-[#10E1C2] text-stone-900 border-[#10E1C2]' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>
                      {w} weeks
                    </button>
                  ))}
                </div>
              </ReasonCard>
            </div>

            {/* Equipment Access */}
            <div id="equipment" className="scroll-mt-8 bg-stone-900 border border-stone-800 rounded-xl p-4">
              <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Equipment Access</p>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.equipment_access.includes(opt.value)} onChange={() => toggleEquipment(opt.value)}
                      className="rounded border-stone-600 bg-stone-800 accent-[#10E1C2]" />
                    <span className={`text-sm transition-colors ${form.equipment_access.includes(opt.value) ? 'text-stone-200' : 'text-stone-500'}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-950/50 border border-red-800 rounded-md px-3 py-2">{error}</p>
            )}

            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full py-3 px-4 bg-[#10E1C2] text-stone-900 font-semibold rounded-md hover:bg-[#0dcfb2] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {generating ? 'Generating program… this may take 30–60s' : 'Approve & Generate Program'}
            </button>

            <p className="text-xs text-stone-600 text-center">
              Or{' '}
              <Link href={`/dashboard/clients/${clientId}/program/generate${planBlockId ? `?plan_block_id=${planBlockId}` : ''}`} className="hover:text-stone-400 underline">
                fill in manually
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
