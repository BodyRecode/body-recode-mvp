'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Check, StickyNote, X } from 'lucide-react'
import type { CallStage, BriefSummary, ScopeFlag } from '@/lib/pre-call-brief'

/**
 * Zoom call companion.
 *
 * Rebuilt 2026-08-12. The previous version was ~1,700 lines of tabs, modes,
 * accordions, an objection library, a language library and a full how-it-works
 * explainer. Kade: "I never used much of this."
 *
 * This is the same shape as the public /how-it-works page, because that flow
 * reads well: a numbered spine, one stage at a time, generous whitespace, no
 * chrome competing with the content. Every stage is generated from the same
 * source as the written brief, so the screen during the call cannot drift from
 * the one read before it.
 */
export default function ZoomCompanion({
  leadId,
  leadName,
  stages,
  summary,
  scopeFlags,
  initialNotes,
  initialStatus,
}: {
  leadId: string
  leadName: string
  stages: CallStage[]
  summary: BriefSummary | null
  scopeFlags: ScopeFlag[]
  initialNotes: string
  initialStatus: string
}) {
  const [notes, setNotes] = useState(initialNotes)
  const [notesOpen, setNotesOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [outcome, setOutcome] = useState<'A' | 'B' | 'C' | null>(null)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState(stages[0]?.key ?? '')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  // Scroll spy so the chip row tracks where you are without you managing it.
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible?.target instanceof HTMLElement && visible.target.dataset.key) setActive(visible.target.dataset.key)
      },
      { rootMargin: '-120px 0px -55% 0px' },
    )
    Object.values(refs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [stages])

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`

  async function saveNotes() {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 1600)
  }

  async function markOutcome(path: 'A' | 'B' | 'C') {
    setBusy(true)
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: path === 'A' ? 'closed_declined' : 'zoom_completed',
        zoom2_outcome: path === 'A' ? 'not_proceeding' : path === 'B' ? 'needs_time' : 'proceeding',
        notes,
      }),
    })
    if (path === 'A') await fetch(`/api/leads/${leadId}/send-zoom1-declined`, { method: 'POST' })
    setOutcome(path)
    setBusy(false)
  }

  function go(key: string) {
    refs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* Sticky header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase">Zoom 1</p>
              <h1 className="text-lg font-extrabold tracking-tight truncate">{leadName}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {summary && (
                <span className="hidden sm:inline text-[12px] font-semibold text-[#4A4A4A]">
                  {summary.stateLabel}{summary.profileLabel ? ` · ${summary.profileLabel}` : ''}
                  {summary.provisional && <span className="text-[#B7791F]"> (provisional)</span>}
                </span>
              )}
              <span className="font-mono text-[13px] tabular-nums text-[#6B6B6B] px-2 py-1 rounded-md bg-[#F4F4F4]">{mmss}</span>
              <button
                onClick={() => setNotesOpen(o => !o)}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E5E5] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors"
              >
                <StickyNote size={13} /> Notes
              </button>
            </div>
          </div>

          {/* Step map */}
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 mt-3">
            {stages.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#C9C9C9] text-xs" aria-hidden>→</span>}
                <button
                  onClick={() => go(s.key)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                    active === s.key ? 'border-[#1B6DFC] bg-blue-50' : 'border-[#E5E5E5] bg-white hover:border-[#B5CFFC]'
                  }`}
                >
                  <span className={`font-mono text-[10px] font-bold ${active === s.key ? 'text-[#1B6DFC]' : 'text-[#999999]'}`}>{s.n}</span>
                  <span className={`text-[12px] font-semibold ${active === s.key ? 'text-[#1B6DFC]' : 'text-[#6B6B6B]'}`}>
                    {s.title.split(' ').slice(0, 2).join(' ')}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scope flags — before anything else, same as the brief */}
      {scopeFlags.length > 0 && (
        <div className="max-w-4xl mx-auto px-5 pt-6">
          <div className="rounded-2xl bg-amber-50 border border-amber-300 p-5">
            <p className="text-[11px] font-bold text-amber-900 uppercase tracking-[0.16em] mb-3 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Outside scope · ask, note, do not interpret
            </p>
            <div className="space-y-2">
              {scopeFlags.map(f => (
                <p key={f.flag} className="text-[14px] text-amber-900 leading-snug">
                  <span className="font-bold">{f.flag}</span> — <span className="text-amber-800">{f.route}</span>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* The spine */}
      <div className="max-w-4xl mx-auto px-5 py-12">
        <div className="relative">
          <div
            aria-hidden
            className="absolute top-2 bottom-2 left-[27px] w-px hidden md:block"
            style={{ background: 'linear-gradient(to bottom, rgba(27,109,252,0.35) 0%, rgba(27,109,252,0.15) 55%, rgba(27,109,252,0) 100%)' }}
          />
          {stages.map(stage => (
            <div
              key={stage.key}
              data-key={stage.key}
              ref={el => { refs.current[stage.key] = el }}
              className="relative flex items-start gap-6 md:gap-8 pb-16 md:pb-20 scroll-mt-40"
            >
              <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-[#1B6DFC]/40 flex items-center justify-center text-[#1B6DFC] font-extrabold text-lg shadow-[0_4px_16px_rgba(27,109,252,0.12)]">
                {stage.n}
              </div>
              <div className="flex-1 min-w-0 pt-1.5">
                <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-2">{stage.eyebrow}</p>
                <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-6">{stage.title}</h2>
                <div className="space-y-4 max-w-2xl">
                  {stage.blocks.map((b, i) => {
                    if (b.kind === 'say') return (
                      <div key={i} className="rounded-xl bg-blue-50 border-l-[3px] border-[#1B6DFC] px-5 py-4">
                        <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.14em] mb-1.5">Say</p>
                        <p className="text-[16px] leading-relaxed text-[#1A1A1A]">&ldquo;{b.text}&rdquo;</p>
                      </div>
                    )
                    if (b.kind === 'ask') return (
                      <p key={i} className="text-[16px] leading-relaxed text-[#1A1A1A] pl-4 border-l-2 border-[#E5E5E5]">
                        <span className="text-[#1B6DFC] font-bold">Ask · </span>&ldquo;{b.text}&rdquo;
                      </p>
                    )
                    if (b.kind === 'warn') return (
                      <div key={i} className="rounded-xl bg-amber-50 border border-amber-300 px-5 py-3.5">
                        <p className="text-[14px] leading-relaxed text-amber-900">{b.text}</p>
                      </div>
                    )
                    if (b.kind === 'bullets') return (
                      <ul key={i} className="space-y-2">
                        {b.items.map((it, j) => (
                          <li key={j} className="flex gap-3 text-[15px] leading-relaxed text-[#3A3A3A]">
                            <span className="text-[#1B6DFC] mt-0.5">·</span><span>{it}</span>
                          </li>
                        ))}
                      </ul>
                    )
                    if (b.kind === 'verbatim') return (
                      <pre key={i} className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl p-5">
                        {b.text}
                      </pre>
                    )
                    return (
                      <p key={i} className="text-[15px] leading-relaxed text-[#6B6B6B]">{b.text}</p>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}

          {/* Outcome */}
          <div className="relative flex items-start gap-6 md:gap-8">
            <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-[#1B6DFC] flex items-center justify-center text-white font-extrabold text-lg">
              <Check size={22} />
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-2">Outcome</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">How did it land?</h2>
              {summary && <p className="text-[15px] text-[#6B6B6B] mb-6 max-w-2xl">Expected: {summary.pathLine}</p>}
              {outcome ? (
                <p className="text-[15px] font-semibold text-[#1B6DFC]">
                  Recorded as Path {outcome}. {outcome === 'A' ? 'Declined follow-up sequence sent.' : 'Status set to Zoom completed.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {([
                    ['C', 'Yes, proceeding', 'bg-[#1B6DFC] text-white border-[#1B6DFC]'],
                    ['B', 'Needs time', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-[#1B6DFC]'],
                    ['A', 'Out', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-red-400'],
                  ] as const).map(([p, label, cls]) => (
                    <button
                      key={p}
                      disabled={busy}
                      onClick={() => markOutcome(p)}
                      className={`text-[14px] font-bold px-5 py-2.5 rounded-xl border transition-colors disabled:opacity-50 ${cls}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[12px] text-[#999999] mt-4">
                Path B is not a fail. Choosing Out also sends the declined follow-up sequence.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Notes drawer */}
      {notesOpen && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white border-l border-[#E5E5E5] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E5]">
            <p className="text-[13px] font-bold">Call notes</p>
            <button onClick={() => setNotesOpen(false)} className="text-[#999999] hover:text-[#1A1A1A]"><X size={16} /></button>
          </div>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Their words. Capture verbatim, you will use them back in the offer."
            className="flex-1 p-5 text-[14px] leading-relaxed resize-none focus:outline-none"
          />
          <div className="px-5 py-3.5 border-t border-[#E5E5E5] flex items-center justify-between">
            <span className="text-[12px] text-[#999999]">{saved ? 'Saved' : `Status: ${initialStatus.replace(/_/g, ' ')}`}</span>
            <button onClick={saveNotes} className="text-[13px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors">
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
