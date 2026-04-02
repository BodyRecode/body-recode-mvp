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
  accumulation: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  intensification: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  realization: 'text-red-400 bg-red-400/10 border-red-400/30',
  restoration: 'text-green-400 bg-green-400/10 border-green-400/30',
}

const goalColour: Record<string, string> = {
  strength: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
  hypertrophy: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  capacity: 'text-teal-400 bg-teal-400/10 border-teal-400/30',
}

function DraftPlanPreview({ plan }: { plan: Plan }) {
  const totalWeeks = plan.plan_blocks.filter(b => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0)

  return (
    <div className="space-y-3">
      {/* Plan identity */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <h2 className="text-base font-semibold text-white">{plan.plan_name}</h2>
        {plan.macro_objective && (
          <p className="text-sm text-stone-400 mt-1">{plan.macro_objective}</p>
        )}
        <p className="text-xs text-stone-600 mt-2">{plan.plan_blocks.length} blocks · {totalWeeks} weeks total</p>
      </div>

      {/* Block timeline */}
      <div className="space-y-2">
        {plan.plan_blocks.map((block, i) => (
          <div key={block.id}>
            {i > 0 && (
              <div className="flex justify-center py-1">
                <div className="w-px h-4 bg-stone-700" />
              </div>
            )}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600 w-5">{block.position}</span>
                  <p className="text-sm font-semibold text-stone-100">{block.block_name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${phaseColour[block.progression_phase] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                    {block.progression_phase}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${goalColour[block.training_goal] || 'text-stone-400 bg-stone-800 border-stone-700'}`}>
                    {block.training_goal}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-stone-500 pl-7">
                <span>{block.week_duration} weeks</span>
                {block.execution_arc && <span className="capitalize">{block.execution_arc} arc</span>}
                {block.phase_category && <span>{block.phase_category}</span>}
              </div>
              {block.notes && (
                <p className="text-xs text-stone-600 italic pl-7 mt-1">{block.notes}</p>
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
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-300 transition-colors">{client.name}</Link>
            <span>/</span>
            <span className="text-stone-300">Macro Plan</span>
          </div>
          <h1 className="text-2xl font-semibold text-white">Macro Training Arc</h1>
          <p className="text-sm text-stone-500 mt-1">Plan the full sequence of meso blocks. Each block links to a generated program.</p>
        </div>
        <Link
          href={`/dashboard/clients/${id}/plan/suggest`}
          className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors shrink-0"
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

      {/* Draft — show preview with Approve/Discard */}
      {draftPlan && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-700 text-amber-400 uppercase tracking-wide">
              Draft Arc — Pending Approval
            </span>
            <PlanDraftActions planId={draftPlan.id} clientId={id} />
          </div>
          <DraftPlanPreview plan={draftPlan} />
        </div>
      )}

      {/* Active plan — full editor */}
      {activePlan && (
        <div>
          {draftPlan && (
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="flex-1 h-px bg-stone-800" />
              <p className="text-xs text-stone-600 uppercase tracking-widest">Current Active Arc</p>
              <div className="flex-1 h-px bg-stone-800" />
            </div>
          )}
          <MacroPlanEditor clientId={id} clientName={client.name} initialPlan={activePlan} />
        </div>
      )}

      {/* No plan yet */}
      {!activePlan && !draftPlan && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-stone-800" />
            <p className="text-xs text-stone-600 uppercase tracking-widest">Manual Entry</p>
            <div className="flex-1 h-px bg-stone-800" />
          </div>
          <MacroPlanEditor clientId={id} clientName={client.name} initialPlan={null} />
        </div>
      )}
    </div>
  )
}
