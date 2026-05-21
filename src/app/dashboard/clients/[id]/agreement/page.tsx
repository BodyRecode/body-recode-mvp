import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { AGREEMENT_SECTIONS } from '@/lib/agreement-sections'

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
        <Link href={`/dashboard/clients/${id}`} className="text-stone-500 hover:text-[#1A1A1A] text-sm transition-colors">← Back</Link>
        <span className="text-stone-700">/</span>
        <p className="text-sm text-stone-600">Coaching Agreement - {client.name}</p>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#1A1A1A]">{client.name}</h1>
          <p className="text-xs text-stone-500 mt-1">Version 2.5 - Sole Trader, Queensland, Australia</p>
        </div>
        <div className="flex items-center gap-2">
          {signedDate && (
            <span className="text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              Signed {signedDate}
            </span>
          )}
          {client.agreement_accepted_at && (
            <Link
              href={`/dashboard/clients/${id}/agreement/print`}
              target="_blank"
              className="text-sm font-medium px-4 py-2.5 rounded-lg border border-stone-300 text-stone-600 hover:border-stone-500 hover:text-stone-800 transition-colors"
            >
              Download PDF
            </Link>
          )}
        </div>
      </div>

      {!client.agreement_accepted_at ? (
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <p className="text-stone-500 text-sm">Agreement not yet signed.</p>
        </div>
      ) : (
        <>
          {/* Signature details */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-5 mb-6">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-3">Signature Details</p>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-200">
              <p className="text-xs text-stone-500 w-44 flex-shrink-0">Signed by</p>
              <p className="text-sm text-stone-800 text-right">{client.agreement_accepted_name}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-stone-200">
              <p className="text-xs text-stone-500 w-44 flex-shrink-0">Date signed</p>
              <p className="text-sm text-stone-800 text-right">{signedDate}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <p className="text-xs text-stone-500 w-44 flex-shrink-0">Client email</p>
              <p className="text-sm text-stone-800 text-right">{client.email}</p>
            </div>
          </div>

          {/* Full agreement document */}
          <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
            <p className="text-xs font-bold tracking-widest text-stone-500 uppercase mb-6">Full Agreement Document</p>
            <div className="space-y-8">
              {AGREEMENT_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-4">{section.title}</p>
                  <div className="space-y-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <p className="text-sm font-semibold text-stone-800 mb-1">{sub.title}</p>
                        <p className="text-sm text-stone-600 leading-relaxed">{sub.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
