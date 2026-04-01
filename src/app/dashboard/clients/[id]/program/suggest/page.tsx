import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import PrescriptionSuggest from './prescription-suggest'

export default async function SuggestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ plan_block_id?: string }>
}) {
  const { id } = await params
  const { plan_block_id } = await searchParams
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  let planBlock = null
  if (plan_block_id) {
    const { data } = await admin
      .from('plan_blocks')
      .select('*, training_plans(plan_name, macro_objective)')
      .eq('id', plan_block_id)
      .eq('client_id', id)
      .maybeSingle()
    planBlock = data
  }

  return (
    <PrescriptionSuggest
      clientId={id}
      clientName={client.name}
      planBlock={planBlock}
      planBlockId={plan_block_id ?? null}
    />
  )
}
