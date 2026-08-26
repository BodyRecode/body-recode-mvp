import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NutritionPrescriptionSuggest from './nutrition-suggest'

export default async function NutritionSuggestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  // Pull the active nutrition plan's bridge-mode metadata so the suggest UI
  // can offer a one-click "step up bridge floor by +200 kcal" preset when
  // regenerating an existing bridge plan. Lets the coach incrementally ramp
  // toward the standard floor rather than removing the override entirely.
  const { data: activePlan } = await admin
    .from('nutrition_plans')
    .select('id, transitional_override_active, transitional_override_floor_kcal, transitional_override_justification')
    .eq('client_id', id)
    .eq('is_active', true)
    .maybeSingle()

  return (
    <div className="max-w-[980px]">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[#666D7A] text-sm br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-[#141821] transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/nutrition`} className="hover:text-[#141821] transition-colors">Nutrition Plan</Link>
          <span>/</span>
          <span className="text-[#141821]">Prescription</span>
        </div>
        <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Nutrition Prescription</h1>
        <p className="text-[#666D7A] text-sm mt-1">Review the suggested prescription before generating the plan.</p>
      </div>

      <NutritionPrescriptionSuggest
        clientId={id}
        clientName={client.name}
        activeBridge={activePlan?.transitional_override_active ? {
          floorKcal: activePlan.transitional_override_floor_kcal ?? 0,
          justification: activePlan.transitional_override_justification ?? '',
        } : null}
      />
    </div>
  )
}
