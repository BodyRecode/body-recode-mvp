import { createAdminClient } from '@/lib/supabase/admin'
import { requireCoachScope, coachFilter } from '@/lib/coach-scope'
import { WeekStrip } from '@/components/dashboard/week-strip'
import { buildWeekStrips } from '@/lib/week-strip-data'
import Link from 'next/link'
import { formatDate, readinessPillStyle, readinessMarkStyle } from '@/lib/utils'
import { AlertTriangle, ArrowUpRight, ChevronRight, UserPlus, Users, Activity, RefreshCw } from 'lucide-react'
import { resolveCurrentBodyState, latestReScore } from '@/lib/body-state-current'
import { getWeekNumber } from '@/lib/weekly-checkin-questions'
import { ONLINE_PACKAGE_VALUES, IN_PERSON_PACKAGE_VALUES, TWO_SESSION_PACKAGE_VALUES } from '@/lib/coaching-packages'
import { PageHeader, Btn, EmptyState, Avatar, MONO_FONT, accentColour, PageBody } from '@/components/dashboard/ui'
import { evaluateReadiness, type ReadinessReport } from '@/lib/readiness-monitor'
import ReassessmentQueue from '@/components/reassessment-queue'
import { loadOpenTriggersWithClients } from '@/lib/reassessment-digest'
import { REASON_LABEL, OVERDUE_AFTER_DAYS } from '@/lib/reassessment-triggers'
import { evaluateRpeCreep } from '@/lib/rpe-creep-monitor'
import { currentBlockWeek } from '@/lib/workout-logging'
import { overlayPublishedProgressRead, PROGRESS_READ_OVERLAY_COLUMNS } from '@/lib/current-read'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ view?: string; type?: string }> }) {
  const supabase = createAdminClient()

  // WHOSE CLIENTS. Added 21 September 2026, found by signing in as a test coach
  // and seeing seven of Kade's clients by name, with their states and their
  // readiness, on the first page after the sidebar.
  //
  // The September work scoped the client DETAIL pages and the client API
  // routes, and the layout on a single client still refuses somebody else's.
  // The LIST pages were missed, and a list is where the names are.
  const scope = await requireCoachScope()
  const onlyCoach = coachFilter(scope)

  // The week strip counts meal logging and logged sessions, which need a plan
  // somebody prescribed. Nothing to show for a read-only coach. 21 Sep 2026.
  const { productTierForScope } = await import('@/lib/coach-tier')
  const { tierAllows } = await import('@/lib/product-tier')
  const canPrescribe = tierAllows(await productTierForScope(supabase, scope), 'coach')

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
        is_active,
        tr_new_body_state,
        tr_state_direction,
        trajectory_reading_published_at
      )
    `)
    .eq('active', !showInactive)
    .order('created_at', { ascending: false })

  if (onlyCoach) query = query.eq('coach_id', onlyCoach)
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

  // Her newest PUBLISHED Progress Read is her current read (14 Sep 2026): the
  // readiness monitor and the state label use it in place of the Foundational
  // Read.
  const progressReadByClient = new Map<string, Record<string, unknown>>()
  if ((clients ?? []).length) {
    const { data: prRows } = await supabase
      .from('progress_reads')
      .select(PROGRESS_READ_OVERLAY_COLUMNS)
      .in('client_id', (clients ?? []).map(c => c.id))
      .eq('status', 'published')
      .eq('is_archived', false)
      .order('published_at', { ascending: false })
    for (const r of prRows ?? []) if (!progressReadByClient.has(r.client_id)) progressReadByClient.set(r.client_id, r)
  }

  const rebuildTrainingIds = new Set((rebuildPrograms || []).map(r => r.client_id))
  const rebuildNutritionIds = new Set((rebuildNutrition || []).map(r => r.client_id))

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const clientsProcessed = await Promise.all((clients || []).map(async client => {
    const startDate = client.coaching_started_at ? new Date(client.coaching_started_at) : null
    if (startDate) startDate.setHours(0, 0, 0, 0)
    const daysUntilStart = startDate ? Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null
    const weekNumber = client.coaching_started_at ? getWeekNumber(client.coaching_started_at) : null

    const foundationalCffs = client.cffs
      ?.filter((c: { is_archived: boolean }) => !c.is_archived)
      .sort((a: { generated_at: string }, b: { generated_at: string }) =>
        new Date(b.generated_at).getTime() - new Date(a.generated_at).getTime()
      )[0] || null
    const latestCffs = foundationalCffs
      ? (overlayPublishedProgressRead(foundationalCffs, progressReadByClient.get(client.id) ?? null) as typeof foundationalCffs)
      : null

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

    // Current body state: the CFFS value never moves after intake, so a
    // Progress Read re-score has to be layered on. Coach-facing list, so an
    // unpublished draft counts.
    const bodyState = resolveCurrentBodyState({
      foundational: latestCffs?.body_state_classification ?? null,
      reScore: latestReScore(client.programs ?? []),
    })

    return { ...client, daysUntilStart, weekNumber, latestCffs, latestCfws, bodyState, hasFormA, hasFormB, rebuildTraining: rebuildTrainingIds.has(client.id), rebuildNutrition: rebuildNutritionIds.has(client.id), upgradeCandidate, readiness }
  }))

  // Roster-level reassessment queue. This is what the Monday digest links to:
  // the per-client panel only helps once you have already opened that client.
  const openTriggers = await loadOpenTriggersWithClients(supabase, onlyCoach)

  const flaggedCount = clientsProcessed.filter(c => c.latestCffs?.reassessment_flagged).length
  const upgradeCandidateCount = clientsProcessed.filter(c => c.upgradeCandidate).length
  const regressionCount = clientsProcessed.filter(c => c.readiness?.status === 'regression').length
  const reassessmentCount = clientsProcessed.filter(c => c.readiness?.reassessmentRecommended).length
  const driftAdvisoryCount = clientsProcessed.filter(c => c.readiness?.status === 'advisory').length
  // The book in one line. This is the legitimate place for colour on this
  // page: it is the readiness of everybody on it, which is the only thing here
  // that colour is allowed to say. Same object as Today and Your Practice, so
  // a coach learns it once rather than three times.
  const BOOK_ORDER = ['Remediation', 'Optimisation', 'Post-Optimisation'] as const
  const bookColour: Record<string, string> = {
    Remediation: '#E0A254',
    Optimisation: '#71ADB8',
    'Post-Optimisation': '#6FA98B',
    'Not read yet': '#2A2F39',
  }
  const book = [
    ...BOOK_ORDER.map(label => ({ label, count: clientsProcessed.filter(c => c.bodyState.label === label).length })),
    { label: 'Not read yet', count: clientsProcessed.filter(c => !c.latestCffs).length },
  ].filter(b => b.count > 0)
  const bookTotal = book.reduce((n, b) => n + b.count, 0) || 1

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

  // One batched pass for the whole list - a per-client query to draw seven
  // squares would be a dozen round trips to render one page.
  const weekStrips = await buildWeekStrips(clientsProcessed.map(c => c.id))

  return (
    <PageBody>
      <PageHeader
        eyebrow="Your book"
        title="Clients"
        subtitle={`${clients?.length || 0} ${showInactive ? 'inactive' : 'active'} ${(clients?.length || 0) === 1 ? 'client' : 'clients'}. Newest read first.`}
        metric={{ value: clients?.length || 0, label: showInactive ? 'inactive' : 'active' }}
        cta={
          <div className="flex items-center gap-2">
            <Btn href="/dashboard/clients/import" variant="secondary" size="sm">
              Import a list
            </Btn>
            <Btn href="/dashboard/clients/new" variant="primary" icon={UserPlus} size="sm">
              New Client
            </Btn>
          </div>
        }
      />

      {book.length > 0 && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: '#0F1115', border: '1px solid #1F242C' }}>
          <div className="text-[10px] font-bold uppercase" style={{ letterSpacing: '0.16em', color: '#676D76' }}>
            Where the book sits
          </div>
          <div className="flex h-2.5 rounded-full overflow-hidden gap-[2px] mt-3.5">
            {book.map(b => (
              <span key={b.label} style={{
                width: `${(b.count / bookTotal) * 100}%`,
                background: bookColour[b.label],
                boxShadow: b.label === 'Not read yet' ? undefined : `0 0 14px ${bookColour[b.label]}66`,
              }} />
            ))}
          </div>
          <div className="flex gap-4 flex-wrap mt-3">
            {book.map(b => (
              <span key={b.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: '#8A9099' }}>
                <span className="w-2 h-2 rounded-full" style={{ background: bookColour[b.label] }} />
                {b.count} {b.label}
              </span>
            ))}
          </div>
        </div>
      )}

      <ReassessmentQueue
        rows={openTriggers}
        reasonLabels={REASON_LABEL}
        overdueAfterDays={OVERDUE_AFTER_DAYS}
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-7 flex-wrap">
        <div className="inline-flex items-center bg-[#0F1115] border border-[#2A2F39] rounded-lg p-0.5">
          {[
            { label: 'All', value: 'all' },
            { label: 'Face-to-Face', value: 'face_to_face' },
            { label: 'Online', value: 'online' },
          ].map(opt => (
            <Link
              key={opt.value}
              href={buildHref({ type: opt.value === 'all' ? null : opt.value })}
              className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                typeFilter === opt.value ? 'bg-[#FAFAF8] text-[#0F1115]' : 'text-[#8A9099] hover:text-[#FAFAF8]'
              }`}
            >
              {opt.label}
            </Link>
          ))}
        </div>

        <div className="h-4 w-px bg-[#1A1E26]" />

        <div className="inline-flex items-center bg-[#0F1115] border border-[#2A2F39] rounded-lg p-0.5">
          {[
            { label: 'Active', inactive: false },
            { label: 'Inactive', inactive: true },
          ].map(opt => (
            <Link
              key={opt.label}
              href={buildHref({ view: opt.inactive ? 'inactive' : null })}
              className={`text-[12.5px] font-semibold px-3 py-1.5 rounded-md transition-colors ${
                showInactive === opt.inactive ? 'bg-[#1A1E26] text-[#FAFAF8]' : 'text-[#8A9099] hover:text-[#FAFAF8]'
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
          className="mb-5 bg-[#0F1115] border rounded-xl overflow-hidden"
          style={{ borderColor: red.ring }}
        >
          <div
            className="px-4 py-3 border-b flex items-center gap-2"
            style={{ borderColor: red.ring }}
          >
            <AlertTriangle size={14} style={{ color: red.text }} />
            <p
              className="text-[11px] font-medium"
              style={{ color: red.text }}
            >
              Needs attention
            </p>
          </div>
          <div className="divide-y divide-[#1A1E26]">
            {clientsProcessed.filter(c => c.rebuildTraining || c.rebuildNutrition).map(client => (
              <div key={client.id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0 flex items-center gap-3">
                  <Avatar name={client.name} size={31} />
                  <div className="min-w-0">
                  <p className="text-[20px] font-bold tracking-[-0.028em] text-[#FAFAF8] truncate">{client.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {client.rebuildTraining && <span className="text-[12.5px]" style={{ color: red.text }}>Training: Rebuild</span>}
                    {client.rebuildTraining && client.rebuildNutrition && <span className="text-[#2A2F39] text-[12.5px]">·</span>}
                    {client.rebuildNutrition && <span className="text-[12.5px]" style={{ color: red.text }}>Nutrition: Rebuild</span>}
                  </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {client.rebuildTraining && (
                    <Link
                      href={`/dashboard/clients/${client.id}/program`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#0F1115]"
                      style={{ color: red.text, borderColor: red.ring }}
                    >
                      Training →
                    </Link>
                  )}
                  {client.rebuildNutrition && (
                    <Link
                      href={`/dashboard/clients/${client.id}/nutrition`}
                      className="text-[11px] font-semibold border px-2.5 py-1 rounded-lg transition-colors hover:bg-[#0F1115]"
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
          className="mb-3 bg-[#0F1115] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: red.ring }}
        >
          <Activity size={14} style={{ color: red.text }} />
          <p className="text-[13.5px]" style={{ color: red.text }}>
            <span className="font-semibold">{regressionCount} client{regressionCount > 1 ? 's' : ''}</span> in active regression. Coach review required.
          </p>
        </div>
      )}

      {/* Doctrine: Signal Monitoring v1.0 - reassessment recommended banner */}
      {reassessmentCount > 0 && (
        <div
          className="mb-3 bg-[#0F1115] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: amber.ring }}
        >
          <RefreshCw size={14} style={{ color: amber.text }} />
          <p className="text-[13.5px]" style={{ color: amber.text }}>
            <span className="font-semibold">{reassessmentCount} client{reassessmentCount > 1 ? 's' : ''}</span> due to be read again.
          </p>
        </div>
      )}

      {/* Drift advisory banner - lowest priority */}
      {driftAdvisoryCount > 0 && (
        <div
          className="mb-3 br-card px-4 py-3 flex items-center gap-3"
        >
          <ArrowUpRight size={14} className="text-[#8A9099]" />
          <p className="text-[13.5px] text-[#8A9099]">
            <span className="font-semibold text-[#FAFAF8]">{driftAdvisoryCount} client{driftAdvisoryCount > 1 ? 's' : ''}</span> with drift advisories this week.
          </p>
        </div>
      )}

      {flaggedCount > 0 && (
        <div
          className="mb-5 bg-[#0F1115] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: amber.ring }}
        >
          <AlertTriangle size={14} style={{ color: amber.text }} />
          <p className="text-[13.5px]" style={{ color: amber.text }}>
            <span className="font-semibold">{flaggedCount} client{flaggedCount > 1 ? 's' : ''}</span> flagged at their first read as worth looking at again
          </p>
        </div>
      )}

      {upgradeCandidateCount > 0 && (
        <div
          className="mb-5 bg-[#0F1115] border rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ borderColor: teal.ring }}
        >
          <ArrowUpRight size={14} style={{ color: teal.text }} />
          <p className="text-[13.5px]" style={{ color: teal.text }}>
            <span className="font-semibold">{upgradeCandidateCount} client{upgradeCandidateCount > 1 ? 's' : ''}</span> eligible for the 2x to 3x upgrade conversation
          </p>
        </div>
      )}

      {clientsProcessed.length === 0 ? (
        <div>
          <EmptyState icon={Users} title="No clients yet" hint="Add your first client to get started" />
        </div>
      ) : (
        <div className="grid gap-2">
          {clientsProcessed.map(client => (
            <Link
              key={client.id}
              href={`/dashboard/clients/${client.id}`}
              className="px-2 py-4 flex items-center justify-between border-b border-[#1F242C] hover:bg-[#12151B] transition-colors group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <Avatar name={client.name} size={36} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] font-bold tracking-[-0.028em] text-[#FAFAF8] group-hover:text-[#FAFAF8] transition-colors truncate">{client.name}</span>
                    {client.latestCffs?.reassessment_flagged && (
                      <AlertTriangle size={13} style={{ color: amber.text }} />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-[11px] text-[#676D76]">
                      {client.bodyState.label === 'Remediation' ? 'Being asked for less at the moment'
                        : client.bodyState.label === 'Optimisation' ? 'Capacity is holding'
                        : client.bodyState.label === 'Post-Optimisation' ? 'Established and steady'
                        : client.latestCffs ? 'Read, and up to date'
                        : 'Waiting on their assessment'}
                    </p>
                    {client.weekNumber !== null && client.daysUntilStart !== null && client.daysUntilStart <= 0 && (
                      <>
                        <span className="text-[#2A2F39] text-[12.5px]">·</span>
                        <span className="text-[11px] text-[#8A9099] font-medium">Week {client.weekNumber}</span>
                        <span className="text-[#2A2F39] text-[12.5px]">·</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormA ? 'text-[#FAFAF8]' : 'text-[#676D76]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >A</span>
                        <span
                          className={`text-[11px] font-semibold ${client.hasFormB ? 'text-[#FAFAF8]' : 'text-[#676D76]'}`}
                          style={{ fontFamily: MONO_FONT }}
                        >B</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3.5 shrink-0 ml-3">
                {canPrescribe && weekStrips[client.id] && (
                  <span className="hidden md:inline-flex" title="Meal logging over the last 7 days. A green dot is a logged session.">
                    <WeekStrip days={weekStrips[client.id]} />
                  </span>
                )}
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
                    style={{ color: '#8A9099', borderColor: '#2A2F39', background: '#0F1115' }}
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
                      <div key={i} className="w-2 h-2 rounded-full" style={readinessMarkStyle(r)} />
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
                  <span
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-full border whitespace-nowrap"
                    style={readinessPillStyle(client.bodyState.label, true)}
                    title={client.bodyState.reScored ? `Re-scored at the last Progress Check. Foundational read: ${client.bodyState.foundational}` : undefined}
                  >
                    {client.bodyState.label}{client.bodyState.reScored ? ' ·' : ''}
                  </span>
                ) : (
                  <span className="text-[11px] text-[#676D76] px-2.5 py-1 rounded-full border border-[#2A2F39]">
                    Not read yet
                  </span>
                )}
                <ChevronRight size={16} className="text-[#676D76] group-hover:text-[#FAFAF8] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageBody>
  )
}
