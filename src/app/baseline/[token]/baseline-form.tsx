'use client'

import { useState } from 'react'
import ClientHeader from '@/components/client-header'
import { useFormDraft } from '@/lib/use-form-draft'
import { compressImage, isUnreadableImageFormat } from '@/lib/compress-image'
import { logoUrl, brand } from '@/config/tenant'

interface Props {
  clientId: string
  clientName: string
  portalHref?: string | null
  /** Last recorded height. When present the field is hidden and this value is reused. */
  knownHeightCm?: number | null
}

type Step = 'intro' | 'measurements' | 'photos' | 'submitting' | 'done'

type PersistedStep = 'intro' | 'measurements' | 'photos' | 'done'
type Draft = {
  step: PersistedStep
  bodyweight: string
  waist: string
  hips: string
  chest: string
  height: string
}

export default function BaselineForm(props: Props) {
  const { clientId, clientName, portalHref } = props
  const [draft, setDraft, clearDraft] = useFormDraft<Draft>(`baseline:${clientId}`, {
    step: 'intro',
    bodyweight: '',
    waist: '',
    hips: '',
    chest: '',
    height: '',
  })
  const [submittingNow, setSubmittingNow] = useState(false)
  const step: Step = submittingNow ? 'submitting' : draft.step
  const setStep = (s: Step) => {
    if (s === 'submitting') { setSubmittingNow(true); return }
    setSubmittingNow(false)
    setDraft(prev => ({ ...prev, step: s }))
  }
  const bodyweight = draft.bodyweight
  const setBodyweight = (v: string) => setDraft(prev => ({ ...prev, bodyweight: v }))
  const waist = draft.waist
  const setWaist = (v: string) => setDraft(prev => ({ ...prev, waist: v }))
  const hips = draft.hips
  const setHips = (v: string) => setDraft(prev => ({ ...prev, hips: v }))
  const chest = draft.chest
  const setChest = (v: string) => setDraft(prev => ({ ...prev, chest: v }))
  // Height is asked ONCE. On a re-capture the last known value is passed in and
  // this field is not shown, because height does not change between check-ins
  // and re-asking it every time is friction for no information.
  const height = draft.height
  const setHeight = (v: string) => setDraft(prev => ({ ...prev, height: v }))
  const needHeight = props.knownHeightCm == null
  const [error, setError] = useState('')

  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null)
  const [photoSide, setPhotoSide] = useState<File | null>(null)
  const [photoBack, setPhotoBack] = useState<File | null>(null)
  const [processing, setProcessing] = useState<Set<string>>(new Set())

  // Photos whose format we could not convert to JPEG in the browser. These
  // still upload, so onboarding is never blocked, but we tell the client now
  // so they can retake rather than have the visual read silently skipped.
  const [unreadable, setUnreadable] = useState<Set<string>>(new Set())

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
      clearMissing(id)
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

  // Validation flags for each missed field
  const [missing, setMissing] = useState<Set<string>>(new Set())
  const [validationMessage, setValidationMessage] = useState('')

  function clearMissing(id: string) {
    if (!missing.has(id)) return
    setMissing(prev => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const firstName = clientName.split(' ')[0]

  const handleContinueMeasurements = () => {
    const missed = new Set<string>()
    if (!bodyweight.trim()) missed.add('bodyweight')
    if (!waist.trim()) missed.add('waist')
    if (!hips.trim()) missed.add('hips')
    if (!chest.trim()) missed.add('chest')
    if (needHeight && !height.trim()) missed.add('height')
    if (missed.size > 0) {
      setMissing(missed)
      setValidationMessage(
        missed.size === 1
          ? '1 measurement still needs an answer.'
          : `${missed.size} measurements still need an answer.`
      )
      return
    }
    setMissing(new Set())
    setValidationMessage('')
    setStep('photos')
  }

  const handleSubmit = async () => {
    if (processing.size > 0) {
      setError('One of your photos is still being optimised. Try again in a moment.')
      return
    }

    const missed = new Set<string>()
    if (!photoFront) missed.add('photoFront')
    if (!photoSide) missed.add('photoSide')
    if (!photoBack) missed.add('photoBack')
    if (missed.size > 0) {
      setMissing(missed)
      setValidationMessage(
        missed.size === 1
          ? '1 photo still needs to be uploaded.'
          : `${missed.size} photos still need to be uploaded.`
      )
      return
    }

    setMissing(new Set())
    setValidationMessage('')
    setStep('submitting')
    setError('')

    const formData = new FormData()
    formData.append('clientId', clientId)
    formData.append('bodyweight', bodyweight)
    formData.append('waist', waist)
    formData.append('hips', hips)
    formData.append('chest', chest)
    formData.append('height', needHeight ? height : String(props.knownHeightCm))
    if (photoFront) formData.append('photoFront', photoFront)
    if (photoSide) formData.append('photoSide', photoSide)
    if (photoBack) formData.append('photoBack', photoBack)

    let res: Response
    try {
      res = await fetch('/api/submit-baseline', { method: 'POST', body: formData })
    } catch {
      setError('Could not reach the server. Check your connection and try again.')
      setStep('photos')
      return
    }

    if (!res.ok) {
      if (res.status === 413) {
        setError('Your photos are too large to upload. Remove and re-take each photo - the form will optimise them automatically.')
      } else {
        setError(`Something went wrong while saving your baseline (status ${res.status}). Please try again, or contact your coach if it keeps happening.`)
      }
      setStep('photos')
      return
    }

    clearDraft()
    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-[#EFF5FE] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <img src={logoUrl()} width="110" alt={brand().name} style={{ display: 'block', margin: '0 auto 20px' }} />
          <h1 className="text-2xl font-bold text-[#141821] mb-3">Baseline received.</h1>
          <p className="text-[#666D7A] text-sm leading-relaxed">Baseline documentation protects interpretive integrity. It allows exposure to be guided by structure rather than emotion. This marks the starting calibration point of your coaching arc.</p>
          <p className="text-[#98A0AD] text-xs mt-4 mb-7">Your coach will review your documentation and your Deliberate Start Window will begin shortly.</p>
          {portalHref && (
            <a
              href={portalHref}
              className="inline-flex items-center gap-2 bg-[#1B6DFC] text-white text-sm font-bold px-6 py-3 rounded-xl hover:bg-[#1560E0] transition-colors"
            >
              Back to your portal
            </a>
          )}
        </div>
      </div>
    )
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-[#FFFFFF] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 border-2 border-[#1B6DFC] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#666D7A] text-sm">Submitting your baseline…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#141821]">
      <ClientHeader homeHref={portalHref} />
      <div className="max-w-lg mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-[#141821] mb-1">Baseline Documentation</h1>
          <p className="text-[#666D7A] text-sm">Hi {firstName} — this is a formal calibration event, not a cosmetic assessment.</p>
        </div>

        {/* STEP: Intro */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="bg-[#F4F6F9] rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-[#141821]">Before you start</h2>
              <p className="text-[#666D7A] text-sm leading-relaxed">This documentation establishes your structural reference point for all future interpretation. It exists to protect interpretive precision — accuracy matters, appearance does not.</p>
              <div className="space-y-3 pt-2">
                {[
                  'Complete this in the morning, before food or training',
                  'Use the bathroom first',
                  'Be in a calm, regulated state',
                  'Do not restrict food or manipulate hydration beforehand',
                  'Do not perform excessive training beforehand',
                  'Do not attempt to optimise your appearance',
                  'Repeat all future re-captures at the same time of day under the same conditions',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#1B6DFC]/10 border border-[#1B6DFC]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#1B6DFC]" />
                    </div>
                    <p className="text-[#43474F] text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep('measurements')}
              className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#1056D6] transition-colors"
            >
              I'm ready — continue
            </button>
          </div>
        )}

        {/* STEP: Measurements */}
        {step === 'measurements' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#141821]">Measurements</h2>
              <p className="text-[#666D7A] text-sm">Record in the units shown. Use a soft tape, don't compress tissue.</p>
            </div>

            {validationMessage && (
              <div className="border-l-2 border-[#DC2626] bg-[#FDEDED] rounded-r-2xl px-4 py-3">
                <p className="text-[#C82626] text-sm font-medium">{validationMessage}</p>
                <p className="text-[#C82626]/70 text-xs mt-1">Missing fields are highlighted in red below.</p>
              </div>
            )}

            <div className="space-y-4">
              {[
                { id: 'bodyweight', label: 'Morning bodyweight', unit: 'kg', value: bodyweight, set: setBodyweight, helper: 'After using the bathroom, before food' },
                { id: 'waist', label: 'Waist circumference', unit: 'cm', value: waist, set: setWaist, helper: 'At narrowest point or just above navel' },
                { id: 'hips', label: 'Hip circumference', unit: 'cm', value: hips, set: setHips, helper: 'At widest point of hips and glutes' },
                { id: 'chest', label: 'Chest circumference', unit: 'cm', value: chest, set: setChest, helper: 'At nipple line while relaxed' },
                ...(needHeight
                  ? [{ id: 'height', label: 'Height', unit: 'cm', value: height, set: setHeight, helper: 'Without shoes. We only need this once.' }]
                  : []),
              ].map(({ id, label, unit, value, set, helper }) => {
                const hasError = missing.has(id)
                return (
                  <div key={label} className={`bg-[#F4F6F9] rounded-2xl p-5 ${hasError ? 'border-l-2 border-[#DC2626]' : ''}`}>
                    <label className={`block text-sm font-medium mb-1 ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>{label}</label>
                    <p className="text-[#666D7A] text-xs mb-3">{helper}</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        value={value}
                        onChange={e => { set(e.target.value); clearMissing(id) }}
                        placeholder="0.0"
                        className={`flex-1 bg-[#EFF1F4] text-[#141821] text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#1B6DFC]/50 placeholder-[#98A0AD] border ${hasError ? 'border-red-400' : 'border-transparent'}`}
                      />
                      <span className="text-[#666D7A] text-sm font-medium w-8">{unit}</span>
                    </div>
                    {hasError && <p className="text-[#C82626] text-xs mt-2 font-medium">Please enter a value.</p>}
                  </div>
                )
              })}
            </div>

            <button
              onClick={handleContinueMeasurements}
              className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#1056D6] transition-colors"
            >
              Continue to photos
            </button>
          </div>
        )}

        {/* STEP: Photos */}
        {step === 'photos' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[#141821]">Composition documentation</h2>
              <p className="text-[#666D7A] text-sm">Three positions required. Images must reflect structural reality, not posed presentation.</p>
            </div>

            {validationMessage && (
              <div className="border-l-2 border-[#DC2626] bg-[#FDEDED] rounded-r-2xl px-4 py-3">
                <p className="text-[#C82626] text-sm font-medium">{validationMessage}</p>
                <p className="text-[#C82626]/70 text-xs mt-1">Missing photos are highlighted in red below.</p>
              </div>
            )}

            <div className="bg-[#F4F6F9] rounded-2xl p-5 space-y-2">
              <p className="text-[12.5px] font-semibold text-[#666D7A]">Photo standards</p>
              <ul className="space-y-1.5 text-[#666D7A] text-sm">
                <li>· Minimal, consistent clothing — neutral colours, no compression garments</li>
                <li>· Natural light where possible — face the light source</li>
                <li>· Camera at mid-torso height, level angle, full body in frame</li>
                <li>· Relaxed stance — no flexing or postural exaggeration</li>
              </ul>
            </div>

            <div className="space-y-4">
              {[
                { id: 'photoFront', label: 'Front - relaxed stance', file: photoFront, set: setPhotoFront },
                { id: 'photoSide', label: 'Side - natural posture', file: photoSide, set: setPhotoSide },
                { id: 'photoBack', label: 'Back - relaxed arms', file: photoBack, set: setPhotoBack },
              ].map(({ id, label, file, set }) => {
                const hasError = missing.has(id)
                const isProcessing = processing.has(id)
                return (
                  <div key={label} className={`bg-[#F4F6F9] rounded-2xl p-5 ${hasError ? 'border-l-2 border-[#DC2626]' : ''}`}>
                    <p className={`text-sm font-medium mb-3 ${hasError ? 'text-[#C82626]' : 'text-[#141821]'}`}>{label}</p>
                    {isProcessing ? (
                      <div className="flex items-center gap-3 py-2">
                        <div className="w-5 h-5 border-2 border-[#1B6DFC] border-t-transparent rounded-full animate-spin" />
                        <span className="text-[#666D7A] text-sm">Optimising photo...</span>
                      </div>
                    ) : file ? (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-[#1B6DFC]/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[#43474F] text-sm truncate max-w-[180px]">{file.name}</p>
                            <p className="text-[#666D7A] text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button onClick={() => set(null)} className="text-[#666D7A] text-xs hover:text-[#141821]">Remove</button>
                      </div>
                    ) : (
                      <label className="block cursor-pointer">
                        <div className={`border-2 border-dashed rounded-xl p-6 text-center hover:border-[#1B6DFC]/50 transition-colors ${hasError ? 'border-red-400' : 'border-[#E8EAEE]'}`}>
                          <svg className="w-6 h-6 text-[#666D7A] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                          </svg>
                          <p className="text-[#666D7A] text-sm">Tap to upload</p>
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
                    {hasError && <p className="text-[#C82626] text-xs mt-2 font-medium">Please upload this photo.</p>}
                    {unreadable.has(id) && (
                      <p className="text-[#A96A12] text-xs mt-2 leading-relaxed">
                        This photo is in HEIC format, which we can&apos;t read for the visual assessment.
                        Your baseline will still save, but to get the full read please switch your camera
                        to JPEG and retake it — iPhone: Settings → Camera → Formats → Most Compatible.
                        Samsung: Camera → Settings → turn off HEIF/high efficiency pictures.
                      </p>
                    )}
                  </div>
                )
              })}
            </div>

            {error && <p className="text-[#C82626] text-sm text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              className="w-full bg-[#1B6DFC] text-white text-sm font-bold py-4 rounded-2xl hover:bg-[#1056D6] transition-colors"
            >
              Submit baseline
            </button>

            <button onClick={() => { setMissing(new Set()); setValidationMessage(''); setStep('measurements') }} className="w-full text-[#666D7A] text-sm py-2 hover:text-[#141821] transition-colors">
              ← Back to measurements
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
