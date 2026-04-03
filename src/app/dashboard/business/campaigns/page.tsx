import { Megaphone } from 'lucide-react'

export default function CampaignsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Campaigns</h1>
        <p className="text-stone-400 text-sm">Email and SMS broadcasts to leads and clients.</p>
      </div>
      <div className="bg-stone-900 border border-dashed border-stone-700 rounded-xl p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-stone-800 rounded-xl">
            <Megaphone size={24} className="text-stone-500" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-stone-400 text-sm font-medium mb-1">Campaign Manager</p>
        <p className="text-stone-600 text-xs">Coming soon — email campaigns, SMS broadcasts, content scheduling</p>
      </div>
    </div>
  )
}
