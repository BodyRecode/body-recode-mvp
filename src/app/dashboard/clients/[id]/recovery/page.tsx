import { createAdminClient } from '@/lib/supabase/admin'
import ClientPageNav from '../client-page-nav'
import { PageHeader } from '@/components/dashboard/ui'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RECOVERY_PROTOCOLS, type EquipmentTag } from '@/lib/recovery-protocols-seed'
import { getActiveConstraintManifest } from '@/lib/recovery-state-machine'
import { getSuggestionsForState } from '@/lib/rrs-protocol-suggestions'
import type { RecoveryPlaybookId } from '@/lib/recovery-doctrine'
import RecoveryManager from './recovery-manager'
import RecoveryPlanSuggestionPanel, { type RecoveryPlanSet } from './plan-suggestion-panel'

/**
 * Coach editor for Recovery Protocols per client.
 * Layer 3 prescription tool - separate from the RRS constraint governor.
 *
 * Coach flow:
 * 1. Tag what equipment the client has access to (home + gym).
 * 2. See the filtered protocol library - only protocols the client can do.
 * 3. Assign protocols with optional per-assignment coach note + dosing override.
 * 4. Manage active assignments: pause, complete, delete, edit note.
 */
export default async function CoachRecoveryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name, recovery_equipment_access, medications')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const [{ data: assignmentsRaw }, { data: latestPlan }] = await Promise.all([
    admin
      .from('recovery_protocol_assignments')
      .select('*')
      .eq('client_id', id)
      .order('assigned_at', { ascending: false }),
    // Last generated plan, so opening the page costs nothing.
    admin
      .from('recovery_plan_suggestions')
      .select('generated_at, overview, suggestions, not_now, gated, rrs_note')
      .eq('client_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const assignments = assignmentsRaw ?? []
  const activeSlugs = assignments.filter(a => a.status === 'active').map(a => a.protocol_slug)

  const initialPlanSet: RecoveryPlanSet | null = latestPlan
    ? {
        generated_at: latestPlan.generated_at,
        overview: latestPlan.overview ?? '',
        suggestions: (latestPlan.suggestions ?? []) as RecoveryPlanSet['suggestions'],
        not_now: (latestPlan.not_now ?? []) as RecoveryPlanSet['not_now'],
        gated: (latestPlan.gated ?? []) as RecoveryPlanSet['gated'],
        rrs_note: latestPlan.rrs_note ?? null,
      }
    : null

  const access = (Array.isArray(client.recovery_equipment_access) ? client.recovery_equipment_access : []) as EquipmentTag[]

  // RRS -> Recovery integration. If the client is in an active RRS state,
  // fetch the state-specific suggestion so the manager can render a banner.
  const activeState = await getActiveConstraintManifest(id)
  const rrsSuggestion = activeState
    ? {
        ...getSuggestionsForState(activeState.playbook.id as RecoveryPlaybookId),
        playbook_id: activeState.playbook.id as RecoveryPlaybookId,
        playbook_name: activeState.playbook.name,
        days_active: activeState.state.days_active,
        entered_at: activeState.state.entered_at,
      }
    : null

  // Log the suggestion view (fire-and-forget; failure never blocks the page).
  if (rrsSuggestion) {
    void admin
      .from('recovery_protocol_suggestions_log')
      .insert({
        client_id: id,
        rrs_playbook_id: rrsSuggestion.playbook_id,
        suggested_protocol_slugs: rrsSuggestion.suggested_protocol_slugs,
        sbst_action: rrsSuggestion.sbst_action,
      })
      .then(({ error }) => {
        if (error) console.error('suggestion log insert failed:', error)
      })
  }

  return (
    <div className="max-w-[980px]">
      <PageHeader
        eyebrow={<Link href={`/dashboard/clients/${id}`} className="hover:text-[#1B6DFC] transition-colors">{client.name}</Link>}
        title="Recovery Protocols"
        subtitle={`Layer 3 coach-assigned recovery protocols for ${client.name}. First tag what equipment they have access to at home and their gym. Then assign protocols from the filtered library - the client only sees what you assign.`}
      />
      <ClientPageNav clientId={id} />
      <p className="text-[12.5px] text-[#98A0AD] -mt-2 mb-6 leading-relaxed">
        Separate from the RRS constraint governor, which reads signals and clamps programs. This surface is the prescription tool: RRS state can inform which protocols to assign, but assigns nothing itself.
      </p>

      <RecoveryPlanSuggestionPanel
        clientId={id}
        clientName={client.name}
        initialSet={initialPlanSet}
        clientMedications={client.medications ?? null}
        activeSlugs={activeSlugs}
        hasEquipmentTagged={access.length > 0}
      />

      <RecoveryManager
        clientId={id}
        clientName={client.name}
        initialAccess={access}
        initialAssignments={assignments}
        allProtocols={RECOVERY_PROTOCOLS}
        rrsSuggestion={rrsSuggestion}
      />
    </div>
  )
}
