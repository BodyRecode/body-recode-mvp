import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MacroPlanEditor from './macro-plan-editor'
import PlanDraftActions from './draft-actions'
import HierarchyVisual from './hierarchy-visual'

interface PlanBlock {
  id: string
  plan_id: string
  client_id: string
  position: number
  block_name: string
  progression_phase: string
  training_goal: string
  week_duration: number
  training_frequency: number | null
  status: 'planned' | 'in_progress' | 'complete' | 'skipped'
  phase_category: string | null
  execution_arc: string | null
  phase_objective: string | null
  program_id: string | null
  notes: string | null
}

interface Plan {
  id: string
  plan_name: string
  macro_objective: string | null
  notes: string | null
  is_active: boolean
  status: string
  plan_blocks: PlanBlock[]
}

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

function DraftPlanPreview({ plan }: { plan: Plan }) {
  const totalWeeks = plan.plan_blocks.filter(b => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0)

  return (
    <div className="space-y-3">
      {/* Plan identity */}
      <div className="bg-[#14171D] br-card p-5">
        <h2 className="text-base font-semibold text-[#FAFAF8]">{plan.plan_name}</h2>
        {plan.macro_objective && (
          <p className="text-sm text-[#8A9099] mt-1">{plan.macro_objective}</p>
        )}
        <p className="text-[12.5px] text-[#676D76] mt-2">{plan.plan_blocks.length} blocks · {totalWeeks} weeks total</p>
      </div>

      {/* Block timeline */}
      <div className="space-y-2">
        {plan.plan_blocks.map((block, i) => (
          <div key={block.id}>
            {i > 0 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-[#2A2F39]" />
              </div>
            )}
            <div className="bg-[#14171D] br-card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[12.5px] font-medium text-[#676D76] w-5">{block.position}</span>
                  <p className="text-sm font-semibold text-[#FAFAF8]">{block.block_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {block.progression_phase}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-[#8A9099] bg-[#1A1E26] border-[#2A2F39]'}`}>
                    {block.training_goal}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-[12.5px] text-[#8A9099] pl-7">
                <span>{block.week_duration} weeks</span>
                {block.execution_arc && <span className="capitalize">{block.execution_arc} arc</span>}
                {block.phase_category && <span>{block.phase_category}</span>}
              </div>
              {block.notes && (
                <p className="text-[12.5px] text-[#676D76] italic pl-7 mt-1">{block.notes}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function MacroPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    { data: client },
    { data: plans },
    { data: activeProgram },
    { data: nutritionPlan },
  ] = await Promise.all([
    admin.from('clients').select('id, name').eq('id', id).maybeSingle(),
    admin.from('training_plans').select('*, plan_blocks(*)').eq('client_id', id).order('created_at', { ascending: false }),
    admin.from('programs').select('block_name, progression_phase, training_goal, training_frequency, week_duration').eq('client_id', id).eq('is_active', true).maybeSingle(),
    admin.from('nutrition_plans').select('entry_state, carb_demand_level, modulation_level').eq('client_id', id).eq('is_active', true).maybeSingle(),
  ])

  if (!client) notFound()

  const draftPlan = plans?.find(p => p.status === 'draft') as Plan | undefined
  const activePlan = plans?.find(p => p.is_active && p.status !== 'draft') as Plan | undefined

  if (draftPlan?.plan_blocks) {
    draftPlan.plan_blocks.sort((a: PlanBlock, b: PlanBlock) => a.position - b.position)
  }
  if (activePlan?.plan_blocks) {
    activePlan.plan_blocks.sort((a: PlanBlock, b: PlanBlock) => a.position - b.position)
  }

  return (
    <div className="max-w-[980px]">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-[#8A9099] text-sm br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-[#FAFAF8] transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-[#FAFAF8]">Macro Plan</span>
          </div>
          <h1 className="text-[20px] font-semibold text-[#FAFAF8] tracking-[-0.025em]">Macro Training Arc</h1>
          <p className="text-sm text-[#8A9099] mt-1">Plan the full sequence of meso blocks. Each block links to a generated program.</p>
        </div>
        <Link
          href={`/dashboard/clients/${id}/plan/suggest`}
          className="text-[12.5px] font-medium px-3 py-1.5 border border-[#2A2F39] text-[#8A9099] rounded-lg hover:border-[#2A2F39] hover:text-[#FAFAF8] transition-colors shrink-0"
        >
          {activePlan || draftPlan ? 'Suggest New Arc' : 'Suggest Arc'}
        </Link>
      </div>

      {/* Hierarchy Visual */}
      <div className="mb-8">
        <HierarchyVisual
          plan={activePlan ?? draftPlan ?? null}
          activeProgram={activeProgram ?? null}
          nutritionPlan={nutritionPlan ?? null}
        />
      </div>

      {/* Draft - show preview with Approve/Discard */}
      {draftPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[12.5px] font-medium px-2.5 py-1 rounded-full bg-[#1A1E26] border border-[#E0A254] text-[#E0A254]">
              Draft Arc - Pending Approval
            </span>
            <PlanDraftActions planId={draftPlan.id} clientId={id} />
          </div>
          <DraftPlanPreview plan={draftPlan} />
        </div>
      )}

      {/* Active plan - full editor */}
      {activePlan && (
        <div>
          {draftPlan && (
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="flex-1 h-px bg-[#1A1E26]" />
              <p className="text-[12.5px] text-[#676D76]">Current Active Arc</p>
              <div className="flex-1 h-px bg-[#1A1E26]" />
            </div>
          )}
          <MacroPlanEditor clientId={id} clientName={client.name} initialPlan={activePlan} />
        </div>
      )}

      {/* No plan yet */}
      {!activePlan && !draftPlan && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-[#1A1E26]" />
            <p className="text-[12.5px] text-[#676D76]">Manual Entry</p>
            <div className="flex-1 h-px bg-[#1A1E26]" />
          </div>
          <MacroPlanEditor clientId={id} clientName={client.name} initialPlan={null} />
        </div>
      )}
    </div>
  )
}
