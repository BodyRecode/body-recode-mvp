import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import PrescriptionSuggest from './prescription-suggest'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'

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

  // Phase 3 — surface the active recovery constraint manifest so the coach
  // sees what will be auto-applied to this generation (and can choose to
  // override with a documented reason).
  const recoveryManifest = await getActiveConstraintManifest(id)
  const recoveryNotice = recoveryManifest
    ? {
        playbookId: recoveryManifest.playbook.id,
        playbookName: recoveryManifest.playbook.name,
        playbookSource: recoveryManifest.playbook.source,
        tier: recoveryManifest.playbook.tier,
        purpose: recoveryManifest.playbook.purpose,
        daysActive: recoveryManifest.state.days_active,
        enforcementMode: recoveryManifest.enforcementMode,
        constraintsSummary: {
          loadReductionPct: recoveryManifest.playbook.trainingConstraints.loadReductionPct as readonly [number, number] | null,
          sessionsPerWeekCap: recoveryManifest.playbook.trainingConstraints.sessionsPerWeekCap,
          sessionsRemovedPerWeek: recoveryManifest.playbook.trainingConstraints.sessionsRemovedPerWeek as readonly [number, number] | null,
          progressionLocked: recoveryManifest.playbook.trainingConstraints.progressionLocked,
          conditioningBlocked: recoveryManifest.playbook.trainingConstraints.conditioningBlocked,
          testingBlocked: recoveryManifest.playbook.trainingConstraints.testingBlocked,
        },
      }
    : null

  return (
    <PrescriptionSuggest
      clientId={id}
      clientName={client.name}
      planBlock={planBlock}
      planBlockId={plan_block_id ?? null}
      recoveryNotice={recoveryNotice}
    />
  )
}
