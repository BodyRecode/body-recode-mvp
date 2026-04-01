import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import DraftEditor from './draft-editor'

export default async function DraftReviewPage({
  params,
}: {
  params: Promise<{ id: string; program_id: string }>
}) {
  const { id, program_id } = await params
  const admin = createAdminClient()

  const { data: client } = await admin
    .from('clients')
    .select('id, name')
    .eq('id', id)
    .maybeSingle()

  if (!client) notFound()

  const { data: program } = await admin
    .from('programs')
    .select('*')
    .eq('id', program_id)
    .eq('client_id', id)
    .eq('status', 'draft')
    .maybeSingle()

  if (!program) notFound()

  return (
    <DraftEditor
      clientId={id}
      clientName={client.name}
      program={program}
    />
  )
}
