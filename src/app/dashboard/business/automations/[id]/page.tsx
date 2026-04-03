import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import WorkflowEditor from '../workflow-editor'

export default async function EditWorkflowPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: workflow } = await supabase
    .from('be_workflows')
    .select('*, be_workflow_steps(*)')
    .eq('id', id)
    .single()

  if (!workflow) notFound()

  const steps = (workflow.be_workflow_steps ?? [])
    .sort((a: { position: number }, b: { position: number }) => a.position - b.position)
    .map((s: {
      id: string; type: string; action_type?: string
      config: Record<string, string | number>; position: number
    }) => ({
      id: s.id,
      type: s.type as 'action' | 'wait' | 'condition',
      action_type: s.action_type as any,
      config: s.config ?? {},
      position: s.position,
    }))

  return (
    <div>
      <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
        <Link href="/dashboard/business/automations" className="hover:text-stone-300 transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span className="text-stone-300">{workflow.name}</span>
      </div>
      <WorkflowEditor
        initial={{
          id: workflow.id,
          name: workflow.name,
          trigger_type: workflow.trigger_type,
          trigger_config: workflow.trigger_config ?? {},
          is_active: workflow.is_active,
          steps,
        }}
      />
    </div>
  )
}
