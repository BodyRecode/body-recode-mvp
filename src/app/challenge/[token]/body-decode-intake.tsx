'use client'

import { useState } from 'react'
import { brand } from "@/config/tenant";

// Mirrors the public scorecard SECTIONS structure verbatim. Same 5 sections,
// same 1-3 scoring, same wording. An enroller's signal here reads the same
// as it would on /scorecard.
const SECTIONS = [
  {
    key: '01' as const,
    title: 'Energy',
    rows: [
      { score: 1, desc: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.' },
      { score: 2, desc: 'Inconsistent. Some good days, some bad. Not reliable.' },
      { score: 3, desc: 'Steady energy through the day. No need for caffeine to function.' },
    ],
  },
  {
    key: '02' as const,
    title: 'Sleep',
    rows: [
      { score: 1, desc: 'Poor quality. Waking through the night. Not rested in the morning.' },
      { score: 2, desc: 'Okay most nights but not consistently recovering.' },
      { score: 3, desc: 'Sleeping well. Waking rested. Recovery feels solid.' },
    ],
  },
  {
    key: '03' as const,
    title: 'Stress Load',
    rows: [
      { score: 1, desc: 'High stress. Work, life, or emotional load is significant and ongoing.' },
      { score: 2, desc: 'Moderate. Manageable most of the time but not low.' },
      { score: 3, desc: 'Low to moderate. Not carrying a heavy chronic stress load right now.' },
    ],
  },
  {
    key: '04' as const,
    title: 'Training Response',
    rows: [
      { score: 1, desc: 'Not progressing. Performance is flat or declining. Body feels beaten up.' },
      { score: 2, desc: 'Some progress but inconsistent. Hard to build momentum.' },
      { score: 3, desc: 'Responding well. Getting stronger, fitter, recovering between sessions.' },
    ],
  },
  {
    key: '05' as const,
    title: 'Fat Loss Response',
    rows: [
      { score: 1, desc: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.' },
      { score: 2, desc: 'Slow or stalled. Some movement but not matching the input.' },
      { score: 3, desc: 'Body is responding. Composition is shifting in the right direction.' },
    ],
  },
]

type QualifierAnswer = 'A' | 'B' | 'C' | 'D'

const APPROACH_OPTIONS: { value: QualifierAnswer; label: string }[] = [
  { value: 'A', label: 'I look at what my body is doing and adjust' },
  { value: 'B', label: 'I give it more time and stay consistent' },
  { value: 'C', label: 'I push harder and expect it to break through' },
  { value: 'D', label: 'I get frustrated and want the program changed immediately' },
]

// Day 0 forward-intent question. Replaces the scorecard's
// investment_readiness — that question makes no sense at the entry to a
// free Challenge ("ready to invest in 1-on-1?" right after taking the
// free thing reads as bait-and-switch and tags ~all cold-paid enrollers
// as freebie hunters). This asks where they'd ascend TO instead — a
// forward-fit question that aligns with the state-routed result card
// they're about to see.
const ASCENSION_INTENT_OPTIONS: { value: QualifierAnswer; label: string }[] = [
  { value: 'A', label: 'Want my body fully decoded — the 6-week Blueprint' },
  { value: 'B', label: 'Want ongoing coaching rhythm — Membership' },
  { value: 'C', label: 'Want 1:1 work with Kade' },
  { value: 'D', label: 'Not sure yet — let me see what the Challenge surfaces' },
]

type BiologicalSex = 'M' | 'F'
type AgeBand = 'under_35' | '35_44' | '45_54' | '55_plus'
type FatStorage = 'midsection' | 'posterior' | 'hips_thighs' | 'all_over' | 'low_tone'
type CycleStatus = 'regular' | 'irregular' | 'perimenopausal' | 'postmenopausal'

const SEX_OPTIONS: { value: BiologicalSex; label: string }[] = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
]
const AGE_OPTIONS: { value: AgeBand; label: string }[] = [
  { value: 'under_35', label: 'Under 35' },
  { value: '35_44', label: '35-44' },
  { value: '45_54', label: '45-54' },
  { value: '55_plus', label: '55+' },
]
const STORAGE_OPTIONS: { value: FatStorage; label: string }[] = [
  { value: 'midsection', label: 'Belly and front of the stomach' },
  { value: 'posterior', label: 'Lower back, love handles and upper back' },
  { value: 'hips_thighs', label: 'Hips, thighs and lower body' },
  { value: 'all_over', label: 'Softening all over, fairly evenly' },
  { value: 'low_tone', label: 'Losing muscle tone and definition' },
]
const CYCLE_OPTIONS: { value: CycleStatus; label: string }[] = [
  { value: 'regular', label: 'Regular cycle' },
  { value: 'irregular', label: 'Irregular cycle' },
  { value: 'perimenopausal', label: 'Perimenopausal' },
  { value: 'postmenopausal', label: 'Postmenopausal' },
]

export interface IntakeResult {
  score: number
  body_state: 'Depleted State' | 'Transitioning State' | 'Ready State'
  section_scores?: Partial<Record<'01' | '02' | '03' | '04' | '05', number>>
  profile: string | null
  profile_confidence: 'high' | 'low' | null
  profile_driver: string | null
  profile_descriptor: string
}

// Pill-style option button (radio). Used by demographics + qualifiers.
function PillOption({ selected, label, onClick, compact }: {
  selected: boolean
  label: string
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        background: selected ? 'rgba(27,109,252,0.08)' : '#FFFFFF',
        border: `1.5px solid ${selected ? '#1B6DFC' : '#E5E5E5'}`,
        borderRadius: '12px', padding: compact ? '12px 14px' : '14px 16px',
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'all 0.15s ease', fontFamily: 'inherit',
      }}
    >
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
        background: selected ? '#1B6DFC' : '#FFFFFF',
        border: `1.5px solid ${selected ? '#1B6DFC' : '#D4D4D4'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {selected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#FFFFFF' }} />}
      </div>
      <span style={{ fontSize: '14px', color: selected ? '#1056D6' : '#3A3A3A', fontWeight: selected ? 600 : 500, lineHeight: 1.45 }}>
        {label}
      </span>
    </button>
  )
}

// Section scoring row with red/amber/blue score colouring — mirrors the
// public scorecard's section card pattern (score 1 = red Depleted,
// score 2 = amber Transitioning, score 3 = Signal Blue Ready).
function ScoreSection({ section, selected, onSelect }: {
  section: typeof SECTIONS[number]
  selected: number | null
  onSelect: (score: number) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {section.key}
        </span>
        <h2 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.01em', color: '#1A1A1A', margin: 0 }}>
          {section.title}
        </h2>
        {selected && (
          <span style={{ marginLeft: 'auto', fontSize: '11px', fontWeight: 700, color: '#1056D6' }}>
            {selected} / 3
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {section.rows.map(row => {
          const isSelected = selected === row.score
          const scoreColor = row.score === 1 ? '#DC2626' : row.score === 2 ? '#B7791F' : '#1056D6'
          const accentRgba = row.score === 1 ? '239,68,68' : row.score === 2 ? '245,158,11' : '27,109,252'
          return (
            <button
              key={row.score}
              onClick={() => onSelect(row.score)}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '14px',
                background: isSelected ? `rgba(${accentRgba},0.10)` : '#FFFFFF',
                border: `1.5px solid ${isSelected ? scoreColor : '#E5E5E5'}`,
                borderRadius: '12px', padding: '14px 16px',
                cursor: 'pointer', textAlign: 'left', width: '100%',
                transition: 'all 0.15s ease', fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: isSelected ? `rgba(${accentRgba},0.18)` : '#F5F5F5',
                border: `1.5px solid ${isSelected ? scoreColor : '#D4D4D4'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 800, color: isSelected ? scoreColor : '#6B6B6B',
              }}>
                {row.score}
              </div>
              <p style={{
                fontSize: '14px',
                color: isSelected ? scoreColor : '#3A3A3A',
                fontWeight: isSelected ? 600 : 500,
                lineHeight: 1.6, flex: 1, margin: 0,
              }}>
                {row.desc}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function BodyDecodeIntakeForm({ token, onComplete }: {
  token: string
  onComplete: (result: IntakeResult) => void
}) {
  const [scores, setScores] = useState<Partial<Record<'01' | '02' | '03' | '04' | '05', number>>>({})
  const [approach, setApproach] = useState<QualifierAnswer | null>(null)
  const [ascensionIntent, setAscensionIntent] = useState<QualifierAnswer | null>(null)
  const [sex, setSex] = useState<BiologicalSex | null>(null)
  const [age, setAge] = useState<AgeBand | null>(null)
  const [storage, setStorage] = useState<FatStorage | null>(null)
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const sectionsAnswered = SECTIONS.filter(s => scores[s.key] != null).length
  const allScores = sectionsAnswered === SECTIONS.length
  const allDemo = !!sex && !!age && !!storage && (sex !== 'F' || !!cycle)
  const allQualifiers = !!approach && !!ascensionIntent
  const complete = allScores && allDemo && allQualifiers

  // Live progress out of 9 question groups (5 sections + sex + age + storage + 2 qualifiers
  // — cycle only counts for females, so unweighted denominator is 9 male / 10 female).
  const totalQuestions = (sex === 'F' ? 10 : 9)
  const answeredQuestions =
    sectionsAnswered +
    (sex ? 1 : 0) +
    (age ? 1 : 0) +
    (storage ? 1 : 0) +
    (sex === 'F' && cycle ? 1 : 0) +
    (approach ? 1 : 0) +
    (ascensionIntent ? 1 : 0)
  const progressPct = Math.round((answeredQuestions / totalQuestions) * 100)

  async function handleSubmit() {
    if (!complete || submitting) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/challenge/day-zero-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          section_scores: scores,
          approach_response: approach,
          ascension_intent: ascensionIntent,
          biological_sex: sex,
          age_band: age,
          fat_storage: storage,
          cycle_status: sex === 'F' ? cycle : null,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j.error || 'Submit failed')
      }
      const data: IntakeResult = await res.json()
      onComplete(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div>

      {/* HERO — bleed out of the parent padding so the radial glows reach
          the page edges, mirroring the public scorecard's full-bleed hero. */}
      <div style={{ position: 'relative', overflow: 'hidden', margin: '0 -24px 32px', padding: '0 24px' }}>
        <div style={{
          position: 'absolute', top: '-140px', right: '-140px',
          width: '500px', height: '500px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.14) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '0', left: '-100px',
          width: '340px', height: '340px', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(27, 109, 252, 0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', padding: '16px 0 24px' }}>

          {/* Badge pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            background: 'rgba(27, 109, 252,0.1)', border: '1px solid rgba(27, 109, 252,0.25)',
            borderRadius: '99px', padding: '7px 16px', marginBottom: '20px',
          }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1B6DFC' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Body Decode Intake
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 46px)', fontWeight: 900,
            letterSpacing: '-0.035em', lineHeight: 1.08, margin: '0 0 22px', color: '#1A1A1A',
          }}>
            Before we start,
            <br />
            <span style={{ color: '#1B6DFC' }}>let&apos;s read your body.</span>
          </h1>

          {/* Divider line */}
          <div style={{ width: '48px', height: '3px', background: '#1B6DFC', borderRadius: '2px', marginBottom: '24px' }} />

          {/* Lead paragraph */}
          <p style={{ fontSize: '16px', color: '#4A4A4A', lineHeight: 1.7, margin: '0 0 28px' }}>
            Two minutes. The same questions every {brand().name} client answers at the start. This tells us what your body is actually doing right now and shapes what you see across the next 14 days.
                                </p>

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
            {[
              { value: '2 min', label: 'To complete' },
              { value: `${totalQuestions}`, label: 'Questions' },
              { value: 'Now', label: 'Get your read' },
            ].map(stat => (
              <div key={stat.label} style={{
                background: '#FFFFFF', border: '1px solid #E5E5E5',
                borderRadius: '12px', padding: '14px',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: '20px', fontWeight: 900, color: '#1B6DFC', margin: '0 0 4px', letterSpacing: '-0.02em' }}>{stat.value}</p>
                <p style={{ fontSize: '10px', color: '#6B6B6B', margin: 0, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* PROGRESS */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#4A4A4A', fontWeight: 600 }}>
            {answeredQuestions} of {totalQuestions} answered
          </span>
          <span style={{ fontSize: '12px', color: '#1056D6', fontWeight: 700 }}>{progressPct}%</span>
        </div>
        <div style={{ height: '4px', background: '#E5E5E5', borderRadius: '99px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: '#1B6DFC', borderRadius: '99px', width: `${progressPct}%`, transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* SECTIONS */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 18px' }}>
          Part 1 · Where you are right now
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {SECTIONS.map(s => (
            <ScoreSection
              key={s.key}
              section={s}
              selected={scores[s.key] ?? null}
              onSelect={n => setScores(prev => ({ ...prev, [s.key]: n }))}
            />
          ))}
        </div>
      </div>

      {/* DEMOGRAPHICS */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 18px' }}>
          Part 2 · A few things about your body
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>Biological sex</p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {SEX_OPTIONS.map(o => (
                <div key={o.value} style={{ flex: 1 }}>
                  <PillOption selected={sex === o.value} label={o.label} onClick={() => setSex(o.value)} compact />
                </div>
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>Age</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {AGE_OPTIONS.map(o => (
                <PillOption key={o.value} selected={age === o.value} label={o.label} onClick={() => setAge(o.value)} compact />
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>Where do you tend to store fat?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {STORAGE_OPTIONS.map(o => (
                <PillOption key={o.value} selected={storage === o.value} label={o.label} onClick={() => setStorage(o.value)} compact />
              ))}
            </div>
          </div>

          {sex === 'F' && (
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>Cycle status</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                {CYCLE_OPTIONS.map(o => (
                  <PillOption key={o.value} selected={cycle === o.value} label={o.label} onClick={() => setCycle(o.value)} compact />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* QUALIFIERS */}
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.12em', textTransform: 'uppercase', margin: '0 0 18px' }}>
          Part 3 · How you approach this
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>
              When something stops working, what do you usually do?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {APPROACH_OPTIONS.map(o => (
                <PillOption key={o.value} selected={approach === o.value} label={o.label} onClick={() => setApproach(o.value)} compact />
              ))}
            </div>
          </div>

          <div>
            <p style={{ fontSize: '14px', fontWeight: 700, color: '#1A1A1A', marginBottom: '10px' }}>
              If the Challenge points at something deeper, where would you want to go next?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {ASCENSION_INTENT_OPTIONS.map(o => (
                <PillOption key={o.value} selected={ascensionIntent === o.value} label={o.label} onClick={() => setAscensionIntent(o.value)} compact />
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!complete || submitting}
        style={{
          width: '100%', padding: '18px', borderRadius: '12px', border: 'none',
          background: complete ? '#1B6DFC' : '#E5E5E5',
          color: complete ? '#FFFFFF' : '#6B6B6B',
          fontSize: '16px', fontWeight: 800, letterSpacing: '-0.01em',
          cursor: complete && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
          boxShadow: complete ? '0 8px 20px -6px rgba(27,109,252,0.6)' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
        }}
      >
        {submitting ? 'Reading your state...' : complete
          ? <>Reveal my body state <span aria-hidden>→</span></>
          : `Answer all ${totalQuestions} to continue`}
      </button>
    </div>
  )
}
