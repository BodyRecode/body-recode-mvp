import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, Plus, Play, Pause, ChevronRight } from 'lucide-react'
import SystemAutomationsPanel from './system-automations-panel'
import ReseedScorecardButton from './reseed-scorecard-button'

const triggerLabel: Record<string, string> = {
  lead_created: 'Lead created',
  form_submitted: 'Form submitted',
  tag_added: 'Tag added',
  booking_created: 'Booking created',
  payment_completed: 'Payment completed',
  pipeline_stage_changed: 'Pipeline stage changed',
}

export default async function AutomationsPage() {
  const supabase = await createClient()

  const { data: workflows } = await supabase
    .from('be_workflows')
    .select('*, be_workflow_steps(id)')
    .order('created_at', { ascending: false })

  const active = workflows?.filter(w => w.is_active).length || 0
  const total = workflows?.length || 0

  const hasScorecardAutomation = workflows?.some(w => w.name === 'Scorecard — Follow-up Sequence') ?? false

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Automations</h1>
          <p className="text-stone-400 text-sm">{active} active · {total} total</p>
        </div>
        <Link
          href="/dashboard/business/automations/new"
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Workflow
        </Link>
      </div>

      <SystemAutomationsPanel />

      {workflows && workflows.length > 0 ? (
        <div>
          <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Custom Workflows</p>
          <div className="space-y-2">
            {workflows.map((workflow) => {
            const stepCount = Array.isArray(workflow.be_workflow_steps)
              ? workflow.be_workflow_steps.length
              : 0
            return (
              <Link
                key={workflow.id}
                href={`/dashboard/business/automations/${workflow.id}`}
                className="flex items-center gap-4 bg-stone-900 border border-stone-800 rounded-xl p-4 hover:border-stone-700 transition-colors group"
              >
                <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-teal-500/10' : 'bg-stone-800'}`}>
                  <Zap
                    size={15}
                    className={workflow.is_active ? 'text-teal-400' : 'text-stone-500'}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white group-hover:text-teal-400 transition-colors truncate">
                    {workflow.name}
                  </p>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {triggerLabel[workflow.trigger_type] ?? workflow.trigger_type}
                    {' · '}
                    {stepCount} step{stepCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {workflow.name === 'Scorecard — Follow-up Sequence' && (
                    <ReseedScorecardButton />
                  )}
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    workflow.is_active ? 'text-teal-400' : 'text-stone-500'
                  }`}>
                    {workflow.is_active
                      ? <><Play size={11} />Active</>
                      : <><Pause size={11} />Paused</>
                    }
                  </span>
                  <ChevronRight size={14} className="text-stone-600 group-hover:text-stone-400 transition-colors" />
                </div>
              </Link>
            )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-stone-900 border border-dashed border-stone-800 rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-stone-800 rounded-xl">
              <Zap size={24} className="text-stone-500" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-stone-400 text-sm font-medium mb-1">No automations yet</p>
          <p className="text-stone-600 text-xs mb-6">Build workflows to automate your entire lead and client journey</p>
          <Link
            href="/dashboard/business/automations/new"
            className="inline-flex items-center gap-2 bg-teal-500 hover:bg-teal-400 text-stone-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Build your first workflow
          </Link>
        </div>
      )}
    </div>
  )
}
