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

  // Only the light client-name lookup runs on every client sub-page now. The
  // co-pilot history (up to 200 messages) is loaded lazily by the bubble when
  // the coach actually opens it — it used to load on every page whether or not
  // the chat was ever opened, taxing every navigation.
  const { data: client } = await admin.from('clients').select('name').eq('id', id).maybeSingle()

  return (
    <>
      {children}
      {client && (
        <CopilotBubble
          clientId={id}
          clientFirstName={client.name?.split(' ')[0] ?? 'this client'}
        />
      )}
    </>
  )
}
