'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PROGRESS_CHECK_SECTIONS } from '@/lib/progress-check-questions'
import { compressImage, isUnreadableImageFormat } from '@/lib/compress-image'
import { brand } from '@/config/tenant'

export default function ProgressCheckForm({ token, firstName }: { token: string; firstName: string }) {
  const router = useRouter()
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Measurements + photos. Every baseline on file was captured in week one,
  // so the business has no before-and-after for anyone. The capture only ever
  // existed as a one-off onboarding task; putting it here makes the milestone
  // the thing that produces the comparison.
  const [bodyweight, setBodyweight] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [chest, setChest] = useState('')
  const [photoFront, setPhotoFront] = useState<File | null>(null)
  const [photoSide, setPhotoSide] = useState<File | null>(null)
  const [photoBack, setPhotoBack] = useState<File | null>(null)
  const [processing, setProcessing] = useState<Set<string>>(new Set())
  const [unreadable, setUnreadable] = useState<Set<string>>(new Set())
  // An explicit choice, not a silent omission: the client either provides the
  // photos or says she cannot this time, and the coach sees which.
  const [skipPhotos, setSkipPhotos] = useState(false)

  async function handlePhotoPick(id: string, file: File | null, set: (f: File | null) => void) {
    if (!file) {
      set(null)
      setUnreadable(prev => { const next = new Set(prev); next.delete(id); return next })
      return
    }
    setProcessing(prev => new Set(prev).add(id))
    try {
      const compressed = await compressImage(file)
      set(compressed)
      setUnreadable(prev => {
        const next = new Set(prev)
        if (isUnreadableImageFormat(compressed)) next.add(id)
        else next.delete(id)
        return next
      })
    } finally {
      setProcessing(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const set = (id: string, value: string) => setResponses(r => ({ ...r, [id]: value }))

  // Required = every scale + every select question (these drive the re-score).
  // Text fields are optional.
  const requiredIds = PROGRESS_CHECK_SECTIONS.flatMap(s =>
    s.questions.filter(q => q.type === 'scale' || q.type === 'select').map(q => q.id),
  )
  const answeredCount = requiredIds.filter(id => (responses[id] ?? '').trim() !== '').length
  const allPhotos = Boolean(photoFront && photoSide && photoBack)
  const photosSettled = allPhotos || skipPhotos
  const weightGiven = bodyweight.trim() !== '' && Number.isFinite(parseFloat(bodyweight))
  const canSubmit =
    answeredCount === requiredIds.length && weightGiven && photosSettled && !submitting

  async function submit() {
    setSubmitting(true)
    setError(null)
    // Multipart, because the photos travel with the answers. One submission,
    // so a client can never end up with answers on file and no capture.
    const fd = new FormData()
    fd.append('token', token)
    fd.append('responses', JSON.stringify(responses))
    fd.append('bodyweight', bodyweight)
    fd.append('waist', waist)
    fd.append('hips', hips)
    fd.append('chest', chest)
    fd.append('photosSkipped', skipPhotos && !allPhotos ? 'true' : 'false')
    if (photoFront) fd.append('photoFront', photoFront)
    if (photoSide) fd.append('photoSide', photoSide)
    if (photoBack) fd.append('photoBack', photoBack)
    const res = await fetch('/api/submit-progress-check', { method: 'POST', body: fd })
    const data = await res.json().catch(() => ({}))
    if (res.ok && data.ok) { router.refresh(); return }
    setError(data.error ?? 'Something went wrong. Please try again.')
    setSubmitting(false)
  }

  const SCALE = [0, 1, 2, 3, 4]

  return (
    <div className="min-h-screen bg-[#F7F7F7] px-5 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#1B6DFC] uppercase mb-3">{brand().name}™ · Progress Check</p>
        <h1 className="text-3xl font-extrabold text-[#1A1A1A] tracking-tight mb-3">
          {firstName ? `${firstName}, a quick read on where you are now.` : 'A quick read on where you are now.'}
        </h1>
        <p className="text-[#4A4A4A] leading-relaxed mb-10">
          A few minutes on how your body has been across the last few weeks. This is what lets me re-score your state and show you what has actually moved. Answer for your usual experience, not just today.
        </p>

        {PROGRESS_CHECK_SECTIONS.map(section => (
          <div key={section.id} className="bg-white border border-[#E5E5E5] rounded-2xl p-6 md:p-7 mb-5">
            <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-1">{section.title}</h2>
            <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-6">{section.description}</p>

            <div className="space-y-7">
              {section.questions.map(q => (
                <div key={q.id}>
                  <p className="text-[15px] font-semibold text-[#1A1A1A] leading-snug mb-3">{q.text}</p>

                  {q.type === 'scale' && (
                    <div>
                      <div className="flex gap-2">
                        {SCALE.map(n => {
                          const active = responses[q.id] === String(n)
                          return (
                            <button
                              key={n}
                              type="button"
                              onClick={() => set(q.id, String(n))}
                              className={`flex-1 h-11 rounded-lg border text-sm font-bold transition-colors ${active ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white' : 'bg-white border-[#D4D4D4] text-[#3A3A3A] hover:border-[#1B6DFC]'}`}
                            >
                              {n}
                            </button>
                          )
                        })}
                      </div>
                      {q.scaleLabel && (
                        <div className="flex justify-between mt-1.5 text-[11px] text-[#999999]">
                          <span>{q.scaleLabel.low}</span>
                          <span>{q.scaleLabel.high}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {q.type === 'select' && q.options && (
                    <div className="flex flex-col sm:flex-row gap-2">
                      {q.options.map(opt => {
                        const active = responses[q.id] === opt
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => set(q.id, opt)}
                            className={`flex-1 px-4 py-3 rounded-lg border text-sm font-semibold text-left transition-colors ${active ? 'bg-[#1B6DFC]/5 border-[#1B6DFC] text-[#1A1A1A]' : 'bg-white border-[#D4D4D4] text-[#3A3A3A] hover:border-[#1B6DFC]'}`}
                          >
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {q.type === 'text' && (
                    <textarea
                      value={responses[q.id] ?? ''}
                      onChange={e => set(q.id, e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[#D4D4D4] p-3 text-sm text-[#1A1A1A] leading-relaxed focus:border-[#1B6DFC] focus:outline-none resize-y"
                      placeholder="Optional"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Measurements and photos - the milestone capture. */}
        <div className="bg-white border border-[#E5E5E5] rounded-2xl p-6 md:p-7 mb-5">
          <h2 className="text-lg font-extrabold text-[#1A1A1A] mb-1">Measurements and photos</h2>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-6">
            This is the part that lets me show you what has actually changed rather than tell you.
            Same conditions as last time if you can - morning, before eating, same lighting.
          </p>

          <div className="grid grid-cols-2 gap-4 mb-7">
            {[
              { id: 'bodyweight', label: 'Weight (kg)', value: bodyweight, set: setBodyweight, required: true },
              { id: 'waist', label: 'Waist (cm)', value: waist, set: setWaist, required: false },
              { id: 'hips', label: 'Hips (cm)', value: hips, set: setHips, required: false },
              { id: 'chest', label: 'Chest (cm)', value: chest, set: setChest, required: false },
            ].map(f => (
              <div key={f.id}>
                <label htmlFor={`pc-${f.id}`} className="block text-[13px] font-semibold text-[#1A1A1A] mb-2">
                  {f.label}
                  {!f.required && <span className="font-normal text-[#999999]"> · optional</span>}
                </label>
                <input
                  id={`pc-${f.id}`}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  value={f.value}
                  onChange={e => f.set(e.target.value)}
                  className="w-full rounded-lg border border-[#D4D4D4] px-3 py-3 text-[15px] text-[#1A1A1A] focus:border-[#1B6DFC] focus:outline-none"
                  placeholder="-"
                />
              </div>
            ))}
          </div>

          <p className="text-[15px] font-semibold text-[#1A1A1A] leading-snug mb-1">Progress photos</p>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed mb-4">
            Three photos, same as your first set - front, side and back, relaxed stance, no flexing.
            Only I ever see these.
          </p>

          <div className="space-y-4">
            {[
              { id: 'photoFront', label: 'Front - relaxed stance', file: photoFront, set: setPhotoFront },
              { id: 'photoSide', label: 'Side - natural posture', file: photoSide, set: setPhotoSide },
              { id: 'photoBack', label: 'Back - relaxed arms', file: photoBack, set: setPhotoBack },
            ].map(({ id, label, file, set }) => {
              const isProcessing = processing.has(id)
              return (
                <div key={id} className="bg-[#F7F7F7] rounded-2xl p-5">
                  <p className="text-sm font-medium text-[#1A1A1A] mb-3">{label}</p>
                  {isProcessing ? (
                    <div className="flex items-center gap-3 py-2">
                      <div className="w-5 h-5 border-2 border-[#1B6DFC] border-t-transparent rounded-full animate-spin" />
                      <span className="text-[#6B6B6B] text-sm">Optimising photo…</span>
                    </div>
                  ) : file ? (
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[#4A4A4A] text-sm truncate">{file.name}</p>
                      <button type="button" onClick={() => set(null)} className="text-[#6B6B6B] text-xs hover:text-[#1A1A1A] shrink-0">Remove</button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-[#D4D4D4] rounded-xl p-6 text-center hover:border-[#1B6DFC]/50 transition-colors">
                        <p className="text-[#6B6B6B] text-sm">Tap to upload</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => handlePhotoPick(id, e.target.files?.[0] ?? null, set)}
                      />
                    </label>
                  )}
                  {unreadable.has(id) && (
                    <p className="text-amber-700 text-xs mt-2 leading-relaxed">
                      This photo is in HEIC format, which we can&apos;t read for the visual read. It will
                      still save, but to get the full read switch your camera to JPEG and retake it —
                      iPhone: Settings → Camera → Formats → Most Compatible.
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {!allPhotos && (
            <label className="flex items-start gap-3 mt-5 cursor-pointer">
              <input
                type="checkbox"
                checked={skipPhotos}
                onChange={e => setSkipPhotos(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#1B6DFC]"
              />
              <span className="text-[13px] text-[#4A4A4A] leading-relaxed">
                I can&apos;t take photos this time. Send the rest without them.
              </span>
            </label>
          )}
        </div>

        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <div className="flex items-center gap-4 mt-2">
          <button
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center justify-center bg-[#1B6DFC] text-white font-bold px-8 py-4 rounded-full text-base hover:bg-[#1056D6] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Sending…' : 'Submit Progress Check'}
          </button>
          <span className="text-[13px] text-[#6B6B6B]">
            {answeredCount} / {requiredIds.length} answered
            {answeredCount === requiredIds.length && !weightGiven && ' · weight still needed'}
            {answeredCount === requiredIds.length && weightGiven && !photosSettled && ' · photos still needed'}
          </span>
        </div>
      </div>
    </div>
  )
}
