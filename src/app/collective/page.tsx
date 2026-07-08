'use client'

import { useState } from 'react'
import type { Tier, Rating } from '@/lib/collective-fit'

const ACCENT = '#1B6DFC'

type Opt = { value: string; label: string; hint?: string }
type Question =
  | { id: string; kind: 'single'; q: string; sub?: string; options: Opt[] }
  | { id: string; kind: 'multi'; q: string; sub?: string; options: Opt[] }
  | { id: string; kind: 'text'; q: string; sub?: string; placeholder?: string; optional?: boolean }

const QUESTIONS: Question[] = [
  { id: 'modality', kind: 'single', q: 'What do you coach?', sub: 'Your primary modality.', options: [
    { value: 'strength', label: 'Strength / performance' },
    { value: 'yoga', label: 'Yoga / movement' },
    { value: 'pilates', label: 'Pilates' },
    { value: 'other', label: 'Something else' },
  ] },
  { id: 'method_clarity', kind: 'single', q: 'How defined is your method?', sub: 'The way you actually work with clients.', options: [
    { value: 'documented', label: "It's clearly mine, and documented" },
    { value: 'in_head', label: "I have a way, but it's in my head" },
    { value: 'figuring_out', label: "I'm still figuring it out" },
  ] },
  { id: 'audience', kind: 'single', q: 'Do you have an audience?', options: [
    { value: 'engaged', label: 'Yes — an engaged audience that trusts me' },
    { value: 'building', label: "I'm building one" },
    { value: 'not_yet', label: 'Not really, yet' },
  ] },
  { id: 'audience_size', kind: 'single', q: 'Roughly how big?', options: [
    { value: 'under_500', label: 'Under 500' },
    { value: '500_5k', label: '500 – 5,000' },
    { value: '5k_plus', label: '5,000+' },
  ] },
  { id: 'timeline', kind: 'single', q: 'When would you want to launch?', options: [
    { value: 'now', label: "I'm ready now" },
    { value: 'few_months', label: 'In the next few months' },
    { value: 'exploring', label: 'Just exploring' },
  ] },
  { id: 'mindset', kind: 'single', q: 'Which sounds more like you?', options: [
    { value: 'ownership', label: "I'd rather own a business than rent a tool" },
    { value: 'cheap_tool', label: 'I just want the cheapest software that works' },
  ] },
  { id: 'one_liner', kind: 'text', q: 'What do you do, in one line?', placeholder: 'e.g. I help busy mums rebuild strength after kids', optional: true },
  { id: 'current_setup', kind: 'multi', q: 'What are you running on now?', sub: 'Select any that apply.', options: [
    { value: 'spreadsheets', label: 'Spreadsheets' },
    { value: 'off_the_shelf', label: 'Off-the-shelf app' },
    { value: 'nothing', label: 'Nothing structured' },
    { value: 'custom', label: 'Something custom' },
  ] },
  { id: 'whats_broken', kind: 'text', q: "What's not working about it?", placeholder: 'The thing that made you look...', optional: true },
]

const HEARD = ['Referral', 'Body Recode', 'Instagram', 'Podcast / article', 'Other']

