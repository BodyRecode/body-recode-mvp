import { BarChart2 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
        <p className="text-stone-400 text-sm">Revenue, lead volume, conversion rates, booked calls, show-up rate.</p>
      </div>
      <div className="bg-stone-900 border border-dashed border-stone-700 rounded-xl p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-stone-800 rounded-xl">
            <BarChart2 size={24} className="text-stone-500" strokeWidth={1.5} />
          </div>
        </div>
        <p className="text-stone-400 text-sm font-medium mb-1">Analytics Dashboard</p>
        <p className="text-stone-600 text-xs">
          Coming soon — leads generated, CPL, conversion rate, booked calls, show-up rate, revenue
        </p>
      </div>
    </div>
  )
}
