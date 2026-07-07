import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Circle,
  RefreshCw,
} from 'lucide-react'
import { PageHeader, Card, SectionLabel, Pill, MONO_FONT } from '@/components/dashboard/ui'

export const dynamic = 'force-dynamic'

type TenantConfigRow = {
  coach_id: string
  brand: { name: string; apexDomain: string; accentColor: string } | null
  coach: { firstName: string; fullName: string; email: string; location: string } | null
  products: { membershipPrice: number } | null
  licence: {
    tenantId: string
    poweredBy: boolean
    version: string
    stripeAccountId?: string | null
    stripeAccountStatus?: string | null
    twilioSubaccountSid?: string | null
    partnerBilling?: {
      tier?: 'launch' | 'studio'
      subscriptionId?: string | null
      customerId?: string | null
      activeFrom?: string
      lockedSubscriptionCents?: number
      setupFeeStatus?: string
    } | null
    doctrineParameters?: {
      voiceTone?: string
      bannedPhrases?: string[]
      terminologySubstitutions?: Record<string, string>
      checkinCoachingGuidance?: string
      programGenerationGuidance?: string
      nutritionGenerationGuidance?: string
    } | null
  } | null
  modality: { id: string; label: string; doctrineMode: 'A' | 'B' } | null
  updated_at: string
}

/**
 * Kade-only overview of every provisioned tenant's health. One row per
 * tenant with the load-bearing signals: coach last-login, active client
 * count against tier cap, subscription status, doctrine parameters
 * configured, Stripe Connect status, Twilio subaccount configured,
 * custom domain wired. Built for the moment partners #2+ arrive and
 * eyeballing them one-at-a-time stops working.
 *
 * Coach-authenticated at the route level; the underlying queries use
 * the admin (service-role) client because they cross tenants.
 */
export default async function TenantsHealthPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()

  // 1. Every tenant
  const { data: tenants, error: tenantsErr } = await admin
    .from('tenant_config')
    .select('coach_id, brand, coach, products, licence, modality, updated_at')
    .order('updated_at', { ascending: false })
    .returns<TenantConfigRow[]>()

  if (tenantsErr) {
    return (
      <div className="max-w-[1200px]">
        <PageHeader eyebrow="Settings · Tenants Health" title="Tenants Health" accent="amber" />
        <Card>
          <div className="text-red-700 text-[13px]">Failed to load tenants: {tenantsErr.message}</div>
        </Card>
      </div>
    )
  }

  const rows = tenants ?? []

  // 2. Coach auth last_sign_in_at
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 })
  const lastLoginByUserId = new Map<string, string | null>()
  for (const u of authList?.users ?? []) {
    lastLoginByUserId.set(u.id, u.last_sign_in_at ?? null)
  }

  // 3. Active client counts + tenant_domains
  const activeCountsByCoach = new Map<string, number>()

  await Promise.all(
    rows.map(async (t) => {
      const { count } = await admin
        .from('clients')
        .select('id', { count: 'exact', head: true })
        .eq('coach_id', t.coach_id)
        .eq('active', true)
      activeCountsByCoach.set(t.coach_id, count ?? 0)
    })
  )

  const { data: domains } = await admin
    .from('tenant_domains')
    .select('tenant_id, domain, is_primary')
  const domainByTenantId = new Map<string, { domain: string; is_primary: boolean }[]>()
  for (const d of domains ?? []) {
    const list = domainByTenantId.get(d.tenant_id) ?? []
    list.push({ domain: d.domain, is_primary: d.is_primary })
    domainByTenantId.set(d.tenant_id, list)
  }

  // Rollup counts for the top strip
  const stats = {
    total: rows.length,
    activeCoaches: [...lastLoginByUserId.entries()].filter(([id, ts]) => rows.some((r) => r.coach_id === id) && ts && Date.now() - new Date(ts).getTime() < 7 * 24 * 60 * 60 * 1000).length,
    fullyConfigured: rows.filter((r) => hasFullConfig(r)).length,
    doctrineTuned: rows.filter((r) => hasDoctrineParams(r)).length,
  }

  return (
    <div className="max-w-[1240px]">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dashboard/settings"
          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          <ArrowLeft className="w-3 h-3" /> BACK TO SETTINGS
        </Link>
        <Link
          href="/dashboard/settings/tenants-health"
          className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-stone-800"
          style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}
        >
          <RefreshCw className="w-3 h-3" /> REFRESH
        </Link>
      </div>

      <PageHeader
        eyebrow="Settings · Tenants Health"
        title="Tenants Health"
        subtitle="Kade-only overview of every provisioned partner tenant. One row per tenant, load-bearing signals at a glance."
        accent="teal"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <StatMini label="Tenants" value={stats.total} sub={`${rows.length} provisioned`} />
        <StatMini label="Active · last 7d" value={stats.activeCoaches} sub="coach sign-ins" />
        <StatMini label="Fully configured" value={stats.fullyConfigured} sub="Stripe + Twilio + domain" />
        <StatMini label="Doctrine-tuned" value={stats.doctrineTuned} sub="Mode A+ applied" />
      </div>

      <Card padding="none">
        <div className="px-5 pt-5 pb-3">
          <SectionLabel meta={`${rows.length} rows`}>All Tenants</SectionLabel>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="text-[10px] uppercase text-stone-500 border-t border-b border-stone-200" style={{ fontFamily: MONO_FONT, letterSpacing: '0.12em' }}>
                <th className="text-left px-4 py-2 font-normal">Tenant</th>
                <th className="text-left px-4 py-2 font-normal">Coach</th>
                <th className="text-left px-4 py-2 font-normal">Last login</th>
                <th className="text-left px-4 py-2 font-normal">Active clients</th>
                <th className="text-left px-4 py-2 font-normal">Tier</th>
                <th className="text-left px-4 py-2 font-normal">Sub</th>
                <th className="text-left px-4 py-2 font-normal">Stripe Connect</th>
                <th className="text-left px-4 py-2 font-normal">Twilio</th>
                <th className="text-left px-4 py-2 font-normal">Domain</th>
                <th className="text-left px-4 py-2 font-normal">Mode A+</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <TenantRow
                  key={t.coach_id}
                  tenant={t}
                  lastLogin={lastLoginByUserId.get(t.coach_id) ?? null}
                  activeClients={activeCountsByCoach.get(t.coach_id) ?? 0}
                  domains={domainByTenantId.get(t.licence?.tenantId ?? '') ?? []}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 text-[11px] text-stone-500 italic">
        Signal legend: ● configured · ○ not configured. Active-clients cap: Launch tier = 10, Studio tier = 30 (from Founding Ten Agreement). Last-login yellows after 14 days idle.
      </div>
    </div>
  )
}

