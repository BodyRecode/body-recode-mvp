'use client'

import { useState } from 'react'

type Props = {
  token: string
  firstName: string
}

export default function AgreementForm({ token, firstName }: Props) {
  const [consentTier, setConsentTier] = useState<'tier_1' | 'tier_2' | null>(null)
  const [signatureName, setSignatureName] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [signed, setSigned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!consentTier || !signatureName.trim() || !confirmed) return

    setSubmitting(true)
    setError(null)

    const res = await fetch('/api/founding-client-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, consent_tier: consentTier, signature_name: signatureName.trim() }),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    setSigned(true)
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-3">Agreement signed.</h1>
          <p className="text-stone-400 text-sm leading-relaxed">
            Your Founding Client Case Study Agreement has been completed. Your coach will be in touch with your commencement fee and next steps shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-6">Body Recode™ · Founding Client Program</p>
          <h1 className="text-2xl font-bold text-white mb-2">Founding Client Case Study Agreement</h1>
          <p className="text-stone-400 text-sm">Hi {firstName}, please read through this agreement carefully before signing. If anything is unclear, reply to the email before proceeding.</p>
        </div>

        {/* Agreement text */}
        <div className="bg-[#111] border border-stone-800 rounded-xl p-6 mb-8 space-y-6 text-sm text-stone-300 leading-relaxed max-h-[520px] overflow-y-auto">

          <section>
            <h2 className="text-white font-semibold mb-2">1. Agreement Purpose</h2>
            <p>This agreement defines the terms under which the client participates in the Body Recode™ Founding Client Case Study Program. The purpose of this agreement is to:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-stone-400">
              <li>define the relationship between Body Recode™ and the founding client</li>
              <li>govern participation in the system</li>
              <li>establish the terms of documentation and data usage</li>
              <li>define consent boundaries for internal and external case study use</li>
              <li>protect the integrity of the validation process</li>
            </ul>
            <p className="mt-3 text-stone-400">This is not a promotional agreement. This is a structured participation agreement within a controlled validation system.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">2. Nature of the Program</h2>
            <p>The Founding Client Case Study Program is a limited-position participation model designed to support the validation, refinement, and future development of the Body Recode™ system.</p>
            <p className="mt-3">The client acknowledges that:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-stone-400">
              <li>the program is selective</li>
              <li>the program is not publicly offered as a standard coaching package</li>
              <li>the client's participation contributes to the development and validation of the system</li>
              <li>the client's engagement is documented as part of a structured case study process</li>
            </ul>
            <p className="mt-3">The client further acknowledges that the founding client arrangement is not a discount. It is a structured trade in which Body Recode™ provides services and system access, and the client provides documented participation of commercial and developmental value.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">3. Program Structure</h2>
            <p>The client acknowledges that the Founding Client Program includes:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-stone-400">
              <li>a minimum participation threshold of 12 weeks</li>
              <li>an intended engagement duration of 6 to 12 months where possible</li>
              <li>structured onboarding, ongoing data capture, and ongoing interpretation</li>
              <li>weekly synthesis cycles</li>
              <li>possible re-interpretation events over time</li>
              <li>eventual case study generation based on data collected</li>
            </ul>
            <p className="mt-3 text-stone-400">The minimum threshold supports basic case study validity. The highest-value case studies come from longer longitudinal participation. Continuation beyond 12 weeks remains subject to active participation, payment, and agreement status.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">4. Participation Requirements</h2>
            <p>The client agrees to participate in a manner that supports data integrity, interpretation quality, and case study validity. This includes completing all required onboarding forms, providing accurate intake and baseline data, participating in weekly check-in cycles, and engaging with the process in good faith.</p>
            <p className="mt-3 text-stone-400">The client acknowledges that inconsistent participation may reduce or invalidate the value of the case study.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">5. Data and System Inputs</h2>
            <p>Participation includes the capture, storage, interpretation, and use of system-relevant data. This may include intake data, baseline measurements, baseline photos, weekly check-in data, behavioural and lifestyle inputs, system-generated interpretation outputs, progression records, re-interpretation events, and case study classifications.</p>
            <p className="mt-3 text-stone-400">This data may be used to generate CFFS outputs, CFWS outputs, re-interpretation records, prediction vs outcome mapping, case study outputs, and cohort-level system insights.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">6. Interpretation and System Outputs</h2>
            <p>Body Recode™ operates through a structured interpretation model. Initial data is interpreted through a foundational synthesis process. Ongoing data is interpreted through weekly synthesis cycles. The system may update its interpretation over time based on emerging evidence.</p>
            <p className="mt-3 text-stone-400">Interpretation is not fixed. It may be revised where justified by new data. Re-interpretation is part of the system, not an error by default.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">7. Consent and Case Study Use</h2>
            <p>Participation includes consent to structured internal use of data for system validation and development. Internal use includes analysis, interpretation review, case study generation, cohort comparison, system refinement, and validation reporting.</p>
            <p className="mt-3">In addition, the client selects one external consent tier for public-facing use of case study material. The difference between tiers is not whether the case study may be used externally. It is how the client is represented within that use.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">8. Review Rights and Publication Boundaries</h2>
            <p>The client retains review rights over identifying details, named references, photos used publicly, and how their identity is presented externally. These rights do not extend to altering system interpretation, changing CFFS or CFWS outputs, rewriting outcome classification, or suppressing valid internal analysis.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">9. Internal Rights of Use</h2>
            <p>Body Recode™ retains the right to use all collected data internally for legitimate system purposes. These rights continue regardless of whether the client completes, withdraws, or pauses, subject to applicable law and privacy obligations.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">10. External Rights of Use</h2>
            <p>External publication rights are governed by the selected consent tier. Body Recode™ may use case study material externally only within the selected tier, with accurate representation, without fabrication, distortion, or exaggeration.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">11. Case Study Validity Conditions</h2>
            <p>Not all participation automatically results in a valid or publishable case study. A case study may be deemed invalid if onboarding data is incomplete, participation is inconsistent, check-ins are repeatedly missed, or data integrity is compromised. Body Recode™ retains sole discretion to determine validity, completeness, and suitability for publication.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">12. Founding Client Status</h2>
            <p>Founding client status is conditional and system-controlled. Status may include Active, Paused, Completed, or Withdrawn. Founding client status is not permanent by default. It reflects current system reality and may change if participation breaks down or data becomes insufficient.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">13. Fees and Payment Structure</h2>
            <p>Coaching fees are adjusted by 50% for the duration of valid participation in the program. This adjustment reflects the value of documented participation. It is not a discount, promotion, or bargain offer. The adjusted fee remains active only while the client remains validly in the program and this agreement remains active.</p>
            <p className="mt-3 text-stone-400">Failure to maintain payment may result in status interruption, paused participation, withdrawal from the program, or invalidation of case study continuity.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">14. Withdrawal and Termination</h2>
            <p>The client may withdraw at any time by notifying Body Recode™. Withdrawal does not automatically erase prior internal rights of use for data already collected, subject to applicable law and privacy obligations. Body Recode™ may also terminate participation for failure to meet participation requirements, failure to maintain payment, or repeatedly incomplete data.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">15. No Guarantee of Outcome</h2>
            <p>Body Recode™ does not guarantee any particular result, outcome, or transformation. Outcomes depend on multiple factors including compliance, context, behaviour, and external influences. Participation is intended to validate and refine the system, not promise a guaranteed result.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">16. Privacy and Confidentiality</h2>
            <p>Body Recode™ agrees to handle client data in accordance with reasonable privacy and confidentiality standards. Personal data will be stored securely. External publication will follow the selected consent tier. Identifying details will not be used externally outside agreed scope.</p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">17. Entire Agreement and System Authority</h2>
            <p>This agreement governs the client's participation in the Founding Client Case Study Program. Where there is conflict between informal verbal discussion and this agreement, this agreement governs.</p>
          </section>

        </div>

        {/* Signing form */}
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Consent tier */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">Select your consent tier</label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => setConsentTier('tier_1')}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  consentTier === 'tier_1'
                    ? 'border-teal-400 bg-teal-400/5'
                    : 'border-stone-700 bg-[#111] hover:border-stone-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    consentTier === 'tier_1' ? 'border-teal-400' : 'border-stone-600'
                  }`}>
                    {consentTier === 'tier_1' && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Tier 1: External Use (Anonymised)</p>
                    <p className="text-xs text-stone-400 mt-1">Your identity is not disclosed. Identifying details are removed or generalised. Case study outputs may be published in anonymised form.</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setConsentTier('tier_2')}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  consentTier === 'tier_2'
                    ? 'border-teal-400 bg-teal-400/5'
                    : 'border-stone-700 bg-[#111] hover:border-stone-600'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                    consentTier === 'tier_2' ? 'border-teal-400' : 'border-stone-600'
                  }`}>
                    {consentTier === 'tier_2' && <div className="w-2 h-2 rounded-full bg-teal-400" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Tier 2: External Use (Named)</p>
                    <p className="text-xs text-stone-400 mt-1">Your identity may be used. Publication remains subject to your review of identifying material. Case study outputs may be published in named form.</p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Signature */}
          <div>
            <label htmlFor="signature" className="block text-sm font-semibold text-white mb-2">
              Full name (acts as your signature)
            </label>
            <input
              id="signature"
              type="text"
              value={signatureName}
              onChange={e => setSignatureName(e.target.value)}
              placeholder="Type your full name"
              className="w-full bg-[#111] border border-stone-700 rounded-xl px-4 py-3 text-white text-sm placeholder-stone-600 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          {/* Confirmation checkbox */}
          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <div
                onClick={() => setConfirmed(c => !c)}
                className={`mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                  confirmed ? 'border-teal-400 bg-teal-400' : 'border-stone-600 bg-transparent'
                }`}
              >
                {confirmed && (
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-stone-300 leading-relaxed" onClick={() => setConfirmed(c => !c)}>
                I confirm that I have read and understood this agreement in full. I understand the structure of the Founding Client Program, how my data may be used internally and externally, my selected consent tier, and that founding client status is conditional. I agree to participate under these terms.
              </span>
            </label>
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={!consentTier || !signatureName.trim() || !confirmed || submitting}
            className="w-full py-4 bg-teal-400 text-black font-bold text-sm tracking-wide rounded-xl hover:bg-teal-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing…' : 'Sign Agreement'}
          </button>

          <p className="text-xs text-stone-600 text-center">
            By clicking Sign Agreement you are entering into a binding agreement with Body Recode™. If you have any questions, reply to the email before signing.
          </p>
        </form>

      </div>
    </div>
  )
}
