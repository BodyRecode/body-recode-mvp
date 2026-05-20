import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProfileSidebar from '../profile-sidebar'

const phaseColour: Record<string, string> = {
  accumulation: 'text-blue-700 bg-blue-50 border-blue-200',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-700 bg-red-50 border-red-200',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-700 bg-violet-50 border-violet-200',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-blue-500 bg-blue-50 border-blue-200',
}

const entryStateColour: Record<string, string> = {
  stabilisation: 'text-amber-700 bg-amber-50 border-amber-200',
  training_support: 'text-blue-500 bg-blue-50 border-blue-200',
  high_output_support: 'text-violet-700 bg-violet-50 border-violet-200',
  recovery_reset: 'text-red-700 bg-red-50 border-red-200',
}

const readinessColour: Record<string, string> = {
  Green: 'bg-green-950/40 border-green-500 text-green-400',
  Amber: 'bg-amber-950/40 border-amber-500 text-amber-700',
  Red: 'bg-red-950/40 border-red-500 text-red-700',
}

const blockStatusStyle: Record<string, string> = {
  planned: 'border-stone-300 bg-stone-100 text-stone-500',
  in_progress: 'border-amber-700 bg-amber-50 text-amber-700',
  complete: 'border-green-700 bg-green-400/10 text-green-400',
  skipped: 'border-stone-200 bg-stone-100/50 text-stone-300',
}

