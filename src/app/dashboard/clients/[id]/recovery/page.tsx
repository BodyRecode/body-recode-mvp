import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { RECOVERY_PROTOCOLS, type EquipmentTag } from '@/lib/recovery-protocols-seed'
import RecoveryManager from './recovery-manager'

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
    .select('id, name, recovery_equipment_access')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: assignmentsRaw } = await admin
    .from('recovery_protocol_assignments')
    .select('*')
    .eq('client_id', id)
    .order('assigned_at', { ascending: false })

  const assignments = assignmentsRaw ?? []

  const access = (Array.isArray(client.recovery_equipment_access) ? client.recovery_equipment_access : []) as EquipmentTag[]

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-stone-700">Recovery Protocols</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Recovery Protocols</h1>
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          Layer 3 coach-assigned recovery protocols for {client.name}. First tag what equipment they have access to at home and their gym. Then assign protocols from the filtered library - the client only sees what you assign.
        </p>
        <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
          Note: this is separate from the RRS constraint governor (which reads signals and clamps programs). This surface is the prescription tool. RRS state can inform which protocols to assign, but does not auto-assign anything.
        </p>
      </div>

      <RecoveryManager
        clientId={id}
        clientName={client.name}
        initialAccess={access}
        initialAssignments={assignments}
        allProtocols={RECOVERY_PROTOCOLS}
      />
    </div>
  )
}
