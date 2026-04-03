import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdsClient from './ads-client'

export default async function AdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: campaigns } = await supabase
    .from('be_ad_campaigns')
    .select('*')
    .eq('coach_id', user.id)
    .order('date_from', { ascending: false })

  return <AdsClient initialCampaigns={campaigns ?? []} />
}
