import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MarkClearanceButton from './mark-clearance-button'

export default async function MedicalClearancePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('id, name, email, medical_clearance_required, medical_clearance_received_at, medical_clearance_conditions, health_declaration_submitted_at')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  const firstName = client.name?.split(' ')[0] ?? 'there'
  const received = !!client.medical_clearance_received_at

  const whatsappMessage = `Hi ${firstName},

Thanks for completing your health declaration.

Based on one of your responses, we need to obtain medical clearance before progressing into structured training exposure.

This is a routine precautionary step within our onboarding process. It simply ensures that we are operating safely and within appropriate boundaries before increasing load.

I'll send you a Medical Clearance Request Form for your GP to complete. Please book an appointment, take the form with you, and ask them to confirm exercise participation eligibility.

Once completed, send through a clear photo or PDF copy and we'll move forward from there.

All other onboarding steps can continue in the meantime.

If anything is unclear, just message me here and I'll guide you through it.

Kade`

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-white text-sm transition-colors">← Back</Link>
        <span className="text-stone-700">/</span>
        <p className="text-sm text-stone-400">Medical Clearance — {client.name}</p>
      </div>

      {received ? (
        <div className="bg-teal-400/10 border border-teal-400/20 rounded-xl p-5 mb-6">
          <p className="text-sm font-semibold text-teal-400 mb-1">Clearance received</p>
          <p className="text-xs text-stone-400">Received on {new Date(client.medical_clearance_received_at!).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}. Onboarding can proceed.</p>
        </div>
      ) : (
        <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5 mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-400 mb-1">Medical clearance required</p>
            <p className="text-xs text-stone-400">Intake and baseline are locked until clearance is received.</p>
          </div>
          <MarkClearanceButton clientId={id} />
        </div>
      )}

      {/* WhatsApp message */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">WhatsApp Message</p>
          <button
            onClick={() => {}}
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
            id="copy-whatsapp"
          >
            Copy
          </button>
        </div>
        <pre className="text-sm text-stone-300 whitespace-pre-wrap leading-relaxed font-sans">{whatsappMessage}</pre>
      </div>

      {/* Printable form */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase">Medical Clearance Request Form</p>
          <Link
            href={`/dashboard/clients/${id}/medical-clearance/print`}
            target="_blank"
            className="text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white px-3 py-1.5 rounded-lg transition-colors"
          >
            Open printable form ↗
          </Link>
        </div>
        <p className="text-xs text-stone-500">Open the printable form, print or save as PDF, and give to the client to take to their GP.</p>
      </div>
    </div>
  )
}
