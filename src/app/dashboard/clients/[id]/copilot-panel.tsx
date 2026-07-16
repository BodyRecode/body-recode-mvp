'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { CopilotStarters } from '@/components/copilot-starters'
import { clientStarterCategories } from '@/lib/copilot-starter-questions'

type Msg = { id: string | null; role: 'user' | 'assistant'; content: string; flagged: boolean; followups?: string[] }

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

// What the co-pilot can help with — shown in the persistent "What I can help
// with" panel. Client-scoped variant.
const CAPABILITIES: { title: string; body: string }[] = [
  { title: 'Explain this client’s read', body: 'Why they landed in this state or phase, and what’s driving it.' },
  { title: 'Teach the doctrine', body: 'The rule behind the call, in plain terms.' },
  { title: 'Pressure-test your decision', body: '“Talk me out of progressing them.” “Should this be Restoration?”' },
  { title: 'Draft coach guidance', body: 'A short, paste-ready steer for the plan or nutrition generator.' },
]

export default function CopilotPanel({
  clientId,
  clientFirstName,
  initialMessages,
  onClose,
  className,
}: {
  clientId: string
  clientFirstName: string
  initialMessages: Msg[]
  /** When provided (bubble mode), a ✕ shows in the header. */
  onClose?: () => void
  /** Extra classes for the outer card (bubble mode makes it fill its popover). */
  className?: string
}) {
  const pathname = usePathname() ?? ''
  const [messages, setMessages] = useState<Msg[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showHelp, setShowHelp] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  async function send(text: string) {
    const q = text.trim()
    if (!q || loading) return
    setError('')
    setInput('')
    setMessages(prev => [...prev, { id: null, role: 'user', content: q, flagged: false }])
    setLoading(true)
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
      setMessages(prev => [...prev, {
        id: data.assistant?.id ?? null,
        role: 'assistant',
        content: data.assistant?.content ?? '',
        flagged: !!data.assistant?.flagged,
        followups: Array.isArray(data.assistant?.followups) ? data.assistant.followups : [],
      }])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function toggleFlag(idx: number) {
    const m = messages[idx]
    if (!m.id) return
    const next = !m.flagged
    setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, flagged: next } : x)))
    try {
      const res = await fetch(`/api/clients/${clientId}/copilot/flag`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: m.id, flagged: next }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // revert on failure
      setMessages(prev => prev.map((x, i) => (i === idx ? { ...x, flagged: !next } : x)))
    }
  }

  return (
    <div className={`border border-[#E5E5E5] bg-[#FFFFFF] rounded-2xl overflow-hidden flex flex-col ${className ?? ''}`}>
      <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E5E5E5] bg-[#FAFAF7] shrink-0">
        <p className="text-[10px] font-bold text-[#1B6DFC] uppercase tracking-widest" style={{ fontFamily: MONO, letterSpacing: '0.14em' }}>
          Co-Pilot · Doctrine tutor
        </p>
        <span className="ml-auto text-[10px] text-[#999999]" style={{ fontFamily: MONO }}>read-only · coach only</span>
        {onClose && (
          <button onClick={onClose} aria-label="Close co-pilot" className="text-[#999999] hover:text-[#1A1A1A] text-lg leading-none -my-1">✕</button>
        )}
      </div>

      {/* Persistent "What I can help with" bar — available any time. */}
      <button
        onClick={() => setShowHelp(s => !s)}
        aria-expanded={showHelp}
        className="flex items-center gap-2 px-5 py-2 border-b border-[#EDEDED] bg-white text-[#1B6DFC] hover:bg-[rgba(27,109,252,0.04)] transition-colors shrink-0"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="9" stroke="#1B6DFC" strokeWidth="1.6" />
          <path d="M9.5 9.2a2.5 2.5 0 1 1 3.2 2.4c-.7.25-1.2.9-1.2 1.65v.35" stroke="#1B6DFC" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="12" cy="16.4" r="1" fill="#1B6DFC" />
        </svg>
        <span className="text-[13px] font-semibold">What I can help with</span>
        <span className="ml-auto text-[#9AA3AF] text-xs">{showHelp ? '▲' : '▼'}</span>
      </button>

      <div ref={scrollRef} className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
        {showHelp && (
          <div className="text-sm text-[#3A3A3A]">
            <p className="mb-3 text-[#1A1A1A] font-semibold">Here for {clientFirstName}. What I can help with:</p>
            <div className="space-y-2.5 mb-3">
              {CAPABILITIES.map(c => (
                <div key={c.title} className="border border-[#EDEDED] rounded-xl px-3.5 py-2.5">
                  <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5">{c.title}</p>
                  <p className="text-[12.5px] text-[#6B6B6B] leading-relaxed">{c.body}</p>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-[#8A8A8E] leading-relaxed">I read {clientFirstName}’s file to answer. I never change a plan myself, and nothing I say reaches the client.</p>
          </div>
        )}
        {!showHelp && messages.length === 0 && (
          <div className="text-sm text-[#6B6B6B]">
            <p className="mb-3">Ask about {clientFirstName} and the doctrine behind their read. It explains and pressure-tests, grounded in their file. It doesn&apos;t change plans. Pick a category to see the questions worth asking here.</p>
            <CopilotStarters categories={clientStarterCategories(pathname, clientFirstName)} onPick={send} />
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
            <div className={m.role === 'user'
              ? 'max-w-[85%] bg-[#1B6DFC] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed'
              : 'max-w-[92%] bg-[#F5F3EE] text-[#1A1A1A] rounded-2xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed'}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.role === 'assistant' && m.id && (
                <button
                  onClick={() => toggleFlag(i)}
                  title={m.flagged ? 'Flagged for review — click to unflag' : 'Flag this answer for review'}
                  className={`mt-2 inline-flex items-center gap-1 text-[11px] ${m.flagged ? 'text-amber-700 font-semibold' : 'text-[#999999] hover:text-[#6B6B6B]'} transition-colors`}
                >
                  👎 {m.flagged ? 'Flagged for review' : 'Flag'}
                </button>
              )}
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

        {/* Suggested follow-ups under the latest answer — tap to continue or steer. */}
        {!loading && (() => {
          const last = messages[messages.length - 1]
          if (!last || last.role !== 'assistant' || !last.followups?.length) return null
          return (
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
          )
        })()}

        {error && (
          <div className="text-[13px] text-red-600">{error}</div>
        )}
      </div>

      <div className="border-t border-[#E5E5E5] p-3">
        <form
          onSubmit={e => { e.preventDefault(); send(input) }}
          className="flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
            placeholder={`Ask about ${clientFirstName}…`}
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
  )
}
