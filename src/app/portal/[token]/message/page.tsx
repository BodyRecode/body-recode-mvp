import { createAdminClient } from '@/lib/supabase/admin'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import ClientHeader from '@/components/client-header'
import MessageForm from './message-form'
import { isCoachEmail } from '@/lib/coach-auth'

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

  // Pull recent messages for context (most recent first, last 5)
  const { data: recentMessages } = await admin
    .from('client_messages')
    .select('id, body, created_at, responded_at')
    .eq('client_id', client.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#1A1A1A]">
      <ClientHeader />
      <div className="max-w-lg mx-auto px-6 py-10">
        <div className="mb-8">
          <Link href={`/portal/${token}/resources`} className="text-[12px] text-[#999999] hover:text-[#3A3A3A] transition-colors">← Back to resources</Link>
          <h1 className="text-[30px] font-extrabold text-[#1A1A1A] tracking-tight leading-[1.1] mt-4 mb-2">Message your coach</h1>
          <p className="text-[#6B6B6B] text-[15px] leading-relaxed">Send a non-urgent message and your coach will reply by email. For anything urgent, use WhatsApp at the bottom of the portal.</p>
        </div>

        <MessageForm clientId={client.id} clientName={client.name} portalToken={token} />

        {recentMessages && recentMessages.length > 0 && (
          <div className="mt-10">
            <p className="text-[10px] font-bold text-[#999999] uppercase tracking-widest mb-3">Recent messages</p>
            <div className="space-y-3">
              {recentMessages.map(m => (
                <div key={m.id} className="rounded-2xl border border-[#E5E5E5] bg-[#FFFFFF]/70 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-[#999999]">
                      {new Date(m.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${m.responded_at ? 'text-[#1B6DFC]' : 'text-[#999999]'}`}
                    >
                      {m.responded_at ? 'Replied' : 'Sent'}
                    </span>
                  </div>
                  <p className="text-[13px] text-[#3A3A3A] whitespace-pre-line leading-relaxed">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-16" />
      </div>
    </div>
  )
}
