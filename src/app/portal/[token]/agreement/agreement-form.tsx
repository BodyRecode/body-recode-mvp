'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const AGREEMENT_SECTIONS = [
  {
    title: 'PART 1 — PRELIMINARY',
    content: '',
    subsections: [
      { title: '1. Parties', content: 'This Agreement is entered into between Kade Dunstone, trading as Body Recode™, ABN 90 535 525 708 ("Coach") and the individual accepting this Agreement ("Client"). By signing this Agreement the Client agrees to be legally bound by its terms.' },
      { title: '2. Definitions', content: '"Agreement" means this Coaching Agreement. "Services" means performance coaching services provided by the Coach. "Program Materials" includes all training programs, documents, frameworks and digital content created by the Coach. "ACL" means the Australian Consumer Law. "Recreational Services" has the meaning given under the Civil Liability Act 2003 (Qld).' },
      { title: '3. Interpretation', content: 'Headings are for convenience only. A reference to legislation includes amendments and replacements.' },
      { title: '4. Commencement and Term', content: 'This Agreement becomes effective when the Client signs this Agreement and the Coaching Commencement Fee has been paid. Coaching services commence once onboarding steps are completed. This Agreement continues until terminated.' },
    ],
  },
  {
    title: 'PART 2 — SERVICES',
    content: '',
    subsections: [
      { title: '5. Appointment', content: 'The Client engages the Coach to provide the Services.' },
      { title: '6. Scope of Services', content: 'Services may include training programming, coaching sessions, nutrition guidance, and advisory support. Services are educational and performance based and do not constitute medical treatment.' },
      { title: '7. In-Person Coaching', content: 'Coaching may occur at Anytime Fitness Newstead or another agreed location.' },
      { title: '8. Online Coaching', content: 'Online coaching relies on client self-reporting and remote communication.' },
      { title: '8A. Session Scheduling and Attendance', content: 'Clients must provide at least 24 hours notice for session cancellation. Late cancellations may result in the session being forfeited.' },
    ],
  },
  {
    title: 'PART 3 — CLIENT OBLIGATIONS AND RISK',
    content: '',
    subsections: [
      { title: '9. Health Disclosure', content: 'Clients must disclose any medical conditions or injuries that may affect training.' },
      { title: '10. Assumption of Risk', content: 'Participation in exercise carries inherent risks including injury or illness.' },
      { title: '11. Civil Liability Act Waiver (Queensland)', content: 'To the extent permitted by the Civil Liability Act 2003 (Qld), the Coach is not liable for personal injury arising from recreational services.' },
      { title: '12. Compliance With Instructions', content: 'Clients agree to follow coaching instructions.' },
      { title: '12A. Client Responsibility for Program Execution', content: 'Clients are responsible for how exercises are performed outside supervised sessions.' },
      { title: '13. Code of Conduct', content: 'Clients must behave respectfully and safely.' },
    ],
  },
  {
    title: 'PART 4 — FEES AND PAYMENT',
    content: '',
    subsections: [
      { title: '14. Coaching Commencement Fee', content: 'A one-time Coaching Commencement Fee is payable before coaching begins. Coaching services will not commence until this fee is paid.' },
      { title: '15. Weekly Coaching Subscription', content: 'Ongoing coaching is billed via a recurring weekly subscription processed through Stripe or another nominated payment processor. Payments are charged weekly in advance. The Client authorises recurring billing.' },
      { title: '16. Payment Confirmation Prior to Service Commencement', content: 'Coaching will not commence until: (a) the agreement is signed, (b) the commencement fee is paid, and (c) the weekly subscription is established.' },
      { title: '17. Suspension for Non-Payment', content: 'Services may be suspended if payments are not made.' },
      { title: '17A. Failed Payments', content: 'Clients must update payment details within 48 hours if payment fails.' },
    ],
  },
  {
    title: 'PART 5 — LIABILITY AND RISK ALLOCATION',
    content: '',
    subsections: [
      { title: '18. Limitation of Liability', content: 'To the maximum extent permitted by law, the Coach excludes liability for indirect loss.' },
      { title: '19. Indemnity', content: 'The Client indemnifies the Coach against claims arising from breach of this Agreement.' },
    ],
  },
  {
    title: 'PART 6 — INTELLECTUAL PROPERTY AND MEDIA',
    content: '',
    subsections: [
      { title: '20. Intellectual Property', content: 'All program materials remain the property of the Coach.' },
      { title: '20A. Protection of Coaching Systems and Methodology', content: 'The Body Recode™ system and methodologies remain the intellectual property of the Coach and may not be reproduced.' },
      { title: '21. Media Consent', content: 'Photos or videos may be captured for educational or marketing purposes.' },
      { title: '22. Data Storage and Digital Systems', content: 'Client data may be stored on secure digital systems.' },
    ],
  },
  {
    title: 'PART 7 — TERMINATION',
    content: '',
    subsections: [
      { title: '23. Termination by Client', content: 'Clients may terminate with 7 days written notice.' },
      { title: '24. Termination by Coach', content: 'The Coach may terminate services for misconduct or non-payment.' },
      { title: '25. Consequences of Termination', content: 'Outstanding fees remain payable.' },
    ],
  },
  {
    title: 'PART 8 — GENERAL',
    content: '',
    subsections: [
      { title: '26. Confidentiality', content: 'Client information will be kept confidential.' },
      { title: '27. Variation', content: 'The Coach may vary this Agreement with written notice.' },
      { title: '28. Severability', content: 'If any clause is invalid the remainder remains enforceable.' },
      { title: '29. Governing Law', content: 'This Agreement is governed by the laws of Queensland, Australia.' },
      { title: '30. Entire Agreement', content: 'This Agreement constitutes the entire agreement between the parties.' },
    ],
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
          <p className="text-stone-500 text-xs mb-1">Version 2.5 — Sole Trader, Queensland, Australia</p>
          <p className="text-stone-400 text-sm">Please read the full agreement before signing.</p>
        </div>

        <div className="space-y-8 mb-10">
          {AGREEMENT_SECTIONS.map((section) => (
            <div key={section.title}>
              <h2 className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-4">{section.title}</h2>
              <div className="space-y-4">
                {section.subsections.map((sub) => (
                  <div key={sub.title}>
                    <p className="text-sm font-semibold text-white mb-1">{sub.title}</p>
                    <p className="text-sm text-stone-400 leading-relaxed">{sub.content}</p>
                  </div>
                ))}
              </div>
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
