import Link from 'next/link'
import WorkflowEditor from '../workflow-editor'

export default function NewWorkflowPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-stone-500 text-sm mb-6">
        <Link href="/dashboard/business/automations" className="hover:text-stone-700 transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span className="text-stone-700">New Workflow</span>
      </div>
      <WorkflowEditor />
    </div>
  )
}
