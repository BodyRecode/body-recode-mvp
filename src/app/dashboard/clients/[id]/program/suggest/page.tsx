import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import PrescriptionSuggest from './prescription-suggest'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { cffsStateForAnyStateLabel } from '@/lib/pattern-doctrine'
import { deriveReadinessCarryForward } from '@/lib/readiness-carry-forward'

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

  // 2026-08-30 — surface a Progress Read re-score that has not reached a block.
  // The Progress Read writes its re-scored state to programs.tr_new_body_state,
  // but generate-program reads cffs.body_state_classification, so without this
  // the coach has to remember the re-score exists. Only offered when the
  // re-scored state actually DIFFERS from what the CFFS still says.
  const [{ data: latestRead }, { data: activeCffs }] = await Promise.all([
    admin
      .from('programs')
      .select('tr_new_body_state, tr_previous_body_state, tr_state_direction, tr_state_rationale, tr_progress_check_id, block_name')
      .eq('client_id', id)
      .not('tr_new_body_state', 'is', null)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from('cffs')
      .select('body_state_classification')
      .eq('client_id', id)
      .eq('is_archived', false)
      .maybeSingle(),
  ])

  // Readiness carry-forward. Derived here purely so the coach can SEE which
  // domains would move, and on what weekly evidence, before opting in.
  const { data: weeklyReadiness } = await admin
    .from('cfws')
    .select('week_number, exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', id)
    .eq('is_archived', false)
    .order('week_number', { ascending: false })
    .limit(12)

  const { data: cffsReadiness } = await admin
    .from('cffs')
    .select('exposure_readiness_capacity, exposure_readiness_schedule, exposure_readiness_regulation, exposure_readiness_behaviour')
    .eq('client_id', id)
    .eq('is_archived', false)
    .maybeSingle()

  const readinessCarry = cffsReadiness
    ? deriveReadinessCarryForward(weeklyReadiness ?? [], cffsReadiness)
    : null
  const readinessNotice = readinessCarry?.hasChange ? readinessCarry : null

  const rescoredInternal = cffsStateForAnyStateLabel(latestRead?.tr_new_body_state ?? null)
  const reScoreNotice =
    rescoredInternal && activeCffs?.body_state_classification && rescoredInternal !== activeCffs.body_state_classification
      ? {
          publicLabel: latestRead!.tr_new_body_state as string,
          internalLabel: rescoredInternal,
          cffsLabel: activeCffs.body_state_classification as string,
          direction: (latestRead!.tr_state_direction as string | null) ?? null,
          rationale: (latestRead!.tr_state_rationale as string | null) ?? null,
          fromBlock: (latestRead!.block_name as string | null) ?? null,
        }
      : null

  return (
    <PrescriptionSuggest
      clientId={id}
      clientName={client.name}
      planBlock={planBlock}
      planBlockId={plan_block_id ?? null}
      recoveryNotice={recoveryNotice}
      reScoreNotice={reScoreNotice}
      readinessNotice={readinessNotice}
    />
  )
}
