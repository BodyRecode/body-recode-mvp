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
        <div className="flex items-center gap-2 text-[#6E747D] text-sm br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E4E4E0] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-[#0F1115] transition-colors">{client.name}</Link>
          <span>/</span>
          <Link href={`/dashboard/clients/${id}/nutrition`} className="hover:text-[#0F1115] transition-colors">Nutrition Plan</Link>
          <span>/</span>
          <span className="text-[#0F1115]">Generate</span>
        </div>
        <h1 className="text-[20px] font-semibold text-[#0F1115] tracking-[-0.025em]">Generate Nutrition Plan</h1>
        <p className="text-[#6E747D] text-sm mt-1">Fill in the prescription manually.</p>
      </div>

      <NutritionGenerateForm clientId={id} />
    </div>
  )
}
