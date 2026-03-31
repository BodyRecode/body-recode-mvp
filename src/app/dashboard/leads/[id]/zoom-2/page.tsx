import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { selectBlocks } from '@/lib/report-blocks'
import Zoom2Companion from './zoom-2-companion'

export default async function Zoom2Page({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  const { data: lead } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .single()

  if (!lead) notFound()

  const answers = (lead.check_in_answers as Record<string, number>) ?? {}
  const { slsLevel, rpsLevel, rilsLevel } = selectBlocks(answers)

  const admin = createAdminClient()
  const { data: agreement } = await admin
    .from('founding_client_agreements')
    .select('status')
    .eq('lead_id', id)
    .maybeSingle()

  return (
    <Zoom2Companion
      leadName={lead.name}
      slsLevel={slsLevel}
      rpsLevel={rpsLevel}
      rilsLevel={rilsLevel}
      leadId={id}
      initialNotes={lead.notes ?? ''}
      zoom2TriggerType={lead.zoom2_trigger_type ?? null}
      agreementStatus={agreement?.status ?? null}
    />
  )
}
