'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  clientName: string
}

const PAR_Q = [
  'Has your doctor ever said that you have a heart condition and that you should only do physical activity recommended by a doctor?',
  'Do you feel pain in your chest when you do physical activity?',
  'In the past month, have you had chest pain when you were not doing physical activity?',
  'Do you lose your balance because of dizziness, or do you ever lose consciousness?',
  'Do you have a bone or joint problem that could be made worse by a change in your physical activity?',
  'Is your doctor currently prescribing drugs for your blood pressure or heart condition?',
  'Do you know of any other reason why you should not do physical activity?',
]

export default function HealthDeclarationForm({ clientId, clientName }: Props) {
  const router = useRouter()
  const firstName = clientName.split(' ')[0]

  const [parqAnswers, setParqAnswers] = useState<Record<number, boolean>>({})
  const [requiresClearance, setRequiresClearance] = useState<boolean | null>(null)
  const [conditions, setConditions] = useState('')

  const [checks, setChecks] = useState({
    completedParq: false,
    disclosedConditions: false,
    willNotify: false,
    understandsRisks: false,
    acceptsResponsibility: false,
    followsGuidance: false,
    dataConsent: false,
    liabilityWaiver: false,
  })

  const [step, setStep] = useState<'parq' | 'declaration' | 'submitting' | 'done'>('parq')
  const [error, setError] = useState('')

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const parqComplete = PAR_Q.every((_, i) => parqAnswers[i] !== undefined)
  const anyParqYes = Object.values(parqAnswers).some(v => v === true)
  const allChecked = Object.values(checks).every(Boolean) && requiresClearance !== null

  const handleSubmit = async () => {
    setStep('submitting')
    setError('')

    const res = await fetch('/api/portal/submit-health-declaration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId,
        parqAnswers,
        requiresClearance: requiresClearance || anyParqYes,
        conditions,
        checks,
      }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setStep('declaration')
      return
    }

    setStep('done')
    setTimeout(() => router.push('/portal/dashboard'), 2000)
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
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-3">Declaration received.</h1>
          <p className="text-stone-400 text-sm">Your health declaration has been submitted. Your coach will review it shortly.</p>
        </div>
      </div>
    )
  }

  if (step === 'submitting') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="w-10 h-10 border-2 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Health Declaration</h1>
          <p className="text-stone-400 text-sm">Hi {firstName} — complete this before coaching begins.</p>
        </div>

        {/* PAR-Q */}
        {step === 'parq' && (
          <div className="space-y-6">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">Physical Activity Readiness Questionnaire</p>
              <p className="text-stone-500 text-xs">Answer all 7 questions honestly.</p>
            </div>

            <div className="space-y-4">
              {PAR_Q.map((question, i) => (
                <div key={i} className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <p className="text-sm text-stone-200 leading-relaxed mb-4">{i + 1}. {question}</p>
                  <div className="flex gap-3">
                    {[{ label: 'Yes', value: true }, { label: 'No', value: false }].map(opt => (
                      <button
                        key={opt.label}
                        onClick={() => setParqAnswers(prev => ({ ...prev, [i]: opt.value }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                          parqAnswers[i] === opt.value
                            ? opt.value ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-teal-400/10 text-teal-400 border border-teal-400/30'
                            : 'bg-stone-800 text-stone-400 border border-stone-700 hover:border-stone-600'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {anyParqYes && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5">
                <p className="text-amber-400 text-sm font-semibold mb-2">Medical clearance may be required</p>
                <p className="text-stone-400 text-sm">One or more of your answers indicates a potential health consideration. Your coach will review this and advise on next steps. You may be asked to obtain medical clearance before beginning structured exposure.</p>
              </div>
            )}

            {parqComplete && (
              <div className="space-y-4">
                <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
                  <p className="text-sm text-stone-300 mb-3">Do you have any existing medical conditions, injuries, or medications not covered above?</p>
                  <textarea
                    value={conditions}
                    onChange={e => setConditions(e.target.value)}
                    placeholder="Optional — list any conditions, injuries, or medications relevant to your training"
                    rows={3}
                    className="w-full bg-stone-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 resize-none"
                  />
                </div>

                <button
                  onClick={() => setStep('declaration')}
                  className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors"
                >
                  Continue to declaration →
                </button>
              </div>
            )}
          </div>
        )}

        {/* Declaration */}
        {step === 'declaration' && (
          <div className="space-y-5">
            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">Confirm each of the following</p>
              <div className="space-y-4">
                {[
                  { key: 'completedParq', label: 'I completed the PAR-Q honestly and to the best of my knowledge.' },
                  { key: 'disclosedConditions', label: 'I have disclosed all medical conditions, injuries, and medications relevant to my training.' },
                  { key: 'willNotify', label: 'I will notify Body Recode™ of any changes to my health status during coaching.' },
                  { key: 'understandsRisks', label: 'I understand that exercise carries inherent risks including soreness, strain, fatigue, and potential injury.' },
                  { key: 'acceptsResponsibility', label: 'I accept responsibility for communicating honestly about discomfort, injury, or instability.' },
                  { key: 'followsGuidance', label: 'I agree to follow the guidance provided and modify or pause exercises when instructed.' },
                  { key: 'dataConsent', label: 'I consent to my health information being stored securely and used to guide my coaching.' },
                  { key: 'liabilityWaiver', label: 'I agree that Body Recode™ is not liable for injuries arising from participation. Nothing in this waiver limits my rights under Australian Consumer Law.' },
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-3 cursor-pointer">
                    <div
                      onClick={() => toggleCheck(item.key as keyof typeof checks)}
                      className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors ${checks[item.key as keyof typeof checks] ? 'bg-teal-400 border-teal-400' : 'border-stone-600'}`}
                    >
                      {checks[item.key as keyof typeof checks] && (
                        <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <p className="text-stone-300 text-sm leading-relaxed">{item.label}</p>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
              <p className="text-sm text-stone-300 mb-3">Medical clearance requirement</p>
              <div className="flex gap-3">
                {[
                  { label: 'I do not require medical clearance', value: false },
                  { label: 'I require medical clearance and will provide documentation', value: true },
                ].map(opt => (
                  <button
                    key={String(opt.value)}
                    onClick={() => setRequiresClearance(opt.value)}
                    className={`flex-1 py-3 px-3 rounded-xl text-xs font-semibold transition-colors text-left leading-relaxed ${
                      requiresClearance === opt.value
                        ? opt.value ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-teal-400/10 text-teal-400 border border-teal-400/30'
                        : 'bg-stone-800 text-stone-400 border border-stone-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={!allChecked}
              className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Submit declaration
            </button>

            <button onClick={() => setStep('parq')} className="w-full text-stone-500 text-sm py-2 hover:text-white transition-colors">
              ← Back to PAR-Q
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
