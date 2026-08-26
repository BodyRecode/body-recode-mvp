'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  programId: string
  publishedToClientAt: string | null
  programReadingPublishedAt: string | null
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotifyClientButton({
  programId,
  publishedToClientAt,
  programReadingPublishedAt,
}: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const hasReading = Boolean(programReadingPublishedAt)
  const notified = Boolean(publishedToClientAt)

  async function handleClick() {
    setError(null)
    const confirmMsg = notified
      ? 'Notify the client again? They will receive a second email for this block.'
      : 'Send the new-block notification email to the client now?'
    if (!confirm(confirmMsg)) return

    setLoading(true)
    try {
      const res = await fetch('/api/notify-client-training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ program_id: programId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Send failed')
        setLoading(false)
        return
      }
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  if (!hasReading) {
    return (
      <span
        title="Publish the Program Reading first. The reading frames the block."
        className="text-[12.5px] px-3 py-1.5 border border-[#E8EAEE] text-[#98A0AD] rounded-lg cursor-not-allowed"
      >
        Notify Client
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {notified && (
        <span className="text-[11px] text-[#666D7A]">
          Notified {formatDate(publishedToClientAt!)}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          notified
            ? 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
            : 'border-[#1B6DFC] text-[#1B6DFC] hover:bg-blue-50'
        }`}
      >
        {loading ? 'Sending...' : notified ? 'Notify Again' : 'Notify Client'}
      </button>
      {error && (
        <span className="text-[11px] text-red-700">{error}</span>
      )}
    </div>
  )
}
