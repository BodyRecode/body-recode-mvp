'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'

export default function MessageForm({ clientId, clientName, portalToken }: { clientId: string; clientName: string; portalToken: string }) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/portal/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId, body, portalToken }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setSent(true)
      setBody('')
      startTransition(() => router.refresh())
      setTimeout(() => setSent(false), 4000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-[#1c1917] bg-[#111110] p-5">
      <p className="text-[12px] text-[#57534e] mb-3">From {clientName}</p>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your message..."
        rows={6}
        className="w-full bg-[#0c0a09] border border-[#1c1917] rounded-xl px-3 py-3 text-[14px] text-[#e7e5e4] placeholder:text-[#3c3835] focus:outline-none focus:border-[#292524] leading-relaxed resize-y"
      />
      <p className="text-[11px] text-[#3c3835] mt-2">{body.length}/5000 characters</p>

      {error && (
        <div className="mt-3 bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14]">
          {error}
        </div>
      )}

      {sent && (
        <div className="mt-3 bg-[rgba(27,109,252,0.08)] border border-[#0d2d29] rounded-lg px-3 py-2 text-[12px] text-[#14b8a6]">
          Your message has been sent. Your coach will reply by email.
        </div>
      )}

      <button
        type="submit"
        disabled={!body.trim() || sending}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#14b8a6] text-[#0c0a09] text-[14px] font-bold py-3 rounded-xl hover:bg-[#5eead4] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        {sending ? 'Sending...' : 'Send message'}
      </button>
    </form>
  )
}
