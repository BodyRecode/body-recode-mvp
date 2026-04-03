import { Zap } from 'lucide-react'

export default function AutomationsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Automations</h1>
        <p className="text-stone-400 text-sm">Trigger → condition → action. Automation drives everything.</p>
      </div>
      <div className="bg-stone-900 border border-dashed border-stone-700 rounded-xl p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-stone-800 rounded-xl">
            <Zap size={24} className="text-stone-500" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-stone-400 text-sm font-medium mb-1">Workflow Builder</p>
        <p className="text-stone-600 text-xs">
          Coming soon — form submitted, tag added, booking created, payment completed, pipeline stage changed
        </p>
      </div>
    </div>
  )
}
