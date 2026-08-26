'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, Sparkles, RotateCcw } from 'lucide-react'

export default function ReplyBox({
  clientId,
  clientFirstName,
  canDraft,
}: {
  clientId: string
  clientFirstName: string
  /** False when there is nothing from the client to answer yet. */
  canDraft: boolean
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [sent, setSent] = useState(false)
  // Set when the current text came from the model, so the coach can always see
  // he is about to send something he did not write, and can revert to empty.
  const [isDraft, setIsDraft] = useState(false)

  const draft = async () => {
    if (drafting) return
    setError(null)
    setNotice(null)
    setDrafting(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/draft-reply`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      if (data.needsCoach) {
        setNotice(`Needs you personally: ${data.needsCoach}`)
        return
      }
      setBody(data.draft ?? '')
      setIsDraft(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not draft')
    } finally {
      setDrafting(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    setError(null)
    setNotice(null)
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
      setIsDraft(false)
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
      {isDraft && (
        <div className="flex items-center justify-between gap-3 mb-2 rounded-lg bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] px-3 py-2">
          <p className="text-[11px] text-[#1B6DFC]">
            Drafted for you from {clientFirstName}&apos;s plan. Read it before sending.
          </p>
          <button
            type="button"
            onClick={() => { setBody(''); setIsDraft(false) }}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#666D7A] hover:text-[#141821] transition-colors shrink-0"
          >
            <RotateCcw size={11} />
            Discard
          </button>
        </div>
      )}

      <textarea
        value={body}
        onChange={e => { setBody(e.target.value); if (isDraft) setIsDraft(false) }}
        placeholder={`Reply to ${clientFirstName}...`}
        rows={4}
        className={`w-full bg-[#FFFFFF] border rounded-xl px-3 py-3 text-[14px] text-[#141821] placeholder:text-[#98A0AD] focus:outline-none focus:border-[#1B6DFC] leading-relaxed resize-y ${
          isDraft ? 'border-[rgba(27,109,252,0.4)]' : 'border-[#E8EAEE]'
        }`}
      />

      <div className="flex items-center justify-between gap-3 mt-3">
        <p className="text-[11px] text-[#98A0AD]">
          {sent ? 'Sent. They have been emailed a copy.' : `${body.length}/5000 · lands in their portal and their inbox`}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {canDraft && (
            <button
              type="button"
              onClick={draft}
              disabled={drafting || sending}
              className="inline-flex items-center gap-1.5 border border-[#E8EAEE] text-[#43474F] text-[13px] font-semibold px-3 py-2 rounded-lg hover:border-[#1B6DFC]/40 hover:text-[#1B6DFC] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {drafting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              {drafting ? 'Drafting...' : 'Draft a reply'}
            </button>
          )}
          <button
            type="submit"
            disabled={!body.trim() || sending}
            className="inline-flex items-center gap-2 bg-[#1B6DFC] text-[#FFFFFF] text-[13px] font-bold px-4 py-2 rounded-lg hover:bg-[#5390FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            {sending ? 'Sending...' : 'Send reply'}
          </button>
        </div>
      </div>

      {notice && (
        <div className="mt-3 bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14]">
          {notice}
        </div>
      )}
      {error && (
        <div className="mt-3 bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14]">
          {error}
        </div>
      )}
    </form>
  )
}
