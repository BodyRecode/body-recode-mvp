import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClearanceUploadForm from './clearance-upload-form'
import ClientHeader from '@/components/client-header'

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

  // Generate signed URL so client can view their uploaded doc
  let docSignedUrl: string | null = null
  if (client.medical_clearance_doc_url) {
    const { data } = await admin.storage
      .from('clearance-docs')
      .createSignedUrl(client.medical_clearance_doc_url, 60 * 60) // 1 hour
    docSignedUrl = data?.signedUrl ?? null
  }

  if (approved) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
        <div className="max-w-lg mx-auto px-6 py-12">
          <Link href={`/portal/${token}`} className="text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors mb-8 inline-block">← Back to portal</Link>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#1B6DFC]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Clearance approved</h1>
            <p className="text-[#999999] text-sm">Your medical clearance has been reviewed and approved.</p>
          </div>
          {docSignedUrl && (
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5">
              <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Your submitted form</p>
              {docSignedUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img src={docSignedUrl} alt="Your submitted clearance form" className="w-full rounded-lg" />
              ) : (
                <a
                  href={docSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-[#1B6DFC] hover:text-[#5390FF] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View submitted PDF ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
        <div className="max-w-lg mx-auto px-6 py-12">
          <Link href={`/portal/${token}`} className="text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors mb-8 inline-block">← Back to portal</Link>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-[#FFFFFF] border border-[#E5E5E5] rounded-full flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-[#1A1A1A] mb-2">Form submitted</h1>
            <p className="text-[#999999] text-sm">Your completed clearance form has been received. Your coach will review it and confirm approval shortly.</p>
          </div>
          {docSignedUrl && (
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-xl p-5">
              <p className="text-xs font-bold tracking-widest text-[#999999] uppercase mb-3">Your submitted form</p>
              {docSignedUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
                <img src={docSignedUrl} alt="Your submitted clearance form" className="w-full rounded-lg" />
              ) : (
                <a
                  href={docSignedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm text-[#1B6DFC] hover:text-[#5390FF] transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  View submitted PDF ↗
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}`} className="text-xs text-[#999999] hover:text-[#3A3A3A] transition-colors mb-6 inline-block">← Back to portal</Link>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Medical Clearance</h1>
          <p className="text-[#6B6B6B] text-sm leading-relaxed">Based on your health declaration, we need written confirmation from your GP that you are cleared for supervised progressive exercise before training begins.</p>
        </div>

        {/* Steps */}
        <div className="space-y-4 mb-8">
          {[
            { step: '1', title: 'Download the form', desc: 'Print or save the Body Recode Medical Clearance Request Form below.' },
            { step: '2', title: 'See your GP', desc: 'Take the form to your doctor and ask them to complete and sign the exercise clearance section.' },
            { step: '3', title: 'Upload completed form', desc: 'Scan or photograph the completed form and upload it here.' },
          ].map(s => (
            <div key={s.step} className="flex items-start gap-4 bg-[#FFFFFF] rounded-xl p-4 border border-[#E5E5E5]">
              <div className="w-7 h-7 rounded-full bg-[#1B6DFC] flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">{s.step}</div>
              <div>
                <p className="text-sm font-semibold text-[#1A1A1A] mb-0.5">{s.title}</p>
                <p className="text-xs text-[#999999]">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Download form (real PDF, server-rendered via puppeteer) */}
        <a
          href={`/api/portal/${token}/medical-clearance/pdf`}
          className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 hover:border-[#D4D4D4] transition-colors mb-3"
        >
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A]">Download Medical Clearance Form</p>
            <p className="text-xs text-[#999999] mt-0.5">Single-page PDF, pre-filled with your name. Email it to your GP or print to take in.</p>
          </div>
          <svg className="w-5 h-5 text-[#6B6B6B]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
          </svg>
        </a>
        <Link
          href={`/portal/${token}/medical-clearance/print`}
          target="_blank"
          className="block text-center text-xs text-[#999999] hover:text-[#6B6B6B] transition-colors mb-8"
        >
          Or open the form in a new tab →
        </Link>

        {/* Upload form */}
        <ClearanceUploadForm clientId={client.id} portalToken={token} />
      </div>
    </div>
  )
}
