import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import MacroPlanEditor from './macro-plan-editor'

export default async function MacroPlanPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: plan } = await admin
    .from('training_plans')
    .select('*, plan_blocks(*)')
    .eq('client_id', id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .maybeSingle()

  if (plan?.plan_blocks) {
    plan.plan_blocks.sort((a: { position: number }, b: { position: number }) => a.position - b.position)
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-stone-500 text-sm mb-2">
          <Link href={`/dashboard/clients/${id}`} className="hover:text-stone-300 transition-colors">{client.name}</Link>
          <span>/</span>
          <span className="text-stone-300">Macro Plan</span>
        </div>
        <h1 className="text-2xl font-semibold text-white">Macro Training Arc</h1>
        <p className="text-sm text-stone-500 mt-1">Plan the full sequence of meso blocks. Each block links to a generated program.</p>
      </div>

      <MacroPlanEditor clientId={id} clientName={client.name} initialPlan={plan} />
    </div>
  )
}
