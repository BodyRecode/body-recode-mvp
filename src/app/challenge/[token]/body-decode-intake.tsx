'use client'

import { useState } from 'react'

// Mirrors the scorecard SECTIONS structure. Same 5 sections, same 1-3 scoring.
// Wording is identical to the scorecard so an enroller's signal reads the same
// here as it would on /scorecard.
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

const INVESTMENT_OPTIONS: { value: QualifierAnswer; label: string }[] = [
  { value: 'A', label: 'Yes - ready to invest in 1-on-1 coaching now' },
  { value: 'B', label: 'Within the next 1-3 months' },
  { value: 'C', label: 'Just exploring for now' },
  { value: 'D', label: 'Looking for free resources only' },
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
  profile: string | null
  profile_confidence: 'high' | 'low' | null
  profile_driver: string | null
  profile_descriptor: string
}

function OptionButton({ selected, label, onClick, compact }: {
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

function ScoreRow({ section, selected, onSelect }: {
  section: typeof SECTIONS[number]
  selected: number | null
  onSelect: (score: number) => void
}) {
  return (
    <div>
      <p style={{ fontSize: '11px', fontWeight: 700, color: '#1B6DFC', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {section.key} · {section.title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {section.rows.map(r => (
          <OptionButton
            key={r.score}
            selected={selected === r.score}
            label={r.desc}
            onClick={() => onSelect(r.score)}
          />
        ))}
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
  const [investment, setInvestment] = useState<QualifierAnswer | null>(null)
  const [sex, setSex] = useState<BiologicalSex | null>(null)
  const [age, setAge] = useState<AgeBand | null>(null)
  const [storage, setStorage] = useState<FatStorage | null>(null)
  const [cycle, setCycle] = useState<CycleStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const allScores = SECTIONS.every(s => scores[s.key] != null)
  const allDemo = !!sex && !!age && !!storage && (sex !== 'F' || !!cycle)
  const allQualifiers = !!approach && !!investment
  const complete = allScores && allDemo && allQualifiers

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
          investment_readiness: investment,
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Intro */}
      <div style={{
        background: 'rgba(27,109,252,0.06)', border: '1px solid rgba(27,109,252,0.2)',
        borderRadius: '12px', padding: '18px 20px',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#1056D6', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
          Body Decode Intake · 3 minutes
        </p>
        <p style={{ fontSize: '13px', color: '#4A4A4A', lineHeight: 1.7, margin: 0 }}>
          Before you begin, let&apos;s read your starting state. This tells us what your body is actually doing right now and confirms the Challenge is your fit. Your answers stay private and shape what you see across the next 14 days.
        </p>
      </div>

      {/* Section scores */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          Where you are right now
        </p>
        {SECTIONS.map(s => (
          <ScoreRow
            key={s.key}
            section={s}
            selected={scores[s.key] ?? null}
            onSelect={n => setScores(prev => ({ ...prev, [s.key]: n }))}
          />
        ))}
      </div>

      {/* Demographics */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          A few things about your body
        </p>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>Biological sex</p>
          <div style={{ display: 'flex', gap: '8px' }}>
            {SEX_OPTIONS.map(o => (
              <div key={o.value} style={{ flex: 1 }}>
                <OptionButton selected={sex === o.value} label={o.label} onClick={() => setSex(o.value)} compact />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>Age</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {AGE_OPTIONS.map(o => (
              <OptionButton key={o.value} selected={age === o.value} label={o.label} onClick={() => setAge(o.value)} compact />
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>Where do you tend to store fat?</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STORAGE_OPTIONS.map(o => (
              <OptionButton key={o.value} selected={storage === o.value} label={o.label} onClick={() => setStorage(o.value)} compact />
            ))}
          </div>
        </div>

        {sex === 'F' && (
          <div>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>Cycle status</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {CYCLE_OPTIONS.map(o => (
                <OptionButton key={o.value} selected={cycle === o.value} label={o.label} onClick={() => setCycle(o.value)} compact />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Qualifiers */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: '#4A4A4A', letterSpacing: '0.12em', textTransform: 'uppercase', margin: 0 }}>
          How you approach this
        </p>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>
            When something stops working, what do you usually do?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {APPROACH_OPTIONS.map(o => (
              <OptionButton key={o.value} selected={approach === o.value} label={o.label} onClick={() => setApproach(o.value)} compact />
            ))}
          </div>
        </div>

        <div>
          <p style={{ fontSize: '13px', fontWeight: 600, color: '#3A3A3A', marginBottom: '10px' }}>
            How ready are you to invest in resolving this?
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {INVESTMENT_OPTIONS.map(o => (
              <OptionButton key={o.value} selected={investment === o.value} label={o.label} onClick={() => setInvestment(o.value)} compact />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: '13px', color: '#DC2626', margin: 0 }}>{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!complete || submitting}
        style={{
          width: '100%', padding: '16px', borderRadius: '10px', border: 'none',
          background: complete ? '#1B6DFC' : '#E5E5E5',
          color: complete ? '#FFFFFF' : '#4A4A4A',
          fontSize: '15px', fontWeight: 700,
          cursor: complete && !submitting ? 'pointer' : 'not-allowed',
          transition: 'all 0.2s ease',
        }}
      >
        {submitting ? 'Reading your state...' : 'Reveal my body state'}
      </button>
    </div>
  )
}
