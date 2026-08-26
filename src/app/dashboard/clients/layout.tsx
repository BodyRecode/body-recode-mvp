import { createAdminClient } from '@/lib/supabase/admin'
import ClientListColumn, { type ClientListEntry } from './client-list-column'

/**
 * Three-pane layout for every client route: the section rail, then the client
 * list, then the record. Sitting above [id] means Next keeps this layout
 * mounted while only the record re-renders, so moving between two clients
 * does not reload the list, lose its scroll position, or clear the filter.
 *
 * The list is hidden below xl - the rail already takes 236px, and squeezing a
 * third column onto a laptop leaves the record too narrow to read.
 */
export default async function ClientsLayout({ children }: { children: React.ReactNode }) {
  const admin = createAdminClient()

  const { data } = await admin
    .from('clients')
    .select('id, name, coaching_started_at, ended_at')
    .order('name', { ascending: true })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const clients: ClientListEntry[] = (data || []).map(c => {
    const started = c.coaching_started_at ? new Date(c.coaching_started_at) : null
    const status: ClientListEntry['status'] = c.ended_at
      ? 'ended'
      : started && started > today
        ? 'scheduled'
        : 'active'
    return { id: c.id, name: c.name || 'Unnamed client', status }
  })

  return (
    <div className="xl:grid xl:grid-cols-[244px_minmax(0,1fr)] xl:gap-7">
      <ClientListColumn clients={clients} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
