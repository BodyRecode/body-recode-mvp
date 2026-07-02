import { headers } from 'next/headers'
import { getTenant, type TenantConfig } from '@/config/tenant'
import { loadTenantFromDb } from '@/lib/tenant-resolver'
import { PageHeader } from '@/components/dashboard/ui'

export const dynamic = 'force-dynamic'

export default async function TenantSettingsPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? 'body-recode'
  const flagEnabled = process.env.NEXT_PUBLIC_TENANT_DB_ENABLED === 'true'

  // Show both the in-code default AND (if DB-backed enabled) the DB row.
  // This lets the coach see exactly what's in each layer.
  const inCode = getTenant()
  const inDb: TenantConfig | null = flagEnabled ? await loadTenantFromDb(tenantId) : null

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Settings"
        title="Tenant configuration"
        subtitle="How your brand renders across the platform. Values come from the DB when NEXT_PUBLIC_TENANT_DB_ENABLED=true, otherwise from the in-code fallback."
      />

      <StatusBanner tenantId={tenantId} flagEnabled={flagEnabled} inDb={inDb} />

      <ConfigCard title="Brand shell" fields={brandFields(inCode.brand)} />
      <ConfigCard title="Coach identity" fields={coachFields(inCode.coach)} />
      <ConfigCard title="Product wrapping" fields={productFields(inCode.products)} />
      <ConfigCard title="Licence" fields={licenceFields(inCode.licence)} />
      <ConfigCard title="Modality" fields={modalityFields(inCode.modality)} />

      <div className="mt-8 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
        <strong>Read-only for now.</strong> Editing UI lands next pass. To change values today:
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>Values shown are the in-code fallback from <code className="bg-amber-100 px-1 py-0.5 rounded text-[12px]">src/config/tenant.ts</code>.</li>
          <li>DB row lives in the <code className="bg-amber-100 px-1 py-0.5 rounded text-[12px]">tenant_config</code> table (keyed by coach_id).</li>
          <li>Update via <code className="bg-amber-100 px-1 py-0.5 rounded text-[12px]">supabase db query --linked</code> or edit tenant.ts directly.</li>
        </ul>
      </div>
    </div>
  )
}

function StatusBanner({
  tenantId,
  flagEnabled,
  inDb,
}: {
  tenantId: string
  flagEnabled: boolean
  inDb: TenantConfig | null
}) {
  const status = flagEnabled
    ? inDb
      ? { label: 'DB-backed', tone: 'green' as const, detail: `Reading from tenant_config row for '${tenantId}'` }
      : { label: 'DB fallback', tone: 'amber' as const, detail: `Flag ON but no DB row for '${tenantId}' — using in-code default` }
    : { label: 'In-code only', tone: 'stone' as const, detail: 'NEXT_PUBLIC_TENANT_DB_ENABLED=false — flip to true to activate DB path' }

  const toneStyles = {
    green: 'bg-green-50 border-green-200 text-green-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    stone: 'bg-stone-50 border-stone-200 text-stone-700',
  }[status.tone]

  return (
    <div className={`mb-6 p-4 rounded-xl border ${toneStyles}`}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-[11px] font-bold uppercase tracking-widest">{status.label}</span>
        <span className="text-[11px] font-mono opacity-70">tenant_id: {tenantId}</span>
      </div>
      <p className="text-[13px] leading-relaxed">{status.detail}</p>
    </div>
  )
}

function ConfigCard({
  title,
  fields,
}: {
  title: string
  fields: Array<{ label: string; value: string }>
}) {
  return (
    <div className="mb-4 bg-white border border-stone-200 rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-stone-200 bg-stone-50">
        <h3 className="text-[13px] font-bold text-stone-900 uppercase tracking-widest">{title}</h3>
      </div>
      <div className="divide-y divide-stone-100">
        {fields.map((f) => (
          <div key={f.label} className="px-5 py-3 flex items-baseline gap-4">
            <div className="w-52 shrink-0 text-[12px] text-stone-500 font-mono">{f.label}</div>
            <div className="flex-1 text-[13px] text-stone-900 font-mono break-all">{f.value || <span className="text-stone-400 italic">(empty)</span>}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

function brandFields(b: TenantConfig['brand']) {
  return [
    { label: 'name', value: b.name },
    { label: 'nameWithMark', value: b.nameWithMark },
    { label: 'tagline', value: b.tagline },
    { label: 'logoUrlLight', value: b.logoUrlLight },
    { label: 'logoUrlDark', value: b.logoUrlDark },
    { label: 'apexDomain', value: b.apexDomain },
    { label: 'marketingDomain', value: b.marketingDomain },
    { label: 'performanceDomain', value: b.performanceDomain },
    { label: 'appDomain', value: b.appDomain },
    { label: 'supportEmail', value: b.supportEmail },
    { label: 'replyToEmail', value: b.replyToEmail },
    { label: 'fromEmail', value: b.fromEmail },
    { label: 'accentColor', value: b.accentColor },
  ]
}

function coachFields(c: TenantConfig['coach']) {
  return [
    { label: 'firstName', value: c.firstName },
    { label: 'fullName', value: c.fullName },
    { label: 'email', value: c.email },
    { label: 'adminEmail', value: c.adminEmail },
    { label: 'photoUrl', value: c.photoUrl },
    { label: 'location', value: c.location },
    { label: 'credentials', value: c.credentials },
    { label: 'instagramHandle', value: c.instagramHandle },
    { label: 'personalInstagramHandle', value: c.personalInstagramHandle },
    { label: 'whatsAppNumber', value: c.whatsAppNumber },
  ]
}

function productFields(p: TenantConfig['products']) {
  return [
    { label: 'scorecardName', value: p.scorecardName },
    { label: 'reportProductName', value: p.reportProductName },
    { label: 'reportPrice', value: String(p.reportPrice) },
    { label: 'challengeName', value: p.challengeName },
    { label: 'challengePrice', value: String(p.challengePrice) },
    { label: 'blueprintName', value: p.blueprintName },
    { label: 'blueprintPrice', value: String(p.blueprintPrice) },
    { label: 'membershipName', value: p.membershipName },
    { label: 'membershipPrice', value: String(p.membershipPrice) },
    { label: 'coachingPackage2xPrice', value: String(p.coachingPackage2xPrice) },
    { label: 'coachingPackagePriceLabel', value: p.coachingPackagePriceLabel },
  ]
}

function licenceFields(l: TenantConfig['licence']) {
  return [
    { label: 'tenantId', value: l.tenantId },
    { label: 'poweredBy', value: String(l.poweredBy) },
    { label: 'version', value: l.version },
  ]
}

function modalityFields(m: TenantConfig['modality']) {
  return [
    { label: 'id', value: m.id },
    { label: 'label', value: m.label },
    { label: 'doctrineMode', value: m.doctrineMode },
  ]
}
