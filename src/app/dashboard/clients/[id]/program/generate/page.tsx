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

  const admin = createAdminClient()

  let planBlock = null
  if (plan_block_id) {
    const { data } = await admin
      .from('plan_blocks')
      .select('*')
      .eq('id', plan_block_id)
      .eq('client_id', id)
      .maybeSingle()
    planBlock = data
  }

  // Fetch training days from most recent intake
  let intakeTrainingDays: string[] = []
  const { data: intake } = await admin
    .from('intakes')
    .select('training_days_available')
    .eq('client_id', id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (intake?.training_days_available?.length) {
    intakeTrainingDays = intake.training_days_available
  }

  return <GenerateProgramForm clientId={id} planBlock={planBlock} intakeTrainingDays={intakeTrainingDays} />
}
