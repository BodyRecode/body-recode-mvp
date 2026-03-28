'use client'

import { useState } from 'react'

export default function AdminButtons() {
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [blastStatus, setBlastStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number } | null>(null)

  const sendPreview = async () => {
    setPreviewStatus('sending')
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report-preview' }),
      })
      setPreviewStatus(res.ok ? 'sent' : 'error')
    } catch {
      setPreviewStatus('error')
    }
    setTimeout(() => setPreviewStatus('idle'), 4000)
  }

  const sendBlast = async () => {
    if (!confirm('This will send the performance report to ALL leads in the system. Are you sure?')) return
    setBlastStatus('sending')
    try {
      const res = await fetch('/api/admin/resend-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_ADMIN_SECRET }),
      })
      const data = await res.json()
      setBlastResult(data)
      setBlastStatus(res.ok ? 'done' : 'error')
    } catch {
      setBlastStatus('error')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={sendPreview}
        disabled={previewStatus !== 'idle'}
        className="text-sm font-semibold px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition-colors disabled:opacity-50"
      >
        {previewStatus === 'sending' ? 'Sending...' : previewStatus === 'sent' ? 'Sent to your inbox' : previewStatus === 'error' ? 'Failed' : 'Send preview email'}
      </button>
      <div className="flex items-center gap-3">
        {blastResult && (
          <span className="text-xs text-teal-400">{blastResult.sent} sent, {blastResult.failed} failed</span>
        )}
        <button
          onClick={sendBlast}
          disabled={blastStatus !== 'idle'}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-amber-700/50 text-amber-400 hover:border-amber-600 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {blastStatus === 'sending' ? 'Sending...' : blastStatus === 'done' ? 'Done' : blastStatus === 'error' ? 'Failed' : 'Resend reports to all leads'}
        </button>
      </div>
    </div>
  )
}