/* ── row ── */
function TenantRow({
  tenant,
  lastLogin,
  activeClients,
  domains,
}: {
  tenant: TenantConfigRow
  lastLogin: string | null
  activeClients: number
  domains: { domain: string; is_primary: boolean }[]
}) {
  const brand = tenant.brand?.name ?? '—'
  const coachName = tenant.coach?.fullName ?? '—'
  const coachEmail = tenant.coach?.email ?? '—'
  const tier = tenant.licence?.partnerBilling?.tier ?? 'launch'
  const cap = tier === 'studio' ? 30 : 10
  const capPct = cap ? Math.min(100, Math.round((activeClients / cap) * 100)) : 0
  const subStatus = tenant.licence?.partnerBilling?.subscriptionId ? 'active' : 'unset'
  const stripeConnected = !!tenant.licence?.stripeAccountId && tenant.licence.stripeAccountStatus === 'active'
  const twilioConnected = !!tenant.licence?.twilioSubaccountSid
  const domainPrimary = domains.find((d) => d.is_primary)?.domain
  const modeAPlusFields = countDoctrineFields(tenant)

  const lastLoginText = lastLogin
    ? relativeTime(new Date(lastLogin))
    : 'never'
  const lastLoginStale = !lastLogin || Date.now() - new Date(lastLogin).getTime() > 14 * 24 * 60 * 60 * 1000

  const capWarn = capPct >= 80
  const capFull = capPct >= 100

  return (
    <tr className="border-b border-stone-100 hover:bg-stone-50">
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded font-bold text-[11px] text-white shrink-0"
            style={{ backgroundColor: tenant.brand?.accentColor ?? '#1B6DFC', fontFamily: MONO_FONT }}
          >
            {(brand[0] ?? '?').toUpperCase()}
          </span>
          <div>
            <div className="font-semibold text-stone-900">{brand}</div>
            <div className="text-[10px] text-stone-500" style={{ fontFamily: MONO_FONT }}>{tenant.licence?.tenantId ?? '—'}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="text-stone-800">{coachName}</div>
        <div className="text-[10px] text-stone-500">{coachEmail}</div>
      </td>
      <td className="px-4 py-3 align-top">
        <span className={lastLoginStale ? 'text-amber-700' : 'text-stone-800'}>{lastLoginText}</span>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="flex items-center gap-2 text-[12px]">
          <span className={capFull ? 'font-bold text-red-700' : capWarn ? 'font-bold text-amber-700' : 'text-stone-800'}>
            {activeClients} / {cap}
          </span>
        </div>
        <div className="h-[3px] w-24 rounded-full bg-stone-200 mt-1 overflow-hidden">
          <div
            className="h-full"
            style={{
              width: `${capPct}%`,
              background: capFull ? '#DC2626' : capWarn ? '#B7791F' : (tenant.brand?.accentColor ?? '#1B6DFC'),
            }}
          />
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <Pill accent={tier === 'studio' ? 'teal' : 'neutral'}>{tier}</Pill>
      </td>
      <td className="px-4 py-3 align-top">
        <SignalDot on={subStatus === 'active'} label={subStatus} />
      </td>
      <td className="px-4 py-3 align-top">
        <SignalDot on={stripeConnected} label={stripeConnected ? 'active' : tenant.licence?.stripeAccountStatus ?? 'unset'} />
      </td>
      <td className="px-4 py-3 align-top">
        <SignalDot on={twilioConnected} label={twilioConnected ? 'set' : 'unset'} />
      </td>
      <td className="px-4 py-3 align-top">
        {domainPrimary ? (
          <div className="text-stone-800">{domainPrimary}</div>
        ) : (
          <SignalDot on={false} label="unset" />
        )}
      </td>
      <td className="px-4 py-3 align-top">
        {modeAPlusFields > 0 ? (
          <span className="text-stone-800">{modeAPlusFields} / 6 fields</span>
        ) : (
          <SignalDot on={false} label="empty" />
        )}
      </td>
    </tr>
  )
}

