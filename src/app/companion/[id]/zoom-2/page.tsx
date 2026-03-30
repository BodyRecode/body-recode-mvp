import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { selectBlocks } from '@/lib/report-blocks'
import Zoom2Companion from './zoom-2-companion'

export default async function Zoom2CompanionPage({ params }: { params: Promise<{ id: string }> }) {
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

  return (
    <Zoom2Companion
      leadName={lead.name}
      slsLevel={slsLevel}
      rpsLevel={rpsLevel}
      rilsLevel={rilsLevel}
      leadId={id}
      initialNotes={lead.notes ?? ''}
    />
  )
}
