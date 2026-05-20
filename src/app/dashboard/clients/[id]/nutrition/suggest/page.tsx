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

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/nutrition`} className="hover:text-stone-700 transition-colors">Nutrition Plan</Link>
          <span>/</span>
          <span className="text-stone-700">Prescription</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Nutrition Prescription</h1>
        <p className="text-stone-500 text-sm mt-1">Review the suggested prescription before generating the plan.</p>
      </div>

      <NutritionPrescriptionSuggest clientId={id} clientName={client.name} />
    </div>
  )
}
