'use client'

import { useEffect, useState, use as usePromise } from 'react'

/**
 * What a client sees when their coach asks for a testimonial.
 *
 * LIGHT, because a client reads it. A tool is dark, a document is light.
 *
 * ONE STEP. They write it and choose how they are named on the same page. The
 * funnel flow asks for consent a day later because the person did not know they
 * were writing a testimonial; here they do, so splitting it would only be a
 * second chance to lose them.
 *
 * SAYING NO IS ON THE PAGE, in plain words, not buried. An ask that can only be
 * answered yes is not consent, and the answer it produces is worth nothing.
 */

type Ask = { firstName: string; coachName: string; alreadyAnswered: boolean }
type Naming = 'first_name' | 'first_last_initial' | 'anonymous'

export default function TestimonialPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = usePromise(params)
  const [ask, setAsk] = useState<Ask | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [naming, setNaming] = useState<Naming>('first_last_initial')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState<'sent' | 'declined' | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/feedback/testimonial/${token}`)
      .then(async r => {
        if (!r.ok) setLoadError((await r.json().catch(() => ({}))).error ?? 'Could not load.')
        else setAsk(await r.json())
        setLoading(false)
      })
      .catch(() => { setLoadError('Could not load.'); setLoading(false) })
  }, [token])

  async function send(decline: boolean) {
    setBusy(true); setError(null)
    try {
      const r = await fetch(`/api/feedback/testimonial/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(decline ? { decline: true } : { text, publishAs: naming }),
      })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) { setError(d.error ?? 'Something went wrong.'); return }
      setDone(decline ? 'declined' : 'sent')
    } catch {
      setError('Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const shell = (inner: React.ReactNode) => (
    <div className="min-h-screen bg-[#FAFAF8] px-6 py-16">
      <div className="max-w-[620px] mx-auto">{inner}</div>
    </div>
  )

  if (loading) return shell(<p className="text-[13.5px] text-[#6E747D]">One moment…</p>)
  if (loadError || !ask) return shell(
    <>
      <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115]">This link has expired</h1>
      <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">{loadError ?? 'It may already have been used.'} If you would still like to say something, just reply to the email.</p>
    </>
  )

  if (done === 'sent') return shell(
    <>
      <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115]">Thank you</h1>
      <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">That is genuinely useful, and it will only ever appear the way you chose. You can close this page.</p>
    </>
  )

  if (done === 'declined') return shell(
    <>
      <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115]">No problem at all</h1>
      <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">Nothing has been recorded and you will not be asked again. You can close this page.</p>
    </>
  )

  if (ask.alreadyAnswered) return shell(
    <>
      <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115]">Already answered</h1>
      <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">This one has been dealt with. Nothing more to do.</p>
    </>
  )

  const options: Array<{ v: Naming; label: string }> = [
    { v: 'first_name', label: `Just ${ask.firstName}` },
    { v: 'first_last_initial', label: `${ask.firstName} and my last initial` },
    { v: 'anonymous', label: 'Anonymously' },
  ]

  return shell(
    <>
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA2AB]">A few lines</p>
      <h1 className="text-[34px] font-bold tracking-[-0.03em] text-[#0F1115] mt-2 leading-tight">
        {ask.firstName}, how has it actually gone?
      </h1>
      <p className="text-[13.5px] text-[#6E747D] mt-3 leading-relaxed">
        What it was like before, what changed, and whether you would tell someone else to do it. A few sentences is plenty, and your own words are better than polished ones.
      </p>

      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        rows={7}
        placeholder="Write it however you would say it out loud."
        className="w-full mt-6 text-[13.5px] text-[#0F1115] placeholder:text-[#9CA2AB] leading-relaxed bg-white border border-[#DCDCD7] rounded-xl px-4 py-3.5 focus:outline-none focus:border-[#0F1115]"
      />

      <p className="text-[12.5px] font-semibold text-[#0F1115] mt-7">How would you like to be named?</p>
      <div className="mt-2.5 space-y-2">
        {options.map(o => (
          <label key={o.v} className="flex items-center gap-2.5 cursor-pointer">
            <input type="radio" name="naming" checked={naming === o.v} onChange={() => setNaming(o.v)} style={{ accentColor: '#0F1115' }} />
            <span className="text-[13.5px] text-[#0F1115]">{o.label}</span>
          </label>
        ))}
      </div>

      {error && <p className="text-[12.5px] text-[#8F2D2D] mt-4">{error}</p>}

      <div className="flex items-center gap-4 flex-wrap mt-8">
        <button
          onClick={() => send(false)}
          disabled={busy || text.trim().length < 10}
          className="text-[13.5px] font-bold bg-[#0F1115] text-[#FAFAF8] px-5 py-2.5 rounded-lg disabled:opacity-40"
        >
          {busy ? 'Sending…' : 'Send it'}
        </button>
        <button
          onClick={() => send(true)}
          disabled={busy}
          className="text-[12.5px] text-[#6E747D] underline underline-offset-4 hover:text-[#0F1115]"
        >
          I would rather not
        </button>
      </div>

      <p className="text-[11px] text-[#9CA2AB] mt-6 leading-relaxed">
        Nothing appears anywhere until you send it, and it only ever appears the way you chose above. Saying no changes nothing about your coaching.
      </p>
    </>
  )
}
