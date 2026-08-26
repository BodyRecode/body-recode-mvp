import Link from 'next/link'
import WorkflowEditor from '../workflow-editor'

export default function NewWorkflowPage() {
  return (
    <div>
      <div className="flex items-center gap-2 text-[#666D7A] text-sm mb-6">
        <Link href="/dashboard/business/automations" className="hover:text-[#141821] transition-colors">
          Automations
        </Link>
        <span>/</span>
        <span className="text-[#141821]">New Workflow</span>
      </div>
      <WorkflowEditor />
    </div>
  )
}
