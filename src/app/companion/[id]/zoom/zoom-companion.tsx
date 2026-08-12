'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Check, StickyNote, X, MessageSquareWarning, ChevronRight, ChevronLeft } from 'lucide-react'
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
 * ONE STAGE ON SCREEN AT A TIME. The previous pass put all five stages on a
 * single scroll with every question list and every card open, which read as
 * endless during a call. The content did not change; what changed is that you
 * see only the stage you are in, and detail sits one tap away instead of
 * always on.
 *
 * Rules for anything added here:
 *   - What he SAYS is always visible. Everything else can be folded.
 *   - Sub-question sets are shut by default. The hot spot block is the one
 *     exception, because that is the point of stage 2.
 *
 * Spoken content lives in `src/lib/companion-content.ts`. Edit there.
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

  const [step, setStep] = useState(0)
  const [training, setTraining] = useState<TrainingStatus>(null)
  const [notes, setNotes] = useState(initialNotes)
  const [drawer, setDrawer] = useState<'notes' | 'objection' | null>(null)
  const [saved, setSaved] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [outcome, setOutcome] = useState<'A' | 'B' | 'C' | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { window.scrollTo({ top: 0 }) }, [step])

  const mmss = `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
  const scoreDisplay = totalScore ? ` — ${totalScore}/15` : ''

  const preface = training === 'returning'
    ? 'Coming back into it, this gives us a clear starting point.\n\n'
    : training === 'new' ? 'This is the starting point — important context for how we ease you in.\n\n' : ''
  const tail = training === 'returning'
    ? `That's where you're at right now, before we put any load back in.\n\nWhat was your reaction when you saw it?`
    : training === 'new'
      ? `That's your starting point — where we work from before adding any training in.\n\nWhat was your reaction when you saw it?`
      : 'What was your reaction when you saw the result?'

  const recapScript = `OK ${firstName}, before we go any further I want to recap where we're at.

Your scorecard came back as ${bodyState}${scoreDisplay}.

${preface}${state.interpretation}

${tail}`

  async function saveNotes() {
    await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ notes }),
    })
    setSaved(true); setTimeout(() => setSaved(false), 1600)
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
    setOutcome(path); setBusy(false)
  }

  const STEPS = [
    { n: '01', label: 'Open', mins: '2-3 min' },
    { n: '02', label: 'Recap', mins: '5-7 min' },
    { n: '03', label: 'Conversation', mins: '10-15 min' },
    { n: '04', label: 'How it works', mins: '5-7 min' },
    { n: '05', label: 'Offer', mins: '5-10 min' },
    { n: '06', label: 'Outcome', mins: '' },
  ]
  const current = STEPS[step]

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E5E5E5]">
        <div className="max-w-3xl mx-auto px-5 py-2.5 flex items-center justify-between gap-3">
          <div className="min-w-0 flex items-baseline gap-2.5">
            <h1 className="text-[15px] font-extrabold tracking-tight truncate">{leadName}</h1>
            {summary && (
              <span className="hidden sm:inline text-[12px] text-[#6B6B6B] truncate">
                {summary.stateLabel}{summary.profileLabel ? ` · ${summary.profileLabel}` : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="font-mono text-[12px] tabular-nums text-[#6B6B6B] px-2 py-1 rounded-md bg-[#F4F4F4]">{mmss}</span>
            <IconBtn onClick={() => setDrawer(d => d === 'objection' ? null : 'objection')} label="Objection"><MessageSquareWarning size={13} /></IconBtn>
            <IconBtn onClick={() => setDrawer(d => d === 'notes' ? null : 'notes')} label="Notes"><StickyNote size={13} /></IconBtn>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-5 pb-2 flex items-center gap-1">
          {STEPS.map((s, i) => (
            <button key={s.n} onClick={() => setStep(i)} title={s.label}
              className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? 'bg-[#1B6DFC]' : 'bg-[#E5E5E5]'}`} />
          ))}
        </div>
      </div>

      {/* Scope flags — stage 1 only, they are a pre-call item */}
      {scopeFlags.length > 0 && step === 1 && (
        <div className="max-w-3xl mx-auto px-5 pt-5">
          <details className="rounded-xl bg-amber-50 border border-amber-300">
            <summary className="px-4 py-3 cursor-pointer select-none text-[13px] font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle size={13} /> {scopeFlags.length} outside scope · ask, note, do not interpret
            </summary>
            <div className="px-4 pb-4 space-y-2">
              {scopeFlags.map(f => (
                <p key={f.flag} className="text-[13px] text-amber-900 leading-snug">
                  <span className="font-bold">{f.flag}</span> — <span className="text-amber-800">{f.route}</span>
                </p>
              ))}
            </div>
          </details>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-5 pt-6">
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-mono text-[13px] font-bold text-[#1B6DFC]">{current.n}</span>
          <h2 className="text-xl font-extrabold tracking-tight">{current.label}</h2>
          {current.mins && <span className="text-[12px] text-[#999999] ml-auto shrink-0">{current.mins}</span>}
        </div>

        {/* 01 OPEN */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="rounded-xl bg-blue-50 border-l-[3px] border-[#1B6DFC] px-4 py-3.5">
              <p className="text-[16px] leading-relaxed text-[#1A1A1A]">
                Say hello. Small talk. Get {firstName} comfortable before anything else starts.
              </p>
            </div>
            <p className="text-[14px] leading-relaxed text-[#6B6B6B]">
              Not scripted, and it should not be. Two or three minutes of ordinary conversation so they arrive as a
              person rather than a prospect. They are more honest in stage 3 if this part lands.
            </p>
            <Fold title="If you need a way in">
              <Asks items={[
                'How has your day been?',
                'Whereabouts are you based?',
                'Have you got much on this week?',
                'Anything from what you have already filled in that you want to flag before we start?',
              ]} />
            </Fold>
            <Boundary text="No coaching, no scorecard, no questions about their body yet. When they sound settled, move on." />
          </div>
        )}

        {/* 02 RECAP */}
        {step === 1 && (
          <div className="space-y-4">
            <Say text={recapScript} />
            <div className="flex flex-wrap items-center gap-2">
              {([['active', 'Currently training'], ['returning', 'Returning to it'], ['new', 'New to training']] as const).map(([k, label]) => (
                <button key={k} onClick={() => setTraining(k)}
                  className={`text-[13px] font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
                    training === k ? 'border-[#1B6DFC] bg-blue-50 text-[#1B6DFC]' : 'border-[#E5E5E5] text-[#6B6B6B] hover:border-[#B5CFFC]'
                  }`}>{label}</button>
              ))}
              {!training && <span className="text-[12px] text-[#999999]">Set this, stage 2 adapts</span>}
            </div>
            <Fold title="Follow-up questions">
              <Asks items={[
                'What stood out to you most when you saw your result?',
                'Did it feel accurate to where you\'re at?',
                'Anything that surprised you, or didn\'t land?',
              ]} />
            </Fold>
            <Fold title="Coach read, not spoken">
              <p className="text-[14px] leading-relaxed text-[#6B6B6B]">{state.opening}</p>
            </Fold>
          </div>
        )}

        {/* 02 CONVERSATION */}
        {step === 2 && (
          <div className="space-y-4">
            <Say text={`Now I want to get a clearer picture of what's actually been going on for you. The scorecard shows the pattern but doesn't know the why behind it.

I'll ask a few questions about how things are going day to day. Then we'll talk about what you actually want to change. Just answer honestly — there's no right answer.`} />

            <Block title="Hot spot — what they really want to change" accent items={[
              'What is it about how you look or feel right now that you most want to change?',
              'Don\'t just say weight or size — what\'s underneath that?',
              'When did you last feel really good in your body? What was different then?',
              'If we sorted that out for you, what changes day to day?',
            ]} />

            <Fold title="Context questions — energy, sleep, stress, training">
              <div className="space-y-2.5">
                <Block title="Energy" items={['Walk me through what a typical day looks like energy-wise.', 'Do you rely on caffeine to get through the day?', 'When does the energy drop usually hit?']} />
                <Block title="Sleep" items={['What does sleep actually look like for you right now?', 'Are you waking through the night?', 'Do you wake feeling rested?']} />
                <Block title="Stress load" items={['What\'s the stress load like right now — work, life, or something else?', 'Is the demand ongoing or situational?', 'Do you carry it into training?']} />
                <Block title={training === 'returning' ? 'Training (returning)' : training === 'new' ? 'Training (new)' : 'Training'} items={
                  training === 'returning'
                    ? ['Walk me through what training looked like before you stepped back.', 'What made you stop?', 'What does training look like right now, if anything?']
                    : training === 'new'
                      ? ['Have you done any structured exercise before?', 'What\'s prompted you to look at this now?', 'What does activity look like in a typical week right now?']
                      : ['What does progress actually look like compared to what you\'re putting in?', 'Are you getting stronger over time?', 'Does the body feel beaten up, or recovered between sessions?']
                } />
                <Block title="More hot spot prompts" items={['Is it how clothes fit? Catching yourself in the mirror?', 'A specific situation where you really feel it?', 'Has anyone ever made a comment that stuck with you?']} />
              </div>
            </Fold>

            {prepNotes && (
              <Fold title="What they already told you on the form">
                <PrepAnswers notes={prepNotes} compact />
              </Fold>
            )}

            <Boundary text="No prescriptions, no advice, no solutions yet. Repeat the hot spot back word for word when they say it, and put it in your notes." />
          </div>
        )}

        {/* 03 HOW IT WORKS */}
        {step === 3 && (
          <div className="space-y-2.5">
            <p className="text-[14px] text-[#6B6B6B] leading-relaxed">Read the script on each. Anchor every one back to their words from stage 2. Tap Detail if you need it.</p>
            {HOW_IT_WORKS_STAGES.map(card => (
              <div key={card.number} className="rounded-xl border border-[#E5E5E5] overflow-hidden">
                <div className="px-4 pt-3 pb-2.5 flex items-baseline gap-2.5">
                  <span className="font-mono text-[11px] font-bold text-[#1B6DFC]">{card.number}</span>
                  <h3 className="text-[15px] font-extrabold tracking-tight">{card.title}</h3>
                  <span className="text-[11px] text-[#999999] ml-auto shrink-0 hidden sm:inline">{card.subtitle}</span>
                </div>
                <div className="bg-blue-50 border-y border-[#B5CFFC] px-4 py-3">
                  <p className="text-[15px] leading-relaxed text-[#1A1A1A]">{card.coachScript}</p>
                  {card.number === '03' && summary?.profileLabel && (
                    <p className="text-[14px] leading-relaxed text-[#1A1A1A] mt-2 pt-2 border-t border-[#B5CFFC]">
                      {summary.provisional
                        ? `Then: "Yours points toward ${summary.profileLabel}. I want the intake before I commit to that."`
                        : `Then: "Yours is ${summary.profileLabel}."`}
                    </p>
                  )}
                </div>
                <details>
                  <summary className="px-4 py-2 cursor-pointer select-none text-[12px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]">Detail</summary>
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-[14px] leading-relaxed text-[#4A4A4A]">{card.body}</p>
                    {'chips' in card && card.chips && (
                      <div className="flex flex-wrap gap-1.5">
                        {card.chips.map(c => <span key={c} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F4F4] text-[#4A4A4A] border border-[#E5E5E5]">{c}</span>)}
                      </div>
                    )}
                    {'zones' in card && card.zones && (
                      <div className="space-y-1.5">
                        {card.zones.map(z => (
                          <p key={z.region} className="text-[13px] leading-snug">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full mr-2 align-middle ${
                              z.dot === 'red' ? 'bg-red-500' : z.dot === 'amber' ? 'bg-amber-500' : z.dot === 'purple' ? 'bg-violet-500' : 'bg-cyan-500'
                            }`} />
                            <span className="font-semibold">{z.region}</span><span className="text-[#6B6B6B]"> — {z.driver}</span>
                          </p>
                        ))}
                      </div>
                    )}
                    {'pieces' in card && card.pieces && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {card.pieces.map(p => {
                          const theirs = summary?.profileLabel === p.name
                          return (
                            <div key={p.name} className={`rounded-lg p-2.5 border ${theirs ? 'bg-blue-50 border-[#1B6DFC]' : 'bg-[#F7F7F7] border-[#E5E5E5]'}`}>
                              <p className={`text-[12px] font-bold ${theirs ? 'text-[#1B6DFC]' : 'text-[#1A1A1A]'}`}>
                                {p.name}{theirs && <span className="font-semibold"> · theirs{summary?.provisional ? ', provisional' : ''}</span>}
                              </p>
                              <p className="text-[12px] text-[#6B6B6B] leading-snug">{p.desc}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                    {'bridge' in card && card.bridge && (
                      <p className="text-[13px] leading-relaxed text-[#3A3A3A] bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-3">{card.bridge}</p>
                    )}
                  </div>
                </details>
              </div>
            ))}
          </div>
        )}

        {/* 04 OFFER */}
        {step === 4 && (
          <div className="space-y-4">
            {summary?.doNotPitch && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <p className="text-[14px] font-bold text-red-800">They said &quot;{summary.investmentLine}&quot;. Let it land flat. Do not push 1:1.</p>
              </div>
            )}
            <Say text={`You've seen what I do, and you've seen how it gets to the thing you told me about.

Here's what's included: the foundational intake and CFFS, your training program, nutrition structure, weekly check-in and CFWS read, direct access between sessions, and two coached sessions a week.`} />
            <div className="space-y-1.5">
              {PACKAGES.map(p => (
                <div key={p.tier} className="flex items-baseline justify-between gap-3 rounded-lg border border-[#E5E5E5] px-3.5 py-2.5">
                  <p className="text-[14px] font-bold truncate">
                    {p.tier}{p.coachAssessed && <span className="ml-1.5 text-[11px] font-semibold text-[#B7791F]">assessed</span>}
                  </p>
                  <p className="text-[14px] font-black shrink-0">{p.price} <span className="text-[12px] font-semibold text-[#1B6DFC]">/ {p.founding}</span></p>
                </div>
              ))}
              <p className="text-[13px] text-[#6B6B6B] pt-1">Plus {COMMENCEMENT_FEE} one-off to get started. Second figure is the founding rate.</p>
            </div>
            <Fold title="What's included, in full">
              <ul className="space-y-1.5">
                {WHATS_INCLUDED.map(w => (
                  <li key={w} className="flex gap-2 text-[14px] text-[#3A3A3A] leading-snug"><Check size={13} className="text-[#1B6DFC] mt-0.5 shrink-0" /><span>{w}</span></li>
                ))}
              </ul>
            </Fold>
            <Fold title="Founding client offer">
              <p className="text-[13px] font-bold text-[#1B6DFC] mb-1">{FOUNDING_OFFER.headline}</p>
              <p className="text-[13px] text-[#3A3A3A] leading-relaxed">{FOUNDING_OFFER.blurb}</p>
            </Fold>
            <Boundary text="Lead with 2x. Mention 1x only if their history shows self-discipline. After the number, pause. Don't fill the silence." />
          </div>
        )}

        {/* 05 OUTCOME */}
        {step === 5 && (
          <div className="space-y-4">
            {summary && <p className="text-[15px] text-[#6B6B6B]">Expected: {summary.pathLine}</p>}
            {outcome ? (
              <p className="text-[15px] font-semibold text-[#1B6DFC]">
                Recorded as Path {outcome}. {outcome === 'A' ? 'Declined follow-up sent.' : 'Status set to Zoom completed.'}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {([
                  ['C', 'Proceeding', 'bg-[#1B6DFC] text-white border-[#1B6DFC]'],
                  ['B', 'Needs time', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-[#1B6DFC]'],
                  ['A', 'Out', 'bg-white text-[#3A3A3A] border-[#E5E5E5] hover:border-red-400'],
                ] as const).map(([p, label, cls]) => (
                  <button key={p} disabled={busy} onClick={() => markOutcome(p)}
                    className={`text-[14px] font-bold px-5 py-2.5 rounded-xl border transition-colors disabled:opacity-50 ${cls}`}>{label}</button>
                ))}
              </div>
            )}
            <p className="text-[12px] text-[#999999]">Path B is not a fail. Out also sends the declined follow-up.</p>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-[#E5E5E5]">
        <div className="max-w-3xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#6B6B6B] disabled:opacity-30 hover:text-[#1A1A1A]">
            <ChevronLeft size={15} /> Back
          </button>
          <span className="text-[12px] text-[#999999]">{step + 1} of {STEPS.length}</span>
          <button onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))} disabled={step === STEPS.length - 1}
            className="inline-flex items-center gap-1 text-[14px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg disabled:opacity-30 hover:bg-[#5390FF] transition-colors">
            {STEPS[step + 1]?.label ?? 'Done'} <ChevronRight size={15} />
          </button>
        </div>
      </div>

      {/* Drawers */}
      {drawer && (
        <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[440px] bg-white border-l border-[#E5E5E5] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#E5E5E5]">
            <p className="text-[13px] font-bold">{drawer === 'notes' ? 'Call notes' : 'Objection handling'}</p>
            <button onClick={() => setDrawer(null)} className="text-[#999999] hover:text-[#1A1A1A]"><X size={16} /></button>
          </div>
          {drawer === 'notes' ? (
            <>
              <textarea value={notes} onChange={e => setNotes(e.target.value)}
                placeholder="Their hot spot, word for word."
                className="flex-1 p-5 text-[14px] leading-relaxed resize-none focus:outline-none" />
              <div className="px-5 py-3 border-t border-[#E5E5E5] flex items-center justify-between">
                <span className="text-[12px] text-[#999999]">{saved ? 'Saved' : 'Saves to the lead'}</span>
                <button onClick={saveNotes} className="text-[13px] font-bold px-4 py-2 bg-[#1B6DFC] text-white rounded-lg">Save</button>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-[12px] text-[#6B6B6B] leading-relaxed">{OBJECTION_HANDLING.when}</p>
              {OBJECTION_HANDLING.steps.map(st => (
                <div key={st.label}>
                  <p className="text-[13px] font-bold mb-1.5">{st.label}</p>
                  <pre className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl p-4">{st.content}</pre>
                </div>
              ))}
              <div>
                <p className="text-[13px] font-bold mb-1.5">Online script</p>
                <pre className="text-[14px] leading-relaxed text-[#3A3A3A] whitespace-pre-wrap font-sans bg-blue-50 border border-[#B5CFFC] rounded-xl p-4">{ONLINE_SCRIPT}</pre>
              </div>
              <p className="text-[12px] text-[#999999]">{OBJECTION_HANDLING.boundary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Presentational helpers ──────────────────────────────────────────────────

function IconBtn({ onClick, label, children }: { onClick: () => void; label: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={label}
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border border-[#E5E5E5] hover:border-[#1B6DFC] hover:text-[#1B6DFC] transition-colors">
      {children}<span className="hidden sm:inline">{label}</span>
    </button>
  )
}

function Say({ text }: { text: string }) {
  return (
    <div className="rounded-xl bg-blue-50 border-l-[3px] border-[#1B6DFC] px-4 py-3.5">
      <p className="text-[16px] leading-relaxed text-[#1A1A1A] whitespace-pre-line">&ldquo;{text}&rdquo;</p>
    </div>
  )
}

function Asks({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map(t => (
        <li key={t} className="text-[14px] leading-snug text-[#3A3A3A] flex gap-2"><span className="text-[#1B6DFC]">·</span><span>{t}</span></li>
      ))}
    </ul>
  )
}

function Block({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <div className={`rounded-xl border p-3.5 ${accent ? 'border-[#B5CFFC] bg-blue-50/40' : 'border-[#E5E5E5]'}`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.14em] mb-2 ${accent ? 'text-[#1B6DFC]' : 'text-[#999999]'}`}>{title}</p>
      <Asks items={items} />
    </div>
  )
}

function Fold({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-[#E5E5E5]">
      <summary className="px-3.5 py-2.5 cursor-pointer select-none text-[12px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A]">{title}</summary>
      <div className="px-3.5 pb-3.5">{children}</div>
    </details>
  )
}

function Boundary({ text }: { text: string }) {
  return <p className="text-[13px] leading-relaxed text-[#999999] pt-1">{text}</p>
}