export default function CollectivePage() {
  const [step, setStep] = useState(-1) // -1 intro, 0..N questions, N contact, then result
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [contact, setContact] = useState({ name: '', business_name: '', email: '', phone: '', website: '', heard_from: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tier: Tier; dimensions: Record<string, Rating> } | null>(null)
  const [error, setError] = useState('')

  const total = QUESTIONS.length + 1 // + contact
  const contactStep = QUESTIONS.length

  function setAnswer(id: string, value: string | string[]) {
    setAnswers(a => ({ ...a, [id]: value }))
  }
  function pickSingle(id: string, value: string) {
    setAnswer(id, value)
    setStep(s => s + 1)
  }
  function toggleMulti(id: string, value: string) {
    setAnswers(a => {
      const cur = (a[id] as string[]) || []
      return { ...a, [id]: cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value] }
    })
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/collective/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...answers, ...contact }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setResult({ tier: data.tier, dimensions: data.dimensions })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  // ---------- Result ----------
  if (result) return <Result tier={result.tier} dimensions={result.dimensions} />

  const pct = step < 0 ? 0 : Math.round(((step) / total) * 100)

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] flex flex-col">
      {/* top bar */}
      <div className="w-full border-b border-[#E5E5E5]">
        <div className="max-w-xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[13px] font-bold" style={{ background: '#1A1A1A' }}>BR</div>
          <div className="text-sm font-semibold">The Body Recode Collective</div>
        </div>
      </div>
      {step >= 0 && (
        <div className="w-full h-1 bg-[#F0F0F0]"><div className="h-full transition-all" style={{ width: `${pct}%`, background: ACCENT }} /></div>
      )}

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-xl">

          {/* Intro */}
          {step === -1 && (
            <div className="text-center">
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: ACCENT }}>Fit check · 2 minutes</div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight mb-4">A collective of coaches<br/>practising to one standard.</h1>
              <p className="text-[#6B6B6B] text-base leading-relaxed mb-8 max-w-md mx-auto">Answer a few questions and we&apos;ll tell you honestly whether the Collective is the right fit — and what your next step is.</p>
              <button onClick={() => setStep(0)} className="px-7 py-3.5 rounded-xl text-white font-bold text-sm" style={{ background: ACCENT }}>Start the fit check →</button>
            </div>
          )}

          {/* Questions */}
          {step >= 0 && step < contactStep && (() => {
            const qq = QUESTIONS[step]
            return (
              <div>
                <div className="text-xs font-mono text-[#999] mb-3">{step + 1} / {total}</div>
                <h2 className="text-2xl font-bold tracking-tight mb-1">{qq.q}</h2>
                {qq.sub && <p className="text-[#6B6B6B] text-sm mb-6">{qq.sub}</p>}
                {!qq.sub && <div className="mb-6" />}

                {qq.kind === 'single' && (
                  <div className="space-y-3">
                    {qq.options.map(o => (
                      <button key={o.value} onClick={() => pickSingle(qq.id, o.value)}
                        className={`w-full text-left px-5 py-4 rounded-xl border transition-colors ${answers[qq.id] === o.value ? 'border-[#1B6DFC] bg-[#F3F7FF]' : 'border-[#E5E5E5] hover:border-[#1B6DFC]'}`}>
                        <span className="text-[15px] font-medium">{o.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {qq.kind === 'multi' && (
                  <div className="space-y-3">
                    {qq.options.map(o => {
                      const on = ((answers[qq.id] as string[]) || []).includes(o.value)
                      return (
                        <button key={o.value} onClick={() => toggleMulti(qq.id, o.value)}
                          className={`w-full text-left px-5 py-4 rounded-xl border transition-colors flex items-center gap-3 ${on ? 'border-[#1B6DFC] bg-[#F3F7FF]' : 'border-[#E5E5E5] hover:border-[#1B6DFC]'}`}>
                          <span className={`w-4 h-4 rounded border flex-shrink-0 ${on ? 'bg-[#1B6DFC] border-[#1B6DFC]' : 'border-[#CCC]'}`} />
                          <span className="text-[15px] font-medium">{o.label}</span>
                        </button>
                      )
                    })}
                    <button onClick={() => setStep(s => s + 1)} className="mt-2 px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: ACCENT }}>Continue →</button>
                  </div>
                )}

                {qq.kind === 'text' && (
                  <div>
                    <textarea value={(answers[qq.id] as string) || ''} onChange={e => setAnswer(qq.id, e.target.value)}
                      placeholder={qq.placeholder} rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px] resize-none" />
                    <button onClick={() => setStep(s => s + 1)} className="mt-4 px-6 py-3 rounded-xl text-white font-bold text-sm" style={{ background: ACCENT }}>Continue →</button>
                  </div>
                )}

                {step > 0 && (
                  <button onClick={() => setStep(s => s - 1)} className="mt-6 text-sm text-[#999] hover:text-[#3A3A3A]">← Back</button>
                )}
              </div>
            )
          })()}

          {/* Contact */}
          {step === contactStep && (
            <div>
              <div className="text-xs font-mono text-[#999] mb-3">{total} / {total}</div>
              <h2 className="text-2xl font-bold tracking-tight mb-1">Where do we send your result?</h2>
              <p className="text-[#6B6B6B] text-sm mb-6">And a couple of details so the fit check is real.</p>
              <div className="space-y-3">
                <input value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} placeholder="Your name *" className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px]" />
                <input value={contact.business_name} onChange={e => setContact(c => ({ ...c, business_name: e.target.value }))} placeholder="Business / brand name" className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px]" />
                <input value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} placeholder="Email *" type="email" className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px]" />
                <input value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} placeholder="Mobile (so we can reach you)" className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px]" />
                <input value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} placeholder="Website or main Instagram" className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px]" />
                <select value={contact.heard_from} onChange={e => setContact(c => ({ ...c, heard_from: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-[#E5E5E5] focus:border-[#1B6DFC] outline-none text-[15px] text-[#6B6B6B]">
                  <option value="">How did you hear about the Collective?</option>
                  {HEARD.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
              <button onClick={submit} disabled={submitting || !contact.name.trim() || !contact.email.trim()}
                className="mt-5 w-full px-6 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40" style={{ background: ACCENT }}>
                {submitting ? 'Reading your answers…' : 'See my result →'}
              </button>
              <button onClick={() => setStep(s => s - 1)} className="mt-4 text-sm text-[#999] hover:text-[#3A3A3A]">← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------- Result screens ----------
function Result({ tier, dimensions }: { tier: Tier; dimensions: Record<string, Rating> }) {
  const weakest = (['method', 'audience', 'readiness'] as const).find(d => dimensions[d] !== 'green')
  const strengthenLine: Record<string, string> = {
    method: 'The one thing to lock in first: get your method out of your head and documented. That is what the engine runs on.',
    audience: 'The one thing to build first: an audience that trusts you. The platform converts attention — you need some to convert.',
    readiness: 'When the timing is right for you, the door is open. Come back when you are ready to move.',
  }

  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg text-center">
        {tier === 'ready' && (
          <>
            <div className="text-5xl mb-5">🟢</div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">You&apos;re exactly who the Collective is built for.</h1>
            <p className="text-[#6B6B6B] leading-relaxed mb-8">You have a method, an audience, and you&apos;re ready. The next step is a short call to walk through your fit and how it would work. No pitch.</p>
            <a href="/book" className="inline-block px-8 py-4 rounded-xl text-white font-bold text-sm" style={{ background: ACCENT }}>Book your call →</a>
            <p className="text-xs text-[#999] mt-4">We&apos;ll be in touch shortly either way.</p>
          </>
        )}
        {tier === 'building' && (
          <>
            <div className="text-5xl mb-5">🟡</div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">You&apos;re close.</h1>
            <p className="text-[#6B6B6B] leading-relaxed mb-6">There&apos;s real potential here — you&apos;re just not quite ready to get the most out of the Collective yet.</p>
            <p className="text-[15px] text-[#1A1A1A] leading-relaxed mb-8 bg-[#F3F7FF] border border-[#1B6DFC]/20 rounded-xl px-5 py-4">{strengthenLine[weakest || 'method']}</p>
            <p className="text-[#6B6B6B] text-sm">We&apos;ve got your details — I&apos;ll reach out when the timing lines up, and you&apos;ll be first to know when founding places open.</p>
          </>
        )}
        {tier === 'not_yet' && (
          <>
            <div className="text-5xl mb-5">🔴</div>
            <h1 className="text-3xl font-extrabold tracking-tight mb-4">Not the right time — yet.</h1>
            <p className="text-[#6B6B6B] leading-relaxed mb-6">Being honest: the Collective isn&apos;t the right move for you right now. That&apos;s not a no forever.</p>
            <p className="text-[15px] text-[#1A1A1A] leading-relaxed mb-8 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl px-5 py-4">{strengthenLine[weakest || 'method']}</p>
            <p className="text-[#6B6B6B] text-sm">Build that, and come back. The door stays open.</p>
          </>
        )}
      </div>
    </div>
  )
}
