'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  clientId: string
  clientName: string
  clientEmail: string
}

const AGREEMENT_CLAUSES = [
  {
    part: 'PART 1 — PRELIMINARY',
    clauses: [
      { num: '1', title: 'Parties', body: 'This Agreement is entered into between Kade Dunstone, trading as Body Recode™, ABN 90 535 525 708 ("Coach") and the individual accepting this Agreement ("Client"). By accepting this Agreement the Client agrees to be legally bound by its terms.' },
      { num: '2', title: 'Definitions', body: '"Agreement" means this Coaching Agreement. "Services" means performance coaching services provided by the Coach. "Program Materials" includes all training programs, documents, frameworks and digital content created by the Coach. "ACL" means the Australian Consumer Law. "Recreational Services" has the meaning given under the Civil Liability Act 2003 (Qld).' },
      { num: '4', title: 'Commencement and Term', body: 'This Agreement becomes effective when the Client accepts this Agreement and the Coaching Commencement Fee has been paid. Coaching services commence once onboarding steps are completed. This Agreement continues until terminated.' },
    ],
  },
  {
    part: 'PART 2 — SERVICES',
    clauses: [
      { num: '6', title: 'Scope of Services', body: 'Services may include training programming, coaching sessions, nutrition guidance, and advisory support. Services are educational and performance based and do not constitute medical treatment.' },
      { num: '7', title: 'In-Person Coaching', body: 'Coaching may occur at Anytime Fitness Newstead or another agreed location.' },
      { num: '8', title: 'Online Coaching', body: 'Online coaching relies on client self-reporting and remote communication.' },
      { num: '8A', title: 'Session Scheduling and Attendance', body: 'Clients must provide at least 24 hours notice for session cancellation. Late cancellations may result in the session being forfeited.' },
    ],
  },
  {
    part: 'PART 3 — CLIENT OBLIGATIONS AND RISK',
    clauses: [
      { num: '9', title: 'Health Disclosure', body: 'Clients must disclose any medical conditions or injuries that may affect training.' },
      { num: '10', title: 'Assumption of Risk', body: 'Participation in exercise carries inherent risks including injury or illness.' },
      { num: '11', title: 'Civil Liability Act Waiver (Queensland)', body: 'To the extent permitted by the Civil Liability Act 2003 (Qld), the Coach is not liable for personal injury arising from recreational services.' },
      { num: '12', title: 'Compliance With Instructions', body: 'Clients agree to follow coaching instructions.' },
      { num: '12A', title: 'Client Responsibility for Program Execution', body: 'Clients are responsible for how exercises are performed outside supervised sessions.' },
      { num: '13', title: 'Code of Conduct', body: 'Clients must behave respectfully and safely.' },
    ],
  },
  {
    part: 'PART 4 — FEES AND PAYMENT',
    clauses: [
      { num: '14', title: 'Coaching Commencement Fee', body: 'A one-time Coaching Commencement Fee is payable before coaching begins. Coaching services will not commence until this fee is paid.' },
      { num: '15', title: 'Weekly Coaching Subscription', body: 'Ongoing coaching is billed via a recurring weekly subscription. Payments are charged weekly in advance. The Client authorises recurring billing.' },
      { num: '16', title: 'Payment Confirmation Prior to Service Commencement', body: 'Coaching will not commence until the agreement is signed, the commencement fee is paid, and the weekly subscription is established.' },
      { num: '17', title: 'Suspension for Non-Payment', body: 'Services may be suspended if payments are not made.' },
      { num: '17A', title: 'Failed Payments', body: 'Clients must update payment details within 48 hours if payment fails.' },
    ],
  },
  {
    part: 'PART 5 — LIABILITY AND RISK ALLOCATION',
    clauses: [
      { num: '18', title: 'Limitation of Liability', body: 'To the maximum extent permitted by law, the Coach excludes liability for indirect loss.' },
      { num: '19', title: 'Indemnity', body: 'The Client indemnifies the Coach against claims arising from breach of this Agreement.' },
    ],
  },
  {
    part: 'PART 6 — INTELLECTUAL PROPERTY AND MEDIA',
    clauses: [
      { num: '20', title: 'Intellectual Property', body: 'All program materials remain the property of the Coach.' },
      { num: '20A', title: 'Protection of Coaching Systems and Methodology', body: 'The Body Recode™ system and methodologies remain the intellectual property of the Coach and may not be reproduced.' },
      { num: '21', title: 'Media Consent', body: 'Photos or videos may be captured for educational or marketing purposes.' },
      { num: '22', title: 'Data Storage and Digital Systems', body: 'Client data may be stored on secure digital systems.' },
    ],
  },
  {
    part: 'PART 7 — TERMINATION',
    clauses: [
      { num: '23', title: 'Termination by Client', body: 'Clients may terminate with 7 days written notice.' },
      { num: '24', title: 'Termination by Coach', body: 'The Coach may terminate services for misconduct or non-payment.' },
      { num: '25', title: 'Consequences of Termination', body: 'Outstanding fees remain payable.' },
    ],
  },
  {
    part: 'PART 8 — GENERAL',
    clauses: [
      { num: '26', title: 'Confidentiality', body: 'Client information will be kept confidential.' },
      { num: '27', title: 'Variation', body: 'The Coach may vary this Agreement with written notice.' },
      { num: '28', title: 'Severability', body: 'If any clause is invalid the remainder remains enforceable.' },
      { num: '29', title: 'Governing Law', body: 'This Agreement is governed by the laws of Queensland, Australia.' },
      { num: '30', title: 'Entire Agreement', body: 'This Agreement constitutes the entire agreement between the parties.' },
    ],
  },
]