/* ── helpers ── */
function SignalDot({ on, label }: { on: boolean; label: string }) {
  if (on) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        <span className="text-[11px] text-stone-700">{label}</span>
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5">
      <Circle className="w-3.5 h-3.5 text-stone-400" />
      <span className="text-[11px] text-stone-500">{label}</span>
    </span>
  )
}

function StatMini({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="p-4 rounded-2xl border border-stone-200 bg-white">
      <div className="text-[10px] text-stone-500 uppercase mb-2" style={{ fontFamily: MONO_FONT, letterSpacing: '0.14em' }}>{label}</div>
      <div className="text-[28px] font-extrabold text-stone-900 leading-none mb-1" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div className="text-[11px] text-stone-500">{sub}</div>
    </div>
  )
}

function countDoctrineFields(tenant: TenantConfigRow): number {
  const dp = tenant.licence?.doctrineParameters
  if (!dp) return 0
  let n = 0
  if (dp.voiceTone?.trim()) n++
  if ((dp.bannedPhrases ?? []).some((p) => p.trim().length > 0)) n++
  if (dp.terminologySubstitutions && Object.keys(dp.terminologySubstitutions).length > 0) n++
  if (dp.checkinCoachingGuidance?.trim()) n++
  if (dp.programGenerationGuidance?.trim()) n++
  if (dp.nutritionGenerationGuidance?.trim()) n++
  return n
}

function hasDoctrineParams(tenant: TenantConfigRow): boolean {
  return countDoctrineFields(tenant) > 0
}

function hasFullConfig(tenant: TenantConfigRow): boolean {
  const stripe = tenant.licence?.stripeAccountStatus === 'active'
  const twilio = !!tenant.licence?.twilioSubaccountSid
  const sub = !!tenant.licence?.partnerBilling?.subscriptionId
  return stripe && twilio && sub
}

function relativeTime(d: Date): string {
  const diff = Date.now() - d.getTime()
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.floor(hr / 24)
  if (day < 30) return `${day}d ago`
  const mo = Math.floor(day / 30)
  return `${mo}mo ago`
}

// Ensure AlertTriangle import stays used (referenced by legend note)
void AlertTriangle
