import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Database } from 'lucide-react'
import { PageHeader, Card, MONO_FONT, EmptyState } from '@/components/dashboard/ui'
import { humaniseValidationIssue } from '@/lib/nutrition-validation'
import { DOCTRINE_VERSIONS } from '@/lib/doctrine-versions'

/**
 * Nutrition Engine telemetry dashboard.
 *
 * Reads from nutrition_validator_events (written by the generate route
 * via src/lib/nutrition-telemetry.ts). Shows:
 *   - Headline numbers (last N days): total requests, % first-attempt
 *     pass, % escalated to Sonnet, % returned 422
 *   - Per-rule fire-rate table: rule code, humanised description, fires,
 *     generations, fire rate. Rows >25% get a subtle red tint
 *   - Filter UI: doctrine version + time window
 *
 * Phase 4 commit 5. Graceful degradation: empty state when the events
 * table doesn't exist yet (migration hasn't been run).
 */

interface ValidatorEvent {
  doctrine_version: string | null
  attempt_tier: 'haiku' | 'sonnet'
  ok: boolean
  issue_codes: string[]
  final_outcome:
    | 'passed_first_haiku'
    | 'passed_haiku_retry'
    | 'sonnet_escalation_succeeded'
    | 'sonnet_escalation_failed'
    | 'returned_422_to_coach'
    | null
  request_id: string | null
  occurred_at: string
}

const WINDOWS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

