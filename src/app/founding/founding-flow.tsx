'use client'

import { useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  sectionsFor, TRAINING_OPTIONS, SEX_OPTIONS, AGE_OPTIONS, STORAGE_OPTIONS, DIRECTION_OPTIONS,
  CYCLE_OPTIONS, START_OPTIONS, SPENT_OPTIONS, WHERE_OPTIONS, VOICE_OPTIONS, PRICE_REACTION_OPTIONS,
  PRICE_YEAR, PRICE_MONTH, PRICE_WEEK, type TrainingStatus, type SectionKey,
} from '@/lib/rey-founding'

const BLUE = '#1B6DFC'
const BLUE_DARK = '#1056D6'
const INK = '#141821'
const BODY = '#43474F'
const MUTED = '#666D7A'
const LINE = '#E8EAEE'

type Result = {
  token: string
  already_joined: boolean
  score: number
  body_state: string
  state_description: string
  profile: string | null
  profile_confidence: 'high' | 'low' | null
  profile_descriptor: string | null
}

const STATE_COLOUR: Record<string, string> = {
  'Depleted State': '#DC2626',
  'Transitioning State': '#B7791F',
  'Ready State': BLUE_DARK,
}

function Pill({ selected, label, onClick }: { selected: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', textAlign: 'left',
        background: selected ? 'rgba(27,109,252,0.08)' : '#FFFFFF',
        border: `1.5px solid ${selected ? BLUE : LINE}`, borderRadius: '12px',
        padding: '12px 14px', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%', flexShrink: 0,
        background: selected ? BLUE : '#FFFFFF', border: `1.5px solid ${selected ? BLUE : '#CFD4DC'}`,
      }} />
      <span style={{ fontSize: '14px', color: selected ? BLUE_DARK : '#3A3A3A', fontWeight: selected ? 600 : 500, lineHeight: 1.45 }}>
        {label}
      </span>
    </button>
  )
}

