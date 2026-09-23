import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Zap, Plus, Play, Pause, ChevronRight, AlertTriangle } from 'lucide-react'
import SystemAutomationsPanel from './system-automations-panel'
import DormantReactivationButton from './dormant-reactivation-button'
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

  const hasScorecardAutomation = workflows?.some(w => w.name === 'Scorecard - Follow-up Sequence') ?? false

  // Duplicate detection, added 2026-08-12 after a second scorecard sequence
  // appeared on launch day and double-sent to eight leads for a month without
  // anything on screen saying so. The engine now skips the newer one, but a
  // silent skip is still a thing you should be able to SEE.
  const activeWorkflows = workflows?.filter(w => w.is_active) ?? []
  const byTrigger = new Map<string, typeof activeWorkflows>()
  for (const w of activeWorkflows) {
    const key = `${w.trigger_type}|${JSON.stringify(w.trigger_config ?? {})}`
    byTrigger.set(key, [...(byTrigger.get(key) ?? []), w])
  }
  const duplicateGroups = [...byTrigger.values()].filter(g => g.length > 1)

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#2A2F39] bg-[#14171D]/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[20px] font-semibold tracking-[-0.025em] mb-1">Automations</h1>
          <p className="text-[#8A9099] text-sm">{active} active · {total} total</p>
        </div>
        <Link
          href="/dashboard/business/automations/new"
          className="flex items-center gap-2 bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus size={14} strokeWidth={2.5} />
          New Workflow
        </Link>
      </div>

      {duplicateGroups.length > 0 && (
        <div className="mb-6 rounded-xl bg-[linear-gradient(180deg,#FEFAF2,#FDF6E9)] border border-[#F1DEB8] p-4">
          <p className="text-[13.5px] font-bold text-[#8A5A14] mb-1.5 flex items-center gap-1.5">
            <AlertTriangle size={14} /> Duplicate workflows on the same trigger
          </p>
          <p className="text-[13.5px] text-[#8A5A14] leading-relaxed mb-3">
            More than one active workflow fires on the same trigger with the same conditions. Only the
            oldest one runs, the rest are skipped, so nobody is being double-sent right now. But one of
            these is not doing anything and should be turned off.
          </p>
          {duplicateGroups.map((group, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-[12.5px] font-mediumr text-[#A96A12] mb-1">
                Trigger: {group[0].trigger_type}
              </p>
              {group.map((w, j) => (
                <Link key={w.id} href={`/dashboard/business/automations/${w.id}`}
                  className="block text-[13.5px] text-[#8A5A14] hover:underline">
                  {j === 0 ? '✓ running' : '✗ skipped'} · {w.name}
                  <span className="text-[#A96A12]"> · created {new Date(w.created_at).toLocaleDateString('en-AU')}</span>
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}

      <DormantReactivationButton />

      <SystemAutomationsPanel />

      {workflows && workflows.length > 0 ? (
        <div>
          <p className="text-[12.5px] font-semibold text-[#8A9099] mb-3">Custom Workflows</p>
          <div className="space-y-2">
            {workflows.map((workflow) => {
            const stepCount = Array.isArray(workflow.be_workflow_steps)
              ? workflow.be_workflow_steps.length
              : 0
            return (
              <Link
                key={workflow.id}
                href={`/dashboard/business/automations/${workflow.id}`}
                className="flex items-center gap-4 bg-[#1A1E26] br-card p-4 hover:border-[#2A2F39] transition-colors group"
              >
                <div className={`p-2 rounded-lg ${workflow.is_active ? 'bg-[rgba(27,109,252,0.08)]' : 'bg-[#1F242C]'}`}>
                  <Zap
                    size={15}
                    className={workflow.is_active ? 'text-[#FAFAF8]' : 'text-[#8A9099]'}
                    strokeWidth={1.8}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#FAFAF8] group-hover:text-[#FAFAF8] transition-colors truncate">
                    {workflow.name}
                  </p>
                  <p className="text-[12.5px] text-[#8A9099] mt-0.5">
                    {triggerLabel[workflow.trigger_type] ?? workflow.trigger_type}
                    {' · '}
                    {stepCount} step{stepCount !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {workflow.name === 'Scorecard - Follow-up Sequence' && (
                    <ReseedScorecardButton stepCount={stepCount} />
                  )}
                  <span className={`flex items-center gap-1 text-xs font-medium ${
                    workflow.is_active ? 'text-[#FAFAF8]' : 'text-[#8A9099]'
                  }`}>
                    {workflow.is_active
                      ? <><Play size={11} />Active</>
                      : <><Pause size={11} />Paused</>
                    }
                  </span>
                  <ChevronRight size={14} className="text-[#676D76] group-hover:text-[#8A9099] transition-colors" />
                </div>
              </Link>
            )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-[#1A1E26] border border-dashed border-[#2A2F39] rounded-xl p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-[#1F242C] rounded-xl">
              <Zap size={24} className="text-[#8A9099]" strokeWidth={1.5} />
            </div>
          </div>
          <p className="text-[#8A9099] text-sm font-medium mb-1">No automations yet</p>
          <p className="text-[#676D76] text-[12.5px] mb-6">Build workflows to automate your entire lead and client journey</p>
          <Link
            href="/dashboard/business/automations/new"
            className="inline-flex items-center gap-2 bg-[#FAFAF8] hover:bg-[#E4E4E0] text-[#14171D] text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={14} strokeWidth={2.5} />
            Build your first workflow
          </Link>
        </div>
      )}
    </div>
  )
}
