'use client'

import { useState } from 'react'
import { Loader2, Send, Check, Copy } from 'lucide-react'

// Coach-facing "Send Progress Check" control. Lives beside the Block-End /
// Progress Read panel. One click creates a Progress Check invitation for this
// client + block and emails the client the link. The client completes it at
// /progress-check/{token}; on submit the coach is notified and can generate the
// Progress Read (which re-scores body state from the answers). Coach-gated end
// to end - nothing publishes without the coach.
export default function ProgressCheckButton({
  clientId,
  programId,
  clientEmail,
}: {
  clientId: string
  programId: string | null
  clientEmail?: string | null
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [error, setError] = useState('')
  const [url, setUrl] = useState('')
  const [copied, setCopied] = useState(false)

  async function send() {
    if (status === 'sending') return
    if (!clientEmail) {
      setError('No email on file for this client. Add one, or copy the link once created.')
      setStatus('error')
      return
    }
    if (!confirm('Email this client a Progress Check now? It is a short (about five minute) re-assessment. When she submits it you will be notified, and you can generate her Progress Read.')) return
    setStatus('sending')
    setError('')
    try {
      const res = await fetch('/api/new-progress-check-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, programId, send: true }),
      })
      const data = await res.json().catch(() => ({}))
      if (data.url) setUrl(data.url)
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setStatus('sent')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
      setStatus('error')
    }
  }

  function copy() {
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="inline-flex flex-col items-start gap-1.5">
      <button
        onClick={send}
        disabled={status === 'sending' || status === 'sent'}
        className={`inline-flex items-center gap-2 text-[12px] font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 ${
          status === 'sent'
            ? 'border border-[#B5CFFC] bg-[rgba(27,109,252,0.10)] text-[#1B6DFC]'
            : 'border border-[#E8EAEE] bg-[#FFFFFF] text-[#43474F] hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] hover:text-[#1B6DFC]'
        }`}
        title="Email the client a short re-assessment so the Progress Read can re-score her body state."
      >
        {status === 'sending' ? <Loader2 size={13} className="animate-spin" /> : status === 'sent' ? <Check size={13} /> : <Send size={13} />}
        {status === 'sending' ? 'Sending...' : status === 'sent' ? 'Progress Check sent' : 'Send Progress Check'}
      </button>
      {status === 'error' && <p className="text-[11px] text-[#8A5A14] max-w-[240px]">{error}</p>}
      {url && (
        <button
          onClick={copy}
          className="inline-flex items-center gap-1 text-[10px] text-[#98A0AD] hover:text-[#1B6DFC] transition-colors"
        >
          <Copy size={10} /> {copied ? 'Link copied' : 'Copy link'}
        </button>
      )}
    </div>
  )
}
