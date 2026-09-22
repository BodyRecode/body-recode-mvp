import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import { recentCounts, monthStartIso } from '@/lib/partner-billing'

export const metadata = { title: 'Partner Billing · Settings' }
export const dynamic = 'force-dynamic'

type TenantRow = {
  coach_id: string
  brand: { name: string }
  coach: { fullName: string; email: string }
  licence: {
    tenantId: string
    partnerBilling: {
      tier: 'launch' | 'studio'
      customerId?: string | null
      subscriptionId?: string | null
      activeFrom?: string | null
      lockedSetupFeeCents?: number | null
      lockedSubscriptionCents?: number | null
      perActiveClientCents?: number | null
      setupFeeStatus?: 'not_invoiced' | 'invoiced' | 'paid' | null
    } | null
  }
}

function fmtAud(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '—'
  return `$${(cents / 100).toLocaleString('en-AU', { minimumFractionDigits: 0 })}`
}

function fmtMonth(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', { year: 'numeric', month: 'short' })
}

export default async function PartnerBillingAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) redirect('/dashboard')

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tenant_config')
    .select('coach_id, brand, coach, licence')
    .not('licence->partnerBilling', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="max-w-[1100px]">
        <PageHeader eyebrow="Admin" title="Partner billing" subtitle="Collective Partner billing state." />
        <div className="p-4 rounded-xl border border-[#E8C9C9] bg-[#FBF1F1] text-[#8A1919] text-[13.5px]">
          Error: {error.message}
        </div>
      </div>
    )
  }

  const rows = (data ?? []) as TenantRow[]

  // Fetch recent months for each row in parallel
  const withHistory = await Promise.all(
    rows.map(async (r) => ({
      row: r,
      history: await recentCounts(r.licence.tenantId, 6),
    })),
  )

  // Current billable month (previous full month by AEST)
  const now = new Date()
  const prevMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const billableMonth = monthStartIso(prevMonth)

  const totalPartners = rows.length
  const totalMRRLocked = rows.reduce((sum, r) => sum + (r.licence.partnerBilling?.lockedSubscriptionCents ?? 0), 0)
  const totalActiveClientsLastMonth = withHistory.reduce((sum, wh) => {
    const last = wh.history.find((h) => h.month_start === billableMonth)
    return sum + (last?.active_count ?? 0)
  }, 0)
  const totalPerClientRevenueLastMonth = withHistory.reduce((sum, wh) => {
    const last = wh.history.find((h) => h.month_start === billableMonth)
    const perClient = wh.row.licence.partnerBilling?.perActiveClientCents ?? 2000
    return sum + ((last?.active_count ?? 0) * perClient)
  }, 0)

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        eyebrow="Admin · Partner billing"
        title="Collective Partner billing"
        subtitle="Kade's billing of Collective Partners. Per Agreement §6: one-time setup + locked monthly subscription + per-active-client fee. This page shows what to invoice each month. Auto-invoicing via Stripe API is v2 - for now invoice manually via Stripe dashboard using the numbers here."
      />

      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricTile label="Collective Partners" value={totalPartners.toString()} />
        <MetricTile label="Locked MRR (subs)" value={fmtAud(totalMRRLocked)} hint="Sum of locked subscriptions" />
        <MetricTile label="Active clients last month" value={totalActiveClientsLastMonth.toString()} hint={fmtMonth(billableMonth)} />
        <MetricTile label="Per-client revenue last month" value={fmtAud(totalPerClientRevenueLastMonth)} hint="Sum of activeCount × per-client rate" />
      </div>

      <div className="mb-6 p-4 rounded-xl border border-[#DCDCD7] bg-[rgba(27,109,252,0.08)] text-[12.5px] text-[#000000] leading-relaxed">
        <strong>Billable month.</strong> Active-client counts are computed monthly on the 1st at 08:00 AEST by the Inngest cron <code>partner-active-client-counter</code>. The count for a month reflects clients active during that calendar month. Invoice in the following month for the previous month&apos;s activity. Current billable month: <strong>{fmtMonth(billableMonth)}</strong>.
      </div>

      {rows.length === 0 ? (
        <div className="p-8 rounded-xl border border-[#E4E4E0] bg-[#FAFAF8] text-center text-[13.5px] text-[#6E747D]">
          No Collective Partners on file yet. When a partner signs the Collective Partner Agreement, set <code className="bg-white border border-[#E4E4E0] px-1 py-0.5 rounded">licence.partnerBilling</code> on their <code className="bg-white border border-[#E4E4E0] px-1 py-0.5 rounded">tenant_config</code> row with tier + locked prices + Stripe customer id.
        </div>
      ) : (
        <div className="space-y-6">
          {withHistory.map(({ row, history }) => {
            const pb = row.licence.partnerBilling!
            const currentMonthCount = history.find((h) => h.month_start === billableMonth)?.active_count ?? 0
            const perClient = pb.perActiveClientCents ?? 2000
            const currentMonthRevenue = currentMonthCount * perClient
            return (
              <section key={row.coach_id} className="br-card overflow-hidden">
                <div className="px-5 py-4 border-b border-[#E4E4E0] bg-[#FAFAF8]">
                  <div className="flex items-baseline justify-between gap-3 flex-wrap">
                    <div>
                      <div className="text-[10px] font-medium text-[#6E747D]">{row.licence.tenantId}</div>
                      <h2 className="text-[20px] font-bold text-[#0F1115] mt-0.5">{row.brand?.name ?? row.coach?.fullName}</h2>
                      <div className="text-[11px] text-[#6E747D] mt-0.5">{row.coach?.fullName} · {row.coach?.email}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-medium text-[#6E747D]">Tier</div>
                      <div className="text-[16px] font-bold text-[#000000] mt-0.5 capitalize">{pb.tier}</div>
                      {pb.activeFrom && (
                        <div className="text-[10px] font-mono text-[#9CA2AB] mt-0.5">since {new Date(pb.activeFrom).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                    <MetricTile
                      label="Setup fee (locked)"
                      value={fmtAud(pb.lockedSetupFeeCents)}
                      hint={pb.setupFeeStatus ?? 'not_invoiced'}
                      tone={pb.setupFeeStatus === 'paid' ? 'green' : pb.setupFeeStatus === 'invoiced' ? 'amber' : 'stone'}
                    />
                    <MetricTile
                      label="Monthly sub (locked)"
                      value={fmtAud(pb.lockedSubscriptionCents)}
                      hint="Per month"
                    />
                    <MetricTile
                      label="Active clients last month"
                      value={currentMonthCount.toString()}
                      hint={fmtMonth(billableMonth)}
                    />
                    <MetricTile
                      label="Per-client revenue"
                      value={fmtAud(currentMonthRevenue)}
                      hint={`${currentMonthCount} × ${fmtAud(perClient)}`}
                    />
                  </div>

                  <div className="mb-3 text-[11px] font-medium text-[#6E747D]">6-month history</div>
                  <table className="w-full text-[12.5px] border border-[#E4E4E0] rounded-lg overflow-hidden">
                    <thead className="bg-[#FAFAF8]">
                      <tr>
                        <th className="text-left px-3 py-2 font-medium text-[#6E747D] text-[10px]">Month</th>
                        <th className="text-right px-3 py-2 font-medium text-[#6E747D] text-[10px]">Active clients</th>
                        <th className="text-right px-3 py-2 font-medium text-[#6E747D] text-[10px]">Per-client revenue</th>
                        <th className="text-right px-3 py-2 font-medium text-[#6E747D] text-[10px]">Billed</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2F2EF]">
                      {history.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-3 py-3 text-center text-[#9CA2AB] italic">No monthly rows yet. Cron runs on the 1st of each month.</td>
                        </tr>
                      ) : history.map((h) => (
                        <tr key={h.month_start}>
                          <td className="px-3 py-2 font-mono">{fmtMonth(h.month_start)}</td>
                          <td className="px-3 py-2 text-right font-mono">{h.active_count}</td>
                          <td className="px-3 py-2 text-right font-mono">{fmtAud(h.active_count * perClient)}</td>
                          <td className="px-3 py-2 text-right">
                            {h.billed_at ? (
                              <span className="text-[#2B5E45] font-mono text-[11px]">✓ {new Date(h.billed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}</span>
                            ) : (
                              <span className="text-[#B06E1F] font-mono text-[11px]">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="mt-4 flex items-center gap-3 flex-wrap text-[11px]">
                    {pb.customerId && (
                      <a
                        href={`https://dashboard.stripe.com/customers/${pb.customerId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F2F2EF] hover:bg-[#F2F2EF] text-[#0F1115] hover:text-[#000000] font-mono"
                      >
                        Stripe: {pb.customerId} →
                      </a>
                    )}
                    {pb.subscriptionId && (
                      <a
                        href={`https://dashboard.stripe.com/subscriptions/${pb.subscriptionId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#F2F2EF] hover:bg-[#F2F2EF] text-[#0F1115] hover:text-[#000000] font-mono"
                      >
                        Sub: {pb.subscriptionId} →
                      </a>
                    )}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      )}

      <div className="mt-8 p-4 rounded-xl border border-[#E4E4E0] bg-[#FAFAF8] text-[12.5px] text-[#6E747D] leading-relaxed">
        <p><strong className="text-[#0F1115]">How this page works.</strong> Each Collective Partner has <code className="bg-white border border-[#E4E4E0] px-1 py-0.5 rounded">licence.partnerBilling</code> set on their <code className="bg-white border border-[#E4E4E0] px-1 py-0.5 rounded">tenant_config</code> row (tier + locked prices + Stripe customer). A monthly Inngest cron computes Active Client counts and writes rows to <code className="bg-white border border-[#E4E4E0] px-1 py-0.5 rounded">partner_active_client_counts</code>. This page reads both.</p>
        <p className="mt-2"><strong className="text-[#0F1115]">Invoicing.</strong> v1 is manual. Use the numbers above to create an invoice in Stripe. Mark the month as billed when done (v2 will do this automatically). Setup fee is a one-time invoice at partnership commencement; the locked monthly subscription is a Stripe subscription; the per-active-client fee is a monthly usage invoice for the previous month.</p>
        <p className="mt-2">Related: <Link href="/dashboard/settings/tenants" className="text-[#000000] hover:text-[#000000] underline">Tenant registry</Link>, <Link href="/dashboard/settings/platform-buildout" className="text-[#000000] hover:text-[#000000] underline">Platform Buildout</Link>.</p>
      </div>
    </div>
  )
}

function MetricTile({ label, value, hint, tone = 'default' }: { label: string; value: string; hint?: string; tone?: 'default' | 'stone' | 'green' | 'amber' | 'red' }) {
  const valueColor = {
    default: 'text-[#0F1115]',
    stone: 'text-[#9CA2AB]',
    green: 'text-[#2B5E45]',
    amber: 'text-[#B06E1F]',
    red: 'text-[#8F2D2D]',
  }[tone]
  return (
    <div className="br-card p-3">
      <div className="text-[10px] font-medium text-[#6E747D] mb-1">{label}</div>
      <div className={`text-[20px] font-bold ${valueColor} font-mono`}>{value}</div>
      {hint && <div className="text-[10px] text-[#6E747D] mt-0.5 capitalize">{hint}</div>}
    </div>
  )
}
