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
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-6 mb-4">
      <h2 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] mb-4">Lead Management</h2>
      {!isActive && (
        <p className="text-[12.5px] text-amber-500 mb-3">This lead is inactive and hidden from the main leads list.</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[#E8EAEE] text-[#43474F] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors disabled:opacity-50"
        >
          {loading === 'toggle' ? 'Saving...' : isActive ? 'Deactivate lead' : 'Reactivate lead'}
        </button>
        <button
          onClick={deleteLead}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:border-red-600 hover:bg-red-50 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {loading === 'delete' ? 'Deleting...' : 'Delete lead'}
        </button>
      </div>
    </div>
  )
}
