import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import MessageThread from './message-thread'
import { isCoachEmail } from '@/lib/coach-auth'
import { coach } from '@/config/tenant'

export const dynamic = 'force-dynamic'

export default async function MessageCoachPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/portal/login')

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email')
    .eq('onboarding_token', token)
    .maybeSingle()

  if (!client) return notFound()
  const userEmail = (user.email ?? '').toLowerCase()
  if (userEmail !== (client.email ?? '').toLowerCase() && !isCoachEmail(userEmail)) {
    redirect(`/portal/${token}`)
  }

  // Full conversation, oldest first so it reads top to bottom like a thread.
  const { data: messages } = await admin
    .from('client_messages')
    .select('id, body, sender, created_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: true })

  const coachFirstName = coach().firstName

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">
            Messages
          </h1>
          <p className="text-[#6B6B6B] text-[15px] leading-relaxed">
            Your conversation with {coachFirstName}, all in one place. Replies land here and you will get an email when one arrives. For anything urgent, use WhatsApp at the bottom of the page.
          </p>
        </div>

        <MessageThread
          clientId={client.id}
          clientName={client.name}
          coachFirstName={coachFirstName}
          portalToken={token}
          initialMessages={(messages ?? []).map(m => ({
            id: m.id as string,
            body: m.body as string,
            sender: ((m.sender as string) ?? 'client') as 'client' | 'coach',
            created_at: m.created_at as string,
          }))}
        />

        <div className="h-16" />
      </div>
    </div>
  )
}
