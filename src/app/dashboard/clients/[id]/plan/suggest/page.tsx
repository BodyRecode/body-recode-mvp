import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MacroPlanSuggest from './plan-suggest'

export default async function MacroPlanSuggestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  return (
    <div className="max-w-[980px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#666D7A] text-sm br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-[#141821] transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/plan`} className="hover:text-[#141821] transition-colors">Macro Plan</Link>
          <span>/</span>
          <span className="text-[#141821]">Suggest Arc</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Suggest Macro Arc</h1>
        <p className="text-[#666D7A] text-sm mt-1">Review and edit, then save as a draft. You&apos;ll approve it on the plan page to activate.</p>
      </div>

      <MacroPlanSuggest clientId={id} />
    </div>
  )
}
