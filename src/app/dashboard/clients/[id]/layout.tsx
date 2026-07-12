import { createAdminClient } from '@/lib/supabase/admin'
import CopilotBubble from './copilot-bubble'

/**
 * Client-scoped layout. Renders the Coach Co-Pilot bubble once here so it
 * appears on EVERY page under /dashboard/clients/[id]/* (profile, plan, program,
 * nutrition, suggest, bloods, etc.), always scoped to this client — rather than
 * only on the profile page. (2026-07-12.)
 */
export default async function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [{ data: client }, { data: copilotRows }] = await Promise.all([
    admin.from('clients').select('name').eq('id', id).maybeSingle(),
    admin
      .from('copilot_messages')
      .select('id, role, content, flagged, followups, created_at')
      .eq('client_id', id)
      .order('created_at', { ascending: true })
      .limit(200),
  ])

  const copilotMessages = (copilotRows ?? []).map(m => ({
    id: m.id as string,
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
    flagged: !!m.flagged,
    followups: Array.isArray(m.followups) ? (m.followups as string[]) : [],
  }))

  return (
    <>
      {children}
      {client && (
        <CopilotBubble
          clientId={id}
          clientFirstName={client.name?.split(' ')[0] ?? 'this client'}
          initialMessages={copilotMessages}
        />
      )}
    </>
  )
}
