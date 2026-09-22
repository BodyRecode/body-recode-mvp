'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Publish and Notify, as two separate clicks like every other read. Publishing
 * shows her sections in her portal and sends nothing; Notify emails her.
 */
export default function ProgressReadActions({ readId, status, emailSentAt }: { readId: string; status: 'draft' | 'published'; emailSentAt: string | null }) {
  const router = useRouter()
  const [busy, setBusy] = useState<'publish' | 'unpublish' | 'notify' | null>(null)
  const [error, setError] = useState('')
  const [findings, setFindings] = useState<Array<{ message: string; excerpt?: string }>>([])

  async function call(path: string, body: Record<string, string>, which: typeof busy) {
    setBusy(which); setError(''); setFindings([])
    try {
      const res = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) { setError(data.error || 'Something went wrong'); setFindings(data.findings ?? []); return }
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {status === 'draft' ? (
          <button onClick={() => call('/api/progress-read/publish', { progress_read_id: readId, action: 'publish' }, 'publish')} disabled={!!busy} className="br-btn disabled:opacity-50">
            {busy === 'publish' ? 'Publishing…' : 'Publish to her portal'}
          </button>
        ) : (
          <>
            <button onClick={() => call('/api/progress-read/notify', { progress_read_id: readId }, 'notify')} disabled={!!busy} className="br-btn disabled:opacity-50">
              {busy === 'notify' ? 'Sending…' : emailSentAt ? 'Notify again' : 'Notify her'}
            </button>
            <button onClick={() => call('/api/progress-read/publish', { progress_read_id: readId, action: 'unpublish' }, 'unpublish')} disabled={!!busy} className="text-[12.5px] font-medium text-[#8A9099] hover:text-[#FAFAF8] px-2 disabled:opacity-50">
              {busy === 'unpublish' ? 'Unpublishing…' : 'Unpublish'}
            </button>
          </>
        )}
      </div>
      {emailSentAt && status === 'published' && <p className="text-[12.5px] text-[#676D76]">Emailed {new Date(emailSentAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</p>}
      {error && <p className="text-[12.5px] text-[#D4817E] text-right max-w-[360px]">{error}</p>}
      {findings.map((f, i) => <p key={i} className="text-[12.5px] text-[#D4817E] text-right max-w-[360px]">{f.message}{f.excerpt ? ` "${f.excerpt}"` : ''}</p>)}
    </div>
  )
}