export default async function NutritionEngineHealthPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string; doctrine?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/dashboard/login')

  const { days: daysParam, doctrine: doctrineParam } = await searchParams
  const days = WINDOWS.find(w => String(w.value) === daysParam)?.value ?? 30
  const sinceIso = new Date(Date.now() - days * 86400000).toISOString()

  const admin = createAdminClient()

  // Pull the raw events. Single query, modest size at typical licensee
  // volume (<100k events / month). Filter by doctrine_version if the
  // dropdown picked one; otherwise pull all and offer the dropdown.
  let query = admin
    .from('nutrition_validator_events')
    .select('doctrine_version, attempt_tier, ok, issue_codes, final_outcome, request_id, occurred_at')
    .gte('occurred_at', sinceIso)
    .order('occurred_at', { ascending: false })
    .limit(10000)
  if (doctrineParam) query = query.eq('doctrine_version', doctrineParam)

  const { data: rawEvents, error: queryError } = await query

  // Empty state — table doesn't exist or returned nothing.
  if (queryError && /relation .* does not exist|does not exist/i.test(queryError.message)) {
    return (
      <div className="max-w-[1100px]">
        <PageHeader
          eyebrow="Diagnostics · Engine"
          title="Nutrition Engine"
          subtitle="Validator rule fire rates and doctrine versioning telemetry."
        />
        <Card>
          <EmptyState
            icon={Database}
            title="Telemetry table not yet created."
            hint="Run sql/2026-05-26_nutrition_validator_events.sql in Supabase, then generate a plan to see data here."
          />
        </Card>
      </div>
    )
  }

  const events: ValidatorEvent[] = rawEvents ?? []

  // Headline aggregations
  const requestIds = new Set<string>()
  const finalOutcomeCounts: Record<string, number> = {
    passed_first_haiku: 0,
    passed_haiku_retry: 0,
    sonnet_escalation_succeeded: 0,
    sonnet_escalation_failed: 0,
    returned_422_to_coach: 0,
  }
  for (const e of events) {
    if (e.request_id) requestIds.add(e.request_id)
    if (e.final_outcome) finalOutcomeCounts[e.final_outcome] = (finalOutcomeCounts[e.final_outcome] ?? 0) + 1
  }
  const totalRequests = requestIds.size
  const pct = (n: number) => totalRequests > 0 ? `${Math.round((n / totalRequests) * 100)}%` : '—'
  const passedFirst = finalOutcomeCounts.passed_first_haiku ?? 0
  const passedRetry = finalOutcomeCounts.passed_haiku_retry ?? 0
  const sonnetSucceeded = finalOutcomeCounts.sonnet_escalation_succeeded ?? 0
  const sonnetFailed = finalOutcomeCounts.sonnet_escalation_failed ?? 0
  const returned422 = finalOutcomeCounts.returned_422_to_coach ?? 0

  // Per-rule fire-rate aggregation. For each unique issue_code, count
  // the number of distinct request_ids that had it fire in any attempt.
  // "Fire rate" = distinct requests with rule fired / total requests.
  const ruleFiresByRequest = new Map<string, Set<string>>() // rule_code → request_ids
  for (const e of events) {
    if (!e.request_id) continue
    for (const code of e.issue_codes ?? []) {
      if (!ruleFiresByRequest.has(code)) ruleFiresByRequest.set(code, new Set())
      ruleFiresByRequest.get(code)!.add(e.request_id)
    }
  }
  const ruleRows = Array.from(ruleFiresByRequest.entries())
    .map(([code, reqs]) => ({
      code,
      humanised: humaniseValidationIssue({ code, message: code }).slice(0, 160),
      requests_with_fire: reqs.size,
      fire_rate: totalRequests > 0 ? reqs.size / totalRequests : 0,
    }))
    .sort((a, b) => b.fire_rate - a.fire_rate)

  // Distinct doctrine versions in the window for the filter dropdown
  const doctrineVersionsSet = new Set<string>()
  for (const e of events) if (e.doctrine_version) doctrineVersionsSet.add(e.doctrine_version)
  const doctrineVersions = Array.from(doctrineVersionsSet).sort().reverse()

  function filterHref(nextDays?: number, nextDoctrine?: string | null) {
    const params = new URLSearchParams()
    params.set('days', String(nextDays ?? days))
    if (nextDoctrine !== null) {
      const v = nextDoctrine ?? doctrineParam
      if (v) params.set('doctrine', v)
    }
    return `/dashboard/system-health/nutrition-engine?${params.toString()}`
  }

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Diagnostics · Engine"
        title="Nutrition Engine"
        subtitle="Validator rule fire rates and doctrine versioning telemetry. Drives doctrine tuning decisions: rules firing >25% probably need to be relaxed."
      />

      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold text-[#999999] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Window</span>
          {WINDOWS.map(w => (
            <Link
              key={w.value}
              href={filterHref(w.value)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                w.value === days
                  ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white'
                  : 'border-stone-300 text-stone-600 hover:border-stone-500'
              }`}
            >
              {w.label}
            </Link>
          ))}
        </div>
        {doctrineVersions.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-[#999999] uppercase" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>Doctrine</span>
            <Link
              href={filterHref(undefined, '')}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                !doctrineParam
                  ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white'
                  : 'border-stone-300 text-stone-600 hover:border-stone-500'
              }`}
            >
              All
            </Link>
            {doctrineVersions.map(v => (
              <Link
                key={v}
                href={filterHref(undefined, v)}
                className={`px-2.5 py-1 text-xs rounded-md border font-mono transition-colors ${
                  v === doctrineParam
                    ? 'bg-[#1B6DFC] border-[#1B6DFC] text-white'
                    : 'border-stone-300 text-stone-600 hover:border-stone-500'
                }`}
              >
                v{v}
                {v === DOCTRINE_VERSIONS.nutrition_plan && <span className="ml-1 text-[9px] opacity-70">(current)</span>}
              </Link>
            ))}
          </div>
        )}
      </div>

      {totalRequests === 0 ? (
        <Card>
          <EmptyState
            icon={Database}
            title="No validator events in this window."
            hint="Generate a plan to populate the telemetry, or widen the time window."
          />
        </Card>
      ) : (
        <>
          {/* Headline numbers */}
          <Card>
            <p className="text-[10px] font-bold text-[#999999] uppercase mb-4" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
              Last {days} days · {doctrineParam ? `doctrine v${doctrineParam}` : 'all doctrine versions'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <p className="text-2xl font-bold text-[#1A1A1A] tabular-nums">{totalRequests.toLocaleString()}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Total requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600 tabular-nums">{pct(passedFirst)}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Passed first-pass Haiku</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600 tabular-nums">{pct(passedRetry + sonnetSucceeded)}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Passed on retry / Sonnet</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-600 tabular-nums">{pct(sonnetFailed)}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Sonnet fell back to Haiku</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600 tabular-nums">{pct(returned422)}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">Returned 422 to coach</p>
              </div>
            </div>
          </Card>

          {/* Per-rule fire-rate */}
          <Card className="mt-4">
            <p className="text-[10px] font-bold text-[#999999] uppercase mb-4" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>
              Validator rule fire rates · {ruleRows.length} {ruleRows.length === 1 ? 'rule' : 'rules'} fired in window
            </p>
            {ruleRows.length === 0 ? (
              <p className="text-sm text-stone-500">No validator rules fired in this window. Every plan validated clean — possibly a sign the rules aren&apos;t tight enough, or the engine is in great shape.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left border-b border-stone-200">
                      <th className="pb-2 pr-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Rule</th>
                      <th className="pb-2 pr-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest text-right">Requests</th>
                      <th className="pb-2 pr-3 text-[10px] font-bold text-stone-500 uppercase tracking-widest text-right">Fire rate</th>
                      <th className="pb-2 text-[10px] font-bold text-stone-500 uppercase tracking-widest">Doctrine intent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ruleRows.map(r => {
                      const isHigh = r.fire_rate > 0.25
                      return (
                        <tr key={r.code} className={`border-b border-stone-100 ${isHigh ? 'bg-red-50/40' : ''}`}>
                          <td className="py-2.5 pr-3 align-top">
                            <p className="font-mono text-xs text-stone-700">{r.code}</p>
                          </td>
                          <td className="py-2.5 pr-3 align-top text-right tabular-nums text-stone-600">{r.requests_with_fire}</td>
                          <td className={`py-2.5 pr-3 align-top text-right tabular-nums font-semibold ${isHigh ? 'text-red-700' : 'text-stone-700'}`}>
                            {(r.fire_rate * 100).toFixed(1)}%
                          </td>
                          <td className="py-2.5 align-top text-xs text-stone-500 leading-relaxed">{r.humanised}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <p className="text-[11px] text-stone-400 mt-3">
                  Rows tinted red have fired in more than 25% of requests in this window. That&apos;s a signal the rule might be too tight or the prompt isn&apos;t guiding the model well enough; investigate before tuning. Run rates can also spike right after a doctrine bump because the prompt and validator drift apart momentarily.
                </p>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}
