import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { MessageSquare, ExternalLink } from 'lucide-react'
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

type ClientRow = { id: string; name: string; email: string; onboarding_token: string }

function when(iso: string): string {
  const d = new Date(iso)
  const mins = Math.round((Date.now() - d.getTime()) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (mins < 60 * 24) return `${Math.round(mins / 60)}h ago`
  if (mins < 60 * 24 * 7) return `${Math.round(mins / (60 * 24))}d ago`
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}

export default async function MessagesInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ client?: string }>
}) {
  const sp = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  if (!isCoachEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()

  const { data: messageRows } = await admin
    .from('client_messages')
    .select('id, client_id, body, sender, created_at, read_at, responded_at, client_read_at, anchor_kind, anchor_label')
    .order('created_at', { ascending: false })
    .limit(2000)

  const messages = (messageRows ?? []) as MessageRow[]

  const clientIds = Array.from(new Set(messages.map(m => m.client_id)))
  const { data: clientRows } = clientIds.length
    ? await admin.from('clients').select('id, name, email, onboarding_token').in('id', clientIds)
    : { data: [] }
  const clientsById = new Map((clientRows ?? []).map(c => [c.id as string, c as ClientRow]))

  // One conversation per client. Awaiting-reply means they have said something
  // nobody has answered, and those sort to the top regardless of recency.
  const conversations = clientIds
    .map(cid => {
      const thread = messages.filter(m => m.client_id === cid)
      return {
        clientId: cid,
        thread,
        latest: thread[0],
        awaitingReply: thread.some(m => m.sender === 'client' && !m.responded_at),
      }
    })
    .sort((a, b) => {
      if (a.awaitingReply !== b.awaitingReply) return a.awaitingReply ? -1 : 1
      return new Date(b.latest.created_at).getTime() - new Date(a.latest.created_at).getTime()
    })

  const awaitingCount = conversations.filter(c => c.awaitingReply).length
  const totalClientMessages = messages.filter(m => m.sender === 'client').length

  // Default to whoever has been waiting longest for an answer, since that is
  // the reason to open this page at all. Falls back to most recent activity.
  const selected =
    conversations.find(c => c.clientId === sp.client) ?? conversations[0] ?? null
  const selectedClient = selected ? clientsById.get(selected.clientId) : null
  const selectedName = selectedClient?.name ?? 'Unknown client'
  const selectedFirstName = selectedName.split(' ')[0]

  return (
    <div>
      <PageHeader
        eyebrow="Coaching"
        title="Messages"
        subtitle="Every conversation with a client, both directions. Replying here lands in their portal thread and emails them a copy."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Awaiting reply" value={String(awaitingCount)} accent={awaitingCount > 0 ? 'blue' : 'neutral'} />
        <StatCard label="Conversations" value={String(conversations.length)} />
        <StatCard label="Client messages" value={String(totalClientMessages)} />
      </div>

      {conversations.length === 0 || !selected ? (
        <EmptyState
          icon={MessageSquare}
          title="No messages yet"
          hint="When a client messages you from their portal it appears here, and your reply goes straight back into their portal thread."
        />
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
          {/* Conversation list. On mobile this stacks above the thread and
              scrolls horizontally would be worse than just letting it stack. */}
          <div className="space-y-2 lg:sticky lg:top-6">
            {conversations.map(c => {
              const cl = clientsById.get(c.clientId)
              const name = cl?.name ?? 'Unknown client'
              const isSelected = c.clientId === selected.clientId
              const preview = c.latest.body.replace(/\s+/g, ' ').slice(0, 70)
              return (
                <Link
                  key={c.clientId}
                  href={`/dashboard/messages?client=${c.clientId}`}
                  scroll={false}
                  className={`block rounded-xl border px-4 py-3 transition-colors ${
                    isSelected
                      ? 'border-[#1B6DFC] bg-[#F3F7FF]'
                      : 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#1B6DFC]/40 hover:bg-[#FAFBFD]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className={`text-[13px] font-bold truncate ${isSelected ? 'text-[#1B6DFC]' : 'text-[#1A1A1A]'}`}>
                      {name}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.awaitingReply && <span className="w-2 h-2 rounded-full bg-[#1B6DFC]" aria-label="Awaiting reply" />}
                      <span className="text-[10px] text-[#999999]">{when(c.latest.created_at)}</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] leading-snug line-clamp-2">
                    {c.latest.sender === 'coach' ? 'You: ' : ''}
                    {preview}
                    {c.latest.body.length > 70 ? '...' : ''}
                  </p>
                </Link>
              )
            })}
          </div>

          {/* Selected conversation, in full. No truncation: this pane shows one
              thread at a time, so there is no reason to hide history from the
              coach that the client can already see. */}
          <Card accent={selected.awaitingReply ? 'blue' : undefined}>
            <div className="flex items-center justify-between gap-3 mb-5 pb-4 border-b border-[#E5E5E5]">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/clients/${selected.clientId}`}
                  className="text-[16px] font-bold text-[#1A1A1A] hover:text-[#1B6DFC] transition-colors"
                >
                  {selectedName}
                </Link>
                <p className="text-[12px] text-[#999999] mt-0.5">
                  {selected.thread.length} message{selected.thread.length === 1 ? '' : 's'}
                  {selected.awaitingReply && ' · awaiting your reply'}
                </p>
              </div>
              {selectedClient?.onboarding_token && (
                <Link
                  href={`/portal/${selectedClient.onboarding_token}/message`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#6B6B6B] hover:text-[#1B6DFC] transition-colors shrink-0"
                >
                  <ExternalLink size={12} />
                  Their view
                </Link>
              )}
            </div>

            <ReplyBox
              clientId={selected.clientId}
              clientFirstName={selectedFirstName}
              canDraft={selected.thread.some(m => m.sender === 'client')}
            />

            <div className="space-y-3 mt-6">
              {selected.thread.map(m => (
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
                      {m.sender === 'coach' ? 'You' : selectedFirstName}
                    </p>
                    <p className="text-[10px] text-[#999999]">
                      {when(m.created_at)}
                      {m.sender === 'coach' && (m.client_read_at ? ' · read' : ' · unread')}
                    </p>
                  </div>
                  {isAnchorKind(m.anchor_kind) && (
                    <Link
                      href={
                        selectedClient?.onboarding_token
                          ? anchorPortalHref(selectedClient.onboarding_token, m.anchor_kind)
                          : `/dashboard/clients/${selected.clientId}`
                      }
                      className="inline-block text-[10px] font-medium text-[#1B6DFC] bg-[#FFFFFF] border border-[rgba(27,109,252,0.25)] rounded-full px-2 py-0.5 mb-2 hover:bg-[#F3F7FF] transition-colors"
                    >
                      {anchorChipLabel(m.anchor_kind, m.anchor_label)} →
                    </Link>
                  )}
                  <p className="text-[14px] text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">{m.body}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
