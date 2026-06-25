'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const inputCls = 'w-full bg-stone-200 border border-stone-300 text-stone-900 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B6DFC] focus:border-transparent'
const labelCls = 'block text-xs font-bold text-stone-600 uppercase tracking-wider mb-2'

export default function YogaCreatePlanForm({ clientId }: { clientId: string }) {
  const router = useRouter()
  const [planName, setPlanName] = useState('')
  const [objective, setObjective] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function create() {
    if (!planName) { setError('Plan name required'); return }
    setSaving(true); setError(null)
    try {
      const res = await fetch('/api/plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId, plan_name: planName, macro_objective: objective }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Create failed'); return }
      router.refresh()
    } catch { setError('Create failed') } finally { setSaving(false) }
  }

  return (
    <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-stone-700 mb-4">Create Macro Plan</h2>
      <div className="space-y-4">
        <div>
          <label className={labelCls}>Plan Name</label>
          <input value={planName} onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Restore to Strength" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Macro Objective</label>
          <input value={objective} onChange={(e) => setObjective(e.target.value)}
            placeholder="e.g. Settle the nervous system, then build gentle capacity over 4 months" className={inputCls} />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button onClick={create} disabled={saving}
          className="py-2.5 px-5 bg-[#1B6DFC] text-white font-semibold text-sm rounded-md hover:bg-[#5390FF] disabled:opacity-40 transition-colors">
          {saving ? 'Creating…' : 'Create Plan'}
        </button>
      </div>
    </div>
  )
}
