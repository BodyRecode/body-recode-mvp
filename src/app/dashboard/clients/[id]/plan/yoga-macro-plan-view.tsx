import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { YogaSuggestPlanButton } from './yoga-plan-actions'
import YogaHierarchyVisual from './yoga-hierarchy-visual'
import YogaMacroPlanEditor from './yoga-macro-plan-editor'

interface PlanBlock {
  id: string
  block_name: string
  phase_category: string | null   // yoga intensity ceiling
  phase_objective: string | null  // yoga focus
  week_duration: number
  position: number
  status: string
}
interface TrainingPlan {
  id: string
  plan_name: string
  macro_objective: string | null
  plan_blocks: PlanBlock[]
}

export default async function YogaMacroPlanView({
  clientId, clientName,
}: { clientId: string; clientName: string }) {
  const admin = createAdminClient()
  const [{ data: plans }, { data: latestProgram }] = await Promise.all([
    admin.from('training_plans').select('id, plan_name, macro_objective, is_active, plan_blocks(*)').eq('client_id', clientId).order('created_at', { ascending: false }),
    admin.from('programs').select('block_name, sessions').eq('client_id', clientId).eq('modality', 'yoga').order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const plan = (plans?.find((p) => p.is_active) ?? plans?.[0]) as TrainingPlan | undefined
  const blocks = (plan?.plan_blocks ?? []).slice().sort((a, b) => a.position - b.position)
  const totalWeeks = blocks.filter((b) => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0)
  const current = blocks.find((b) => b.status === 'in_progress')
  const practiceCount = Array.isArray(latestProgram?.sessions) ? latestProgram!.sessions.length : 0

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
            <span>/</span>
            <span className="text-stone-700">Macro Plan</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Macro Training Arc</h1>
          <p className="text-sm text-stone-500 mt-1">Plan the full sequence of blocks. Each block generates a practice block.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/clients/${clientId}/program`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-stone-500 hover:text-stone-800 transition-colors">
            Current Block
          </Link>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">yoga</span>
        </div>
      </div>

      {/* Hierarchy visual */}
      <div className="mb-8">
        <YogaHierarchyVisual plan={plan ?? null} currentBlockName={current?.block_name ?? latestProgram?.block_name ?? null} practiceCount={practiceCount} />
      </div>

      <div className="mb-6">
        <YogaSuggestPlanButton clientId={clientId} hasPlan={!!plan} />
      </div>

      {plan && blocks.length ? (
        <div className="space-y-3">
          {/* Plan identity */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-[#1A1A1A]">{plan.plan_name}</h2>
            {plan.macro_objective && <p className="text-sm text-stone-600 mt-1">{plan.macro_objective}</p>}
            <p className="text-xs text-stone-400 mt-2">{blocks.length} blocks · {totalWeeks} weeks total</p>
          </div>

          {/* Editable block arc */}
          <YogaMacroPlanEditor clientId={clientId} planId={plan.id} initialBlocks={blocks} />
        </div>
      ) : (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
          No arc yet. Suggest one to map out the client&apos;s journey.
        </div>
      )}
    </div>
  )
}
