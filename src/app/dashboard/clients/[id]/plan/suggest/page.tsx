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
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-300 transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/plan`} className="hover:text-stone-300 transition-colors">Macro Plan</Link>
          <span>/</span>
          <span className="text-stone-300">Suggest Arc</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Suggest Macro Arc</h1>
        <p className="text-stone-500 text-sm mt-1">Review and edit the suggested training arc before approving as a draft.</p>
      </div>

      <MacroPlanSuggest clientId={id} />
    </div>
  )
}
