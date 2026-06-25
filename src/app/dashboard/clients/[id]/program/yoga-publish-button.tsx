'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function YogaPublishButton({
  programId, published,
}: { programId: string; published: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (published) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-semibold text-[#1B6DFC]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#1B6DFC]" /> Published to client
      </span>
    )
  }

  async function publish() {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/publish-yoga-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Publish failed'); return }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button onClick={publish} disabled={loading}
        className="rounded-md bg-[#1B6DFC] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5390FF] disabled:opacity-40 transition-colors">
        {loading ? 'Publishing…' : 'Publish to client'}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  )
}
