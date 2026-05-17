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
    const { data, error: signError } = await admin.storage
      .from('clearance-docs')
      .createSignedUrl(client.medical_clearance_doc_url, 60 * 60) // 1 hour
    if (signError) console.error('Clearance signed URL error:', signError)
    docSignedUrl = data?.signedUrl ?? null
  }
  const isImage = client.medical_clearance_doc_url
    ? /\.(jpg|jpeg|png|gif|webp)$/i.test(client.medical_clearance_doc_url)
    : false

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
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-white text-sm transition-colors">← Back</Link>
        <span className="text-stone-700">/</span>
        <p className="text-sm text-stone-400">Medical Clearance - {client.name}</p>
      </div>

      {approved ? (
        <div className="bg-teal-400/10 border border-teal-400/20 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-teal-400 mb-1">Clearance approved</p>
          <p className="text-xs text-stone-400">Approved on {new Date(client.medical_clearance_received_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Intake and baseline are unlocked.</p>
        </div>
      ) : submitted ? (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Form uploaded - awaiting your approval</p>
            <p className="text-xs text-stone-400">
              Submitted {new Date(client.medical_clearance_submitted_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Review the document below and approve when satisfied.
            </p>
          </div>
          <ApproveClearanceButton clientId={id} />
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-400 mb-1">Waiting for client upload</p>
          <p className="text-xs text-stone-400">The client has been notified. This page will update once they upload their completed form.</p>
        </div>
      )}

      {/* Uploaded document */}
      {submitted && docSignedUrl && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Uploaded Document</p>
            <a
              href={docSignedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-400 hover:text-teal-400 transition-colors"
            >
              Open in new tab ↗
            </a>
          </div>
          {isImage ? (
            <img src={docSignedUrl} alt="Medical clearance form" className="w-full rounded-lg border border-stone-700" />
          ) : (
            <iframe
              src={docSignedUrl}
              title="Medical clearance form"
              className="w-full h-[80vh] rounded-lg border border-stone-700 bg-white"
            />
          )}
        </div>
      )}

      {/* WhatsApp message */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
        <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">WhatsApp Message Template</p>
        <pre className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed font-sans">{whatsappMessage}</pre>
      </div>

      {/* Remove clearance requirement */}
      {!approved && (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-1">Remove Requirement</p>
            <p className="text-xs text-stone-500">If the clearance was flagged in error, remove it to clear this client's file.</p>
          </div>
          <RemoveClearanceButton clientId={id} />
        </div>
      )}

      {/* Printable form */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Blank Form (Coach Copy)</p>
          <Link
            href={`/dashboard/clients/${id}/medical-clearance/print`}
            target="_blank"
            className="text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Open printable form ↗
          </Link>
        </div>
        <p className="text-xs text-stone-500">Blank form pre-filled with client details, for your records.</p>
      </div>
    </div>
  )
}
