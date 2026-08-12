'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Check, StickyNote, X, MessageSquareWarning } from 'lucide-react'
import type { BriefSummary, ScopeFlag } from '@/lib/pre-call-brief'
import {
  BODY_STATE_LANGUAGE,
  HOW_IT_WORKS_STAGES,
  WHATS_INCLUDED,
  PACKAGES,
  COMMENCEMENT_FEE,
  FOUNDING_OFFER,
  OBJECTION_HANDLING,
  ONLINE_SCRIPT,
} from '@/lib/companion-content'
import PrepAnswers from '@/components/prep-answers'

type TrainingStatus = 'active' | 'returning' | 'new' | null

/**
 * Zoom call companion.
 *
 * Rebuilt 2026-08-12. Shape borrowed from performance.bodyrecode.au/how-it-works:
 * a numbered vertical spine, one stage at a time, generous whitespace. The
 * CONTENT is Kade's, extracted verbatim into `src/lib/companion-content.ts`.
 * A first pass at this rebuild replaced his scripts with generated copy, which
 * was wrong twice over: it was not his language, and it collapsed the five-stage
 * coaching explanation into four bullets. Edit the content module, not this file.
 */
export default function ZoomCompanion({
  leadId,
  leadName,
  bodyState,
  totalScore,
  summary,
  scopeFlags,
  prepNotes,
  initialNotes,
}: {
  leadId: string
  leadName: string
  bodyState: string
  totalScore: number | null
  summary: BriefSummary | null
  scopeFlags: ScopeFlag[]
  prepNotes: string | null
  initialNotes: string
}) {
  const firstName = leadName.split(' ')[0]
  const state = BODY_STATE_LANGUAGE[bodyState] ?? BODY_STATE_LANGUAGE['Transitioning State']

  const [training, setTraining] = useState<TrainingStatus>(null)
  const [notes, setNotes] = useState(initialNotes)
  const [drawer, setDrawer] = useState<'notes' | 'objection' | null>(null)
  const [saved, setSaved] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [outcome, setOutcome] = useState<'A' | 'B' | 'C' | null>(null)
  const [busy, setBusy] = useState(false)
  const [active, setActive] = useState('recap')
  const refs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        const vis = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (vis?.target instanceof HTMLElement && vis.target.dataset.key) setActive(vis.target.dataset.key)
      },
      { rootMargin: '-140px 0px -55% 0px' },
    )
    Object.values(refs.current).forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  const stage4Preface = training === 'returning'
    ? 'Coming back into it, this gives us a clear starting point.\n\n'
    : training === 'new'
      ? 'This is the starting point — important context for how we ease you in.\n\n'
      : ''

  const stage2Tail = training === 'returning'
    ? `That's where you're at right now, before we put any load back in.\n\nWhat was your reaction when you saw it?`
    : training === 'new'
      ? `That's your starting point — where we work from before adding any training in.\n\nWhat was your reaction when you saw it?`
      : 'What was your reaction when you saw the result?'

  const recapScript = `OK ${firstName}, before we go any further I want to recap where we're at.

Your scorecard came back as ${bodyState}${scoreDisplay}.

${stage4Preface}${state.interpretation}

${stage2Tail}`

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

  const NAV = [
    { key: 'recap', n: '01', label: 'Recap' },
    { key: 'conversation', n: '02', label: 'Conversation' },
    { key: 'system', n: '03', label: 'How it works' },
    { key: 'offer', n: '04', label: 'Offer' },
    { key: 'outcome', n: '05', label: 'Outcome' },
  ]

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5E5E5]">
        <div className="max-w-4xl mx-auto px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase">Zoom 1</p>
              <h1 className="text-lg font-extrabold tracking-tight truncate">{leadName}</h1>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {summary && (
                <span className="hidden md:inline text-[12px] font-semibold text-[#4A4A4A]">
                  {summary.stateLabel}{summary.profileLabel ? ` · ${summary.profileLabel}` : ''}
                  {summary.provisional && <span className="text-[#B7791F]"> (provisional)</span>}
                </span>
              )}
              <span className="font-mono text-[13px] tabular-nums text-[#6B6B6B] px-2 py-1 rounded-md bg-[#F4F4F4]">{mmss}</span>
              <button onClick={() => setDrawer(d => d === 'objection' ? null : 'objection')}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E5E5] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
                <MessageSquareWarning size={13} /> Objection
              </button>
              <button onClick={() => setDrawer(d => d === 'notes' ? null : 'notes')}
                className="inline-flex items-center gap-1.5 text-[13px] font-semibold px-3 py-1.5 rounded-lg border border-[#E5E5E5] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
                <StickyNote size={13} /> Notes
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-2 mt-3">
            {NAV.map((s, i) => (
              <div key={s.key} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[#C9C9C9] text-xs" aria-hidden>→</span>}
                <button onClick={() => refs.current[s.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition-colors ${
                    active === s.key ? 'border-[#1B6DFC] bg-blue-50' : 'border-[#E5E5E5] bg-white hover:border-[#B5CFFC]'
                  }`}>
                  <span className={`font-mono text-[10px] font-bold ${active === s.key ? 'text-[#1B6DFC]' : 'text-[#999999]'}`}>{s.n}</span>
                  <span className={`text-[12px] font-semibold ${active === s.key ? 'text-[#1B6DFC]' : 'text-[#6B6B6B]'}`}>{s.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scope flags */}
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

      <div className="max-w-4xl mx-auto px-5 py-12">
        <div className="relative">
          <div aria-hidden className="absolute top-2 bottom-2 left-[27px] w-px hidden md:block"
            style={{ background: 'linear-gradient(to bottom, rgba(27,109,252,0.35) 0%, rgba(27,109,252,0.15) 70%, rgba(27,109,252,0) 100%)' }} />

          {/* 01 RECAP */}
          <Stage n="01" eyebrow="Stage One · 5-7 min" title="Recap where they're at"
            goal="Recap their scorecard and what you've already covered. Their reaction is the signal."
            innerRef={el => { refs.current.recap = el }} dataKey="recap">
            <Say text={recapScript} />
            <div className="rounded-xl border border-[#E5E5E5] p-4">
              <p className="text-[11px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-2.5">Training context — set this first, stage 2 adapts</p>
              <div className="flex flex-wrap gap-2">
                {([['active', 'Currently training'], ['returning', 'Returning to it'], ['new', 'New to training']] as const).map(([k, label]) => (
                  <button key={k} onClick={() => setTraining(k)}
                    className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
                      training === k ? 'border-[#1B6DFC] bg-blue-50 text-[#1B6DFC]' : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-[#B5CFFC]'
                    }`}>{label}</button>
                ))}
              </div>
            </div>
            <Asks items={[
              'Quick first — are you currently training, coming back to it after a break, or fairly new to all this?',
              'What stood out to you most when you saw your result?',
              'Did it feel accurate to where you\'re at?',
              'Anything that surprised you, or didn\'t land?',
            ]} />
            <Note text={`Coach read, not spoken: ${state.opening}`} />
          </Stage>

          {/* 02 CONVERSATION */}
          <Stage n="02" eyebrow="Stage Two · 10-15 min" title="Conversation and hot spot"
            goal="Build the picture, then push to the real emotional reason they're here. Specific, vulnerable, in their words."
            innerRef={el => { refs.current.conversation = el }} dataKey="conversation">
            <Say text={`Now I want to get a clearer picture of what's actually been going on for you. The scorecard shows the pattern but doesn't know the why behind it.

I'll ask a few questions about how things are going day to day. Then we'll talk about what you actually want to change. Just answer honestly — there's no right answer.`} />

            {prepNotes && (
              <div className="rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] p-5">
                <p className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-[0.14em] mb-1">They already told you this</p>
                <p className="text-[13px] text-[#6B6B6B] mb-4">From the pre-call form. Don&apos;t ask it again, and use their words back.</p>
                <PrepAnswers notes={prepNotes} />
              </div>
            )}

            <Block title="Energy" items={[
              'Walk me through what a typical day looks like energy-wise.',
              'Do you rely on caffeine to get through the day?',
              'When does the energy drop usually hit?',
              'How does energy feel after training specifically?',
            ]} />
            <Block title="Sleep" items={[
              'What does sleep actually look like for you right now?',
              'Are you waking through the night?',
              'Do you wake feeling rested?',
              'Has this been going on long, or recent?',
            ]} />
            <Block title="Stress load" items={[
              'What\'s the stress load like right now — work, life, or something else?',
              'Is the demand ongoing or situational?',
              'Do you carry it into training?',
              'Any genuine downtime in a typical week?',
            ]} />
            <Block title={training === 'returning' ? 'Training (returning)' : training === 'new' ? 'Training (new)' : 'Training'} items={
              training === 'returning'
                ? ['Walk me through what training looked like before you stepped back.', 'What made you stop?', 'How long has it been?', 'What does training look like right now, if anything?']
                : training === 'new'
                  ? ['Have you done any structured exercise before?', 'What\'s prompted you to look at this now?', 'What does activity look like in a typical week right now?']
                  : ['What does progress actually look like compared to what you\'re putting in?', 'Are you getting stronger over time?', 'How do you feel during sessions compared to 6-12 months ago?', 'Does the body feel beaten up, or recovered between sessions?']
            } />
            <Block title="Hot spot — what they really want to change" accent items={[
              'What is it about how you look or feel right now that you most want to change?',
              'Don\'t just say weight or size — what\'s underneath that?',
              'Is it how clothes fit? Catching yourself in the mirror?',
              'A specific situation where you really feel it?',
              'When did you last feel really good in your body? What was different then?',
              'If we sorted that out for you, what changes day to day?',
              'Has anyone ever made a comment that stuck with you?',
            ]} />
            <Boundary text="No prescriptions, no advice, no solutions yet. Just listening and reflecting. The longer they sit in the truth of the hot spot, the more invested they get. Repeat the hot spot back word for word when they say it, and put it in your notes for stage 3." />
          </Stage>

          {/* 03 HOW IT WORKS — full depth */}
          <Stage n="03" eyebrow="Stage Three · 5-7 min" title="Tie the hot spot to how this works"
            goal="Walk all five cards. Every one anchors back to their words from stage 2. Read the script under each, don't paraphrase."
            innerRef={el => { refs.current.system = el }} dataKey="system">
            <div className="space-y-5">
              {HOW_IT_WORKS_STAGES.map(card => (
                <div key={card.number} className="rounded-2xl border border-[#E5E5E5] overflow-hidden">
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-baseline gap-3 mb-2">
                      <span className="font-mono text-[12px] font-bold text-[#1B6DFC]">{card.number}</span>
                      <div>
                        <h3 className="text-lg font-extrabold tracking-tight leading-tight">{card.title}</h3>
                        <p className="text-[12px] font-semibold text-[#999999]">{card.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-[15px] leading-relaxed text-[#4A4A4A]">{card.body}</p>

                    {'chips' in card && card.chips && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {card.chips.map(c => (
                          <span key={c} className="text-[12px] font-semibold px-2.5 py-1 rounded-full bg-[#F4F4F4] text-[#4A4A4A] border border-[#E5E5E5]">{c}</span>
                        ))}
                      </div>
                    )}

                    {'zones' in card && card.zones && (
                      <div className="mt-4 space-y-2">
                        {card.zones.map(z => (
                          <div key={z.region} className="flex items-start gap-3">
                            <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                              z.dot === 'red' ? 'bg-red-500' : z.dot === 'amber' ? 'bg-amber-500' : z.dot === 'purple' ? 'bg-violet-500' : 'bg-cyan-500'
                            }`} />
                            <p className="text-[14px] leading-snug">
                              <span className="font-semibold text-[#1A1A1A]">{z.region}</span>
                              <span className="text-[#6B6B6B]"> — {z.driver}</span>
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {'pieces' in card && card.pieces && (
                      <div className="mt-4 grid sm:grid-cols-2 gap-3">
                        {card.pieces.map(p => (
                          <div key={p.name} className="rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] p-3.5">
                            <p className="text-[13px] font-bold text-[#1A1A1A] mb-0.5">{p.name}</p>
                            <p className="text-[13px] text-[#6B6B6B] leading-snug">{p.desc}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {'bridge' in card && card.bridge && (
                      <div className="mt-4 rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] p-4">
                        <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.14em] mb-1.5">How they connect</p>
                        <p className="text-[14px] leading-relaxed text-[#3A3A3A]">{card.bridge}</p>
                      </div>
                    )}
                  </div>
                  <div className="bg-blue-50 border-t border-[#B5CFFC] px-5 py-4">
                    <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.14em] mb-1.5">Say</p>
                    <p className="text-[15px] leading-relaxed text-[#1A1A1A]">{card.coachScript}</p>
                  </div>
                </div>
              ))}
            </div>
            <Boundary text="Pause between cards. Don't rush. On card 02, match their hot spot to a pair if it's locational. On card 03, name their likely profile and read the description. Don't jump to pricing until all five are walked through and tied back." />
          </Stage>

          {/* 04 OFFER */}
          <Stage n="04" eyebrow="Stage Four · 5-10 min" title="Offer and packages"
            goal="Present pricing in the context of what they just connected to. Then close."
            innerRef={el => { refs.current.offer = el }} dataKey="offer">
            {summary?.doNotPitch && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-5 py-3.5">
                <p className="text-[14px] font-bold text-red-800">They answered &quot;{summary.investmentLine}&quot;. Read them, give the picture, let the offer land flat. Do not push 1:1.</p>
              </div>
            )}
            <Say text={`You've seen what I do, and you've seen how it gets to the thing you told me about.

Here's what's included: the foundational intake and CFFS, your training program, nutrition structure, weekly check-in and CFWS read, direct access between sessions, and two coached sessions a week.`} />
            <div>
              <p className="text-[11px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-2">What&apos;s included</p>
              <ul className="space-y-1.5">
                {WHATS_INCLUDED.map(w => (
                  <li key={w} className="flex gap-2.5 text-[14px] text-[#3A3A3A] leading-snug">
                    <Check size={14} className="text-[#1B6DFC] mt-0.5 shrink-0" /><span>{w}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              {PACKAGES.map(p => (
                <div key={p.tier} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-xl border border-[#E5E5E5] px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-[#1A1A1A]">
                      {p.tier}
                      {p.coachAssessed && <span className="ml-2 text-[11px] font-semibold text-[#B7791F]">coach-assessed</span>}
                    </p>
                    <p className="text-[13px] text-[#6B6B6B] leading-snug">{p.desc}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[15px] font-black text-[#1A1A1A]">{p.price}</p>
                    <p className="text-[12px] text-[#1B6DFC] font-semibold">{p.founding} founding</p>
                  </div>
                </div>
              ))}
              <p className="text-[13px] text-[#6B6B6B] pt-1">Plus {COMMENCEMENT_FEE} one-off to get started. Covers the setup before coaching begins.</p>
            </div>
            <div className="rounded-xl bg-blue-50 border border-[#B5CFFC] px-5 py-4">
              <p className="text-[13px] font-bold text-[#1B6DFC] mb-1">{FOUNDING_OFFER.headline}</p>
              <p className="text-[13px] text-[#3A3A3A] leading-relaxed">{FOUNDING_OFFER.blurb}</p>
            </div>
            <Boundary text="Lead with 2x as the default. Mention 1x only if their training history shows self-discipline. Skip it for new trainers or anyone who admitted inconsistency in stage 2. After stating the number, pause. Let it land. Don't fill the silence. No urgency, no discount framing. Non-enrolment is an acceptable outcome." />
          </Stage>

          {/* 05 OUTCOME */}
          <div ref={el => { refs.current.outcome = el }} data-key="outcome" className="relative flex items-start gap-6 md:gap-8 scroll-mt-40">
            <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-[#1B6DFC] flex items-center justify-center text-white">
              <Check size={22} />
            </div>
            <div className="flex-1 min-w-0 pt-1.5">
              <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-2">Stage Five</p>
              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-3">How did it land?</h2>
              {summary && <p className="text-[15px] text-[#6B6B6B] mb-6 max-w-2xl">Expected: {summary.pathLine}</p>}
              {outcome ? (
                <p className="text-[15px] font-semibold text-[#1B6DFC]">
                  Recorded as Path {outcome}. {outcome === 'A' ? 'Declined follow-up sequence sent.' : 'Status set to Zoom completed.'}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {([
                    ['C', 'Proceeding', 'bg-[#1B6DFC] text-white border-[#1B6DFC]'],
                    ['B', 'Needs time', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-[#1B6DFC]'],
                    ['A', 'Out', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-red-400'],
                  ] as const).map(([p, label, cls]) => (
                    <button key={p} disabled={busy} onClick={() => markOutcome(p)}
                      className={`text-[14px] font-bold px-5 py-2.5 rounded-xl border transition-colors disabled:opacity-50 ${cls}`}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[12px] text-[#999999] mt-4">Path B is not a fail. Marking Out also sends the declined follow-up sequence.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Drawers */}
      {drawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[460px] bg-white border-l border-[#E5E5E5] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E5E5E5]">
            <p className="text-[13px] font-bold">{drawer === 'notes' ? 'Call notes' : 'Objection handling'}</p>
            <button onClick={() => setDrawer(null)} className="text-[#999999] hover:text-[#1A1A1A]"><X size={16} /></button>
          </div>

          {drawer === 'notes' ? (
            <>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Their hot spot, word for word. You'll use it back in stage 3 and 4."
                className="flex-1 p-5 text-[14px] leading-relaxed resize-none focus:outline-none" />
              <div className="px-5 py-3.5 border-t border-[#E5E5E5] flex items-center justify-between">
                <span className="text-[12px] text-[#999999]">{saved ? 'Saved' : 'Saves to the lead'}</span>
                <button onClick={saveNotes} className="text-[13px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#5390FF] transition-colors">Save</button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p className="text-[11px] font-bold text-[#B7791F] uppercase tracking-[0.14em]">{OBJECTION_HANDLING.toneIndicator}</p>
                <p className="text-[13px] text-[#6B6B6B] mt-1 leading-relaxed">{OBJECTION_HANDLING.when}</p>
              </div>
              {OBJECTION_HANDLING.steps.map(step => (
                <div key={step.label}>
                  <p className="text-[13px] font-bold text-[#1A1A1A] mb-1.5">{step.label}</p>
                  <pre className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl p-4">{step.content}</pre>
                </div>
              ))}
              <div>
                <p className="text-[13px] font-bold text-[#1A1A1A] mb-1.5">Online script</p>
                <pre className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-blue-50 border border-[#B5CFFC] rounded-xl p-4">{ONLINE_SCRIPT}</pre>
              </div>
              <p className="text-[12px] text-[#999999] leading-relaxed">{OBJECTION_HANDLING.boundary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Presentational helpers ──────────────────────────────────────────────────

function Stage({ n, eyebrow, title, goal, children, innerRef, dataKey }: {
  n: string; eyebrow: string; title: string; goal: string
  children: React.ReactNode
  innerRef: (el: HTMLDivElement | null) => void
  dataKey: string
}) {
  return (
    <div ref={innerRef} data-key={dataKey} className="relative flex items-start gap-6 md:gap-8 pb-16 md:pb-20 scroll-mt-40">
      <div className="relative z-10 flex-shrink-0 w-14 h-14 rounded-full bg-white border-2 border-[#1B6DFC]/40 flex items-center justify-center text-[#1B6DFC] font-extrabold text-lg shadow-[0_4px_16px_rgba(27,109,252,0.12)]">{n}</div>
      <div className="flex-1 min-w-0 pt-1.5">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-2">{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-2">{title}</h2>
        <p className="text-[15px] text-[#6B6B6B] leading-relaxed mb-6 max-w-2xl">{goal}</p>
        <div className="space-y-4 max-w-2xl">{children}</div>
      </div>
    </div>
  )
}

function Say({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-blue-50 border-l-[3px] border-[#1B6DFC] px-5 py-4">
      <p className="text-[11px] font-bold text-[#1B6DFC] uppercase tracking-[0.14em] mb-2">Say</p>
      <p className="text-[16px] leading-relaxed text-[#1A1A1A] whitespace-pre-line">&ldquo;{text}&rdquo;</p>
    </div>
  )
}

function Asks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map(t => (
        <li key={t} className="text-[15px] leading-relaxed text-[#1A1A1A] pl-4 border-l-2 border-[#E5E5E5]">
          <span className="text-[#1B6DFC] font-bold">Ask · </span>&ldquo;{t}&rdquo;
        </li>
      ))}
    </ul>
  )
}

function Block({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${accent ? 'border-[#B5CFFC] bg-blue-50/40' : 'border-[#E5E5E5]'}`}>
      <p className={`text-[11px] font-bold uppercase tracking-[0.14em] mb-2.5 ${accent ? 'text-[#1B6DFC]' : 'text-[#999999]'}`}>{title}</p>
      <ul className="space-y-1.5">
        {items.map(t => (
          <li key={t} className="text-[14px] leading-snug text-[#3A3A3A] flex gap-2.5">
            <span className="text-[#1B6DFC]">·</span><span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Note({ text }: { text: string }) {
  return <p className="text-[14px] leading-relaxed text-[#6B6B6B]">{text}</p>
}

function Boundary({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] px-5 py-3.5">
      <p className="text-[11px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">Hold the line</p>
      <p className="text-[14px] leading-relaxed text-[#4A4A4A]">{text}</p>
    </div>
  )
}
