'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AGREEMENT_SECTIONS = [
  {
    title: '1. Nature of Service',
    content: `Body Recode™ Performance Coaching is a structured, biology-first coaching service. It is not a medical service, physiotherapy, psychology, or any form of allied health treatment. The coach provides performance coaching, program design, lifestyle guidance, and interpretive analysis of self-reported physiological signals. Nothing within this service constitutes medical advice, diagnosis, or treatment.`,
  },
  {
    title: '2. Coach Qualifications',
    content: `The coach holds qualifications in exercise science and personal training. The coach operates within their scope of practice and will refer the client to appropriate health professionals when required. The coach does not diagnose medical conditions or prescribe medications.`,
  },
  {
    title: '3. Client Responsibilities',
    content: `The client agrees to: provide accurate and honest information throughout the coaching relationship; complete all required documentation including health declarations, intake forms, and weekly check-ins; communicate any changes to health status promptly; follow the program as designed or communicate adjustments needed; attend scheduled sessions and check-ins as agreed; and treat all interactions with professionalism and respect.`,
  },
  {
    title: '4. Health and Medical Clearance',
    content: `The client confirms they have completed the Health Declaration and Readiness Screening truthfully. The client accepts full responsibility for engaging in physical activity. Where medical clearance is required, the client agrees not to commence training until written clearance from a qualified medical practitioner has been provided. The coach reserves the right to pause or discontinue coaching if health concerns arise that fall outside the scope of this service.`,
  },
  {
    title: '5. Program Delivery',
    content: `Programs are delivered digitally through the Body Recode™ platform. Sessions may be conducted in person, online, or via a combination of both as agreed. The coach reserves the right to modify the program at any time based on the client's progress, health status, or coaching requirements.`,
  },
  {
    title: '6. Confidentiality',
    content: `All client information, including health data, personal details, check-in responses, and progress documentation, is held in strict confidence. Client data will not be shared with third parties without written consent, except where required by law. The client's identity will not be used in marketing or promotional material without explicit written consent.`,
  },
  {
    title: '7. Cancellation and Refund Policy',
    content: `The commencement fee is non-refundable once the onboarding process has begun. Ongoing coaching fees are billed as agreed at the point of commencement. The client may terminate the coaching relationship with 14 days written notice. The coach may terminate the coaching relationship with 14 days written notice, or immediately in the event of a material breach of this agreement.`,
  },
  {
    title: '8. Limitation of Liability',
    content: `To the maximum extent permitted by law, the coach and Body Recode™ shall not be liable for any injury, loss, or damage arising from participation in the coaching program. The client participates voluntarily and accepts all risks associated with physical training and lifestyle modification.`,
  },
]

export default function AgreementForm({
  clientId,
  clientName,
  portalToken,
}: {
  clientId: string
  clientName: string
  portalToken: string
}) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accepted || !fullName.trim()) return
    setSubmitting(true)
    setError('')

    const res = await fetch('/api/portal/submit-agreement', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, fullName: fullName.trim() }),
    })

    if (!res.ok) {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
      return
    }

    router.push(`/portal/${portalToken}`)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Coaching Agreement</h1>
          <p className="text-stone-400 text-sm">Please read the full agreement before signing.</p>
        </div>

        <div className="space-y-6 mb-10">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-sm font-bold text-white mb-2">{section.title}</h2>
              <p className="text-sm text-stone-400 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-stone-900 rounded-2xl p-5 border border-stone-800">
            <p className="text-sm text-stone-300 mb-4">By typing your full name and ticking below, you confirm that you have read, understood, and agree to the terms of this Coaching Agreement.</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">Full name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={clientName}
                  required
                  className="w-full bg-stone-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600 border border-stone-700"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={e => setAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-teal-400"
                />
                <span className="text-sm text-stone-300">I have read and agree to the Body Recode™ Coaching Agreement.</span>
              </label>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!accepted || !fullName.trim() || submitting}
            className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Saving…' : 'Sign and continue →'}
          </button>
        </form>
      </div>
    </div>
  )
}
