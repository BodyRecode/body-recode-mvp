'use client'

import { useState } from 'react'

interface Props {
  clientId: string
  clientName: string
}

type Step = 'intro' | 'measurements' | 'photos' | 'submitting' | 'done'

export default function BaselineForm({ clientId, clientName }: Props) {
  const [step, setStep] = useState<Step>('intro')
  const [error, setError] = useState('')

  // Measurements
  const [bodyweight, setBodyweight] = useState('')
  const [waist, setWaist] = useState('')
  const [hips, setHips] = useState('')
  const [chest, setChest] = useState('')

  // Photos
  const [photoFront, setPhotoFront] = useState<File | null>(null)
  const [photoSide, setPhotoSide] = useState<File | null>(null)
  const [photoBack, setPhotoBack] = useState<File | null>(null)

  const firstName = clientName.split(' ')[0]

  const handleSubmit = async () => {
    setStep('submitting')
    setError('')

    const formData = new FormData()
    formData.append('clientId', clientId)
    formData.append('bodyweight', bodyweight)
    formData.append('waist', waist)
    formData.append('hips', hips)
    formData.append('chest', chest)
    if (photoFront) formData.append('photoFront', photoFront)
    if (photoSide) formData.append('photoSide', photoSide)
    if (photoBack) formData.append('photoBack', photoBack)

    const res = await fetch('/api/submit-baseline', { method: 'POST', body: formData })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setStep('photos')
      return
    }

    setStep('done')
  }

  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4"><a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-teal-400 uppercase">Body Recode™</a></p>
          <h1 className="text-2xl font-bold text-white mb-3">Baseline received.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">Baseline documentation protects interpretive integrity. It allows exposure to be guided by structure rather than emotion. This marks the starting calibration point of your coaching arc.</p>
          <p className="text-stone-500 text-xs mt-4">Your coach will review your documentation and your Deliberate Start Window will begin shortly.</p>
        </div>
      </div>
    )
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-400 text-sm">Submitting your baseline…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4"><a href="https://bodyrecode.au" className="text-xs font-bold tracking-widest text-teal-400 uppercase">Body Recode™</a></p>
          <h1 className="text-2xl font-bold text-white mb-1">Baseline Documentation</h1>
          <p className="text-stone-400 text-sm">Hi {firstName} — this is a formal calibration event, not a cosmetic assessment.</p>
        </div>

        {/* STEP: Intro */}
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="bg-stone-900 rounded-2xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-white">Before you start</h2>
              <p className="text-stone-400 text-sm leading-relaxed">This documentation establishes your structural reference point for all future interpretation. It exists to protect interpretive precision — accuracy matters, appearance does not.</p>
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
                    <div className="w-5 h-5 rounded-full bg-teal-400/10 border border-teal-400/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                    </div>
                    <p className="text-stone-300 text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep('measurements')}
              className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors"
            >
              I'm ready — continue
            </button>
          </div>
        )}

        {/* STEP: Measurements */}
        {step === 'measurements' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Measurements</h2>
              <p className="text-stone-500 text-sm">Record in the units shown. Use a soft tape, don't compress tissue.</p>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Morning bodyweight', unit: 'kg', value: bodyweight, set: setBodyweight, helper: 'After using the bathroom, before food' },
                { label: 'Waist circumference', unit: 'cm', value: waist, set: setWaist, helper: 'At narrowest point or just above navel' },
                { label: 'Hip circumference', unit: 'cm', value: hips, set: setHips, helper: 'At widest point of hips and glutes' },
                { label: 'Chest circumference', unit: 'cm', value: chest, set: setChest, helper: 'At nipple line while relaxed' },
              ].map(({ label, unit, value, set, helper }) => (
                <div key={label} className="bg-stone-900 rounded-2xl p-5">
                  <label className="block text-sm font-medium text-white mb-1">{label}</label>
                  <p className="text-stone-500 text-xs mb-3">{helper}</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      value={value}
                      onChange={e => set(e.target.value)}
                      placeholder="0.0"
                      className="flex-1 bg-stone-800 text-white text-base rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
                    />
                    <span className="text-stone-400 text-sm font-medium w-8">{unit}</span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('photos')}
              disabled={!bodyweight || !waist || !hips || !chest}
              className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue to photos
            </button>
          </div>
        )}

        {/* STEP: Photos */}
        {step === 'photos' && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-white">Composition documentation</h2>
              <p className="text-stone-500 text-sm">Three positions required. Images must reflect structural reality, not posed presentation.</p>
            </div>

            <div className="bg-stone-900 rounded-2xl p-5 space-y-2">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Photo standards</p>
              <ul className="space-y-1.5 text-stone-400 text-sm">
                <li>· Minimal, consistent clothing — neutral colours, no compression garments</li>
                <li>· Natural light where possible — face the light source</li>
                <li>· Camera at mid-torso height, level angle, full body in frame</li>
                <li>· Relaxed stance — no flexing or postural exaggeration</li>
              </ul>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Front — relaxed stance', file: photoFront, set: setPhotoFront },
                { label: 'Side — natural posture', file: photoSide, set: setPhotoSide },
                { label: 'Back — relaxed arms', file: photoBack, set: setPhotoBack },
              ].map(({ label, file, set }) => (
                <div key={label} className="bg-stone-900 rounded-2xl p-5">
                  <p className="text-sm font-medium text-white mb-3">{label}</p>
                  {file ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-teal-400/10 flex items-center justify-center">
                          <svg className="w-4 h-4 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-stone-300 text-sm truncate max-w-[180px]">{file.name}</span>
                      </div>
                      <button onClick={() => set(null)} className="text-stone-500 text-xs hover:text-white">Remove</button>
                    </div>
                  ) : (
                    <label className="block cursor-pointer">
                      <div className="border-2 border-dashed border-stone-700 rounded-xl p-6 text-center hover:border-teal-400/50 transition-colors">
                        <svg className="w-6 h-6 text-stone-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <p className="text-stone-500 text-sm">Tap to upload</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={e => set(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </div>
              ))}
            </div>

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!photoFront || !photoSide || !photoBack}
              className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Submit baseline
            </button>

            <button onClick={() => setStep('measurements')} className="w-full text-stone-500 text-sm py-2 hover:text-white transition-colors">
              ← Back to measurements
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
