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
        title="Publish the Program Read first. The read frames the block."
        className="text-[12.5px] px-3 py-1.5 border border-[#E4E4E0] text-[#9CA2AB] rounded-lg cursor-not-allowed"
      >
        Notify Client
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {notified && (
        <span className="text-[11px] text-[#6E747D]">
          Notified {formatDate(publishedToClientAt!)}
        </span>
      )}
      <button
        onClick={handleClick}
        disabled={loading}
        className={`text-xs px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50 ${
          notified
            ? 'border-[#E4E4E0] text-[#6E747D] hover:border-[#DCDCD7] hover:text-[#0F1115]'
            : 'border-[#0F1115] text-[#0F1115] hover:bg-[rgba(27,109,252,0.06)]'
        }`}
      >
        {loading ? 'Sending...' : notified ? 'Notify Again' : 'Notify Client'}
      </button>
      {error && (
        <span className="text-[11px] text-[#8F2D2D]">{error}</span>
      )}
    </div>
  )
}
