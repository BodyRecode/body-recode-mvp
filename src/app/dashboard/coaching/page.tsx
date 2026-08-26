import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { formatDate, getStateColour, getReadinessColour } from '@/lib/utils'
import { AlertTriangle, ArrowUpRight, ChevronRight, UserPlus, Users, Activity, RefreshCw } from 'lucide-react'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { ONLINE_PACKAGE_VALUES, IN_PERSON_PACKAGE_VALUES, TWO_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'
import { PageHeader, Btn, EmptyState, Avatar, MONO_FONT, accentColour } from '@/components/dashboard/ui'
import { evaluateReadiness, type ReadinessReport } from '@/lib/readiness-monitor'
import ReassessmentQueue from '@/components/reassessment-queue'
import { loadOpenTriggersWithClients } from '@/lib/reassessment-digest'
import { REASON_LABEL, OVERDUE_AFTER_DAYS } from '@/lib/reassessment-triggers'
import { evaluateRpeCreep } from '@/lib/rpe-creep-monitor'
import { currentBlockWeek } from '@/lib/workout-logging'

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
        reassessment_language_triggered,
        is_archived
      ),
      weekly_checkins (
        week_number,
        form_type,
        submitted_at
      ),
      programs (
        id,
        block_name,
        week_duration,
        generated_at,
        is_active
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

  // Filter on is_active=true, not status='active'. The two get out of sync
  // when a plan is superseded: generate-nutrition flips is_active=false on
  // the old plan but leaves its `status` column as 'active'. Without this,
  // a 'rebuild' direction set on a now-superseded plan keeps showing on
  // the coaching dashboard forever.
  const { data: rebuildNutrition } = await supabase
    .from('nutrition_plans')
    .select('client_id')
    .eq('is_active', true)
    .eq('current_direction', 'rebuild')

  const rebuildTrainingIds = new Set((rebuildPrograms || []).map(r => r.client_id))
  const rebuildNutritionIds = new Set((rebuildNutrition || []).map(r => r.client_id))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const clientsProcessed = await Promise.all((clients || []).map(async client => {
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    const daysUntilStart = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
    const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

    const latestCffs = client.cffs
      ?.filter((c: { is_archived: boolean }) => !c.is_archived)
      .sort((a: { generated_at: string }, b: { generated_at: string }) =>
        new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      )[0] || null

    const cfwsRowsSorted = (client.cfws || [])
      .filter((c: { is_archived: boolean }) => !c.is_archived)
      .sort((a: { week_number: number }, b: { week_number: number }) => b.week_number - a.week_number)
    const latestCfws = cfwsRowsSorted[0] || null

    const activeProgram = (client.programs || []).find((p: { is_active: boolean }) => p.is_active) || null

    const thisWeekCheckins = weekNumber
      ? (client.weekly_checkins || []).filter((ci: { week_number: number }) => ci.week_number === weekNumber)
      : []
    const hasFormA = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'A')
    const hasFormB = thisWeekCheckins.some((ci: { form_type: string }) => ci.form_type === 'B')

    const upgradeCandidate = TWO_SESSION_PACKAGE_VALUES.includes(client.package) && (weekNumber ?? 0) >= 8 && (daysUntilStart ?? 0) <= 0

    // RPE creep — Workout Logging Phase C. Fired per client in parallel so
    // a roster of N adds at most one round-trip latency to the dashboard.
    const blockWeek = activeProgram?.generated_at
      ? currentBlockWeek(activeProgram.generated_at)
      : null
    const rpeCreep = activeProgram?.id && blockWeek
      ? await evaluateRpeCreep(supabase, client.id, activeProgram.id, blockWeek)
      : null

    // Doctrine: Signal Monitoring and Reassessment Triggers v1.0
    // Coaching has not actually started until coaching_started_at is in the past.
    const readiness: ReadinessReport | null = client.coaching_started_at && (daysUntilStart ?? 1) <= 0
      ? evaluateReadiness({
          cfwsRows: cfwsRowsSorted,
          activeCffs: latestCffs,
          activeProgram,
          client: { coaching_started_at: client.coaching_started_at },
          rpeCreep,
        })
      : null

    return { ...client, daysUntilStart, weekNumber, latestCffs, latestCfws, hasFormA, hasFormB, rebuildTraining: rebuildTrainingIds.has(client.id), rebuildNutrition: rebuildNutritionIds.has(client.id), upgradeCandidate, readiness }
  }))

  // Roster-level reassessment queue. This is what the Monday digest links to:
  // the per-client panel only helps once you have already opened that client.
  const openTriggers = await loadOpenTriggersWithClients(supabase)

  const flaggedCount = clientsProcessed.filter(c => c.latestCffs?.reassessment_flagged).length
  const upgradeCandidateCount = clientsProcessed.filter(c => c.upgradeCandidate).length
  const regressionCount = clientsProcessed.filter(c => c.readiness?.status === 'regression').length
  const reassessmentCount = clientsProcessed.filter(c => c.readiness?.reassessmentRecommended).length
  const driftAdvisoryCount = clientsProcessed.filter(c => c.readiness?.status === 'advisory').length
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

      <ReassessmentQueue
        rows={openTriggers}
        reasonLabels={REASON_LABEL}
        overdueAfterDays={OVERDUE_AFTER_DAYS}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-7 flex-wrap">
        <div className="inline-flex items-center bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-0.5">
          {[
            { label: 'All', value: 'all' },
            { label: 'Face-to-Face', value: 'face_to_face' },
            { label: 'Online', value: 'online' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={buildHref({ type: opt.value === 'all' ? null : opt.value })}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === opt.value ? 'bg-[#1B6DFC] text-[#FFFFFF]' : 'text-[#666D7A] hover:text-[#141821]'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="h-4 w-px bg-[#EFF1F4]" />

        <div className="inline-flex items-center bg-[#FFFFFF] border border-[#E8EAEE] rounded-lg p-0.5">
          {[
            { label: 'Active', inactive: false },
            { label: 'Inactive', inactive: true },
          ].map(opt => (
            <Link
              key={opt.label}
              href={buildHref({ view: opt.inactive ? 'inactive' : null })}
              className={`text-[12px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                showInactive === opt.inactive ? 'bg-[#EFF1F4] text-[#141821]' : 'text-[#666D7A] hover:text-[#141821]'
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
          className="mb-5 bg-[#FFFFFF] border rounded-xl overflow-hidden"
          style={{ borderColor: red.ring }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: red.ring }}
          >
            <AlertTriangle size={14} style={{ color: red.text }} />
            <p
              className="text-[11.5px] font-medium"
              style={{ color: red.text }}
            >
              Needs attention
            </p>
          </div>
          <div className="divide-y divide-[#EFF1F4]">
            {clientsProcessed.filter(c => c.rebuildTraining || c.rebuildNutrition).map(client => (
              <div key={client.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar name={client.name} size={31} />
                  <div className="min-w-0">
                  <p className="text-[14px] font-semibold text-[#141821] truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client.rebuildTraining && <span className="text-[12px]" style={{ color: red.text }}>Training: Rebuild</span>}
                    {client.rebuildTraining && client.rebuildNutrition && <span className="text-[#E8EAEE] text-[12.5px]">·</span>}
                    {client.rebuildNutrition && <span className="text-[12px]" style={{ color: red.text }}>Nutrition: Rebuild</span>}
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {client.rebuildTraining && (
                    <Link
                      href={`/dashboard/clients/${client.id}/program`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#FFFFFF]"
                      style={{ color: red.text, borderColor: red.ring }}
                    >
                      Training →
                    </Link>
                  )}
                  {client.rebuildNutrition && (
                    <Link
                      href={`/dashboard/clients/${client.id}/nutrition`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#FFFFFF]"
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

      {/* Doctrine: Signal Monitoring v1.0 - active regression banner (highest priority) */}
      {regressionCount > 0 && (
        <div
          className="mb-3 bg-[#FFFFFF] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: red.ring }}
        >
          <Activity size={14} style={{ color: red.text }} />
          <p className="text-[13px]" style={{ color: red.text }}>
            <span className="font-semibold">{regressionCount} client{regressionCount > 1 ? 's' : ''}</span> in active regression. Coach review required.
          </p>
        </div>
      )}

      {/* Doctrine: Signal Monitoring v1.0 - reassessment recommended banner */}
      {reassessmentCount > 0 && (
        <div
          className="mb-3 bg-[#FFFFFF] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: amber.ring }}
        >
          <RefreshCw size={14} style={{ color: amber.text }} />
          <p className="text-[13px]" style={{ color: amber.text }}>
            <span className="font-semibold">{reassessmentCount} client{reassessmentCount > 1 ? 's' : ''}</span> recommended for CFFS reassessment.
          </p>
        </div>
      )}

      {/* Drift advisory banner - lowest priority */}
      {driftAdvisoryCount > 0 && (
        <div
          className="mb-3 bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <ArrowUpRight size={14} className="text-[#666D7A]" />
          <p className="text-[13px] text-[#666D7A]">
            <span className="font-semibold text-[#141821]">{driftAdvisoryCount} client{driftAdvisoryCount > 1 ? 's' : ''}</span> with drift advisories this week.
          </p>
        </div>
      )}

      {flaggedCount > 0 && (
        <div
          className="mb-5 bg-[#FFFFFF] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: amber.ring }}
        >
          <AlertTriangle size={14} style={{ color: amber.text }} />
          <p className="text-[13px]" style={{ color: amber.text }}>
            <span className="font-semibold">{flaggedCount} client{flaggedCount > 1 ? 's' : ''}</span> flagged on intake CFFS for reassessment consideration
          </p>
        </div>
      )}

      {upgradeCandidateCount > 0 && (
        <div
          className="mb-5 bg-[#FFFFFF] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: teal.ring }}
        >
          <ArrowUpRight size={14} style={{ color: teal.text }} />
          <p className="text-[13px]" style={{ color: teal.text }}>
            <span className="font-semibold">{upgradeCandidateCount} client{upgradeCandidateCount > 1 ? 's' : ''}</span> eligible for the 2x to 3x upgrade conversation
          </p>
        </div>
      )}

      {clientsProcessed.length === 0 ? (
        <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl">
          <EmptyState icon={Users} title="No clients yet" hint="Add your first client to get started" />
        </div>
      ) : (
        <div className="grid gap-2">
          {clientsProcessed.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl px-5 py-4 flex items-center justify-between hover:border-[#CFD4DC] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Avatar name={client.name} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-[#141821] group-hover:text-[#1B6DFC] transition-colors truncate">{client.name}</span>
                    {client.latestCffs?.reassessment_flagged && (
                      <AlertTriangle size={13} style={{ color: amber.text }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[11px] text-[#98A0AD]">
                      Added {formatDate(client.created_at)}
                    </p>
                    {client.weekNumber !== null && client.daysUntilStart !== null && client.daysUntilStart <= 0 && (
                      <>
                        <span className="text-[#E8EAEE] text-[12.5px]">·</span>
                        <span className="text-[11px] text-[#666D7A] font-medium">Week {client.weekNumber}</span>
                        <span className="text-[#E8EAEE] text-[12.5px]">·</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormA ? 'text-[#1B6DFC]' : 'text-[#98A0AD]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >A</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormB ? 'text-[#1B6DFC]' : 'text-[#98A0AD]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >B</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-3">
                {client.readiness?.status === 'regression' && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1"
                    style={{ color: red.text, borderColor: red.ring, background: red.bg }}
                    title={client.readiness.drift.filter((d: { severity: string }) => d.severity === 'high').map((d: { message: string }) => d.message).join(' · ')}
                  >
                    <Activity size={10} /> Regression
                  </span>
                )}
                {client.readiness?.status === 'reassessment' && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1"
                    style={{ color: amber.text, borderColor: amber.ring, background: amber.bg }}
                    title={client.readiness.reassessmentReasons.map((r: { message: string }) => r.message).join(' · ')}
                  >
                    <RefreshCw size={10} /> Reassess
                  </span>
                )}
                {client.readiness?.status === 'advisory' && (
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                    style={{ color: '#666D7A', borderColor: '#E8EAEE', background: '#FFFFFF' }}
                    title={client.readiness.drift.map((d: { message: string }) => d.message).join(' · ')}
                  >
                    Drift
                  </span>
                )}
                {client.upgradeCandidate && (
                  <span
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: teal.text, borderColor: teal.ring, background: teal.bg }}
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
                  <span className="text-[11px] text-[#98A0AD] px-2.5 py-1 rounded-full border border-[#E8EAEE]">
                    No CFFS
                  </span>
                )}
                <ChevronRight size={16} className="text-[#98A0AD] group-hover:text-[#1B6DFC] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
