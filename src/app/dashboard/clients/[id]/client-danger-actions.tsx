'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ClientDangerActions({ clientId, isActive }: { clientId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'deactivate' | 'activate' | 'delete' | null>(null)

  async function toggleActive() {
    const action = isActive ? 'deactivate' : 'activate'
    setLoading(action)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !isActive }),
    })
    setLoading(null)
    router.refresh()
  }

  async function deleteClient() {
    if (!confirm('Delete this client permanently? This cannot be undone. All their data including intake, CFFS, check-ins, and CFWS will be removed.')) return
    setLoading('delete')
    const res = await fetch(`/api/clients/${clientId}`, { method: 'DELETE' })
    setLoading(null)
    if (!res.ok) {
      const data = await res.json()
      alert(`Failed to delete client: ${data.error || 'Unknown error'}`)
      return
    }
    router.push('/dashboard/coaching')
  }

  return (
    <div className="mt-6 bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-6">
      <h2 className="text-sm font-semibold text-[#3A3A3A] uppercase tracking-wider mb-4">Client Management</h2>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleActive}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-[#E5E5E5] text-[#3A3A3A] hover:border-[#D4D4D4] hover:text-[#1A1A1A] transition-colors disabled:opacity-50"
        >
          {loading === 'deactivate' || loading === 'activate'
            ? 'Saving...'
            : isActive ? 'Deactivate client' : 'Reactivate client'}
        </button>
        <button
          onClick={deleteClient}
          disabled={!!loading}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-red-900 text-red-700 hover:border-red-700 hover:text-red-700 transition-colors disabled:opacity-50"
        >
          {loading === 'delete' ? 'Deleting...' : 'Delete client'}
        </button>
      </div>
      {!isActive && (
        <p className="text-xs text-amber-500 mt-3">This client is inactive. They will not appear in the active coaching dashboard.</p>
      )}
    </div>
  )
}
