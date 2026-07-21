import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SUPPLEMENT_SUBSTANCES } from '@/lib/supplement-substances-seed'
import SupplementsManager from './supplements-manager'

/**
 * Coach editor for Supplement assignments per client.
 * Layer 3 prescription tool. Substance library lives in code as the
 * source of truth. Client sees all three tiers of any assigned
 * substance and picks what fits their budget.
 */
export default async function CoachSupplementsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: assignmentsRaw } = await admin
    .from('supplement_assignments')
    .select('*')
    .eq('client_id', id)
    .order('assigned_at', { ascending: false })

  const assignments = assignmentsRaw ?? []

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-stone-700">Supplements</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Supplement stack</h1>
        <p className="text-stone-600 text-sm mt-2 leading-relaxed">
          Layer 3 coach-assigned supplements for {client.name}. Assign a substance from the library - {client.name} sees all three tiers (Essential / Enhanced / Elite) and picks what fits their budget and commitment.
        </p>
        <p className="text-[11px] text-stone-500 mt-2 leading-relaxed">
          Note: substance library lives in code. Deep research reports and doctrine rationale for each substance live at <code className="bg-stone-100 px-1 rounded">~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/</code>. Add new substances by editing <code className="bg-stone-100 px-1 rounded">src/lib/supplement-substances-seed.ts</code>.
        </p>
      </div>

      <SupplementsManager
        clientId={id}
        clientName={client.name}
        initialAssignments={assignments}
        allSubstances={SUPPLEMENT_SUBSTANCES}
      />
    </div>
  )
}
