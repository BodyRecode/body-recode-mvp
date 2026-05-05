import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatDate, getStateColour, getReadinessColour } from '@/lib/utils'
import { AlertTriangle, ArrowUpRight, ChevronRight, UserPlus, Users } from 'lucide-react'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { ONLINE_PACKAGE_VALUES, IN_PERSON_PACKAGE_VALUES, TWO_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'
import { PageHeader, Btn, EmptyState, MONO_FONT, accentColour } from '@/components/dashboard/ui'

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

  if (typeFilter === 'online') query = query.in('package', ONLINE_PACKAGE_VALUES)
  if (typeFilter === 'face_to_face') query = query.in('package', IN_PERSON_PACKAGE_VALUES)

  const { data: clients } = await query

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

    const upgradeCandidate = TWO_SESSION_PACKAGE_VALUES.includes(client.package) && (weekNumber ?? 0) >= 8 && (daysUntilStart ?? 0) <= 0

    return { ...client, daysUntilStart, weekNumber, latestCffs, latestCfws, hasFormA, hasFormB, rebuildTraining: rebuildTrainingIds.has(client.id), rebuildNutrition: rebuildNutritionIds.has(client.id), upgradeCandidate }
  })

  const flaggedCount = clientsProcessed.filter(c => c.latestCffs?.reassessment_flagged).length
  const upgradeCandidateCount = clientsProcessed.filter(c => c.upgradeCandidate).length
  const teal = accentColour('teal')
  const red = accentColour('red')
  const amber = accentColour('amber')

  const buildHref = (paramOverrides: { view?: string | null; type?: string | null }) => {
    const next: Record<string, string> = {}
    const newView = paramOverrides.view !== undefined ? paramOverrides.view : (showInactive ? 'inactive' : null)
    const newType = paramOverrides.type !== undefined ? paramOverrides.type : (typeFilter === 'all' ? null : typeFilter)
    if (newView) next.view = newView
    if (newType) next.type = newType
    const qs = Object.entries(next).map(([k, v]) => `${k}=${v}`).join('&')
    return `/dashboard/coaching${qs ? '?' + qs : ''}`
  }

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Coaching"
        title="Clients"
        subtitle={`${clients?.length || 0} ${showInactive ? 'inactive' : 'active'} ${(clients?.length || 0) === 1 ? 'client' : 'clients'}`}
        cta={
          <Btn href="/dashboard/clients/new" variant="primary" icon={UserPlus} size="sm">
            New Client
          </Btn>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-7 flex-wrap">
        <div className="inline-flex items-center bg-[#111110] border border-[#1c1917] rounded-lg p-0.5">
          {[
            { label: 'All', value: 'all' },
            { label: 'Face-to-Face', value: 'face_to_face' },
            { label: 'Online', value: 'online' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={buildHref({ type: opt.value === 'all' ? null : opt.value })}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === opt.value ? 'bg-[#14b8a6] text-[#0c0a09]' : 'text-[#a8a29e] hover:text-white'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="h-4 w-px bg-[#1c1917]" />

        <div className="inline-flex items-center bg-[#111110] border border-[#1c1917] rounded-lg p-0.5">
          {[
            { label: 'Active', inactive: false },
            { label: 'Inactive', inactive: true },
          ].map(opt => (
            <Link
              key={opt.label}
              href={buildHref({ view: opt.inactive ? 'inactive' : null })}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                showInactive === opt.inactive ? 'bg-[#1c1917] text-white' : 'text-[#a8a29e] hover:text-white'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Action queue - clients needing attention */}
      {clientsProcessed.some(c => c.rebuildTraining || c.rebuildNutrition) && (
        <div
          className="mb-5 bg-[#111110] border rounded-2xl overflow-hidden"
          style={{ borderColor: red.ring }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: red.ring }}
          >
            <AlertTriangle size={14} style={{ color: red.text }} />
            <p
              className="text-[10px] font-bold uppercase"
              style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em', color: red.text }}
            >
              Needs attention
            </p>
          </div>
          <div className="divide-y divide-[#1c1917]">
            {clientsProcessed.filter(c => c.rebuildTraining || c.rebuildNutrition).map(client => (
              <div key={client.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-white truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client.rebuildTraining && <span className="text-[12px]" style={{ color: red.text }}>Training: Rebuild</span>}
                    {client.rebuildTraining && client.rebuildNutrition && <span className="text-[#1c1917] text-xs">·</span>}
                    {client.rebuildNutrition && <span className="text-[12px]" style={{ color: red.text }}>Nutrition: Rebuild</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {client.rebuildTraining && (
                    <Link
                      href={`/dashboard/clients/${client.id}/program`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#0c0a09]"
                      style={{ color: red.text, borderColor: red.ring }}
                    >
                      Training →
                    </Link>
                  )}
                  {client.rebuildNutrition && (
                    <Link
                      href={`/dashboard/clients/${client.id}/nutrition`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#0c0a09]"
                      style={{ color: red.text, borderColor: red.ring }}
                    >
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
        <div
          className="mb-5 bg-[#111110] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: amber.ring }}
        >
          <AlertTriangle size={14} style={{ color: amber.text }} />
          <p className="text-[13px]" style={{ color: amber.text }}>
            <span className="font-semibold">{flaggedCount} client{flaggedCount > 1 ? 's' : ''}</span> may be appropriate for re-assessment
          </p>
        </div>
      )}

      {upgradeCandidateCount > 0 && (
        <div
          className="mb-5 bg-[#111110] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: teal.ring }}
        >
          <ArrowUpRight size={14} style={{ color: teal.text }} />
          <p className="text-[13px]" style={{ color: teal.text }}>
            <span className="font-semibold">{upgradeCandidateCount} client{upgradeCandidateCount > 1 ? 's' : ''}</span> eligible for the 2x to 3x upgrade conversation
          </p>
        </div>
      )}

      {clientsProcessed.length === 0 ? (
        <div className="bg-[#111110] border border-[#1c1917] rounded-2xl">
          <EmptyState icon={Users} title="No clients yet" hint="Add your first client to get started" />
        </div>
      ) : (
        <div className="grid gap-2">
          {clientsProcessed.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="bg-[#111110] border border-[#1c1917] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#292524] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div
                  className="w-9 h-9 rounded-full bg-[#1c1917] border border-[#292524] flex items-center justify-center text-[13px] font-medium text-[#d4cfc9] shrink-0"
                  style={{ fontFamily: MONO_FONT }}
                >
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white group-hover:text-[#14b8a6] transition-colors truncate">{client.name}</span>
                    {client.latestCffs?.reassessment_flagged && (
                      <AlertTriangle size={13} style={{ color: amber.text }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[11px] text-[#57534e]">
                      Added {formatDate(client.created_at)}
                    </p>
                    {client.weekNumber !== null && client.daysUntilStart !== null && client.daysUntilStart <= 0 && (
                      <>
                        <span className="text-[#1c1917] text-xs">·</span>
                        <span className="text-[11px] text-[#a8a29e] font-medium">Week {client.weekNumber}</span>
                        <span className="text-[#1c1917] text-xs">·</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormA ? 'text-[#14b8a6]' : 'text-[#57534e]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >A</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormB ? 'text-[#14b8a6]' : 'text-[#57534e]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >B</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {client.upgradeCandidate && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border uppercase"
                    style={{ fontFamily: MONO_FONT, letterSpacing: '0.08em', color: teal.text, borderColor: teal.ring, background: teal.bg }}
                  >
                    Upgrade
                  </span>
                )}

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
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap"
                    style={{ color: amber.text, borderColor: amber.ring, background: amber.bg }}
                  >
                    Starts in {client.daysUntilStart}d
                  </span>
                ) : client.daysUntilStart === 0 ? (
                  <span
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap"
                    style={{ color: teal.text, borderColor: teal.ring, background: teal.bg }}
                  >
                    Starts today
                  </span>
                ) : client.latestCffs ? (
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border whitespace-nowrap ${getStateColour(client.latestCffs.body_state_classification)}`}>
                    {client.latestCffs.body_state_classification}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#57534e] px-2.5 py-1 rounded-full border border-[#1c1917]">
                    No CFFS
                  </span>
                )}
                <ChevronRight size={16} className="text-[#57534e] group-hover:text-[#14b8a6] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
