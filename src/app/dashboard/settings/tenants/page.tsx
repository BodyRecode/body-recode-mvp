import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isCoachEmail } from '@/lib/coach-auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'

export const dynamic = 'force-dynamic'

type TenantRow = {
  coach_id: string
  brand: { name: string; nameWithMark: string; accentColor: string; apexDomain: string }
  coach: { firstName: string; fullName: string; email: string; location: string }
  products: { challengeName: string; blueprintPrice: number; membershipPrice: number }
  licence: { tenantId: string; poweredBy: boolean; version: string }
  modality: { id: string; label: string; doctrineMode: 'A' | 'B' }
  created_at: string
  updated_at: string
}

export default async function TenantsAdminPage() {
  // Admin gate: only Kade (or configured COACH_EMAILS) can see this
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || !isCoachEmail(user.email)) {
    redirect('/dashboard')
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('tenant_config')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    return (
      <div className="max-w-[1100px]">
        <PageHeader eyebrow="Admin" title="All tenants" subtitle="Multi-tenant registry across the platform." />
        <div className="p-4 rounded-xl border border-[#F5C9C9] bg-[#FDEDED] text-[#8A1919] text-[13px]">
          Error loading tenants: {error.message}
        </div>
      </div>
    )
  }

  const tenants = (data ?? []) as TenantRow[]

  return (
    <div className="max-w-[1200px]">
      <PageHeader
        eyebrow="Admin"
        title="All tenants"
        subtitle={`${tenants.length} tenant${tenants.length === 1 ? '' : 's'} in the tenant_config table. Kade-only view.`}
      />

      <div className="mb-6 flex items-center gap-4 flex-wrap">
        <MetricPill label="Total tenants" value={String(tenants.length)} />
        <MetricPill label="Strength modality" value={String(tenants.filter(t => t.modality?.id === 'strength').length)} />
        <MetricPill label="Yoga modality" value={String(tenants.filter(t => t.modality?.id === 'yoga').length)} />
        <MetricPill label="Powered by BR" value={String(tenants.filter(t => t.licence?.poweredBy === true).length)} />
      </div>

      <div className="br-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-[#FBFCFD] border-b border-[#E8EAEE]">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Tenant</th>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Coach</th>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Modality</th>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Pricing</th>
                <th className="text-left px-4 py-3 font-medium text-[#141821] text-[11px]">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F4F6F9]">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#666D7A] text-[13px]">
                    No tenants yet. Insert one via SQL or the coach signup flow.
                  </td>
                </tr>
              ) : tenants.map((t) => (
                <tr key={t.coach_id} className="hover:bg-[#FBFCFD] transition-colors">
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-[12px] font-medium text-[#141821]">{t.licence?.tenantId ?? '—'}</div>
                    <div className="font-mono text-[10px] text-[#98A0AD] mt-1">{t.coach_id.slice(0, 8)}…</div>
                    {t.licence?.poweredBy && (
                      <div className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-medium text-[#1056D6] bg-[rgba(27,109,252,0.08)] rounded">
                        Powered by BR
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[#141821]">{t.brand?.name ?? '—'}</div>
                    <div className="text-[11px] text-[#666D7A] mt-0.5">{t.brand?.apexDomain ?? ''}</div>
                    {t.brand?.accentColor && (
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <div className="w-3 h-3 rounded-full border border-[#E8EAEE]" style={{ background: t.brand.accentColor }} />
                        <span className="font-mono text-[10px] text-[#666D7A]">{t.brand.accentColor}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[#141821]">{t.coach?.fullName ?? '—'}</div>
                    <div className="text-[11px] text-[#666D7A] mt-0.5">{t.coach?.email ?? ''}</div>
                    <div className="text-[11px] text-[#98A0AD] mt-0.5">{t.coach?.location ?? ''}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[#141821] capitalize">{t.modality?.label ?? t.modality?.id ?? '—'}</div>
                    <div className="text-[11px] text-[#666D7A] mt-0.5 font-mono">mode {t.modality?.doctrineMode ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="font-mono text-[11px] text-[#141821]">
                      Report ${(t.products as unknown as { reportPrice?: number })?.reportPrice ?? '—'}
                    </div>
                    <div className="font-mono text-[11px] text-[#141821]">Blueprint ${t.products?.blueprintPrice ?? '—'}</div>
                    <div className="font-mono text-[11px] text-[#141821]">Membership ${t.products?.membershipPrice ?? '—'}/wk</div>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div className="text-[11px] text-[#666D7A]">{formatDate(t.updated_at)}</div>
                    <div className="text-[10px] text-[#98A0AD] mt-0.5">v{t.licence?.version ?? '?'}</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3 text-[12px] text-[#666D7A]">
        <Link href="/dashboard/settings/tenant" className="text-[#1560E0] hover:text-[#1056D6] underline">
          View my own tenant config →
        </Link>
      </div>

      <div className="mt-8 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD] text-[12px] text-[#666D7A] leading-relaxed">
        <strong className="text-[#141821]">Read-only registry.</strong> Coach signup UI + tenant provisioning form land in a follow-up pass.
        For now, insert new tenants via
        <code className="mx-1 bg-white border border-[#E8EAEE] px-1 py-0.5 rounded text-[11px]">supabase db query --linked</code>
        or via the pipeline test script
        <code className="mx-1 bg-white border border-[#E8EAEE] px-1 py-0.5 rounded text-[11px]">scripts/test-melisa-full-pipeline.ts</code>.
      </div>
    </div>
  )
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#FBFCFD] border border-[#E8EAEE]">
      <span className="text-[10px] font-medium text-[#666D7A]">{label}</span>
      <span className="text-[14px] font-bold text-[#141821]">{value}</span>
    </div>
  )
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return '—'
  }
}