export default async function ClientDirectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: client },
    { data: cffs },
    { data: cfws },
    { data: trainingPlan },
    { data: activeProgram },
    { data: activeNutritionPlan },
  ] = await Promise.all([
    admin.from('clients').select('id, name, coaching_started_at').eq('id', id).maybeSingle(),
    admin.from('cffs').select('body_state_classification, resolution_state, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, generated_at').eq('client_id', id).eq('is_archived', false).maybeSingle(),
    admin.from('cfws').select('week_number, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour, generated_at').eq('client_id', id).order('week_number', { ascending: false }).limit(1).maybeSingle(),
    admin.from('training_plans').select('*, plan_blocks(*)').eq('client_id', id).maybeSingle(),
    admin.from('programs').select('id, block_name, progression_phase, training_goal, training_frequency, week_duration, generated_at').eq('client_id', id).eq('is_active', true).maybeSingle(),
    admin.from('nutrition_plans').select('id, plan_name, entry_state, carb_demand_level, modulation_level, key_priorities, progression_notes, current_direction, estimated_calorie_band, protein_anchor_g, generated_at').eq('client_id', id).eq('is_active', true).maybeSingle(),
  ])

  if (!client) notFound()

  const blocks = trainingPlan?.plan_blocks
    ? [...trainingPlan.plan_blocks].sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    : []

  const currentBlock = blocks.find((b: { status: string }) => b.status === 'in_progress') || null
  const completedBlocks = blocks.filter((b: { status: string }) => b.status === 'complete').length
  const totalWeeks = blocks.filter((b: { status: string }) => b.status !== 'skipped').reduce((sum: number, b: { week_duration: number }) => sum + b.week_duration, 0)

  const readiness = cfws || cffs
  const readinessItems = readiness ? [
    { label: 'Capacity', value: readiness.exposure_readiness_capacity },
    { label: 'Schedule', value: readiness.exposure_readiness_schedule },
    { label: 'Regulation', value: readiness.exposure_readiness_regulation },
    { label: 'Behaviour', value: readiness.exposure_readiness_behaviour },
  ] : []

  return (
    <div className="flex gap-8 max-w-5xl">
      <ProfileSidebar clientId={id} />
      <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-stone-700">Direction</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Client Direction</h1>
        <p className="text-stone-500 text-sm mt-1">Macro arc, current meso block, and nutrition alignment - all in one view.</p>
      </div>

      <div className="space-y-4">

        {/* Current State - CFFS */}
        {cffs ? (
          <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
              <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Current Body State</p>
              <div className="flex items-center gap-2">
                {cfws && (
                  <span className="text-[10px] text-blue-500 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">Week {cfws.week_number} readiness</span>
                )}
                <Link href={`/dashboard/clients/${id}`} className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors">View CFFS →</Link>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-[#1A1A1A]">{cffs.body_state_classification}</p>
                  <p className="text-xs text-stone-500 mt-0.5">Resolution: <span className="text-stone-700">{cffs.resolution_state}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {readinessItems.map(item => (
                  <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${readinessColour[item.value] || 'bg-stone-200 border-stone-400 text-stone-600'}`}>
                    <p className="text-xs font-bold mb-0.5">{item.value}</p>
                    <p className="text-[10px] text-stone-500 uppercase tracking-wide">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-stone-100/50 border border-stone-200 rounded-xl p-5">
            <p className="text-stone-500 text-sm">No CFFS generated yet</p>
          </div>
        )}

        {/* Macro Arc */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Macro Training Arc</p>
            <Link href={`/dashboard/clients/${id}/plan`} className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors">
              {trainingPlan ? 'Edit plan →' : 'Create plan →'}
            </Link>
          </div>
          {trainingPlan ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-[#1A1A1A]">{trainingPlan.plan_name}</p>
                <p className="text-xs text-stone-400">{completedBlocks}/{blocks.length} blocks · {totalWeeks}w total</p>
              </div>
              {trainingPlan.macro_objective && (
                <p className="text-xs text-stone-600 leading-relaxed mb-4">{trainingPlan.macro_objective}</p>
              )}

              {/* Block timeline */}
              {blocks.length > 0 ? (
                <div className="space-y-2">
                  {blocks.map((block: {
                    id: string
                    position: number
                    block_name: string
                    progression_phase: string
                    training_goal: string
                    week_duration: number
                    status: string
                    execution_arc: string | null
                    phase_objective: string | null
                    program_id: string | null
                  }) => (
                    <div
                      key={block.id}
                      className={`rounded-xl border px-4 py-3 ${blockStatusStyle[block.status] || blockStatusStyle.planned} ${block.status === 'in_progress' ? 'ring-1 ring-amber-700/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-stone-400">{String(block.position).padStart(2, '0')}</span>
                          <p className={`text-sm font-medium ${block.status === 'skipped' ? 'line-through text-stone-300' : 'text-stone-800'}`}>
                            {block.block_name}
                          </p>
                          {block.status === 'in_progress' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 uppercase tracking-wide">Current</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-stone-500 bg-stone-200 border-stone-300'}`}>
                            {block.progression_phase}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-stone-500 bg-stone-200 border-stone-300'}`}>
                            {block.training_goal}
                          </span>
                          <span className="text-[10px] text-stone-400">{block.week_duration}w</span>
                        </div>
                      </div>
                      {block.phase_objective && block.status !== 'skipped' && (
                        <p className="text-[10px] text-stone-400 mt-1.5 leading-relaxed">{block.phase_objective}</p>
                      )}
                      {block.status === 'in_progress' && block.program_id && (
                        <Link
                          href={`/dashboard/clients/${id}/program`}
                          className="text-[10px] text-blue-500 hover:text-blue-700 mt-1.5 inline-block transition-colors"
                        >
                          View program →
                        </Link>
                      )}
                      {block.status === 'in_progress' && !block.program_id && (
                        <Link
                          href={`/dashboard/clients/${id}/program/suggest?plan_block_id=${block.id}`}
                          className="text-[10px] text-amber-700 hover:text-amber-700 mt-1.5 inline-block transition-colors"
                        >
                          Generate program →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-stone-400 text-sm">No blocks added yet.</p>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-stone-500 text-sm">No macro plan created yet</p>
              <Link href={`/dashboard/clients/${id}/plan`} className="text-xs text-blue-500 hover:text-blue-700 mt-2 inline-block transition-colors">
                Create macro plan →
              </Link>
            </div>
          )}
        </div>

        {/* Current Meso + Micro */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Training Program</p>
            <Link href={`/dashboard/clients/${id}/program`} className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors">
              {activeProgram ? 'View program →' : 'Generate →'}
            </Link>
          </div>
          {activeProgram ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{activeProgram.block_name}</p>
                  <p className="text-xs text-stone-500 mt-1">{activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks</p>
                </div>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[activeProgram.progression_phase] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
                    {activeProgram.progression_phase}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[activeProgram.training_goal] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
                    {activeProgram.training_goal}
                  </span>
                </div>
              </div>
              {currentBlock && (
                <div className="mt-3 pt-3 border-t border-stone-200">
                  <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Macro Block Context</p>
                  <p className="text-xs text-stone-600">
                    Block {currentBlock.position} of {blocks.length} - {currentBlock.execution_arc || currentBlock.progression_phase}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-stone-500 text-sm">No active program</p>
              <Link href={`/dashboard/clients/${id}/plan`} className="text-xs text-blue-500 hover:text-blue-700 mt-2 inline-block transition-colors">
                Open macro plan →
              </Link>
            </div>
          )}
        </div>

        {/* Nutrition Alignment */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-200">
            <p className="text-[10px] font-bold text-stone-600 uppercase tracking-widest">Nutrition Alignment</p>
            <Link href={`/dashboard/clients/${id}/nutrition`} className="text-[10px] text-stone-400 hover:text-stone-600 transition-colors">
              {activeNutritionPlan ? 'View plan →' : 'Generate →'}
            </Link>
          </div>
          {activeNutritionPlan ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-[#1A1A1A]">{activeNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${entryStateColour[activeNutritionPlan.entry_state] || 'text-stone-600 bg-stone-200 border-stone-300'}`}>
                    {activeNutritionPlan.entry_state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize text-stone-600 bg-stone-200 border-stone-300">
                    {activeNutritionPlan.carb_demand_level} carbs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-stone-200/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Protein</p>
                  <p className="text-sm font-semibold text-[#1A1A1A]">{activeNutritionPlan.protein_anchor_g}g/day</p>
                </div>
                <div className="bg-stone-200/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Modulation</p>
                  <p className="text-sm font-semibold text-[#1A1A1A] capitalize">{activeNutritionPlan.modulation_level}</p>
                </div>
                {activeNutritionPlan.estimated_calorie_band && (
                  <div className="bg-stone-200/50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-0.5">Calorie Band</p>
                    <p className="text-sm font-semibold text-[#1A1A1A]">{activeNutritionPlan.estimated_calorie_band}</p>
                  </div>
                )}
              </div>

              {activeNutritionPlan.current_direction && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize mb-3 ${
                  activeNutritionPlan.current_direction === 'progress' ? 'text-green-400 bg-green-400/10 border-green-700' :
                  activeNutritionPlan.current_direction === 'rebuild' ? 'text-red-700 bg-red-50 border-red-700' :
                  'text-amber-700 bg-amber-50 border-amber-700'
                }`}>
                  Weekly direction: {activeNutritionPlan.current_direction}
                </div>
              )}

              {activeNutritionPlan.key_priorities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-1.5">Key Priorities</p>
                  <div className="space-y-1">
                    {activeNutritionPlan.key_priorities.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-0.5 shrink-0">•</span>
                        <p className="text-xs text-stone-600">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-stone-500 text-sm">No active nutrition plan</p>
              <Link href={`/dashboard/clients/${id}/nutrition/suggest`} className="text-xs text-blue-500 hover:text-blue-700 mt-2 inline-block transition-colors">
                Generate plan →
              </Link>
            </div>
          )}
        </div>

        {/* Signal Alignment Summary */}
        {(cffs || activeProgram || activeNutritionPlan) && (
          <div className="bg-stone-100/50 border border-stone-200 rounded-xl px-5 py-4">
            <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mb-3">Signal Alignment</p>
            <div className="space-y-2">
              {cffs && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Body State</span>
                  <span className="text-stone-800 font-medium">{cffs.body_state_classification} · {cffs.resolution_state}</span>
                </div>
              )}
              {activeProgram && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Training Phase</span>
                  <span className="text-stone-800 font-medium capitalize">{activeProgram.progression_phase} · {activeProgram.training_goal}</span>
                </div>
              )}
              {activeNutritionPlan && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Nutrition Entry State</span>
                  <span className="text-stone-800 font-medium capitalize">{activeNutritionPlan.entry_state.replace(/_/g, ' ')} · {activeNutritionPlan.carb_demand_level} carbs</span>
                </div>
              )}
              {activeNutritionPlan?.current_direction && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Nutrition Direction</span>
                  <span className={`font-medium capitalize ${
                    activeNutritionPlan.current_direction === 'progress' ? 'text-green-400' :
                    activeNutritionPlan.current_direction === 'rebuild' ? 'text-red-700' :
                    'text-amber-700'
                  }`}>{activeNutritionPlan.current_direction}</span>
                </div>
              )}
              {trainingPlan && currentBlock && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-500">Arc Progress</span>
                  <span className="text-stone-800 font-medium">Block {currentBlock.position} of {blocks.length} · {completedBlocks} complete</span>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      </div>
    </div>
  )
}
