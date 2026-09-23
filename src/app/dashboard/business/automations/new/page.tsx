import Link from 'next/link'
import WorkflowEditor from '../workflow-editor'

export default function NewWorkflowPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#8A9099] text-sm mb-6">
        <Link href="/dashboard/business/automations" className="hover:text-[#FAFAF8] transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span className="text-[#FAFAF8]">New Workflow</span>
      </div>
      <WorkflowEditor />
    </div>
  )
}
