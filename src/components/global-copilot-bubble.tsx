'use client'

import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { LAUNCHER_BUTTON, launcherStyle, LAUNCHER_PANEL_SHADOW } from '@/components/launcher-style'
import { usePathname } from 'next/navigation'
import { CopilotStarters } from '@/components/copilot-starters'
import { generalStarterCategories } from '@/lib/copilot-starter-questions'

/**
 * Global Coach Co-Pilot bubble (2026-07-13). The SAME co-pilot as the
 * client-scoped one, mounted in the dashboard root layout so it appears on
 * EVERY page. When no specific client is loaded it talks about the method /
 * doctrine generally (POSTs /api/copilot). On a client's profile the richer
 * client-scoped bubble already renders (dashboard/clients/[id]/layout.tsx), so
 * this one hides itself there to avoid a double bubble.
 *
 * Discoverability (2026-07-13): a first-time nudge points at the bubble, and a
 * persistent "What I can help with" bar inside the panel explains the
 * capability at any time (not just the empty state).
 *
 * Stateless: conversation lives in local state and is replayed to the API each
 * turn (nothing is persisted). Same look/voice as CopilotPanel.
 *
 * EVERY OPEN STARTS A FRESH CONVERSATION (2026-08-17). The bubble is mounted in
 * the dashboard layout, so it survives soft navigation — without this reset,
 * closing it and opening it again on another page dropped the coach back into the
 * previous conversation, which then got replayed to the model as context.
 */

type Msg = { role: 'user' | 'assistant'; content: string; followups?: string[] }

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

// What the co-pilot can help with — shown in the persistent "What I can help
// with" panel and as the empty-state intro.
const CAPABILITIES: { title: string; body: string }[] = [
  { title: 'Read your roster', body: 'Who needs attention today, who is drifting, who is due to progress — across all your clients.' },
  { title: 'Explain a read', body: 'Why a client landed in this state or phase, and what is driving it.' },
  { title: 'Teach the doctrine', body: 'The rule behind a decision, in plain terms a newer coach can follow.' },
  { title: 'Pressure-test your call', body: '"Talk me out of progressing them." "Should this be Restoration?"' },
  { title: 'Draft coach guidance', body: 'A short, paste-ready steer for the plan or nutrition generator.' },
]

// The one-tap "morning brief" (Phase 6). Routed through the normal general
// endpoint, which already carries the live roster snapshot.
const MORNING_BRIEF = 'Give me my morning brief. Go through my roster and tell me who needs my attention today, grouped by urgency (most urgent first), and for each name the reason (the doctrine call or the missing step) and the single next action. Then note anyone steady or due to progress. Keep it a tight briefing, not a list dump.'

