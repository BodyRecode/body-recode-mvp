import { createAdminClient } from '@/lib/supabase/admin'
import GenerateProgramForm from './form'

export default async function GenerateProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ plan_block_id?: string }>
}) {
  const { id } = await params
  const { plan_block_id } = await searchParams

  let planBlock = null
  if (plan_block_id) {
    const admin = createAdminClient()
    const { data } = await admin
      .from('plan_blocks')
      .select('*')
      .eq('id', plan_block_id)
      .eq('client_id', id)
      .maybeSingle()
    planBlock = data
  }

  return <GenerateProgramForm clientId={id} planBlock={planBlock} />
}
