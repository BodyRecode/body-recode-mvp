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
  } else {
    // No plan_block_id in the URL used to mean every field fell back to its
    // hardcoded default: accumulation, strength, 3x/week, 4 weeks. For a client
    // in Remediation with an approved arc that is wrong on every count, and the
    // coach had no signal it had happened. Resolve the current block instead.
    const { data } = await admin
      .from('plan_blocks')
      .select('*, training_plans!inner(status)')
      .eq('client_id', id)
      .eq('training_plans.status', 'active')
      .in('status', ['in_progress', 'planned'])
      .order('position', { ascending: true })
      .limit(1)
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
