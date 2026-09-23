import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ClearanceUploadForm from './clearance-upload-form'
import PortalPageShell from '../portal-page-shell'
import { requirePortalClient } from '@/lib/portal-guard'

export default async function PortalMedicalClearancePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const admin = createAdminClient()

  const client = await requirePortalClient(token, 'medical_clearance_required, medical_clearance_received_at, medical_clearance_submitted_at, medical_clearance_doc_url')

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

  const SubmittedDocCard = () => docSignedUrl ? (
    <div className="rounded-2xl border border-[#E4E4E0] bg-[#FFFFFF] p-5">
      <p className="text-[11px] font-medium text-[#9CA2AB] mb-3">Your submitted form</p>
      {docSignedUrl.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i) ? (
        <img src={docSignedUrl} alt="Your submitted clearance form" className="w-full rounded-lg" />
      ) : (
        <a
          href={docSignedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 text-[13.5px] text-[#0F1115] hover:text-[#6E747D] transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          View submitted PDF ↗
        </a>
      )}
    </div>
  ) : null

  if (approved) {
    return (
      <PortalPageShell
        backHref={`/portal/${token}`}
        backLabel="← Back to portal"
        eyebrow="Medical Clearance"
        title="Clearance approved"
        description="Your medical clearance has been reviewed and approved."
      >
        <SubmittedDocCard />
      </PortalPageShell>
    )
  }

  if (submitted) {
    return (
      <PortalPageShell
        backHref={`/portal/${token}`}
        backLabel="← Back to portal"
        eyebrow="Medical Clearance"
        title="Form submitted"
        description="Your completed clearance form has been received. Your coach will review it and confirm approval shortly."
      >
        <SubmittedDocCard />
      </PortalPageShell>
    )
  }

  return (
    <PortalPageShell
      backHref={`/portal/${token}`}
      backLabel="← Back to portal"
      eyebrow="Medical Clearance"
      title="Medical clearance"
      description="Based on your health declaration, we need written confirmation from your GP that you are cleared for supervised progressive exercise before training begins."
    >
      {/* Steps */}
      <div className="space-y-4 mb-8">
        {[
          { step: '1', title: 'Download the form', desc: 'Print or save the Body Recode Medical Clearance Request Form below.' },
          { step: '2', title: 'See your GP', desc: 'Take the form to your doctor and ask them to complete and sign the exercise clearance section.' },
          { step: '3', title: 'Upload completed form', desc: 'Scan or photograph the completed form and upload it here.' },
        ].map(s => (
          <div key={s.step} className="flex items-start gap-4 bg-[#FFFFFF] rounded-2xl p-5 border border-[#E4E4E0]">
            <div className="w-7 h-7 rounded-full bg-[#0F1115] flex items-center justify-center flex-shrink-0 text-white text-[12.5px] font-bold">{s.step}</div>
            <div>
              <p className="text-[13.5px] font-semibold text-[#0F1115] mb-0.5">{s.title}</p>
              <p className="text-[12.5px] text-[#9CA2AB]">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Download form (real PDF, server-rendered via puppeteer) */}
      <a
        href={`/api/portal/${token}/medical-clearance/pdf`}
        className="flex items-center justify-between w-full bg-[#FFFFFF] border border-[#E4E4E0] rounded-2xl px-5 py-4 hover:border-[#DCDCD7] transition-colors mb-3"
      >
        <div>
          <p className="text-[13.5px] font-semibold text-[#0F1115]">Download Medical Clearance Form</p>
          <p className="text-[12.5px] text-[#9CA2AB] mt-0.5">Single-page PDF, pre-filled with your name. Email it to your GP or print to take in.</p>
        </div>
        <svg className="w-5 h-5 text-[#6E747D]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
        </svg>
      </a>
      <Link
        href={`/portal/${token}/medical-clearance/print`}
        target="_blank"
        className="block text-center text-[12.5px] text-[#9CA2AB] hover:text-[#6E747D] transition-colors mb-8"
      >
        Or open the form in a new tab →
      </Link>

      {/* Upload form */}
      <ClearanceUploadForm clientId={client.id} portalToken={token} />
    </PortalPageShell>
  )
}
