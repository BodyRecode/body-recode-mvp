import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { selectBlocks, getSignalPattern } from '@/lib/report-blocks'
import ZoomCompanion from './zoom-companion'

export default async function Zoom1CompanionPage({ params }: { params: Promise<{ id: string }> }) {
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

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0)
  const signalPattern = getSignalPattern(totalScore, Object.keys(answers).length * 3)

  return (
    <ZoomCompanion
      leadName={lead.name}
      signalPattern={signalPattern}
      slsLevel={slsLevel}
      rpsLevel={rpsLevel}
      rilsLevel={rilsLevel}
      leadId={id}
      initialNotes={lead.notes ?? ''}
    />
  )
}
