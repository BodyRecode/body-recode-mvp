'use client'

import { useState } from 'react'
import type { Tier, Rating } from '@/lib/collective-fit'

// Aligned to the Collective marketing design system (off-white canvas,
// dot-grid, Inter + JetBrains Mono, electric-blue accent).
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;600&display=swap');
.ca{--bg:#faf9f7;--card:#ffffff;--line:#e5e2dc;--line2:#d6d3cc;--ink:#1a1816;--mut:#6b6762;--acc:#3b82f6;--acc2:#2563eb;--accsoft:#eff6ff;--accmut:#dbeafe;
  min-height:100vh;background:var(--bg);background-image:radial-gradient(var(--line2) 1px,transparent 1px);background-size:26px 26px;background-position:-13px -13px;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,sans-serif;color:var(--ink);display:flex;flex-direction:column;}
.ca *{box-sizing:border-box;}
.ca .bar{border-bottom:1px solid var(--line);background:rgba(250,249,247,.86);backdrop-filter:blur(8px);}
.ca .barin{max-width:640px;margin:0 auto;padding:16px 24px;display:flex;align-items:center;gap:11px;}
.ca .mk{width:30px;height:30px;border-radius:8px;background:var(--ink);color:#fff;font-family:'JetBrains Mono',monospace;font-weight:600;font-size:13px;display:flex;align-items:center;justify-content:center;}
.ca .nm{font-weight:700;letter-spacing:-.02em;font-size:14px;}
.ca .prog{height:3px;background:var(--line);}
.ca .prog>i{display:block;height:100%;background:var(--acc);transition:width .3s ease;}
.ca .mid{flex:1;display:flex;align-items:center;justify-content:center;padding:48px 24px;}
.ca .col{width:100%;max-width:600px;}
.ca .eyebrow{font-family:'JetBrains Mono',monospace;font-size:12px;font-weight:600;color:var(--acc);letter-spacing:.04em;margin-bottom:16px;}
.ca .qn{font-family:'JetBrains Mono',monospace;font-size:12px;color:#9aa0a6;margin-bottom:14px;}
.ca h1{font-size:38px;line-height:1.06;letter-spacing:-.03em;font-weight:800;}
.ca h2{font-size:26px;line-height:1.1;letter-spacing:-.02em;font-weight:800;margin-bottom:6px;}
.ca .sub{font-size:15px;line-height:1.6;color:var(--mut);}
.ca .opt{width:100%;text-align:left;padding:16px 20px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-size:15px;font-weight:500;color:var(--ink);cursor:pointer;transition:border-color .15s,background .15s;display:flex;align-items:center;gap:12px;}
.ca .opt:hover{border-color:var(--acc);}
.ca .opt.on{border-color:var(--acc);background:var(--accsoft);}
.ca .box{width:16px;height:16px;border-radius:5px;border:1px solid var(--line2);flex:0 0 auto;}
.ca .opt.on .box{background:var(--acc);border-color:var(--acc);}
.ca .primary{background:var(--acc);color:#fff;font-weight:700;font-size:14px;padding:14px 26px;border-radius:12px;border:none;cursor:pointer;box-shadow:0 8px 22px rgba(59,130,246,.28);}
.ca .primary:disabled{opacity:.4;cursor:default;box-shadow:none;}
.ca .ghost{color:#9aa0a6;font-size:14px;background:none;border:none;cursor:pointer;padding:0;}
.ca .ghost:hover{color:var(--ink);}
.ca .inp{width:100%;padding:13px 16px;border-radius:12px;border:1px solid var(--line);background:var(--card);font-size:15px;font-family:inherit;color:var(--ink);outline:none;}
.ca .inp:focus{border-color:var(--acc);}
.ca .note{font-size:15px;line-height:1.6;color:var(--ink);background:var(--accsoft);border:1px solid var(--accmut);border-radius:14px;padding:18px 20px;}
@media (max-width:480px){
  .ca h1{font-size:28px;}
  .ca .mid{padding:32px 20px;}
  .ca .barin{padding:14px 20px;}
}
`

type Opt = { value: string; label: string }
type Q =
  | { id: string; kind: 'single'; q: string; sub?: string; options: Opt[] }
  | { id: string; kind: 'multi'; q: string; sub?: string; options: Opt[] }
  | { id: string; kind: 'text'; q: string; sub?: string; placeholder?: string }

const QUESTIONS: Q[] = [
  { id: 'modality', kind: 'single', q: 'What do you coach?', sub: 'Your primary modality.', options: [
    { value: 'strength', label: 'Strength / performance' }, { value: 'yoga', label: 'Yoga / movement' },
    { value: 'pilates', label: 'Pilates' }, { value: 'other', label: 'Something else' } ] },
  { id: 'method_clarity', kind: 'single', q: 'How defined is your method?', sub: 'The way you actually work with clients.', options: [
    { value: 'documented', label: "It's clearly mine, and documented" }, { value: 'in_head', label: "I have a way, but it's in my head" },
    { value: 'figuring_out', label: "I'm still figuring it out" } ] },
  { id: 'audience', kind: 'single', q: 'Do you have an audience?', options: [
    { value: 'engaged', label: 'Yes — an engaged audience that trusts me' }, { value: 'building', label: "I'm building one" },
    { value: 'not_yet', label: 'Not really, yet' } ] },
  { id: 'audience_size', kind: 'single', q: 'Roughly how big?', options: [
    { value: 'under_500', label: 'Under 500' }, { value: '500_5k', label: '500 – 5,000' }, { value: '5k_plus', label: '5,000+' } ] },
  { id: 'timeline', kind: 'single', q: 'When would you want to launch?', options: [
    { value: 'now', label: "I'm ready now" }, { value: 'few_months', label: 'In the next few months' }, { value: 'exploring', label: 'Just exploring' } ] },
  { id: 'mindset', kind: 'single', q: 'Which sounds more like you?', options: [
    { value: 'ownership', label: "I'd rather own a business than rent a tool" }, { value: 'cheap_tool', label: 'I just want the cheapest software that works' } ] },
  { id: 'one_liner', kind: 'text', q: 'What do you do, in one line?', placeholder: 'e.g. I help busy mums rebuild strength after kids' },
  { id: 'current_setup', kind: 'multi', q: 'What are you running on now?', sub: 'Select any that apply.', options: [
    { value: 'spreadsheets', label: 'Spreadsheets' }, { value: 'off_the_shelf', label: 'Off-the-shelf app' },
    { value: 'nothing', label: 'Nothing structured' }, { value: 'custom', label: 'Something custom' } ] },
  { id: 'whats_broken', kind: 'text', q: "What's not working about it?", placeholder: 'The thing that made you look…' },
]
const HEARD = ['Referral', 'Body Recode', 'Instagram', 'Podcast / article', 'Other']

export default function ApplyPage() {
  const [step, setStep] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [contact, setContact] = useState({ name: '', business_name: '', email: '', phone: '', website: '', heard_from: '' })
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ tier: Tier; dimensions: Record<string, Rating> } | null>(null)
  const [error, setError] = useState('')

  const total = QUESTIONS.length + 1
  const contactStep = QUESTIONS.length
  const set = (id: string, v: string | string[]) => setAnswers(a => ({ ...a, [id]: v }))
  const pick = (id: string, v: string) => { set(id, v); setStep(s => s + 1) }
  const toggle = (id: string, v: string) => setAnswers(a => {
    const cur = (a[id] as string[]) || []; return { ...a, [id]: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] }
  })

  async function submit() {
    setSubmitting(true); setError('')
    try {
      const res = await fetch('/api/collective/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...answers, ...contact }) })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong.')
      setResult({ tier: data.tier, dimensions: data.dimensions })
    } catch (e) { setError(e instanceof Error ? e.message : 'Something went wrong.') } finally { setSubmitting(false) }
  }

  if (result) return <div className="ca"><style dangerouslySetInnerHTML={{ __html: CSS }} /><Result tier={result.tier} dimensions={result.dimensions} /></div>

  const pct = step < 0 ? 0 : Math.round((step / total) * 100)

  return (
    <div className="ca">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="bar"><div className="barin"><div className="mk">BR</div><div className="nm">The Body Recode Collective</div></div></div>
      {step >= 0 && <div className="prog"><i style={{ width: `${pct}%` }} /></div>}

      <div className="mid">
        <div className="col">
          {step === -1 && (
            <div style={{ textAlign: 'center' }}>
              <div className="eyebrow">// Fit check · 2 minutes</div>
              <h1>A collective of coaches<br />practising to one standard.</h1>
              <p className="sub" style={{ margin: '18px auto 32px', maxWidth: 440 }}>Answer a few questions and we&apos;ll tell you honestly whether the Collective is the right fit — and what your next step is.</p>
              <button className="primary" onClick={() => setStep(0)}>Start the fit check →</button>
            </div>
          )}

          {step >= 0 && step < contactStep && (() => {
            const q = QUESTIONS[step]
            return (
              <div>
                <div className="qn">{step + 1} / {total}</div>
                <h2>{q.q}</h2>
                {q.sub ? <p className="sub" style={{ marginBottom: 24 }}>{q.sub}</p> : <div style={{ height: 18 }} />}
                {q.kind === 'single' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {q.options.map(o => <button key={o.value} className={`opt${answers[q.id] === o.value ? ' on' : ''}`} onClick={() => pick(q.id, o.value)}>{o.label}</button>)}
                  </div>
                )}
                {q.kind === 'multi' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {q.options.map(o => { const on = ((answers[q.id] as string[]) || []).includes(o.value)
                      return <button key={o.value} className={`opt${on ? ' on' : ''}`} onClick={() => toggle(q.id, o.value)}><span className="box" />{o.label}</button> })}
                    <button className="primary" style={{ marginTop: 4, alignSelf: 'flex-start' }} onClick={() => setStep(s => s + 1)}>Continue →</button>
                  </div>
                )}
                {q.kind === 'text' && (
                  <div>
                    <textarea className="inp" rows={3} style={{ resize: 'none' }} placeholder={q.placeholder} value={(answers[q.id] as string) || ''} onChange={e => set(q.id, e.target.value)} />
                    <div style={{ marginTop: 16 }}><button className="primary" onClick={() => setStep(s => s + 1)}>Continue →</button></div>
                  </div>
                )}
                {step > 0 && <button className="ghost" style={{ marginTop: 24 }} onClick={() => setStep(s => s - 1)}>← Back</button>}
              </div>
            )
          })()}

          {step === contactStep && (
            <div>
              <div className="qn">{total} / {total}</div>
              <h2>Where do we send your result?</h2>
              <p className="sub" style={{ marginBottom: 24 }}>And a couple of details so the fit check is real.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="inp" placeholder="Your name *" value={contact.name} onChange={e => setContact(c => ({ ...c, name: e.target.value }))} />
                <input className="inp" placeholder="Business / brand name" value={contact.business_name} onChange={e => setContact(c => ({ ...c, business_name: e.target.value }))} />
                <input className="inp" type="email" placeholder="Email *" value={contact.email} onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
                <input className="inp" placeholder="Mobile (so we can reach you)" value={contact.phone} onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
                <input className="inp" placeholder="Website or main Instagram" value={contact.website} onChange={e => setContact(c => ({ ...c, website: e.target.value }))} />
                <select className="inp" style={{ color: contact.heard_from ? 'var(--ink)' : '#9aa0a6' }} value={contact.heard_from} onChange={e => setContact(c => ({ ...c, heard_from: e.target.value }))}>
                  <option value="">How did you hear about the Collective?</option>
                  {HEARD.map(h => <option key={h} value={h} style={{ color: '#1a1816' }}>{h}</option>)}
                </select>
              </div>
              {error && <p style={{ color: '#c0392b', fontSize: 14, marginTop: 12 }}>{error}</p>}
              <button className="primary" style={{ marginTop: 20, width: '100%' }} disabled={submitting || !contact.name.trim() || !contact.email.trim()} onClick={submit}>
                {submitting ? 'Reading your answers…' : 'See my result →'}
              </button>
              <button className="ghost" style={{ marginTop: 16 }} onClick={() => setStep(s => s - 1)}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Result({ tier, dimensions }: { tier: Tier; dimensions: Record<string, Rating> }) {
  const weakest = (['method', 'audience', 'readiness'] as const).find(d => dimensions[d] !== 'green')
  const line: Record<string, string> = {
    method: 'The one thing to lock in first: get your method out of your head and documented. That is what the engine runs on.',
    audience: 'The one thing to build first: an audience that trusts you. The platform converts attention — you need some to convert.',
    readiness: 'When the timing is right for you, the door is open. Come back when you are ready to move.',
  }
  return (
    <div className="mid">
      <div className="col" style={{ textAlign: 'center', maxWidth: 520 }}>
        {tier === 'ready' && (<>
          <div style={{ fontSize: 46, marginBottom: 16 }}>🟢</div>
          <h1 style={{ fontSize: 32 }}>You&apos;re exactly who the Collective is built for.</h1>
          <p className="sub" style={{ margin: '18px 0 30px' }}>You have a method, an audience, and you&apos;re ready. The next step is a short call to walk through your fit and how it would work. No pitch.</p>
          <a href="/book" className="primary" style={{ textDecoration: 'none', display: 'inline-block' }}>Book your call →</a>
          <p className="qn" style={{ marginTop: 16 }}>We&apos;ll be in touch shortly either way.</p>
        </>)}
        {tier === 'building' && (<>
          <div style={{ fontSize: 46, marginBottom: 16 }}>🟡</div>
          <h1 style={{ fontSize: 32 }}>You&apos;re close.</h1>
          <p className="sub" style={{ margin: '18px 0 22px' }}>There&apos;s real potential here — you&apos;re just not quite ready to get the most out of the Collective yet.</p>
          <p className="note" style={{ marginBottom: 24 }}>{line[weakest || 'method']}</p>
          <p className="sub">We&apos;ve got your details — I&apos;ll reach out when the timing lines up, and you&apos;ll be first to know when founding places open.</p>
        </>)}
        {tier === 'not_yet' && (<>
          <div style={{ fontSize: 46, marginBottom: 16 }}>🔴</div>
          <h1 style={{ fontSize: 32 }}>Not the right time — yet.</h1>
          <p className="sub" style={{ margin: '18px 0 22px' }}>Being honest: the Collective isn&apos;t the right move for you right now. That&apos;s not a no forever.</p>
          <p className="note" style={{ marginBottom: 24, background: '#f5f5f4', borderColor: '#e5e2dc' }}>{line[weakest || 'method']}</p>
          <p className="sub">Build that, and come back. The door stays open.</p>
        </>)}
      </div>
    </div>
  )
}