export default function AgreementForm({ clientId, clientName, clientEmail }: Props) {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = fullName.trim().length > 2 && accepted && !submitting

  const handleSubmit = async () => {
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

    router.push('/portal/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-10">

        <div className="mb-8">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-1">Coaching Agreement</h1>
          <p className="text-stone-400 text-sm">Version 2.5 · Kade Dunstone trading as Body Recode™ · ABN 90 535 525 708</p>
        </div>

        {/* Agreement text */}
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 mb-6 max-h-[60vh] overflow-y-auto space-y-6">
          {AGREEMENT_CLAUSES.map(section => (
            <div key={section.part}>
              <p className="text-xs font-bold text-teal-400 uppercase tracking-wider mb-3">{section.part}</p>
              <div className="space-y-4">
                {section.clauses.map(clause => (
                  <div key={clause.num}>
                    <p className="text-sm font-semibold text-white mb-1">{clause.num}. {clause.title}</p>
                    <p className="text-stone-400 text-sm leading-relaxed">{clause.body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Execution */}
        <div className="space-y-5">
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-5">
            <p className="text-xs text-stone-500 uppercase tracking-wider mb-3">Your details</p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-stone-400 mb-1.5">Full legal name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder={clientName}
                  className="w-full bg-stone-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-400/50 placeholder-stone-600"
                />
              </div>
              <div>
                <label className="block text-xs text-stone-400 mb-1.5">Email</label>
                <p className="text-stone-300 text-sm px-4 py-3 bg-stone-800/50 rounded-xl">{clientEmail}</p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <div
              onClick={() => setAccepted(!accepted)}
              className={`w-5 h-5 rounded flex-shrink-0 mt-0.5 flex items-center justify-center border-2 transition-colors ${accepted ? 'bg-teal-400 border-teal-400' : 'border-stone-600'}`}
            >
              {accepted && (
                <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <p className="text-stone-400 text-sm leading-relaxed">
              I have read and agree to be legally bound by the terms of the Body Recode™ Coaching Agreement v2.5. I understand this constitutes a binding legal agreement.
            </p>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full bg-teal-400 text-black text-sm font-bold py-4 rounded-2xl hover:bg-teal-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {submitting ? 'Submitting…' : 'Accept agreement'}
          </button>

          <p className="text-stone-600 text-xs text-center">
            Governed by the laws of Queensland, Australia. Accepted electronically — {new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}.
          </p>
        </div>

      </div>
    </div>
  )
}
