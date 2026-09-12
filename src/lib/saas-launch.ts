/**
 * Live numbers for the SaaS launch board.
 *
 * Every figure here is READ FROM THE DATABASE at request time. Nothing on the
 * launch page is typed by hand, deliberately: the Collective page once said
 * "3 founding members admitted" when the real number was zero, and Dylan
 * Shields' application sat unactioned for 26 days because nothing surfaced it.
 * A plan that reports its own status from a manifest can drift; one that counts
 * real rows cannot.
 *
 * The buildout manifest (`saas-buildout-manifest.ts`) stays the source of truth
 * for what has been BUILT. This file is the source of truth for what is
 * HAPPENING — applications, coaches, and whether the gate has actually opened.
 *
 * Added 12 Sep 2026.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type ApplicationRow = {
  id: string
  name: string | null
  businessName: string | null
  modality: string | null
  tier: string | null
  timeline: string | null
  status: string | null
  createdAt: string
  /** Whole days since it arrived. */
  ageDays: number
  /** No human has moved it out of the state it landed in. */
  unactioned: boolean
}

export type LaunchSnapshot = {
  /** Partner applications, newest first. */
  applications: ApplicationRow[]
  applicationsTotal: number
  applicationsUnactioned: number
  /** Age of the oldest application nobody has actioned, or null if none. */
  oldestUnactionedDays: number | null
  /** Coach accounts configured on the platform, including Kade's own. */
  tenantsTotal: number
  /** Coach accounts that are NOT Kade's. This is the gate. */
  outsideCoaches: number
  /** People who have completed the scorecard assessment. */
  assessments: number
  /** People on the platform as clients. */
  clients: number
  /** Training and nutrition plans the engine has generated. */
  plansGenerated: number
  /** Weekly check-ins processed through the loop. */
  checkins: number
  /** Set when a count could not be read, so the page says so instead of showing 0. */
  errors: string[]
}

const DAY = 1000 * 60 * 60 * 24

function ageInDays(iso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / DAY))
}

/**
 * A row nobody has touched. The application table ships rows in at `new` and a
 * human moves them on, so anything still sitting at `new` (or with no status at
 * all) has not been looked at by a person.
 */
function isUnactioned(status: string | null): boolean {
  return !status || status === 'new'
}

async function countOf(
  db: ReturnType<typeof createAdminClient>,
  table: string,
  errors: string[],
): Promise<number> {
  const { count, error } = await db.from(table).select('*', { count: 'exact', head: true })
  if (error) {
    errors.push(`${table}: ${error.message}`)
    return 0
  }
  return count ?? 0
}

export async function getLaunchSnapshot(): Promise<LaunchSnapshot> {
  const db = createAdminClient()
  const errors: string[] = []

  const [appsRes, tenantsRes, leadsRes, clients, programs, nutrition, checkins] = await Promise.all([
    db
      .from('collective_applications')
      .select('id,name,business_name,modality,tier,timeline,status,created_at')
      .order('created_at', { ascending: false }),
    db.from('tenant_config').select('coach_id'),
    db.from('leads').select('scorecard_score'),
    countOf(db, 'clients', errors),
    countOf(db, 'programs', errors),
    countOf(db, 'nutrition_plans', errors),
    countOf(db, 'weekly_checkins', errors),
  ])

  if (appsRes.error) errors.push(`collective_applications: ${appsRes.error.message}`)
  if (tenantsRes.error) errors.push(`tenant_config: ${tenantsRes.error.message}`)
  if (leadsRes.error) errors.push(`leads: ${leadsRes.error.message}`)

  const applications: ApplicationRow[] = (appsRes.data ?? []).map((r) => ({
    id: String(r.id),
    name: r.name ?? null,
    businessName: r.business_name ?? null,
    modality: r.modality ?? null,
    tier: r.tier ?? null,
    timeline: r.timeline ?? null,
    status: r.status ?? null,
    createdAt: r.created_at,
    ageDays: ageInDays(r.created_at),
    unactioned: isUnactioned(r.status ?? null),
  }))

  const unactioned = applications.filter((a) => a.unactioned)

  const tenantsTotal = tenantsRes.data?.length ?? 0
  // Kade's own account is one of these rows. Anything beyond it is a coach who
  // is not him, which is the only thing the gate actually asks.
  const outsideCoaches = Math.max(0, tenantsTotal - 1)

  const assessments = (leadsRes.data ?? []).filter((l) => l.scorecard_score != null).length

  return {
    applications,
    applicationsTotal: applications.length,
    applicationsUnactioned: unactioned.length,
    oldestUnactionedDays: unactioned.length
      ? Math.max(...unactioned.map((a) => a.ageDays))
      : null,
    tenantsTotal,
    outsideCoaches,
    assessments,
    clients,
    plansGenerated: programs + nutrition,
    checkins,
    errors,
  }
}
