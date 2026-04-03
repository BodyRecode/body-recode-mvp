import { createClient } from '@/lib/supabase/server'
import CampaignEditor from '../campaign-editor'

export default async function NewCampaignPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tags } = await supabase
    .from('be_tags')
    .select('id, name')
    .eq('coach_id', user!.id)
    .order('name')

  return <CampaignEditor tags={tags ?? []} />
}
