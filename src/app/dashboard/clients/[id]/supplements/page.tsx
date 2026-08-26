import { createAdminClient } from '@/lib/supabase/admin'
import ClientPageNav from '../client-page-nav'
import { PageHeader } from '@/components/dashboard/ui'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { SUPPLEMENT_SUBSTANCES } from '@/lib/supplement-substances-seed'
import SupplementsManager from './supplements-manager'
import SuggestionPanel, { type SuggestionSet } from './suggestion-panel'

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
    .select('id, name, medications')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const [{ data: assignmentsRaw }, { data: latestSuggestion }] = await Promise.all([
    admin
      .from('supplement_assignments')
      .select('*')
      .eq('client_id', id)
      .order('assigned_at', { ascending: false }),
    // Last generated set, so opening the page doesn't cost a clinical-tier call.
    admin
      .from('supplement_suggestions')
      .select('generated_at, overview, suggestions, not_now, gated')
      .eq('client_id', id)
      .order('generated_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const assignments = assignmentsRaw ?? []
  const activeSlugs = assignments.filter(a => a.status === 'active').map(a => a.substance_slug)

  const initialSet: SuggestionSet | null = latestSuggestion
    ? {
        generated_at: latestSuggestion.generated_at,
        overview: latestSuggestion.overview ?? '',
        suggestions: (latestSuggestion.suggestions ?? []) as SuggestionSet['suggestions'],
        not_now: (latestSuggestion.not_now ?? []) as SuggestionSet['not_now'],
        gated: (latestSuggestion.gated ?? []) as SuggestionSet['gated'],
      }
    : null

  return (
    <div className="max-w-[980px]">
      <PageHeader
        eyebrow={<Link href={`/dashboard/clients/${id}`} className="hover:text-[#1B6DFC] transition-colors">{client.name}</Link>}
        title="Supplement stack"
        subtitle={`Layer 3 coach-assigned supplements for ${client.name}. Assign a substance from the library - ${client.name} sees all three tiers (Essential / Enhanced / Elite) and picks what fits their budget and commitment.`}
      />
      <ClientPageNav clientId={id} />
      <p className="text-[12.5px] text-[#98A0AD] -mt-2 mb-6 leading-relaxed">
        The substance library lives in code. Research reports and doctrine rationale sit at <code className="bg-[#F4F6F9] px-1 rounded">~/Dropbox/01_BODY_RECODE/00_PLAYBOOK/supplement_research/</code>; add substances in <code className="bg-[#F4F6F9] px-1 rounded">src/lib/supplement-substances-seed.ts</code>.
      </p>

      <SuggestionPanel
        clientId={id}
        clientName={client.name}
        initialSet={initialSet}
        clientMedications={client.medications ?? null}
        activeSlugs={activeSlugs}
      />

      <SupplementsManager
        clientId={id}
        clientName={client.name}
        initialAssignments={assignments}
        allSubstances={SUPPLEMENT_SUBSTANCES}
      />
    </div>
  )
}
