import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDate, getStateColour } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select(`
      *,
      cffs (
        id,
        body_state_classification,
        resolution_state,
        reassessment_flagged,
        generated_at,
        is_archived
      )
    `)
    .order('created_at', { ascending: false })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const clientsWithLatestCFFS = (clients || []).map(client => {
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    const daysUntilStart = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

    return {
      ...client,
      daysUntilStart,
      latestCffs: client.cffs
        ?.filter((c: { is_archived: boolean }) => !c.is_archived)
        .sort((a: { generated_at: string }, b: { generated_at: string }) =>
          new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
        )[0] || null
    }
  })

  const flaggedCount = clientsWithLatestCFFS.filter(c => c.latestCffs?.reassessment_flagged).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-stone-400 text-sm mt-1">{clients?.length || 0} active clients</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="bg-white text-stone-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          + Add Client
        </Link>
      </div>

      {flaggedCount > 0 && (
        <div className="mb-6 bg-amber-950/50 border border-amber-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            <span className="font-medium">{flaggedCount} client{flaggedCount > 1 ? 's' : ''}</span> may be appropriate for re-assessment
          </p>
        </div>
      )}

      {clientsWithLatestCFFS.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <p className="text-lg mb-2">No clients yet</p>
          <p className="text-sm">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clientsWithLatestCFFS.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="bg-stone-900 border border-stone-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-stone-600 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center text-sm font-medium text-stone-300">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{client.name}</span>
                    {client.latestCffs?.reassessment_flagged && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <p className="text-stone-500 text-xs mt-0.5">
                    Added {formatDate(client.created_at)}
                    {client.latestCffs && ` · CFFS ${formatDate(client.latestCffs.generated_at)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {client.daysUntilStart !== null && client.daysUntilStart > 0 ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-amber-400/30 text-amber-400 bg-amber-400/10">
                    Starts in {client.daysUntilStart}d
                  </span>
                ) : client.daysUntilStart === 0 ? (
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-teal-400/30 text-teal-400 bg-teal-400/10">
                    Starts today
                  </span>
                ) : client.latestCffs ? (
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${getStateColour(client.latestCffs.body_state_classification)}`}>
                    {client.latestCffs.body_state_classification}
                  </span>
                ) : (
                  <span className="text-xs text-stone-500 px-2.5 py-1 rounded-full border border-stone-700">
                    No CFFS
                  </span>
                )}
                <span className="text-stone-600 group-hover:text-stone-400 transition-colors">→</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
