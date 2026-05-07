import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
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

  // Programs must be generated from a meso block in the macro plan. Without a
  // plan_block_id the prescription has no progression context, so redirect to
  // the plan and have the coach pick a block.
  if (!plan_block_id) {
    redirect(`/dashboard/clients/${id}/plan`)
  }

  const { data: planBlock } = await admin
    .from('plan_blocks')
    .select('*, training_plans(plan_name, macro_objective)')
    .eq('id', plan_block_id)
    .eq('client_id', id)
    .maybeSingle()

  // If the block id was wrong / belongs to another client, also bounce back
  // to the plan rather than generating without context.
  if (!planBlock) {
    redirect(`/dashboard/clients/${id}/plan`)
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
