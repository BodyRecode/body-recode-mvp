import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ApproveClearanceButton from './approve-clearance-button'
import RemoveClearanceButton from './remove-clearance-button'

export default async function MedicalClearancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, medical_clearance_required, medical_clearance_received_at, medical_clearance_submitted_at, medical_clearance_doc_url')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const approved = !!client.medical_clearance_received_at
  const submitted = !!client.medical_clearance_submitted_at

  // Generate signed URL if doc exists
  let docSignedUrl: string | null = null
  if (client.medical_clearance_doc_url) {
    const { data } = await admin.storage
      .from('clearance-docs')
      .createSignedUrl(client.medical_clearance_doc_url, 60 * 60) // 1 hour
    docSignedUrl = data?.signedUrl ?? null
  }

  const whatsappMessage = `Hi ${firstName},

Thanks for completing your health declaration.

Based on one of your responses, we need to obtain medical clearance before progressing into structured training exposure.

This is a routine precautionary step within our onboarding process. It simply ensures that we are operating safely and within appropriate boundaries before increasing load.

Head to your portal to download the Medical Clearance Request Form, take it to your GP, and ask them to complete and sign it. Once done, scan or photograph the completed form and upload it directly through your portal.

All other onboarding steps can continue in the meantime.

If anything is unclear, just message me here and I'll guide you through it.

Kade`

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-[#1A1A1A] text-sm transition-colors">← Back</Link>
        <span className="text-stone-300">/</span>
        <p className="text-sm text-stone-600">Medical Clearance - {client.name}</p>
      </div>

      {approved ? (
        <div className="bg-blue-50 border border-blue-500/20 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-blue-500 mb-1">Clearance approved</p>
          <p className="text-xs text-stone-600">Approved on {new Date(client.medical_clearance_received_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Intake and baseline are unlocked.</p>
        </div>
      ) : submitted ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-700 mb-1">Form uploaded - awaiting your approval</p>
            <p className="text-xs text-stone-600">
              Submitted {new Date(client.medical_clearance_submitted_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Review the document below and approve when satisfied.
            </p>
          </div>
          <ApproveClearanceButton clientId={id} />
        </div>
      ) : (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-700 mb-1">Waiting for client upload</p>
          <p className="text-xs text-stone-600">The client has been notified. This page will update once they upload their completed form.</p>
        </div>
      )}

      {/* Uploaded document */}
      {submitted && docSignedUrl && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-6">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">Uploaded Document</p>
          {docSignedUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
            <img src={docSignedUrl} alt="Medical clearance form" className="w-full rounded-lg border border-stone-300" />
          ) : (
            <a
              href={docSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-sm text-blue-500 hover:text-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Open uploaded PDF ↗
            </a>
          )}
        </div>
      )}

      {/* WhatsApp message */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">WhatsApp Message Template</p>
        <pre className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{whatsappMessage}</pre>
      </div>

      {/* Remove clearance requirement */}
      {!approved && (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-1">Remove Requirement</p>
            <p className="text-xs text-stone-500">If the clearance was flagged in error, remove it to clear this client's file.</p>
          </div>
          <RemoveClearanceButton clientId={id} />
        </div>
      )}

      {/* Printable form */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Blank Form (Coach Copy)</p>
          <Link
            href={`/dashboard/clients/${id}/medical-clearance/print`}
            target="_blank"
            className="text-xs bg-stone-200 text-stone-700 hover:bg-stone-300 hover:text-[#1A1A1A] px-3 py-1.5 rounded-lg transition-colors"
          >
            Open printable form ↗
          </Link>
        </div>
        <p className="text-xs text-stone-500">Blank form pre-filled with client details, for your records.</p>
      </div>
    </div>
  )
}
