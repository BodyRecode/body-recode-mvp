'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Send, X } from 'lucide-react'
import { anchorChipLabel, type AnchorKind } from '@/lib/message-anchors'

export interface ThreadMessage {
  id: string
  body: string
  sender: 'client' | 'coach'
  created_at: string
  anchor_kind: AnchorKind | null
  anchor_label: string | null
}

export interface PendingAnchor {
  kind: AnchorKind
  label: string | null
}

function when(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  if (mins < 60 * 24 * 7) return `${Math.round(mins / (60 * 24))}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function MessageThread({
  clientId,
  clientName,
  coachFirstName,
  portalToken,
  initialMessages,
  pendingAnchor,
}: {
  clientId: string
  clientName: string
  coachFirstName: string
  portalToken: string
  initialMessages: ThreadMessage[]
  pendingAnchor: PendingAnchor | null
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Kept in state so the client can drop the anchor and ask something general
  // without navigating away and losing what they have already typed.
  const [anchor, setAnchor] = useState<PendingAnchor | null>(pendingAnchor)
  const marked = useRef(false)

  // Clear the unread badge once the thread is actually on screen. Done here
  // rather than in the server render so a route prefetch doesn't mark messages
  // read that the client never opened.
  useEffect(() => {
    if (marked.current) return
    if (!initialMessages.some(m => m.sender === 'coach')) return
    marked.current = true
    fetch('/api/portal/mark-messages-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId }),
    }).catch(() => {
      // Badge accuracy is not worth surfacing an error over.
    })
  }, [clientId, initialMessages])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim() || sending) return
    setError(null)
    setSending(true)
    try {
      const res = await fetch('/api/portal/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          body,
          portalToken,
          anchorKind: anchor?.kind ?? null,
          anchorLabel: anchor?.label ?? null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `Server returned ${res.status}`)
      setBody('')
      setAnchor(null)
      // Drop ?about= so a refresh doesn't silently re-anchor the next message.
      router.replace(`/portal/${portalToken}/message`)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send')
    } finally {
      setSending(false)
    }
  }

  const firstName = clientName?.split(' ')[0] ?? 'You'

  return (
    <div>
      <form onSubmit={submit} className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF] p-5">
        {anchor && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] text-[#999999]">Asking about</span>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#1B6DFC] bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] rounded-full pl-2.5 pr-1.5 py-1">
              {anchorChipLabel(anchor.kind, anchor.label)}
              <button
                type="button"
                onClick={() => setAnchor(null)}
                aria-label="Remove this topic"
                className="text-[#1B6DFC] hover:text-[#1A1A1A] transition-colors"
              >
                <X size={11} />
              </button>
            </span>
          </div>
        )}
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={
            initialMessages.length === 0
              ? `Ask ${coachFirstName} anything about your plan...`
              : 'Write a reply...'
          }
          rows={5}
          className="w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl px-3 py-3 text-[14px] text-[#1A1A1A] placeholder:text-[#999999] focus:outline-none focus:border-[#1B6DFC] leading-relaxed resize-y"
        />
        <p className="text-[11px] text-[#999999] mt-2">{body.length}/5000 characters</p>

        {error && (
          <div className="mt-3 bg-[#FEF6E7] border border-[#F0DCB4] rounded-lg px-3 py-2 text-[12px] text-[#8A5A14]">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!body.trim() || sending}
          className="mt-4 w-full inline-flex items-center justify-center gap-2 bg-[#1B6DFC] text-[#FFFFFF] text-[14px] font-bold py-3 rounded-xl hover:bg-[#5390FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {sending ? 'Sending...' : 'Send message'}
        </button>
      </form>

      {initialMessages.length > 0 && (
        <div className="space-y-3 mt-8">
          {initialMessages.map((m, i) => (
            <div
              key={m.id}
              className={
                m.sender === 'coach'
                  ? 'rounded-2xl bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] px-4 py-3 mr-6'
                  : 'rounded-2xl bg-[#F7F7F7] border border-[#E5E5E5] px-4 py-3 ml-6'
              }
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                  {m.sender === 'coach' ? coachFirstName : firstName}
                </p>
                <p className="text-[10px] text-[#999999]">{when(m.created_at)}</p>
              </div>
              {m.anchor_kind && (
                <p className="inline-block text-[10px] font-medium text-[#1B6DFC] bg-[#FFFFFF] border border-[rgba(27,109,252,0.25)] rounded-full px-2 py-0.5 mb-2">
                  {anchorChipLabel(m.anchor_kind, m.anchor_label)}
                </p>
              )}
              <p className="text-[14px] text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{m.body}</p>
              {/* Delivery confirmation on the client's newest message, shown
                  only while it is the last thing in the thread. The anxiety it
                  answers is "did that even send", not "has he read it" — a read
                  receipt would turn every normal gap before a reply into being
                  ignored. Once the coach answers, the reply is its own proof. */}
              {i === 0 && m.sender === 'client' && (
                <p className="text-[11px] text-[#6B6B6B] mt-2 pt-2 border-t border-[#E5E5E5]">
                  Sent. {coachFirstName} has been notified and will reply here.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