export default function GlobalCopilotBubble({ brandName = 'Body Recode' }: { brandName?: string }) {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // First-time nudge: default hidden (so nothing flashes pre-hydration), then
  // reveal after mount only if the coach hasn't seen/dismissed it before.
  const [introSeen, setIntroSeen] = useState(true)
  // Phase 6 proactive: count of clients awaiting the coach (roster p<=20).
  const [awaiting, setAwaiting] = useState<number | null>(null)
  // Phase 8 coach memory: the coach's preferences editor.
  const [showPrefs, setShowPrefs] = useState(false)
  const [prefsText, setPrefsText] = useState('')
  const [prefsBusy, setPrefsBusy] = useState(false)
  const [prefsSaved, setPrefsSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  async function openPrefs() {
    setShowPrefs(true)
    setShowHelp(false)
    setPrefsBusy(true)
    try {
      const res = await fetch('/api/copilot/preferences')
      const data = await res.json()
      setPrefsText(typeof data.preferences === 'string' ? data.preferences : '')
    } catch { /* leave whatever's there */ }
    finally { setPrefsBusy(false) }
  }

  async function savePrefs() {
    setPrefsBusy(true); setPrefsSaved(false)
    try {
      const res = await fetch('/api/copilot/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences: prefsText }),
      })
      if (!res.ok) throw new Error()
      setPrefsSaved(true)
      setTimeout(() => setPrefsSaved(false), 2500)
    } catch { setError('Could not save preferences') }
    finally { setPrefsBusy(false) }
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  // Fetch the attention count once on mount (the layout keeps this bubble
  // mounted across soft navigations, so this runs once per full page load).
  useEffect(() => {
    let cancelled = false
    fetch('/api/copilot/roster-summary')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (!cancelled && d && typeof d.awaiting === 'number') setAwaiting(d.awaiting) })
      .catch(() => { /* non-blocking — no badge on failure */ })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    try { setIntroSeen(localStorage.getItem('br_copilot_intro_seen') === '1') } catch { setIntroSeen(true) }
  }, [])

  function dismissIntro() {
    setIntroSeen(true)
    try { localStorage.setItem('br_copilot_intro_seen', '1') } catch { /* private mode — just hide for the session */ }
  }

  function openPanel() {
    // Fresh conversation every open — clear the last one rather than resuming it.
    setMessages([])
    setInput('')
    setError('')
    setOpen(true)
    dismissIntro()
    setShowHelp(true)
  }

  // On a specific client's pages the client-scoped co-pilot already renders.
  // Hide the global one there so there's only ever one bubble on screen.
  const onClientProfile = /^\/dashboard\/clients\/[^/]+/.test(pathname)
  if (onClientProfile) return null

  async function send(text: string) {
    const q = text.trim()
    if (!q || loading) return
    setError('')
    setInput('')
    setShowHelp(false)
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
      {/* First-time nudge — points at the bubble on first sight, once ever. */}
      {!open && !introSeen && (
        <div className="fixed bottom-24 right-5 z-50 w-[264px] max-w-[calc(100vw-2.5rem)] bg-[#141821] text-white rounded-xl shadow-2xl p-4 print:hidden">
          <p className="text-[10px] font-medium text-[#8FB6FF] mb-1" style={{ fontFamily: MONO }}>New · Co-Pilot</p>
          <p className="text-[13px] leading-relaxed text-[#E8EAEE] mb-3">Ask me anything about the {brandName} method — I&apos;m on every page. Explain a read, teach the doctrine, or pressure-test a call.</p>
          <div className="flex items-center gap-2">
            <button onClick={openPanel} className="text-[13px] font-semibold bg-[#1B6DFC] hover:bg-[#1558d6] text-white rounded-lg px-3 py-1.5 transition-colors">See what I can do</button>
            <button onClick={dismissIntro} className="text-[13px] text-[#B5B5B5] hover:text-white px-2 py-1.5">Dismiss</button>
          </div>
          <div className="absolute -bottom-1.5 right-9 w-3 h-3 bg-[#141821] rotate-45" />
        </div>
      )}

      {open && (
        <div
          className="fixed bottom-[76px] right-5 z-50 w-[380px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-xl print:hidden"
          style={{ boxShadow: LAUNCHER_PANEL_SHADOW }}
          role="dialog"
          aria-label="Coach Co-Pilot"
        >
          <div className="border border-[#E8EAEE] bg-[#FFFFFF] rounded-xl overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE] bg-[linear-gradient(180deg,#FFFFFF,#FBFCFD)] shrink-0">
              <p className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Co-Pilot</p>
              <span className="ml-auto text-[11.5px] text-[#98A0AD]">Doctrine tutor · read-only</span>
              <button onClick={() => setOpen(false)} aria-label="Close co-pilot" className="text-[#98A0AD] hover:text-[#141821] -my-1">
                <X size={16} />
              </button>
            </div>

            {/* Persistent "What I can help with" bar — available any time, not
                just on the empty state. Toggles the capability explainer. */}
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
              <span className="ml-auto text-[#9AA3AF] text-[12.5px]">{showHelp ? '▲' : '▼'}</span>
            </button>

            <div ref={scrollRef} className="px-5 py-4 space-y-4 flex-1 min-h-0 overflow-y-auto">
              {showPrefs ? (
                <div className="text-sm text-[#43474F]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[13px] font-semibold text-[#141821]">Your coaching preferences</p>
                    <button onClick={() => setShowPrefs(false)} className="text-[12px] text-[#1B6DFC] hover:underline">Back</button>
                  </div>
                  <p className="text-[12.5px] text-[#666D7A] leading-relaxed mb-2.5">Tell me how you like to coach and I&apos;ll keep it in mind everywhere (e.g. &quot;favour 4-day splits when the gates allow&quot;, &quot;keep first blocks to 3 sets&quot;, &quot;prefer dairy-free swaps&quot;). This is soft guidance only — it never overrides a client&apos;s readiness gates, phase, or safety.</p>
                  <textarea
                    value={prefsText}
                    onChange={e => setPrefsText(e.target.value)}
                    disabled={prefsBusy}
                    rows={7}
                    placeholder="e.g. Favour fewer, higher-quality movements. Default to 3-day weeks unless the client has more capacity…"
                    className="w-full resize-none text-[13px] border border-[#E8EAEE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#1B6DFC] disabled:opacity-60"
                  />
                  <div className="flex items-center gap-2 mt-2.5">
                    <button
                      onClick={savePrefs}
                      disabled={prefsBusy}
                      className="text-[13px] font-semibold px-3.5 py-1.5 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1558d6] transition-colors disabled:opacity-40"
                    >
                      {prefsBusy ? 'Saving…' : 'Save'}
                    </button>
                    {prefsSaved && <span className="text-[12.5px] text-[#22A054] font-medium">Saved</span>}
                  </div>
                </div>
              ) : showHelp ? (
                <div className="text-sm text-[#43474F]">
                  <p className="mb-3 text-[#141821] font-semibold">I&apos;m on every page. Here&apos;s what I can help with:</p>
                  <div className="space-y-2.5 mb-4">
                    {CAPABILITIES.map(c => (
                      <div key={c.title} className="border border-[#EDEDED] rounded-xl px-3.5 py-2.5">
                        <p className="text-[13px] font-bold text-[#141821] mb-0.5">{c.title}</p>
                        <p className="text-[12.5px] text-[#666D7A] leading-relaxed">{c.body}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-[12.5px] text-[#8A8A8E] mb-3 leading-relaxed">I never change a plan myself, and nothing I say reaches your client. For a grounded read on a specific person, open their profile — the co-pilot there reads their file.</p>
                  <button onClick={openPrefs} className="w-full text-left text-[12.5px] text-[#1B6DFC] border border-[#B5CFFC] bg-[rgba(27,109,252,0.04)] hover:bg-[rgba(27,109,252,0.08)] rounded-xl px-3.5 py-2.5 mb-3 transition-colors">
                    ⚙ Set your coaching preferences — I&apos;ll remember how you like to work
                  </button>
                  <p className="mb-1.5 text-[11px] font-medium text-[#98A0AD]" style={{ fontFamily: MONO }}>Try asking</p>
                  <CopilotStarters categories={generalStarterCategories(pathname)} onPick={send} />
                </div>
              ) : (
                <>
                  {messages.length === 0 && (
                    <div className="text-sm text-[#666D7A]">
                      <p className="mb-3">Ask me anything about the {brandName} method. Tap <span className="font-semibold text-[#1B6DFC]">What I can help with</span> above, or pick a category:</p>
                      <CopilotStarters categories={generalStarterCategories(pathname)} onPick={send} />
                    </div>
                  )}

                  {messages.map((m, i) => (
                    <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                      <div className={m.role === 'user'
                        ? 'max-w-[85%] bg-[#1B6DFC] text-white rounded-xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed'
                        : 'max-w-[92%] bg-[#F5F3EE] text-[#141821] rounded-xl rounded-bl-sm px-4 py-3 text-sm leading-relaxed'}>
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  ))}

                  {loading && (
                    <div className="bg-[#F5F3EE] rounded-xl rounded-bl-sm px-4 py-3 inline-flex items-center gap-1.5 w-fit" aria-label="Co-pilot is typing">
                      <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-[#9AA3AF] animate-bounce motion-reduce:animate-none" style={{ animationDelay: '300ms' }} />
                    </div>
                  )}

                  {!loading && last && last.role === 'assistant' && !!last.followups?.length && (
                    <div className="flex flex-col gap-1.5 pt-1">
                      <p className="text-[10px] font-medium text-[#98A0AD]" style={{ fontFamily: MONO }}>Follow up</p>
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
                </>
              )}
            </div>

            {/* One-tap morning brief (Phase 6) — narrates the roster on demand. */}
            <div className="px-3 pt-2 shrink-0">
              <button
                onClick={() => send(MORNING_BRIEF)}
                disabled={loading}
                className="w-full text-[13px] font-medium px-3 py-2 border border-[#B5CFFC] text-[#1B6DFC] rounded-xl hover:bg-[rgba(27,109,252,0.05)] transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                <span aria-hidden>☀</span>
                Morning brief
                {!!awaiting && awaiting > 0 && (
                  <span className="text-[11px] font-medium text-white bg-[#E4572E] rounded-full px-1.5 py-0.5 leading-none" style={{ fontFamily: MONO }}>
                    {awaiting} awaiting
                  </span>
                )}
              </button>
            </div>

            <div className="border-t border-[#E8EAEE] p-3 mt-2">
              <form onSubmit={e => { e.preventDefault(); send(input) }} className="flex items-end gap-2">
                <textarea
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                  placeholder="Ask about the method…"
                  rows={2}
                  className="flex-1 resize-none text-sm border border-[#E8EAEE] rounded-xl px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
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
        onClick={() => (open ? setOpen(false) : openPanel())}
        aria-label={open ? 'Close Co-Pilot' : 'Open Co-Pilot'}
        title="Co-Pilot - doctrine tutor"
        className={`${LAUNCHER_BUTTON} bottom-5 right-5`}
        style={launcherStyle(open)}
      >
        {open ? (
          <X size={20} />
        ) : (
          // Same neutral "Aperture" glyph as the client-scoped bubble so it's
          // visibly one co-pilot. White-label-swappable.
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="white" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.6" opacity="0.55" />
            <circle cx="12" cy="12" r="1.9" fill="white" />
          </svg>
        )}
        {/* Attention badge — clients awaiting the coach (Phase 6). */}
        {!open && !!awaiting && awaiting > 0 && (
          <span
            aria-label={`${awaiting} clients awaiting you`}
            className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full text-white text-[11px] font-semibold flex items-center justify-center border-2 border-white"
            style={{
              background: 'linear-gradient(180deg,#EF4444,#DC2626)',
              boxShadow: '0 1px 2px rgba(220,38,38,0.35)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {awaiting > 9 ? '9+' : awaiting}
          </span>
        )}
      </button>
    </>
  )
}
