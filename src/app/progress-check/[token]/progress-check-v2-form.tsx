'use client'

/**
 * The near-full Progress Check. Spec: 02_FEATURE_SPECS/2026-09-13_Progress_Check_Spec.md
 *
 * Reveal on commit (spec 3): each question appears with no previous answer
 * visible. Once she commits her new answer, what she said last time appears
 * beside it. She can say an old answer was never right, which is saved as its
 * own record and never changes the old answer (3.2). A question she was not
 * asked last time says so, and is never presented as a change (3.3).
 *
 * "Committed" means answered for buttons, and left the box with something
 * written for free text, so her last answer does not appear on the first
 * keystroke.
 *
 * Saves to the server as she goes (spec 5). Photos are the exception and travel
 * with the final submit.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { QuestionInput, isAnswered, type FormValue } from '@/components/intake-question-input'
import type { Question } from '@/lib/intake-questions'
import { PROGRESS_CHECK_V2_SECTIONS, isRequiredV2, isVisibleV2, WHAT_CHANGED_ID } from '@/lib/progress-check-v2'
import { SELF_REPORTED_CHANGE_IDS } from '@/lib/answer-comparison'
import { compressImage, isUnreadableImageFormat } from '@/lib/compress-image'
import { brand } from '@/config/tenant'

type Answers = Record<string, FormValue>
export type DisputeDraft = { questionId: string; shouldHaveBeen: string | number; note: string }

interface Props {
  token: string
  firstName: string
  coachFirstName: string
  checkinFirstHref: string | null
  previous: Answers
  gender: string | null
  initialAnswers: Answers
  initialDisputes: DisputeDraft[]
  initialSection: number
}

const SECTIONS = PROGRESS_CHECK_V2_SECTIONS
// Screen 0 is the explanation, then one screen per section, then measurements and photos.
const LAST_SCREEN = SECTIONS.length + 1

function formatValue(q: Question, v: unknown): string {
  if (v == null) return ''
  if (Array.isArray(v)) return v.join(', ')
  if (q.type === 'scale') return `${v} of 4`
  return String(v)
}

function RevealPanel({
  q, value, previous, dispute, onDispute, onRemoveDispute,
}: {
  q: Question
  value: FormValue | undefined
  previous: unknown
  dispute: DisputeDraft | undefined
  onDispute: (d: DisputeDraft) => void
  onRemoveDispute: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [pick, setPick] = useState<string | number | null>(dispute?.shouldHaveBeen ?? null)
  const [note, setNote] = useState(dispute?.note ?? '')

  if (SELF_REPORTED_CHANGE_IDS.has(q.id)) {
    return <p className="mt-3 text-[13px] text-[#666D7A] leading-relaxed">This one asks about the time since your last read, so there is nothing to compare it with.</p>
  }

  const hasPrevious = previous != null && !(Array.isArray(previous) && previous.length === 0) && previous !== ''
  if (!hasPrevious) {
    return <p className="mt-3 text-[13px] text-[#666D7A] leading-relaxed">We didn&apos;t ask you this last time, so this is your first answer.</p>
  }

  const same = JSON.stringify(previous) === JSON.stringify(value)
  const canDispute = q.type === 'scale' || q.type === 'select'

  return (
    <div className="mt-3 rounded-2xl bg-[#F3F7FF] border border-[#D6E4FD] px-4 py-3.5">
      <p className="text-[13px] text-[#43474F] leading-relaxed">
        <span className="font-semibold text-[#141821]">Last time: </span>
        {formatValue(q, previous)}
        {q.type !== 'text' && (same ? ' · the same as now' : ` · now ${formatValue(q, value)}`)}
      </p>

      {canDispute && dispute && !editing && (
        <div className="mt-2">
          <p className="text-[13px] text-[#43474F] leading-relaxed">
            You said last time&apos;s answer should have been <span className="font-semibold">{formatValue(q, dispute.shouldHaveBeen)}</span>
            {dispute.note ? ` (${dispute.note})` : ''}. Your original answer stays on record beside your correction.
          </p>
          <div className="flex gap-4 mt-1.5">
            <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-semibold text-[#1B6DFC]">Change</button>
            <button type="button" onClick={onRemoveDispute} className="text-[13px] font-semibold text-[#666D7A]">Remove</button>
          </div>
        </div>
      )}

      {canDispute && !dispute && !editing && (
        <button type="button" onClick={() => setEditing(true)} className="mt-1.5 text-[13px] font-semibold text-[#1B6DFC]">
          That old answer wasn&apos;t right
        </button>
      )}

      {canDispute && editing && (
        <div className="mt-3">
          <p className="text-[13px] font-semibold text-[#141821] mb-2">What should last time&apos;s answer have been?</p>
          <div className={q.type === 'scale' ? 'flex gap-2' : 'flex flex-col gap-2'}>
            {(q.type === 'scale' ? [0, 1, 2, 3, 4] : q.options ?? []).map(opt => (
              <button
                key={String(opt)}
                type="button"
                aria-pressed={pick === opt}
                onClick={() => setPick(opt)}
                className={`${q.type === 'scale' ? 'flex-1' : 'text-left'} min-h-[44px] px-3 py-2.5 rounded-xl text-[14px] font-semibold border-2 transition-colors ${
                  pick === opt ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white' : 'bg-white border-[#E8EAEE] text-[#43474F]'
                }`}
              >
                {String(opt)}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            placeholder="Optional: what was going on?"
            className="mt-2 w-full bg-white rounded-xl px-3 py-2.5 text-[14px] text-[#141821] border border-[#E8EAEE] focus:outline-none focus:ring-2 focus:ring-[#1B6DFC]/30 resize-none"
          />
          <div className="flex gap-4 mt-2">
            <button
              type="button"
              disabled={pick === null || pick === previous}
              onClick={() => { if (pick !== null) { onDispute({ questionId: q.id, shouldHaveBeen: pick, note: note.trim() }); setEditing(false) } }}
              className="text-[13px] font-semibold text-white bg-[#1B6DFC] px-4 py-2 rounded-lg disabled:opacity-40"
            >
              Save correction
            </button>
            <button type="button" onClick={() => setEditing(false)} className="text-[13px] font-semibold text-[#666D7A]">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProgressCheckV2Form(props: Props) {
  const { token, firstName, coachFirstName, checkinFirstHref, previous, gender } = props
  const router = useRouter()
  const [answers, setAnswers] = useState<Answers>(props.initialAnswers)
  const [disputes, setDisputes] = useState<DisputeDraft[]>(props.initialDisputes)
  const [screen, setScreen] = useState<number>(Math.min(Math.max(props.initialSection, 0), LAST_SCREEN))
  // Free text is committed when she leaves the box. Anything loaded from a save is already committed.
  const [textCommitted, setTextCommitted] = useState<Set<string>>(
    () => new Set(Object.entries(props.initialAnswers).filter(([, v]) => typeof v === 'string' && v.trim() !== '').map(([k]) => k)),
  )
  const [errors, setErrors] = useState<Set<string>>(new Set())
  const [validation, setValidation] = useState('')
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  // Measurements, photos and confirmation.
  const [bodyweight, setBodyweight] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [chest, setChest] = useState('')
  const [photos, setPhotos] = useState<Record<string, File | null>>({ photoFront: null, photoSide: null, photoBack: null })
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [unreadable, setUnreadable] = useState<Set<string>>(new Set())
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const disputeById = useMemo(() => new Map(disputes.map(d => [d.questionId, d])), [disputes])

  // Save as she goes, debounced. The server copy is the one that survives a closed tab.
  const firstRender = useRef(true)
  const save = useCallback(async (a: Answers, d: DisputeDraft[], s: number) => {
    setSaveState('saving')
    try {
      const res = await fetch('/api/progress-check/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: a, disputes: d, section: s }),
      })
      setSaveState(res.ok ? 'saved' : 'error')
    } catch {
      setSaveState('error')
    }
  }, [token])
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    const t = setTimeout(() => { void save(answers, disputes, screen) }, 1200)
    return () => clearTimeout(t)
  }, [answers, disputes, screen, save])

  function setValue(id: string, v: FormValue) {
    setAnswers(prev => ({ ...prev, [id]: v }))
    if (errors.has(id)) setErrors(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  function toggle(id: string, opt: string) {
    const cur = (answers[id] as string[]) || []
    setValue(id, cur.includes(opt) ? cur.filter(x => x !== opt) : [...cur, opt])
  }

  function go(next: number) {
    setScreen(next)
    setTimeout(() => window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior }), 0)
  }

  function missingIn(sectionIdx: number): string[] {
    const s = SECTIONS[sectionIdx]
    return s.questions
      .filter(q => isVisibleV2(q, answers, previous, gender))
      .filter(q => isRequiredV2(q) && !isAnswered(q, answers[q.id]))
      .map(q => q.id)
  }

  function continueFrom(sectionIdx: number) {
    const missed = missingIn(sectionIdx)
    if (missed.length) {
      setErrors(new Set(missed))
      setValidation(missed.length === 1 ? '1 question still needs an answer.' : `${missed.length} questions still need an answer.`)
      setTimeout(() => document.getElementById(`q-${missed[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 60)
      return
    }
    setValidation('')
    go(sectionIdx + 2)
  }

  async function pickPhoto(id: string, file: File | null) {
    if (!file) {
      setPhotos(p => ({ ...p, [id]: null }))
      setUnreadable(prev => { const n = new Set(prev); n.delete(id); return n })
      return
    }
    setProcessing(prev => new Set(prev).add(id))
    try {
      const compressed = await compressImage(file)
      setPhotos(p => ({ ...p, [id]: compressed }))
      setUnreadable(prev => { const n = new Set(prev); if (isUnreadableImageFormat(compressed)) n.add(id); else n.delete(id); return n })
    } finally {
      setProcessing(prev => { const n = new Set(prev); n.delete(id); return n })
    }
  }

  const num = (v: string) => v.trim() !== '' && Number.isFinite(parseFloat(v))
  const measurementsGiven = num(bodyweight) && num(waist) && num(hips) && num(chest)
  const allPhotos = Boolean(photos.photoFront && photos.photoSide && photos.photoBack)
  const unansweredSections = SECTIONS.map((_, i) => i).filter(i => missingIn(i).length > 0)

  async function submit() {
    if (unansweredSections.length) { go(unansweredSections[0] + 1); return }
    setSubmitting(true)
    setSubmitError(null)
    const fd = new FormData()
    fd.append('token', token)
    fd.append('responses', JSON.stringify(answers))
    fd.append('disputes', JSON.stringify(disputes))
    fd.append('bodyweight', bodyweight)
    fd.append('waist', waist)
    fd.append('hips', hips)
    fd.append('chest', chest)
    for (const [k, f] of Object.entries(photos)) if (f) fd.append(k, f)
    const res = await fetch('/api/submit-progress-check', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) { router.refresh(); return }
    setSubmitError(data.error ?? 'Something went wrong. Your answers are saved, so please try again.')
    setSubmitting(false)
  }

  const progressPct = Math.round((screen / LAST_SCREEN) * 100)

  return (
    <div className="min-h-screen bg-[#FBFCFD] px-5 py-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase">{brand().name}™ · Progress Check</p>
          <p className="text-[12px] text-[#98A0AD]" aria-live="polite">
            {saveState === 'saving' ? 'Saving…' : saveState === 'saved' ? 'Saved' : saveState === 'error' ? 'Not saved, check your connection' : ''}
          </p>
        </div>
        {screen > 0 && (
          <div className="h-1.5 bg-[#E8EAEE] rounded-full mb-8 overflow-hidden">
            <div className="h-full bg-[#1B6DFC] transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        )}

        {screen === 0 && (
          <div>
            <h1 className="text-[28px] font-extrabold text-[#141821] tracking-tight leading-tight mb-5">
              {firstName ? `${firstName}, it's time to look at everything again.` : "It's time to look at everything again."}
            </h1>
            <div className="space-y-4 text-[15px] text-[#43474F] leading-relaxed">
              <p>This is your Progress Check. It is how {coachFirstName} writes your Progress Read: what has moved since your last read, and what hasn&apos;t.</p>
              <p><strong className="text-[#141821]">Most of these questions you will recognise.</strong> That is deliberate. You are answering the same questions so they can be compared, not because anything was lost.</p>
              <p><strong className="text-[#141821]">Answer each one fresh.</strong> Once you have, you will see what you said last time beside it.</p>
              <p><strong className="text-[#141821]">If an old answer was never right,</strong> you can say so. Your correction is kept alongside the original.</p>
              <p>It takes about <strong className="text-[#141821]">15 to 20 minutes</strong>, most of it tapping a number. It saves as you go, so you can stop and come back.</p>
            </div>

            {checkinFirstHref && (
              <div className="rounded-2xl border border-[#B5CFFC] bg-[#F3F7FF] p-5 mt-6">
                <p className="text-[13px] font-semibold text-[#141821] mb-1">Your weekly check-in is open this weekend</p>
                <p className="text-[13px] text-[#43474F] leading-relaxed">If you have a few minutes, do that one first. It is the shorter of the two and it closes Sunday evening. This will still be here afterwards.</p>
                <a href={checkinFirstHref} className="inline-block mt-3 text-[13px] font-semibold text-[#1B6DFC]">Go to my check-in →</a>
              </div>
            )}

            <div className="bg-white border border-[#E8EAEE] rounded-2xl p-5 mt-6">
              <p className="text-[13px] font-semibold text-[#141821] mb-2">For the last step, have these ready</p>
              <ul className="text-[13px] text-[#43474F] leading-relaxed space-y-1">
                <li>· Scales and a tape measure: weight, waist, hips and chest</li>
                <li>· Somewhere to take three photos: front, side and back</li>
              </ul>
            </div>

            <button onClick={() => go(1)} className="mt-8 w-full sm:w-auto bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors">
              {Object.keys(props.initialAnswers).length ? 'Carry on where I left off' : 'Start'}
            </button>
          </div>
        )}

        {screen >= 1 && screen < LAST_SCREEN && (() => {
          const sIdx = screen - 1
          const section = SECTIONS[sIdx]
          const visible = section.questions.filter(q => isVisibleV2(q, answers, previous, gender))
          return (
            <div>
              <p className="text-[12px] text-[#98A0AD] mb-1">Section {screen} of {SECTIONS.length}</p>
              <h2 className="text-[22px] font-extrabold text-[#141821] tracking-tight mb-2">{section.title}</h2>
              <p className="text-[14px] text-[#666D7A] leading-relaxed mb-8 whitespace-pre-line">{section.description}</p>
              <div className="space-y-9">
                {visible.map(q => {
                  const value = answers[q.id]
                  const committed = q.type === 'text' ? textCommitted.has(q.id) && isAnswered(q, value) : isAnswered(q, value)
                  return (
                    <div
                      key={q.id}
                      id={`q-${q.id}`}
                      onBlur={q.type === 'text' ? () => { if (isAnswered(q, answers[q.id])) setTextCommitted(prev => new Set(prev).add(q.id)) } : undefined}
                    >
                      <QuestionInput
                        question={q}
                        value={value}
                        onChange={v => setValue(q.id, v)}
                        onToggle={opt => toggle(q.id, opt)}
                        hasError={errors.has(q.id)}
                      />
                      {committed && q.id !== WHAT_CHANGED_ID && (
                        <RevealPanel
                          q={q}
                          value={value}
                          previous={previous[q.id]}
                          dispute={disputeById.get(q.id)}
                          onDispute={d => setDisputes(prev => [...prev.filter(x => x.questionId !== d.questionId), d])}
                          onRemoveDispute={() => setDisputes(prev => prev.filter(x => x.questionId !== q.id))}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
              {validation && <p className="mt-6 text-[14px] text-[#C82626]">{validation}</p>}
              <div className="flex items-center gap-3 mt-10">
                <button onClick={() => go(screen - 1)} className="px-6 py-3.5 rounded-full border border-[#CFD4DC] text-[#43474F] font-semibold">Back</button>
                <button onClick={() => continueFrom(sIdx)} className="flex-1 sm:flex-none bg-[#1B6DFC] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#1056D6] transition-colors">Continue</button>
              </div>
            </div>
          )
        })()}

        {screen === LAST_SCREEN && (
          <div>
            <h2 className="text-[22px] font-extrabold text-[#141821] tracking-tight mb-2">Measurements and photos</h2>
            <p className="text-[14px] text-[#666D7A] leading-relaxed mb-7">
              This is the part that shows what has changed rather than tells you. Same conditions as last time if you can: morning, before eating, same lighting.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-8">
              {[
                { id: 'bodyweight', label: 'Weight (kg)', value: bodyweight, set: setBodyweight },
                { id: 'waist', label: 'Waist (cm)', value: waist, set: setWaist },
                { id: 'hips', label: 'Hips (cm)', value: hips, set: setHips },
                { id: 'chest', label: 'Chest (cm)', value: chest, set: setChest },
              ].map(f => (
                <div key={f.id}>
                  <label htmlFor={`pc-${f.id}`} className="block text-[14px] font-semibold text-[#141821] mb-2">{f.label}</label>
                  <input
                    id={`pc-${f.id}`}
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    className="w-full rounded-xl border border-[#CFD4DC] px-3 py-3 text-[16px] text-[#141821] focus:border-[#1B6DFC] focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <p className="text-[15px] font-semibold text-[#141821] mb-1">Progress photos</p>
            <p className="text-[13px] text-[#666D7A] leading-relaxed mb-4">Front, side and back, relaxed stance, no flexing. Only your coach sees these.</p>
            <div className="space-y-3">
              {[
                { id: 'photoFront', label: 'Front, relaxed stance' },
                { id: 'photoSide', label: 'Side, natural posture' },
                { id: 'photoBack', label: 'Back, relaxed arms' },
              ].map(({ id, label }) => (
                <div key={id} className="bg-white border border-[#E8EAEE] rounded-2xl p-4">
                  <p className="text-[14px] font-medium text-[#141821] mb-2">{label}</p>
                  {processing.has(id) ? (
                    <p className="text-[13px] text-[#666D7A]">Optimising photo…</p>
                  ) : photos[id] ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[13px] text-[#43474F] truncate">{photos[id]!.name}</p>
                      <button type="button" onClick={() => pickPhoto(id, null)} className="text-[13px] text-[#666D7A] shrink-0">Remove</button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-[#CFD4DC] rounded-xl p-5 text-center text-[13px] text-[#666D7A]">Tap to upload</div>
                      <input type="file" accept="image/*" capture="environment" className="hidden" data-photo={id} onChange={e => pickPhoto(id, e.target.files?.[0] ?? null)} />
                    </label>
                  )}
                  {unreadable.has(id) && (
                    <p className="text-[12px] text-[#A96A12] mt-2 leading-relaxed">This photo is in HEIC format, which can&apos;t be read for the visual read. It will still save. iPhone: Settings, Camera, Formats, Most Compatible, then retake it.</p>
                  )}
                </div>
              ))}
            </div>

            <button type="button" onClick={() => setConfirmed(c => !c)} className="flex items-start gap-3 text-left w-full mt-8">
              <span className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${confirmed ? 'bg-[#1B6DFC]' : 'bg-white border-2 border-[#CFD4DC]'}`}>
                {confirmed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </span>
              <span className="text-[15px] leading-relaxed text-[#43474F]">I have answered honestly, for how things have actually been, not my best or worst days.</span>
            </button>

            {unansweredSections.length > 0 && (
              <p className="mt-6 text-[14px] text-[#C82626]">
                {unansweredSections.length === 1 ? 'One section still has' : `${unansweredSections.length} sections still have`} unanswered questions.{' '}
                <button type="button" onClick={() => go(unansweredSections[0] + 1)} className="font-semibold underline">Take me there</button>
              </p>
            )}
            {submitError && <p className="mt-4 text-[14px] text-[#C82626]">{submitError}</p>}

            <div className="flex items-center gap-3 mt-8">
              <button onClick={() => go(screen - 1)} className="px-6 py-3.5 rounded-full border border-[#CFD4DC] text-[#43474F] font-semibold">Back</button>
              <button
                onClick={submit}
                disabled={submitting || !measurementsGiven || !allPhotos || !confirmed || unansweredSections.length > 0}
                className="flex-1 sm:flex-none bg-[#1B6DFC] text-white font-bold px-8 py-3.5 rounded-full hover:bg-[#1056D6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending…' : 'Submit Progress Check'}
              </button>
            </div>
            <p className="mt-3 text-[13px] text-[#666D7A]">
              {!measurementsGiven ? 'Measurements still needed. ' : ''}
              {!allPhotos ? 'Photos still needed. ' : ''}
              {measurementsGiven && allPhotos && !confirmed ? 'Tick the box above to submit.' : ''}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
