'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LeadDangerActions({ leadId, isActive }: { leadId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'toggle' | 'delete' | null>(null)

  async function toggleActive() {
    setLoading('toggle')
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !isActive }),
    })
    setLoading(null)
    router.refresh()
  }

  async function deleteLead() {
    if (!confirm('Delete this lead permanently? This cannot be undone.')) return
    setLoading('delete')
    await fetch(`/api/leads/${leadId}`, { method: 'DELETE' })
    setLoading(null)
    router.push('/dashboard/leads')
  }

  return (
    <div className="bg-[#111110] border border-[#1c1917] rounded-xl p-6 mb-4">
      <h2 className="text-sm font-semibold text-[#d4cfc9] uppercase tracking-wider mb-4">Lead Management</h2>
      {!isActive && (
        <p className="text-xs text-amber-500 mb-3">This lead is inactive and hidden from the main leads list.</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[#1c1917] text-[#d4cfc9] hover:border-[#292524] hover:text-white transition-colors disabled:opacity-50"
        >
          {loading === 'toggle' ? 'Saving...' : isActive ? 'Deactivate lead' : 'Reactivate lead'}
        </button>
        <button
          onClick={deleteLead}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-red-900 text-red-400 hover:border-red-700 hover:text-red-300 transition-colors disabled:opacity-50"
        >
          {loading === 'delete' ? 'Deleting...' : 'Delete lead'}
        </button>
      </div>
    </div>
  )
}
