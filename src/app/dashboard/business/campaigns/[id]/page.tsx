import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CampaignEditor from '../campaign-editor'

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: campaign }, { data: tags }] = await Promise.all([
    supabase
      .from('be_campaigns')
      .select('*')
      .eq('id', id)
      .eq('coach_id', user!.id)
      .single(),
    supabase
      .from('be_tags')
      .select('id, name')
      .eq('coach_id', user!.id)
      .order('name'),
  ])

  if (!campaign) notFound()

  return (
    <CampaignEditor
      campaign={{
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        subject: campaign.subject,
        content: campaign.content,
        status: campaign.status,
        recipient_filter: campaign.recipient_filter,
        scheduled_at: campaign.scheduled_at,
      }}
      tags={tags ?? []}
    />
  )
}
