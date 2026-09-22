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
        <Link href={`/dashboard/clients/${id}`} className="text-[#6E747D] hover:text-[#0F1115] text-sm transition-colors">← Back</Link>
        <span className="text-[#0F1115]">/</span>
        <p className="text-sm text-[#6E747D]">Coaching Agreement - {client.name}</p>
      </div>

      <div className="flex items-start justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E4E4E0] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold text-[#0F1115] tracking-[-0.025em]">{client.name}</h1>
          <p className="text-[12.5px] text-[#6E747D] mt-1">Version 2.5 - Sole Trader, Queensland, Australia</p>
        </div>
        <div className="flex items-center gap-2">
          {signedDate && (
            <span className="text-[12.5px] font-semibold text-[#0F1115] bg-[rgba(27,109,252,0.08)] border border-[#DCDCD7] px-3 py-1.5 rounded-lg">
              Signed {signedDate}
            </span>
          )}
          {client.agreement_accepted_at && (
            <Link
              href={`/dashboard/clients/${id}/agreement/print`}
              target="_blank"
              className="text-sm font-medium px-4 py-2.5 rounded-lg border border-[#E4E4E0] text-[#6E747D] hover:border-[#DCDCD7] hover:text-[#0F1115] transition-colors"
            >
              Download PDF
            </Link>
          )}
        </div>
      </div>

      {!client.agreement_accepted_at ? (
        <div className="bg-[#F2F2EF] br-card p-5">
          <p className="text-[#6E747D] text-sm">Agreement not yet signed.</p>
        </div>
      ) : (
        <>
          {/* Signature details */}
          <div className="bg-[#F2F2EF] br-card p-5 mb-6">
            <p className="text-[12.5px] font-medium text-[#6E747D] mb-3">Signature Details</p>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#E4E4E0]">
              <p className="text-[12.5px] text-[#6E747D] w-44 flex-shrink-0">Signed by</p>
              <p className="text-sm text-[#0F1115] text-right">{client.agreement_accepted_name}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5 border-b border-[#E4E4E0]">
              <p className="text-[12.5px] text-[#6E747D] w-44 flex-shrink-0">Date signed</p>
              <p className="text-sm text-[#0F1115] text-right">{signedDate}</p>
            </div>
            <div className="flex items-start justify-between gap-4 py-2.5">
              <p className="text-[12.5px] text-[#6E747D] w-44 flex-shrink-0">Client email</p>
              <p className="text-sm text-[#0F1115] text-right">{client.email}</p>
            </div>
          </div>

          {/* Full agreement document */}
          <div className="bg-[#F2F2EF] br-card p-5">
            <p className="text-[12.5px] font-medium text-[#6E747D] mb-6">Full Agreement Document</p>
            <div className="space-y-8">
              {AGREEMENT_SECTIONS.map((section) => (
                <div key={section.title}>
                  <p className="text-[12.5px] font-medium text-[#0F1115] mb-4">{section.title}</p>
                  <div className="space-y-4">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <p className="text-sm font-semibold text-[#0F1115] mb-1">{sub.title}</p>
                        <p className="text-sm text-[#6E747D] leading-relaxed">{sub.content}</p>
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
