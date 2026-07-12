'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Global Coach Co-Pilot bubble (2026-07-13). The SAME co-pilot as the
 * client-scoped one, mounted in the dashboard root layout so it appears on
 * EVERY page. When no specific client is loaded it talks about the method /
 * doctrine generally (POSTs /api/copilot). On a client's profile the richer
 * client-scoped bubble already renders (dashboard/clients/[id]/layout.tsx), so
 * this one hides itself there to avoid a double bubble.
 *
 * Stateless: conversation lives in local state for the session and is replayed
 * to the API each turn (no persistence yet). Same look/voice as CopilotPanel.
 */

type Msg = { role: 'user' | 'assistant'; content: string; followups?: string[] }

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

const STARTERS = [
  'Explain the cross-pillar authority order in plain terms.',
  'When must a client enter Restoration, and why?',
  'Walk me through the four readiness gates.',
  'Why is progression permissioned, never assumed?',
]

export default function GlobalCopilotBubble() {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // On a specific client's pages the client-scoped co-pilot already renders.
  // Hide the global one there so there's only ever one bubble on screen.
  const onClientProfile = /^\/dashboard\/clients\/[^/]+/.test(pathname)
  if (onClientProfile) return null

  async function send(text: string) {
    const q = text.trim()
    if (!q || loading) return
    setError('')
    setInput('')
    const priorHistory = messages.map(m => ({ role: m.role, content: m.content }))
    setMessages(prev => [...prev, { role: 'user', content: q }])
    setLoading(true)
    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history: priorHistory }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.assistant?.content ?? '',
        followups: Array.isArray(data.assistant?.followups) ? data.assistant.followups : [],
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const last = messages[messages.length - 1]

  return (
    <>
      {open && (
        <div
          className="fixed bottom-24 right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] shadow-2xl rounded-2xl print:hidden"
          role="dialog"
          aria-label="Coach Co-Pilot"
        >
          <div className="border border-[#E5E5E5] bg-[#FFFFFF] rounded-2xl overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E5E5] bg-[#FAFAF7] shrink-0">
              <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest" style={{ fontFamily: MONO, letterSpacing: '0.14em' }}>
                Co-Pilot · Doctrine tutor
              </p>
              <span className="ml-auto text-[10px] text-[#999999]" style={{ fontFamily: MONO }}>read-only · coach only</span>
              <button onClick={() => setOpen(false)} aria-label="Close co-pilot" className="text-[#999999] hover:text-[#1A1A1A] text-lg leading-none -my-1">✕</button>
            </div>

            <div ref={scrollRef} className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {messages.length === 0 && (
                <div className="text-sm text-[#6B6B6B]">
                  <p className="mb-3">Ask about the Body Recode method and doctrine. It explains and pressure-tests, in plain terms. For a read on a specific client, open their profile — the co-pilot there reads their file.</p>
                  <div className="flex flex-col gap-2">
                    {STARTERS.map(s => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-left text-[13px] text-[#1B6DFC] border border-[#B5CFFC] bg-[rgba(27,109,252,0.05)] hover:bg-[rgba(27,109,252,0.1)] rounded-lg px-3 py-2 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  <div className={m.role === 'user'
                    ? 'max-w-[85%] bg-[#1B6DFC] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed'
                    : 'max-w-[92%] bg-[#F5F3EE] text-[#1A1A1A] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed'}>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="bg-[#F5F3EE] rounded-2xl rounded-bl-sm px-4 py-3 inline-flex items-center gap-1.5 w-fit" aria-label="Co-pilot is typing">
                  <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
                </div>
              )}

              {!loading && last && last.role === 'assistant' && !!last.followups?.length && (
                <div className="flex flex-col gap-1.5 pt-1">
                  <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest" style={{ fontFamily: MONO }}>Follow up</p>
                  {last.followups.map((f, i) => (
                    <button
                      key={i}
                      onClick={() => send(f)}
                      className="text-left text-[13px] text-[#1B6DFC] border border-[#B5CFFC] bg-[rgba(27,109,252,0.05)] hover:bg-[rgba(27,109,252,0.1)] rounded-lg px-3 py-1.5 transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}

              {error && <div className="text-[13px] text-red-600">{error}</div>}
            </div>

            <div className="border-t border-[#E5E5E5] p-3">
              <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                  placeholder="Ask about the method…"
                  rows={2}
                  className="flex-1 resize-none text-sm border border-[#E5E5E5] rounded-xl px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="text-sm font-medium px-4 py-2 bg-[#1B6DFC] text-white rounded-xl hover:bg-[#1558d6] transition-colors disabled:opacity-40"
                >
                  Ask
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Co-Pilot' : 'Open Co-Pilot'}
        title="Co-Pilot · doctrine tutor"
        className="fixed bottom-5 right-5 z-50 h-14 w-14 rounded-full bg-[#1B6DFC] hover:bg-[#1558d6] text-white shadow-xl flex items-center justify-center transition-colors print:hidden"
      >
        {open ? (
          <span className="text-2xl leading-none">✕</span>
        ) : (
          // Same neutral "Aperture" glyph as the client-scoped bubble so it's
          // visibly one co-pilot. White-label-swappable.
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.6" opacity="0.55" />
            <circle cx="12" cy="12" r="1.9" fill="white" />
          </svg>
        )}
      </button>
    </>
  )
}
