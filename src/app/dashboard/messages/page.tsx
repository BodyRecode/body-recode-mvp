import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { PageHeader, Card, StatCard, EmptyState } from '@/components/dashboard/ui'
import { isAnchorKind, anchorChipLabel, anchorPortalHref } from '@/lib/message-anchors'
import ReplyBox from './reply-box'

export const dynamic = 'force-dynamic'

type MessageRow = {
  id: string
  client_id: string
  body: string
  sender: 'client' | 'coach'
  created_at: string
  read_at: string | null
  responded_at: string | null
  client_read_at: string | null
  anchor_kind: string | null
  anchor_label: string | null
}

function when(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  if (mins < 60 * 24 * 7) return `${Math.round(mins / (60 * 24))}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default async function MessagesInboxPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isCoachEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: messageRows } = await admin
    .from('client_messages')
    .select('id, client_id, body, sender, created_at, read_at, responded_at, client_read_at, anchor_kind, anchor_label')
    .order('created_at', { ascending: false })
    .limit(500)

  const messages = (messageRows ?? []) as MessageRow[]

  const clientIds = Array.from(new Set(messages.map(m => m.client_id)))
  const { data: clientRows } = clientIds.length
    ? await admin.from('clients').select('id, name, email, onboarding_token').in('id', clientIds)
    : { data: [] }

  const clientsById = new Map(
    (clientRows ?? []).map(c => [c.id as string, c as { id: string; name: string; email: string; onboarding_token: string }])
  )

  // One conversation per client, newest activity first. Awaiting-reply means
  // their latest message is theirs and nobody has answered it.
  const conversations = clientIds
    .map(cid => {
      const thread = messages.filter(m => m.client_id === cid)
      const latest = thread[0]
      const awaitingReply = thread.some(m => m.sender === 'client' && !m.responded_at)
      return { clientId: cid, thread, latest, awaitingReply }
    })
    .sort((a, b) => {
      if (a.awaitingReply !== b.awaitingReply) return a.awaitingReply ? -1 : 1
      return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    })

  const awaitingCount = conversations.filter(c => c.awaitingReply).length
  const totalClientMessages = messages.filter(m => m.sender === 'client').length

  return (
    <div>
      <PageHeader
        eyebrow="Coaching"
        title="Messages"
        subtitle="Every conversation with a client, both directions. Replying here lands in their portal thread and emails them a copy."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <StatCard label="Awaiting reply" value={String(awaitingCount)} />
        <StatCard label="Conversations" value={String(conversations.length)} />
        <StatCard label="Client messages" value={String(totalClientMessages)} />
      </div>

      {conversations.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          hint="When a client messages you from their portal it appears here, and your reply goes straight back into their portal thread."
        />
      ) : (
        <div className="space-y-6">
          {conversations.map(({ clientId, thread, awaitingReply }) => {
            const client = clientsById.get(clientId)
            const name = client?.name ?? 'Unknown client'
            const firstName = name.split(' ')[0]
            return (
              <Card key={clientId} accent={awaitingReply ? 'blue' : undefined}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    {client ? (
                      <Link
                        href={`/dashboard/clients/${clientId}`}
                        className="text-[15px] font-bold text-[#1A1A1A] hover:text-[#1B6DFC] transition-colors"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="text-[15px] font-bold text-[#1A1A1A]">{name}</span>
                    )}
                    <p className="text-[12px] text-[#999999] mt-0.5">
                      {thread.length} message{thread.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  {awaitingReply && (
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#1B6DFC] bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] px-2 py-1 rounded-md">
                      Awaiting reply
                    </span>
                  )}
                </div>

                <ReplyBox
                  clientId={clientId}
                  clientFirstName={firstName}
                  canDraft={thread.some(m => m.sender === 'client')}
                />

                {/* Newest first, matching the client's view of the same thread. */}
                <div className="space-y-3 mt-5">
                  {thread.slice(0, 6).map(m => (
                    <div
                      key={m.id}
                      className={
                        m.sender === 'coach'
                          ? 'rounded-xl bg-[#F3F7FF] border border-[rgba(27,109,252,0.25)] px-4 py-3 ml-8'
                          : 'rounded-xl bg-[#F7F7F7] border border-[#E5E5E5] px-4 py-3 mr-8'
                      }
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#999999]">
                          {m.sender === 'coach' ? 'You' : firstName}
                        </p>
                        <p className="text-[10px] text-[#999999]">
                          {when(m.created_at)}
                          {m.sender === 'coach' && (m.client_read_at ? ' · read' : ' · unread')}
                        </p>
                      </div>
                      {isAnchorKind(m.anchor_kind) && (
                        <Link
                          href={
                            client?.onboarding_token
                              ? anchorPortalHref(client.onboarding_token, m.anchor_kind)
                              : `/dashboard/clients/${clientId}`
                          }
                          className="inline-block text-[10px] font-medium text-[#1B6DFC] bg-[#FFFFFF] border border-[rgba(27,109,252,0.25)] rounded-full px-2 py-0.5 mb-2 hover:bg-[#F3F7FF] transition-colors"
                        >
                          {anchorChipLabel(m.anchor_kind, m.anchor_label)} →
                        </Link>
                      )}
                      <p className="text-[14px] text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                    </div>
                  ))}
                  {thread.length > 6 && (
                    <p className="text-[11px] text-[#999999] text-center">
                      Showing the 6 most recent of {thread.length} messages
                    </p>
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
