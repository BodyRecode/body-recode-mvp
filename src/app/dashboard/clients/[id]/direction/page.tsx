import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClientPageNav from '../client-page-nav'
import { PageHeader } from '@/components/dashboard/ui'
import { currentReadRow } from '@/lib/current-read'
import { readinessLevel } from '@/lib/readiness-levels'

const phaseColour: Record<string, string> = {
  accumulation: 'text-[#FFFFFF] bg-[rgba(27,109,252,0.08)] border-[#2A2F39]',
  intensification: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
  realization: 'text-[#D4817E] bg-[#1A1214] border-[#4A2222]',
  restoration: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-[#C2C6CC] bg-[#1A1E26] border-[#2A2F39]',
  hypertrophy: 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#2A2F39]/30',
  capacity: 'text-[#FAFAF8] bg-[rgba(27,109,252,0.08)] border-[#2A2F39]',
}

const entryStateColour: Record<string, string> = {
  stabilisation: 'text-[#E0A254] bg-[#1A1E26] border-[#4A3A22]',
  training_support: 'text-[#FAFAF8] bg-[rgba(27,109,252,0.08)] border-[#2A2F39]',
  high_output_support: 'text-[#C2C6CC] bg-[#1A1E26] border-[#2A2F39]',
  recovery_reset: 'text-[#D4817E] bg-[#1A1214] border-[#4A2222]',
}

// The four ratings are NOT readiness and carry no colour. They used to be
// painted in the Remediation and Attention colours, which taught the same amber
// two meanings one box apart. Severity is weight now. See readiness-levels.
const readinessTone: Record<string, string> = {
  quiet: 'bg-[#14171D] border-[#2A2F39] text-[#676D76]',
  normal: 'bg-[#14171D] border-[#4A4F57] text-[#C2C6CC]',
  strong: 'bg-[#1A1E26] border-[#FAFAF8] text-[#FAFAF8] font-semibold',
}

const blockStatusStyle: Record<string, string> = {
  planned: 'border-[#2A2F39] bg-[#14171D] text-[#8A9099]',
  in_progress: 'border-[#E0A254] bg-[#1A1E26] text-[#E0A254]',
  complete: 'border-[#6FA98B] bg-[#1A1E26]/10 text-[#C2C6CC]',
  skipped: 'border-[#2A2F39] bg-[#14171D]/50 text-[#FAFAF8]',
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
    currentReadRow(admin, id),
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
    <div className="max-w-[980px]">
      <div className="min-w-0">
      <PageHeader
        eyebrow={<Link href={`/dashboard/clients/${id}`} className="hover:text-[#FAFAF8] transition-colors">{client.name}</Link>}
        title="Direction"
        subtitle="Macro arc, current meso block, and nutrition alignment - all in one view."
      />
      <ClientPageNav clientId={id} />

      <div className="space-y-4">

        {/* Current State - CFFS */}
        {cffs ? (
          <div className="bg-[#14171D] br-card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F39]">
              <p className="text-[10px] font-medium text-[#8A9099]">Current Body State</p>
              <div className="flex items-center gap-2">
                {cfws && (
                  <span className="text-[10px] text-[#FAFAF8] bg-[rgba(27,109,252,0.08)] border border-[#2A2F39] px-2 py-0.5 rounded-full">Week {cfws.week_number} readiness</span>
                )}
                <Link href={`/dashboard/clients/${id}`} className="text-[10px] text-[#676D76] hover:text-[#8A9099] transition-colors">View the read →</Link>
              </div>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-lg font-bold text-[#FAFAF8]">{cffs.body_state_classification}</p>
                  <p className="text-[12.5px] text-[#8A9099] mt-0.5">Resolution: <span className="text-[#FAFAF8]">{cffs.resolution_state}</span></p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {readinessItems.map(item => (
                  <div key={item.label} className={`px-3 py-2 rounded-lg border-l-2 ${readinessTone[readinessLevel(item.value).tone]}`}>
                    <p className="text-[12.5px] mb-0.5">{readinessLevel(item.value).label}</p>
                    <p className="text-[10px] text-[#8A9099]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-[#14171D]/50 br-card p-5">
            <p className="text-[#8A9099] text-sm">Not read yet</p>
          </div>
        )}

        {/* Macro Arc */}
        <div className="bg-[#14171D] br-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F39]">
            <p className="text-[10px] font-medium text-[#8A9099]">Macro Training Arc</p>
            <Link href={`/dashboard/clients/${id}/plan`} className="text-[10px] text-[#676D76] hover:text-[#8A9099] transition-colors">
              {trainingPlan ? 'Edit plan →' : 'Create plan →'}
            </Link>
          </div>
          {trainingPlan ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-1">
                <p className="text-sm font-semibold text-[#FAFAF8]">{trainingPlan.plan_name}</p>
                <p className="text-[12.5px] text-[#676D76]">{completedBlocks}/{blocks.length} blocks · {totalWeeks}w total</p>
              </div>
              {trainingPlan.macro_objective && (
                <p className="text-[12.5px] text-[#8A9099] leading-relaxed mb-4">{trainingPlan.macro_objective}</p>
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
                      className={`rounded-xl border px-4 py-3 ${blockStatusStyle[block.status] || blockStatusStyle.planned} ${block.status === 'in_progress' ? 'ring-1 ring-[#E0A254]/50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-[#676D76]">{String(block.position).padStart(2, '0')}</span>
                          <p className={`text-sm font-medium ${block.status === 'skipped' ? 'line-through text-[#FAFAF8]' : 'text-[#FAFAF8]'}`}>
                            {block.block_name}
                          </p>
                          {block.status === 'in_progress' && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#1A1E26] text-[#E0A254]">Current</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                            {block.progression_phase}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                            {block.training_goal}
                          </span>
                          <span className="text-[10px] text-[#676D76]">{block.week_duration}w</span>
                        </div>
                      </div>
                      {block.phase_objective && block.status !== 'skipped' && (
                        <p className="text-[10px] text-[#676D76] mt-1.5 leading-relaxed">{block.phase_objective}</p>
                      )}
                      {block.status === 'in_progress' && block.program_id && (
                        <Link
                          href={`/dashboard/clients/${id}/program`}
                          className="text-[10px] text-[#FAFAF8] hover:text-[#FFFFFF] mt-1.5 inline-block transition-colors"
                        >
                          View program →
                        </Link>
                      )}
                      {block.status === 'in_progress' && !block.program_id && (
                        <Link
                          href={`/dashboard/clients/${id}/program/suggest?plan_block_id=${block.id}`}
                          className="text-[10px] text-[#E0A254] hover:text-[#E0A254] mt-1.5 inline-block transition-colors"
                        >
                          Generate program →
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#676D76] text-sm">No blocks added yet.</p>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-[#8A9099] text-sm">No macro plan created yet</p>
              <Link href={`/dashboard/clients/${id}/plan`} className="text-[12.5px] text-[#FAFAF8] hover:text-[#FFFFFF] mt-2 inline-block transition-colors">
                Create macro plan →
              </Link>
            </div>
          )}
        </div>

        {/* Current Meso + Micro */}
        <div className="bg-[#14171D] br-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F39]">
            <p className="text-[10px] font-medium text-[#8A9099]">Training Program</p>
            <Link href={`/dashboard/clients/${id}/program`} className="text-[10px] text-[#676D76] hover:text-[#8A9099] transition-colors">
              {activeProgram ? 'View program →' : 'Generate →'}
            </Link>
          </div>
          {activeProgram ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#FAFAF8]">{activeProgram.block_name}</p>
                  <p className="text-[12.5px] text-[#8A9099] mt-1">{activeProgram.training_frequency}x/week · {activeProgram.week_duration} weeks</p>
                </div>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${phaseColour[activeProgram.progression_phase] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {activeProgram.progression_phase}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${goalColour[activeProgram.training_goal] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {activeProgram.training_goal}
                  </span>
                </div>
              </div>
              {currentBlock && (
                <div className="mt-3 pt-3 border-t border-[#2A2F39]">
                  <p className="text-[10px] text-[#676D76] mb-1">Macro Block Context</p>
                  <p className="text-[12.5px] text-[#8A9099]">
                    Block {currentBlock.position} of {blocks.length} - {currentBlock.execution_arc || currentBlock.progression_phase}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-[#8A9099] text-sm">No active program</p>
              <Link href={`/dashboard/clients/${id}/plan`} className="text-[12.5px] text-[#FAFAF8] hover:text-[#FFFFFF] mt-2 inline-block transition-colors">
                Open macro plan →
              </Link>
            </div>
          )}
        </div>

        {/* Nutrition Alignment */}
        <div className="bg-[#14171D] br-card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#2A2F39]">
            <p className="text-[10px] font-medium text-[#8A9099]">Nutrition Alignment</p>
            <Link href={`/dashboard/clients/${id}/nutrition`} className="text-[10px] text-[#676D76] hover:text-[#8A9099] transition-colors">
              {activeNutritionPlan ? 'View plan →' : 'Generate →'}
            </Link>
          </div>
          {activeNutritionPlan ? (
            <div className="px-5 py-4">
              <div className="flex items-start justify-between mb-3">
                <p className="text-sm font-semibold text-[#FAFAF8]">{activeNutritionPlan.plan_name}</p>
                <div className="flex gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize ${entryStateColour[activeNutritionPlan.entry_state] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {activeNutritionPlan.entry_state.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border capitalize text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]">
                    {activeNutritionPlan.carb_demand_level} carbs
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-[#1A1E26]/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#8A9099] mb-0.5">Protein</p>
                  <p className="text-sm font-semibold text-[#FAFAF8]">{activeNutritionPlan.protein_anchor_g}g/day</p>
                </div>
                <div className="bg-[#1A1E26]/50 rounded-lg px-3 py-2">
                  <p className="text-[10px] text-[#8A9099] mb-0.5">Modulation</p>
                  <p className="text-sm font-semibold text-[#FAFAF8] capitalize">{activeNutritionPlan.modulation_level}</p>
                </div>
                {activeNutritionPlan.estimated_calorie_band && (
                  <div className="bg-[#1A1E26]/50 rounded-lg px-3 py-2">
                    <p className="text-[10px] text-[#8A9099] mb-0.5">Calorie Band</p>
                    <p className="text-sm font-semibold text-[#FAFAF8]">{activeNutritionPlan.estimated_calorie_band}</p>
                  </div>
                )}
              </div>

              {activeNutritionPlan.current_direction && (
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium capitalize mb-3 ${
                  activeNutritionPlan.current_direction === 'progress' ? 'text-[#C2C6CC] bg-[#1A1E26]/10 border-[#6FA98B]' :
                  activeNutritionPlan.current_direction === 'rebuild' ? 'text-[#D4817E] bg-[#1A1214] border-[#D4817E]' :
                  'text-[#E0A254] bg-[#1A1E26] border-[#E0A254]'
                }`}>
                  Weekly direction: {activeNutritionPlan.current_direction}
                </div>
              )}

              {activeNutritionPlan.key_priorities?.length > 0 && (
                <div>
                  <p className="text-[10px] font-medium text-[#8A9099] mb-1.5">Key Priorities</p>
                  <div className="space-y-1">
                    {activeNutritionPlan.key_priorities.map((p: string, i: number) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[#FAFAF8] mt-0.5 shrink-0">•</span>
                        <p className="text-[12.5px] text-[#8A9099]">{p}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-5 text-center">
              <p className="text-[#8A9099] text-sm">No active nutrition plan</p>
              <Link href={`/dashboard/clients/${id}/nutrition/suggest`} className="text-[12.5px] text-[#FAFAF8] hover:text-[#FFFFFF] mt-2 inline-block transition-colors">
                Generate plan →
              </Link>
            </div>
          )}
        </div>

        {/* Signal Alignment Summary */}
        {(cffs || activeProgram || activeNutritionPlan) && (
          <div className="bg-[#14171D]/50 br-card px-5 py-4">
            <p className="text-[10px] font-medium text-[#8A9099] mb-3">Signal Alignment</p>
            <div className="space-y-2">
              {cffs && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A9099]">Body State</span>
                  <span className="text-[#FAFAF8] font-medium">{cffs.body_state_classification} · {cffs.resolution_state}</span>
                </div>
              )}
              {activeProgram && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A9099]">Training Phase</span>
                  <span className="text-[#FAFAF8] font-medium capitalize">{activeProgram.progression_phase} · {activeProgram.training_goal}</span>
                </div>
              )}
              {activeNutritionPlan && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A9099]">Nutrition Entry State</span>
                  <span className="text-[#FAFAF8] font-medium capitalize">{activeNutritionPlan.entry_state.replace(/_/g, ' ')} · {activeNutritionPlan.carb_demand_level} carbs</span>
                </div>
              )}
              {activeNutritionPlan?.current_direction && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A9099]">Nutrition Direction</span>
                  <span className={`font-medium capitalize ${
                    activeNutritionPlan.current_direction === 'progress' ? 'text-[#C2C6CC]' :
                    activeNutritionPlan.current_direction === 'rebuild' ? 'text-[#D4817E]' :
                    'text-[#E0A254]'
                  }`}>{activeNutritionPlan.current_direction}</span>
                </div>
              )}
              {trainingPlan && currentBlock && (
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="text-[#8A9099]">Arc Progress</span>
                  <span className="text-[#FAFAF8] font-medium">Block {currentBlock.position} of {blocks.length} · {completedBlocks} complete</span>
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
