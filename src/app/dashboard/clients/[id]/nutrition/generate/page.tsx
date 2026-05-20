import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NutritionGenerateForm from './form'

export default async function NutritionGeneratePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-700 transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/nutrition`} className="hover:text-stone-700 transition-colors">Nutrition Plan</Link>
          <span>/</span>
          <span className="text-stone-700">Generate</span>
        </div>
        <h1 className="text-2xl font-semibold text-[#1A1A1A]">Generate Nutrition Plan</h1>
        <p className="text-stone-500 text-sm mt-1">Fill in the prescription manually.</p>
      </div>

      <NutritionGenerateForm clientId={id} />
    </div>
  )
}
