import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { YogaSuggestPlanButton, YogaGenerateBlockButton } from './yoga-plan-actions'

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

const STATUS_STYLE: Record<string, string> = {
  planned: 'bg-stone-200 text-stone-600 border-stone-300',
  in_progress: 'bg-blue-50 text-[#1B6DFC] border-blue-200',
  complete: 'bg-green-50 text-green-700 border-green-200',
  skipped: 'bg-stone-100 text-stone-400 border-stone-200',
}

export default async function YogaMacroPlanView({
  clientId, clientName,
}: { clientId: string; clientName: string }) {
  const admin = createAdminClient()
  const { data: plans } = await admin
    .from('training_plans')
    .select('id, plan_name, macro_objective, is_active, plan_blocks(*)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })

  const plan = (plans?.find((p) => p.is_active) ?? plans?.[0]) as TrainingPlan | undefined
  const blocks = (plan?.plan_blocks ?? []).slice().sort((a, b) => a.position - b.position)
  const totalWeeks = blocks.filter((b) => b.status !== 'skipped').reduce((s, b) => s + b.week_duration, 0)

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
            <Link href={`/dashboard/clients/${clientId}`} className="hover:text-stone-700 transition-colors">{clientName}</Link>
            <span>/</span>
            <span className="text-stone-700">Macro Plan</span>
          </div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">Yoga Macro Plan</h1>
          <p className="text-sm text-stone-500 mt-1">The arc of blocks over the coming months.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link href={`/dashboard/clients/${clientId}/program`}
            className="text-xs font-medium px-3 py-1.5 border border-stone-300 text-stone-600 rounded-lg hover:border-stone-500 hover:text-stone-800 transition-colors">
            Current Block
          </Link>
          <span className="rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">yoga modality</span>
        </div>
      </div>

      <div className="mb-6">
        <YogaSuggestPlanButton clientId={clientId} hasPlan={!!plan} />
      </div>

      {plan && blocks.length ? (
        <div className="space-y-4">
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">{plan.plan_name}</h2>
            {plan.macro_objective && <p className="text-sm text-stone-600 mt-1">{plan.macro_objective}</p>}
            <p className="text-xs text-stone-400 mt-2">{blocks.length} blocks · {totalWeeks} weeks total</p>
          </div>

          <div className="space-y-3">
            {blocks.map((b) => (
              <div key={b.id} className="bg-stone-100 border border-stone-200 rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[11px] font-black text-[#1B6DFC] shrink-0">{String(b.position).padStart(2, '0')}</span>
                    <h3 className="font-semibold text-stone-900 text-sm truncate">{b.block_name}</h3>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize shrink-0 ${STATUS_STYLE[b.status] ?? STATUS_STYLE.planned}`}>
                    {b.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    {b.phase_category && (
                      <span className="px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-[#1B6DFC] capitalize">{b.phase_category}</span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-stone-200 text-stone-600">{b.week_duration} weeks</span>
                    {b.phase_objective && <span className="text-stone-500">{b.phase_objective}</span>}
                  </div>
                  <YogaGenerateBlockButton
                    clientId={clientId}
                    planBlockId={b.id}
                    blockName={b.block_name}
                    ceiling={b.phase_category ?? 'gentle'}
                    weekDuration={b.week_duration}
                    done={b.status === 'in_progress' || b.status === 'complete'}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl p-8 text-center text-sm text-stone-500">
          No arc yet. Suggest one to map out the client&apos;s journey.
        </div>
      )}
    </div>
  )
}
