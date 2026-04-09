import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import UpgradeCompanion from './upgrade-companion'

export default async function UpgradeCompanionPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = createAdminClient()
  const { id } = await params

  const { data: client } = await admin
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()

  if (!client) notFound()

  const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

  // Get latest CFFS for body state context
  const { data: cffsRecords } = await admin
    .from('cffs')
    .select('body_state_classification, generated_at')
    .eq('client_id', id)
    .eq('is_archived', false)
    .order('generated_at', { ascending: false })
    .limit(1)

  const bodyState = cffsRecords?.[0]?.body_state_classification ?? null

  return (
    <UpgradeCompanion
      clientName={client.name}
      clientId={id}
      weekNumber={weekNumber}
      currentPackage={client.package ?? '2x'}
      bodyState={bodyState}
    />
  )
}
