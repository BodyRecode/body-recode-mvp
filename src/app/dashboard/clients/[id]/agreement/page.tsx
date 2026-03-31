import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function AgreementViewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, agreement_accepted_at, agreement_accepted_name')
    .eq('id', id)
    .single()

  if (!client) return notFound()

  const signedDate = client.agreement_accepted_at
    ? new Date(client.agreement_accepted_at).toLocaleDateString('en-AU', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-white text-sm transition-colors">← Back</Link>
        <span className="text-stone-700">/</span>
        <p className="text-sm text-stone-400">Coaching Agreement — {client.name}</p>
      </div>

      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">{client.name}</h1>
        {signedDate && <p className="text-xs text-stone-500 mt-1">Signed {signedDate}</p>}
      </div>

      {!client.agreement_accepted_at ? (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5">
          <p className="text-stone-500 text-sm">Agreement not yet signed.</p>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">Signature Details</p>
          <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-800">
            <p className="text-xs text-stone-500 w-44 flex-shrink-0">Signed by</p>
            <p className="text-sm text-stone-200 text-right">{client.agreement_accepted_name}</p>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-800">
            <p className="text-xs text-stone-500 w-44 flex-shrink-0">Date signed</p>
            <p className="text-sm text-stone-200 text-right">{signedDate}</p>
          </div>
          <div className="flex items-start justify-between gap-4 py-2.5">
            <p className="text-xs text-stone-500 w-44 flex-shrink-0">Client email</p>
            <p className="text-sm text-stone-200 text-right">{client.email}</p>
          </div>
        </div>
      )}
    </div>
  )
}
