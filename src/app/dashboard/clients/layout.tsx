import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import ClientListColumn, { type ClientListEntry } from './client-list-column'
import { coachFilter, requireCoachScope } from '@/lib/coach-scope'

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
  const scope = await requireCoachScope()

  // Only this coach's clients. The owner sees everyone. See lib/coach-scope.ts.
  let query = admin
    .from('clients')
    .select('id, name, coaching_started_at, ended_at')
    .order('name', { ascending: true })
  const onlyMine = coachFilter(scope)
  if (onlyMine) query = query.eq('coach_id', onlyMine)

  const { data } = await query

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

  // The proof artefact is shown to somebody who is not the coach, so it gets
  // no client list beside it: those are other people's names.
  const pathname = (await headers()).get('x-pathname') ?? ''
  const onProof = /\/dashboard\/clients\/[^/]+\/proof(\/|$)/.test(pathname)
  if (onProof) return <>{children}</>

  return (
    <div className="xl:grid xl:grid-cols-[244px_minmax(0,1fr)] xl:gap-7">
      <ClientListColumn clients={clients} />
      <div className="min-w-0">{children}</div>
    </div>
  )
}
