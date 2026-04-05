import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ContentClient from './content-client'

export default async function ContentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: hooks },
    { data: messages },
    { data: ctas },
    { data: outputs },
  ] = await Promise.all([
    supabase.from('be_content_hooks').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
    supabase.from('be_content_messages').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
    supabase.from('be_content_ctas').select('*').eq('coach_id', user.id).order('created_at', { ascending: false }),
    supabase
      .from('be_content_outputs')
      .select('*, hook:be_content_hooks(hook_text, category), message:be_content_messages(message_text, type), cta:be_content_ctas(cta_text)')
      .eq('coach_id', user.id)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  return (
    <ContentClient
      initialHooks={hooks ?? []}
      initialMessages={messages ?? []}
      initialCtas={ctas ?? []}
      initialOutputs={outputs ?? []}
    />
  )
}
