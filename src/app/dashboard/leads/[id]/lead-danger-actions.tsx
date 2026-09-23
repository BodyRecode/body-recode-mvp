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
    <div className="br-card p-6 mb-4">
      <h2 className="text-[13.5px] font-semibold text-[#FAFAF8] tracking-[-0.015em] mb-4">Lead Management</h2>
      {!isActive && (
        <p className="text-[12.5px] text-[#B7791F] mb-3">This lead is inactive and hidden from the main leads list.</p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[#2A2F39] text-[#C2C6CC] hover:border-[#FAFAF8] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#FAFAF8] transition-colors disabled:opacity-50"
        >
          {loading === 'toggle' ? 'Saving...' : isActive ? 'Deactivate lead' : 'Reactivate lead'}
        </button>
        <button
          onClick={deleteLead}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[#F5C9C9] text-[#D4817E] hover:border-[#D4817E] hover:bg-[#FDEDED] hover:text-[#D4817E] transition-colors disabled:opacity-50"
        >
          {loading === 'delete' ? 'Deleting...' : 'Delete lead'}
        </button>
      </div>
    </div>
  )
}
