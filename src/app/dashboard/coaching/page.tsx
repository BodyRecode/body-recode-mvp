import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatDate, getStateColour, getReadinessColour } from '@/lib/utils'
import { AlertTriangle } from 'lucide-react'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string; type?: string }> }) {
  const supabase = createAdminClient()
  const { view, type } = await searchParams
  const showInactive = view === 'inactive'
  const typeFilter = type === 'online' ? 'online' : type === 'face_to_face' ? 'face_to_face' : 'all'

  let query = supabase
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
      ),
      cfws (
        week_number,
        generated_at,
        exposure_readiness_capacity,
        exposure_readiness_schedule,
        exposure_readiness_regulation,
        exposure_readiness_behaviour,
        is_archived
      ),
      weekly_checkins (
        week_number,
        form_type,
        submitted_at
      )
    `)
    .eq('active', !showInactive)
    .order('created_at', { ascending: false })

  if (typeFilter === 'online') query = query.eq('package', 'online')
  if (typeFilter === 'face_to_face') query = query.in('package', ['2x', '3x'])

  const { data: clients } = await query

  // Fetch clients with active Rebuild direction on training or nutrition
  const { data: rebuildPrograms } = await supabase
    .from('programs')
    .select('client_id')
    .eq('is_active', true)
    .eq('current_direction', 'rebuild')

  const { data: rebuildNutrition } = await supabase
    .from('nutrition_plans')
    .select('client_id')
    .eq('status', 'active')
    .eq('current_direction', 'rebuild')

  const rebuildTrainingIds = new Set((rebuildPrograms || []).map(r => r.client_id))
  const rebuildNutritionIds = new Set((rebuildNutrition || []).map(r => r.client_id))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const clientsProcessed = (clients || []).map(client => {
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    const daysUntilStart = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null

    const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

    const latestCffs = client.cffs
      ?.filter((c: { is_archived: boolean }) => !c.is_archived)
      .sort((a: { generated_at: string }, b: { generated_at: string }) =>
        new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      )[0] || null

    const latestCfws = client.cfws
      ?.filter((c: { is_archived: boolean }) => !c.is_archived)
      .sort((a: { week_number: number }, b: { week_number: number }) => b.week_number - a.week_number)[0] || null

    const thisWeekCheckins = weekNumber
      ? (client.weekly_checkins || []).filter((ci: { week_number: number }) => ci.week_number === weekNumber)
      : []
    const hasFormA = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'A')
    const hasFormB = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'B')

    return { ...client, daysUntilStart, weekNumber, latestCffs, latestCfws, hasFormA, hasFormB, rebuildTraining: rebuildTrainingIds.has(client.id), rebuildNutrition: rebuildNutritionIds.has(client.id) }
  })

  const flaggedCount = clientsProcessed.filter(c => c.latestCffs?.reassessment_flagged).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-stone-400 text-sm mt-1">{clients?.length || 0} {showInactive ? 'inactive' : 'active'} clients</p>
        </div>
        <Link
          href="/dashboard/clients/new"
          className="bg-white text-stone-950 text-sm font-medium px-4 py-2 rounded-lg hover:bg-stone-100 transition-colors"
        >
          + Add Client
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-8">
        {/* Type */}
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
          {[
            { label: 'All', value: 'all' },
            { label: 'Face-to-Face', value: 'face_to_face' },
            { label: 'Online', value: 'online' },
          ].map(opt => {
            const href = `/dashboard/coaching${
              [showInactive ? 'view=inactive' : '', opt.value !== 'all' ? `type=${opt.value}` : ''].filter(Boolean).join('&') ? '?' + [showInactive ? 'view=inactive' : '', opt.value !== 'all' ? `type=${opt.value}` : ''].filter(Boolean).join('&') : ''
            }`
            return (
              <Link
                key={opt.value}
                href={href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${typeFilter === opt.value ? 'bg-teal-500 text-black' : 'text-stone-400 hover:text-white'}`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>

        <div className="h-4 w-px bg-stone-700" />

        {/* Active / Inactive */}
        <div className="flex items-center bg-stone-900 border border-stone-800 rounded-lg p-0.5">
          {[
            { label: 'Active', inactive: false },
            { label: 'Inactive', inactive: true },
          ].map(opt => {
            const href = `/dashboard/coaching${
              [opt.inactive ? 'view=inactive' : '', typeFilter !== 'all' ? `type=${typeFilter}` : ''].filter(Boolean).join('&') ? '?' + [opt.inactive ? 'view=inactive' : '', typeFilter !== 'all' ? `type=${typeFilter}` : ''].filter(Boolean).join('&') : ''
            }`
            return (
              <Link
                key={opt.label}
                href={href}
                className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${showInactive === opt.inactive ? 'bg-stone-600 text-white' : 'text-stone-400 hover:text-white'}`}
              >
                {opt.label}
              </Link>
            )
          })}
        </div>
      </div>

      {/* Action queue — clients needing attention */}
      {clientsProcessed.some(c => c.rebuildTraining || c.rebuildNutrition) && (
        <div className="mb-6 bg-stone-900 border border-red-800/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-red-800/30 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest">Needs attention</p>
          </div>
          <div className="divide-y divide-stone-800">
            {clientsProcessed.filter(c => c.rebuildTraining || c.rebuildNutrition).map(client => (
              <div key={client.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-white">{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client.rebuildTraining && <span className="text-xs text-red-400">Training: Rebuild</span>}
                    {client.rebuildTraining && client.rebuildNutrition && <span className="text-stone-700 text-xs">·</span>}
                    {client.rebuildNutrition && <span className="text-xs text-red-400">Nutrition: Rebuild</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {client.rebuildTraining && (
                    <Link href={`/dashboard/clients/${client.id}/program`} className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-800/50 px-2.5 py-1 rounded-lg transition-colors">
                      Training →
                    </Link>
                  )}
                  {client.rebuildNutrition && (
                    <Link href={`/dashboard/clients/${client.id}/nutrition`} className="text-xs font-semibold text-red-400 hover:text-red-300 border border-red-800/50 px-2.5 py-1 rounded-lg transition-colors">
                      Nutrition →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {flaggedCount > 0 && (
        <div className="mb-6 bg-amber-950/50 border border-amber-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            <span className="font-medium">{flaggedCount} client{flaggedCount > 1 ? 's' : ''}</span> may be appropriate for re-assessment
          </p>
        </div>
      )}

      {clientsProcessed.length === 0 ? (
        <div className="text-center py-20 text-stone-500">
          <p className="text-lg mb-2">No clients yet</p>
          <p className="text-sm">Add your first client to get started</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {clientsProcessed.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="bg-stone-900 border border-stone-800 rounded-xl px-5 py-4 flex items-center justify-between hover:border-stone-600 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-9 h-9 rounded-full bg-stone-700 flex items-center justify-center text-sm font-medium text-stone-300 shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{client.name}</span>
                    {client.latestCffs?.reassessment_flagged && (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <p className="text-stone-500 text-xs">
                      Added {formatDate(client.created_at)}
                    </p>
                    {client.weekNumber !== null && client.daysUntilStart !== null && client.daysUntilStart <= 0 && (
                      <>
                        <span className="text-stone-700 text-xs">·</span>
                        <span className="text-stone-400 text-xs font-medium">Week {client.weekNumber}</span>
                        <span className="text-stone-700 text-xs">·</span>
                        <span className={`text-xs font-semibold ${client.hasFormA ? 'text-teal-400' : 'text-stone-600'}`}>A</span>
                        <span className={`text-xs font-semibold ${client.hasFormB ? 'text-teal-400' : 'text-stone-600'}`}>B</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* CFWS readiness dots */}
                {client.latestCfws && client.daysUntilStart !== null && client.daysUntilStart <= 0 && (
                  <div className="flex items-center gap-1">
                    {[
                      client.latestCfws.exposure_readiness_capacity,
                      client.latestCfws.exposure_readiness_schedule,
                      client.latestCfws.exposure_readiness_regulation,
                      client.latestCfws.exposure_readiness_behaviour,
                    ].map((r, i) => (
                      <div key={i} className={`w-2 h-2 rounded-full ${getReadinessColour(r)}`} />
                    ))}
                  </div>
                )}

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
