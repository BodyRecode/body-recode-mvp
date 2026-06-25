'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function YogaSuggestPlanButton({ clientId, hasPlan }: { clientId: string; hasPlan: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function suggest() {
    if (hasPlan && !confirm('Suggest a new arc? This replaces the current plan.')) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/suggest-yoga-plan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      router.refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={suggest} disabled={loading}
        className="py-2.5 px-5 bg-[#1B6DFC] text-white font-semibold text-sm rounded-md hover:bg-[#5390FF] disabled:opacity-40 transition-colors">
        {loading ? 'Designing the arc…' : hasPlan ? 'Suggest a new arc' : 'Suggest a yoga arc'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}

export function YogaGenerateBlockButton({
  clientId, planBlockId, blockName, ceiling, weekDuration, done,
}: {
  clientId: string; planBlockId: string; blockName: string
  ceiling: string; weekDuration: number; done: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function generate() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/generate-yoga-practice', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          ceiling,
          block_name_override: blockName,
          week_duration: weekDuration,
          plan_block_id: planBlockId,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      router.push(`/dashboard/clients/${clientId}/program`)
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setLoading(false) }
  }

  return (
    <div className="flex items-center gap-2">
      <button onClick={generate} disabled={loading}
        className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${done
          ? 'border border-stone-300 text-stone-600 hover:border-stone-500'
          : 'bg-[#1B6DFC] text-white hover:bg-[#5390FF]'} disabled:opacity-40`}>
        {loading ? 'Generating…' : done ? 'Regenerate' : 'Generate this block'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
