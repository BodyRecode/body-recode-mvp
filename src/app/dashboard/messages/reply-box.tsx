'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send } from 'lucide-react'

export default function ReplyBox({
  clientId,
  clientFirstName,
}: {
  clientId: string
  clientFirstName: string
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/reply-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setBody('')
      setSent(true)
      setTimeout(() => setSent(false), 4000)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder={`Reply to ${clientFirstName}...`}
        rows={4}
        className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#1B6DFC] leading-relaxed resize-y"
      />
      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-[#999999]">
          {sent ? 'Sent. They have been emailed a copy.' : `${body.length}/5000 · lands in their portal and their inbox`}
        </p>
        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="inline-flex items-center gap-2 bg-[#1B6DFC] text-[#FFFFFF] text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
          {sending ? 'Sending...' : 'Send reply'}
        </button>
      </div>
      {error && (
        <div className="mt-3 bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14]">
          {error}
        </div>
      )}
    </form>
  )
}