function Question<T extends string>({ title, options, value, onChange, grid }: {
  title: string
  options: readonly { value: T; label: string }[]
  value: string | null
  onChange: (v: T) => void
  grid?: boolean
}) {
  return (
    <div>
      <p style={{ fontSize: '15px', fontWeight: 700, color: INK, margin: '0 0 10px', lineHeight: 1.4 }}>{title}</p>
      <div style={grid
        ? { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }
        : { display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {options.map(o => (
          <Pill key={o.value} selected={value === o.value} label={o.label} onClick={() => onChange(o.value)} />
        ))}
      </div>
    </div>
  )
}

function Part({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: '40px' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 18px' }}>
        {label}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>{children}</div>
    </section>
  )
}

const input = {
  width: '100%', padding: '14px 16px', background: '#FFFFFF', border: '1.5px solid #D4D4D4',
  borderRadius: '10px', color: INK, fontSize: '15px', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
} as const

export default function FoundingFlow() {
  const source = useSearchParams()?.get('source') ?? 'direct'

  const [training, setTraining] = useState<TrainingStatus | null>(null)
  const [scores, setScores] = useState<Partial<Record<SectionKey, number>>>({})
  const [sex, setSex] = useState<'F' | 'M' | null>(null)
  const [age, setAge] = useState<string | null>(null)
  const [storage, setStorage] = useState<string | null>(null)
  const [direction, setDirection] = useState<string | null>(null)
  const [cycle, setCycle] = useState<string | null>(null)
  const [start, setStart] = useState<string | null>(null)
  const [spent, setSpent] = useState<string | null>(null)
  const [where, setWhere] = useState<string | null>(null)
  const [voice, setVoice] = useState<string | null>(null)
  const [firstName, setFirstName] = useState('')
  const [email, setEmail] = useState('')

  const [result, setResult] = useState<Result | null>(null)
  const [reaction, setReaction] = useState<string | null>(null)
  const [joined, setJoined] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function chooseTraining(next: TrainingStatus) {
    // The two effort questions are worded differently for her; an answer to
    // the other wording no longer counts.
    if ((next === 'none') !== (training === 'none')) setScores(s => ({ ...s, '04': undefined, '05': undefined }))
    setTraining(next)
  }

  const sections = sectionsFor(training)
  const scored = sections.filter(s => scores[s.key] != null).length
  const female = sex === 'F'
  const total = 1 + sections.length + 3 + (female ? 2 : 0) + 4
  const answered = (training ? 1 : 0) + scored + [sex, age, storage].filter(Boolean).length
    + (female ? [direction, cycle].filter(Boolean).length : 0)
    + [start, spent, where, voice].filter(Boolean).length
  const complete = answered === total
  const canSubmit = complete && firstName.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function submit() {
    if (!canSubmit || busy) return
    setBusy(true)
    setError('')
    try {
      const res = await fetch('/api/founding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'result', source, first_name: firstName, email,
          training_status: training, section_scores: scores,
          biological_sex: sex, age_band: age, fat_storage: storage,
          storage_direction: female ? direction : null, cycle_status: female ? cycle : null,
          start_timing: start, spent_last_year: spent, train_where: where, voice_coach: voice,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Something went wrong. Please try again.')
      setResult(data as Result)
      setJoined(!!data.already_joined)
      window.scrollTo({ top: 0, behavior: 'instant' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
    }
    setBusy(false)
  }

  async function respond(payload: { price_reaction?: string; join?: boolean }) {
    if (!result) return false
    try {
      const res = await fetch('/api/founding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'respond', token: result.token, ...payload }),
      })
      return res.ok
    } catch {
      return false
    }
  }

  function chooseReaction(v: string) {
    setReaction(v)
    // Recorded the moment she picks it, whether or not she joins: "too much for
    // me" from a woman who leaves is the most useful answer on the page.
    void respond({ price_reaction: v })
  }

  async function join() {
    if (busy) return
    setBusy(true)
    setError('')
    const ok = await respond({ join: true, ...(reaction ? { price_reaction: reaction } : {}) })
    if (ok) setJoined(true)
    else setError('Something went wrong. Please try again.')
    setBusy(false)
  }

  // ── Result, then the app ─────────────────────────────────────────────
  if (result) {
    const colour = STATE_COLOUR[result.body_state] ?? BLUE_DARK
    return (
      <div>
        <p style={{ fontSize: '13px', color: MUTED, margin: '24px 0 6px' }}>{firstName.trim()}, your readiness is</p>
        <p style={{ fontSize: '40px', fontWeight: 900, color: colour, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '0 0 6px' }}>
          {result.body_state}
        </p>
        <p style={{ fontSize: '14px', color: MUTED, margin: '0 0 18px' }}>{result.score} out of 15</p>
        <p style={{ fontSize: '16px', color: BODY, lineHeight: 1.75, margin: '0 0 28px' }}>{result.state_description}</p>

        {result.profile && result.profile_descriptor && (
          <div style={{ background: '#FFFFFF', border: `1px solid ${LINE}`, borderLeft: `3px solid ${BLUE}`, borderRadius: '12px', padding: '20px 22px', marginBottom: '36px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: BLUE, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              {result.profile_confidence === 'high' ? 'Your pattern' : 'Your likely pattern'}
            </p>
            <p style={{ fontSize: '20px', fontWeight: 800, color: INK, margin: '0 0 10px' }}>{result.profile}</p>
            <p style={{ fontSize: '15px', color: BODY, lineHeight: 1.7, margin: 0 }}>{result.profile_descriptor}</p>
            {result.profile_confidence !== 'high' && (
              <p style={{ fontSize: '13px', color: MUTED, lineHeight: 1.6, margin: '10px 0 0' }}>
                Two minutes of questions points here. A full read confirms it.
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: '16px', color: BODY, lineHeight: 1.75, margin: '0 0 32px' }}>
          That is what your body is doing. What it does not tell you is what to do about it, in what
          order, and how that changes as your body does. That is the part we are building.
        </p>

        {/* The app */}
        <div style={{ background: 'linear-gradient(180deg, #17191F 0%, #0C1B33 100%)', borderRadius: '18px', padding: '30px 26px', color: '#FFFFFF' }}>
          <p style={{ fontSize: '11px', fontWeight: 800, color: '#8FB4F5', letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 12px' }}>
            What we are building next
          </p>
          <p style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.2, margin: '0 0 14px' }}>
            A new app from Body Recode that builds everything around this result.
          </p>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, margin: '0 0 20px' }}>
            Most apps give everyone the same plan. This one starts from your read, and keeps rewriting it as
            your body changes.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              'Your full read, written for you: what your body is doing, why, and what it usually gets mistaken for.',
              'Training and nutrition built from that read, starting where you are: gym, home, or not training yet.',
              'A coach in your ear through every session, adjusting to how you feel that day.',
              'A weekly check-in that changes the plan, and a fresh read every 12 weeks.',
            ].map(t => (
              <li key={t} style={{ display: 'flex', gap: '12px', fontSize: '15px', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
                <span aria-hidden style={{ width: '6px', height: '6px', borderRadius: '50%', background: BLUE, marginTop: '9px', flexShrink: 0 }} />
                {t}
              </li>
            ))}
          </ul>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: '22px', marginBottom: '8px' }}>
            <p style={{ margin: 0, display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '44px', fontWeight: 900, letterSpacing: '-0.03em' }}>${PRICE_YEAR}</span>
              <span style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)' }}>a year</span>
            </p>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.65)', margin: '4px 0 0' }}>
              That is ${PRICE_WEEK} a week. Or ${PRICE_MONTH} a month.
            </p>
          </div>
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, margin: '14px 0 0' }}>
            <strong style={{ color: '#FFFFFF' }}>It is not built yet.</strong> The founding list gets in first when it
            opens, and founding members keep this price for as long as they stay subscribed. Nothing to pay now.
          </p>
        </div>

        {joined ? (
          <div style={{ marginTop: '22px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.35)', borderRadius: '14px', padding: '20px 22px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#15803D', letterSpacing: '0.04em', textTransform: 'uppercase', margin: '0 0 6px' }}>
              You&apos;re on the founding list
            </p>
            <p style={{ fontSize: '15px', color: BODY, lineHeight: 1.65, margin: 0 }}>
              We will email <strong style={{ color: INK, overflowWrap: 'anywhere' }}>{email.trim()}</strong> when it opens, at ${PRICE_YEAR} a year.
              If you change your mind, reply to that email and you are off the list.
            </p>
          </div>
        ) : (
          <div style={{ marginTop: '26px' }}>
            <Question
              title={`At $${PRICE_YEAR} a year, is this:`}
              options={PRICE_REACTION_OPTIONS}
              value={reaction}
              onChange={chooseReaction}
              grid
            />
            <button
              type="button"
              onClick={join}
              disabled={busy}
              style={{
                width: '100%', marginTop: '22px', padding: '18px', borderRadius: '12px', border: 'none',
                background: BLUE, color: '#FFFFFF', fontSize: '16px', fontWeight: 800, cursor: busy ? 'not-allowed' : 'pointer',
                boxShadow: '0 8px 20px -6px rgba(27,109,252,0.6)', opacity: busy ? 0.6 : 1, fontFamily: 'inherit',
              }}
            >
              {busy ? 'Adding you...' : 'Join the founding list'}
            </button>
            <p style={{ fontSize: '12px', color: MUTED, textAlign: 'center', margin: '10px 0 0' }}>
              No payment. One email to confirm, then nothing until it opens.
            </p>
            {error && <p style={{ fontSize: '13px', color: '#DC2626', textAlign: 'center', margin: '10px 0 0' }}>{error}</p>}
          </div>
        )}
      </div>
    )
  }

  // ── The questions ────────────────────────────────────────────────────
  return (
    <div>
      <div style={{ padding: '28px 0 30px' }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: BLUE_DARK, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 16px' }}>
          Body Recode · two minutes
        </p>
        <h1 style={{ fontSize: 'clamp(34px, 7vw, 48px)', fontWeight: 900, letterSpacing: '-0.035em', lineHeight: 1.06, margin: '0 0 18px', color: INK }}>
          Your body has changed.
          <br />
          <span style={{ color: BLUE }}>Find out why.</span>
        </h1>
        <p style={{ fontSize: '17px', color: BODY, lineHeight: 1.7, margin: 0 }}>
          Training hard and getting nowhere, or not training at all and your body just feels off. Two minutes of quick
          questions, then your readiness and your likely pattern straight away, and a first look at what we are
          building next.
        </p>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: BODY, fontWeight: 600 }}>{answered} of {total} answered</span>
          <span style={{ fontSize: '12px', color: BLUE_DARK, fontWeight: 700 }}>{Math.round((answered / total) * 100)}%</span>
        </div>
        <div style={{ height: '4px', background: LINE, borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${(answered / total) * 100}%`, background: BLUE, borderRadius: '99px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      <Part label="Part 1 · Where you are right now">
        <Question title="Are you training at the moment?" options={TRAINING_OPTIONS} value={training} onChange={chooseTraining} grid />
        {sections.map(s => (
          <Question
            key={s.key}
            title={s.title}
            options={s.rows.map(r => ({ value: String(r.score), label: r.desc }))}
            value={scores[s.key] != null ? String(scores[s.key]) : null}
            onChange={v => setScores(prev => ({ ...prev, [s.key]: Number(v) }))}
          />
        ))}
      </Part>

      <Part label="Part 2 · A few things about your body">
        <Question title="Biological sex" options={SEX_OPTIONS} value={sex} onChange={setSex} grid />
        <Question title="Age" options={AGE_OPTIONS} value={age} onChange={setAge} grid />
        <Question title="Where do you tend to store fat?" options={STORAGE_OPTIONS} value={storage} onChange={setStorage} />
        {female && (
          <>
            <Question title="Has where it sits changed over the last few years?" options={DIRECTION_OPTIONS} value={direction} onChange={setDirection} />
            <Question title="Where are you in your cycle?" options={CYCLE_OPTIONS} value={cycle} onChange={setCycle} grid />
          </>
        )}
      </Part>

      <Part label="Part 3 · About you">
        <Question title="How soon do you want to start making changes?" options={START_OPTIONS} value={start} onChange={setStart} />
        <Question title="Roughly what have you spent on your health and body in the last year? Coaching, programs, apps, supplements, tests." options={SPENT_OPTIONS} value={spent} onChange={setSpent} grid />
        <Question title="If you had a plan built for you, where would you train?" options={WHERE_OPTIONS} value={where} onChange={setWhere} grid />
        <Question title="Would you want a coach talking you through your sessions, in your ear?" options={VOICE_OPTIONS} value={voice} onChange={setVoice} />
      </Part>

      <Part label="Your result">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }} className="lt-2col">
          <input style={input} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First name" autoComplete="given-name" aria-label="First name" />
          <input style={input} value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" type="email" autoComplete="email" aria-label="Email" />
        </div>
        <p style={{ fontSize: '12.5px', color: MUTED, lineHeight: 1.6, margin: '-12px 0 0' }}>
          Your answers include health information. We use them to show you your result and, if you join the founding
          list, to build what you are joining. We only email you if you join. <a href="/privacy" style={{ color: BLUE_DARK }}>Privacy policy</a>.
        </p>
        <div>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit || busy}
            style={{
              width: '100%', padding: '18px', borderRadius: '12px', border: 'none', fontFamily: 'inherit',
              background: canSubmit ? BLUE : LINE, color: canSubmit ? '#FFFFFF' : MUTED,
              fontSize: '16px', fontWeight: 800, cursor: canSubmit && !busy ? 'pointer' : 'not-allowed',
              boxShadow: canSubmit ? '0 8px 20px -6px rgba(27,109,252,0.6)' : 'none',
            }}
          >
            {busy ? 'Reading your answers...' : complete ? 'Show my result' : `Answer all ${total} to see your result`}
          </button>
          {error && <p style={{ fontSize: '13px', color: '#DC2626', textAlign: 'center', margin: '10px 0 0' }}>{error}</p>}
        </div>
      </Part>
    </div>
  )
}
