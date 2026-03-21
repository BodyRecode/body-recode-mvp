import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClearanceUploadForm from './clearance-upload-form'

export default async function PortalMedicalClearancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, medical_clearance_required, medical_clearance_received_at, medical_clearance_submitted_at, medical_clearance_doc_url')
    .eq('onboarding_token', token)
    .single()

  if (!client || !client.medical_clearance_required) return notFound()

  const approved = !!client.medical_clearance_received_at
  const submitted = !!client.medical_clearance_submitted_at

  if (approved) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode™</p>
          <div className="w-14 h-14 bg-teal-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Clearance approved</h1>
          <p className="text-stone-500 text-sm">Your medical clearance has been reviewed and approved. Head back to your portal to continue.</p>
          <Link href={`/portal/${token}`} className="inline-block mt-6 text-sm font-bold text-black bg-teal-400 px-6 py-3 rounded-2xl hover:bg-teal-300 transition-colors">Back to portal →</Link>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-6">Body Recode™</p>
          <div className="w-14 h-14 bg-stone-900 border border-stone-800 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white mb-2">Form submitted</h1>
          <p className="text-stone-500 text-sm">Your completed clearance form has been received. Your coach will review it and confirm approval shortly.</p>
          <Link href={`/portal/${token}`} className="inline-block mt-6 text-sm text-stone-400 hover:text-white transition-colors">← Back to portal</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-xs text-stone-500 hover:text-stone-300 transition-colors mb-6 inline-block">← Back to portal</Link>
          <p className="text-xs font-bold tracking-widest text-teal-400 uppercase mb-3">Body Recode™</p>
          <h1 className="text-2xl font-bold text-white mb-2">Medical Clearance</h1>
          <p className="text-stone-400 text-sm leading-relaxed">Based on your health declaration, we need written confirmation from your GP that you are cleared for supervised progressive exercise before training begins.</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {[
            { step: '1', title: 'Download the form', desc: 'Print or save the Body Recode Medical Clearance Request Form below.' },
            { step: '2', title: 'See your GP', desc: 'Take the form to your doctor and ask them to complete and sign the exercise clearance section.' },
            { step: '3', title: 'Upload completed form', desc: 'Scan or photograph the completed form and upload it here.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-4 bg-stone-900 rounded-xl p-4 border border-stone-800">
              <div className="w-7 h-7 rounded-full bg-teal-400 flex items-center justify-center flex-shrink-0 text-black text-xs font-bold">{s.step}</div>
              <div>
                <p className="text-sm font-semibold text-white mb-0.5">{s.title}</p>
                <p className="text-xs text-stone-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Download form */}
        <Link
          href={`/portal/${token}/medical-clearance/print`}
          target="_blank"
          className="flex items-center justify-between w-full bg-stone-900 border border-stone-700 rounded-2xl px-5 py-4 hover:border-stone-600 transition-colors mb-8"
        >
          <div>
            <p className="text-sm font-semibold text-white">Medical Clearance Request Form</p>
            <p className="text-xs text-stone-500 mt-0.5">Opens in new tab — print or save as PDF</p>
          </div>
          <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </Link>

        {/* Upload form */}
        <ClearanceUploadForm clientId={client.id} portalToken={token} />
      </div>
    </div>
  )
}
