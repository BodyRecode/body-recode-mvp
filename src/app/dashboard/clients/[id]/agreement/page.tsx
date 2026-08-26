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
        <Link href={`/dashboard/clients/${id}`} className="text-[#666D7A] hover:text-[#141821] text-sm transition-colors">← Back</Link>
        <span className="text-[#141821]">/</span>
        <p className="text-sm text-[#666D7A]">Coaching Agreement - {client.name}</p>
      </div>

      <div className="flex items-start justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">{client.name}</h1>
          <p className="text-[12.5px] text-[#666D7A] mt-1">Version 2.5 - Sole Trader, Queensland, Australia</p>
        </div>
        <div className="flex items-center gap-2">
          {signedDate && (
            <span className="text-[12.5px] font-semibold text-blue-500 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg">
              Signed {signedDate}
            </span>
          )}
          {client.agreement_accepted_at && (
            <Link
              href={`/dashboard/clients/${id}/agreement/print`}
              target="_blank"
              className="text-sm font-medium px-4 py-2.5 rounded-lg border border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821] transition-colors"
            >
              Download PDF
            </Link>
          )}
        </div>
      </div>

      {!client.agreement_accepted_at ? (
        <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
          <p className="text-[#666D7A] text-sm">Agreement not yet signed.</p>
        </div>
      ) : (
        <>
          {/* Signature details */}
          <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5 mb-6">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">Signature Details</p>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#E8EAEE]">
              <p className="text-[12.5px] text-[#666D7A] w-44 flex-shrink-0">Signed by</p>
              <p className="text-sm text-[#141821] text-right">{client.agreement_accepted_name}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#E8EAEE]">
              <p className="text-[12.5px] text-[#666D7A] w-44 flex-shrink-0">Date signed</p>
              <p className="text-sm text-[#141821] text-right">{signedDate}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <p className="text-[12.5px] text-[#666D7A] w-44 flex-shrink-0">Client email</p>
              <p className="text-sm text-[#141821] text-right">{client.email}</p>
            </div>
          </div>

          {/* Full agreement document */}
          <div className="bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-5">
            <p className="text-[12.5px] font-medium text-[#666D7A] mb-6">Full Agreement Document</p>
            <div className="space-y-8">
              {AGREEMENT_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-[12.5px] font-medium text-blue-500 mb-4">{section.title}</p>
                  <div className="space-y-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <p className="text-sm font-semibold text-[#141821] mb-1">{sub.title}</p>
                        <p className="text-sm text-[#666D7A] leading-relaxed">{sub.content}</p>
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
