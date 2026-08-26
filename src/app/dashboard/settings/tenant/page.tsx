import { headers } from 'next/headers'
import { getTenant, type TenantConfig } from '@/config/tenant'
import { loadTenantFromDb } from '@/lib/tenant-resolver'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/dashboard/ui'
import { EditableSection } from './edit-section'
import { DomainsSection } from './domains-section'
import { StripeConnectSection } from './stripe-section'
import { DoctrineParametersSection } from './doctrine-parameters-section'

export const dynamic = 'force-dynamic'

export default async function TenantSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ stripe_result?: string }>
}) {
  const h = await headers()
  const tenantId = h.get('x-tenant-id') ?? 'body-recode'
  const flagEnabled = process.env.NEXT_PUBLIC_TENANT_DB_ENABLED === 'true'
  const { stripe_result } = await searchParams

  // Determine if the current user has an editable DB row (they're a coach + tenant_config row exists for their coach_id)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let dbRow: TenantConfig | null = null
  if (user) {
    const { data } = await supabase
      .from('tenant_config')
      .select('brand, coach, products, licence, modality')
      .eq('coach_id', user.id)
      .maybeSingle()
    if (data) {
      dbRow = data as unknown as TenantConfig
    }
  }

  const canEdit = Boolean(dbRow)
  // Prefer the DB row for display when editing is possible; otherwise fall back to in-code
  const displayed = canEdit && dbRow ? dbRow : getTenant()
  const inDbForFlag: TenantConfig | null = flagEnabled ? await loadTenantFromDb(tenantId) : null

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Settings"
        title="Tenant configuration"
        subtitle="How your brand renders across the platform. Edit any section below — saves apply immediately + invalidate the tenant cache."
      />

      <StatusBanner tenantId={tenantId} flagEnabled={flagEnabled} inDb={inDbForFlag} canEdit={canEdit} />

      {canEdit ? (
        <>
          <EditableSection
            section="brand"
            title="Brand shell"
            fields={brandFields(displayed.brand)}
            colorKeys={new Set(['accentColor'])}
          />
          <EditableSection
            section="coach"
            title="Coach identity"
            fields={coachFields(displayed.coach)}
          />
          <EditableSection
            section="products"
            title="Product wrapping"
            fields={productFields(displayed.products)}
            numericKeys={
              new Set([
                'reportPrice',
                'challengePrice',
                'blueprintPrice',
                'membershipPrice',
                'coachingPackage2xPrice',
              ])
            }
          />
          <EditableSection
            section="licence"
            title="Licence"
            fields={licenceFields(displayed.licence)}
            booleanKeys={new Set(['poweredBy'])}
          />
          <EditableSection
            section="modality"
            title="Modality"
            fields={modalityFields(displayed.modality)}
          />
          <DoctrineParametersSection initial={displayed.licence.doctrineParameters ?? null} />
          <DomainsSection />
          <StripeConnectSection
            stripeAccountId={displayed.licence.stripeAccountId ?? null}
            stripeAccountStatus={displayed.licence.stripeAccountStatus ?? null}
            searchStatus={stripe_result ?? null}
          />
        </>
      ) : (
        <>
          <ReadOnlyCard title="Brand shell" fields={brandFields(displayed.brand)} />
          <ReadOnlyCard title="Coach identity" fields={coachFields(displayed.coach)} />
          <ReadOnlyCard title="Product wrapping" fields={productFields(displayed.products)} />
          <ReadOnlyCard title="Licence" fields={licenceFields(displayed.licence)} />
          <ReadOnlyCard title="Modality" fields={modalityFields(displayed.modality)} />

          <div className="mt-6 p-4 rounded-xl border border-amber-200 bg-amber-50 text-[13px] text-amber-900 leading-relaxed">
            <strong>Read-only:</strong> no tenant_config row exists for your coach_id yet. Values shown are the in-code fallback from
            <code className="mx-1 bg-amber-100 px-1 py-0.5 rounded text-[12px]">src/config/tenant.ts</code>.
            To enable editing, ensure a row exists in the
            <code className="mx-1 bg-amber-100 px-1 py-0.5 rounded text-[12px]">tenant_config</code>
            table with your coach_id.
          </div>
        </>
      )}
    </div>
  )
}

function StatusBanner({
  tenantId,
  flagEnabled,
  inDb,
  canEdit,
}: {
  tenantId: string
  flagEnabled: boolean
  inDb: TenantConfig | null
  canEdit: boolean
}) {
  const status = flagEnabled
    ? inDb
      ? { label: 'DB-backed', tone: 'green' as const, detail: `Reading from tenant_config row for '${tenantId}'` }
      : { label: 'DB fallback', tone: 'amber' as const, detail: `Flag ON but no DB row for '${tenantId}' — using in-code default` }
    : { label: 'In-code only', tone: 'stone' as const, detail: 'NEXT_PUBLIC_TENANT_DB_ENABLED=false — flip to true to activate DB path' }

  const toneStyles = {
    green: 'bg-green-50 border-green-200 text-green-900',
    amber: 'bg-amber-50 border-amber-200 text-amber-900',
    stone: 'bg-[#FBFCFD] border-[#E8EAEE] text-[#141821]',
  }[status.tone]

  return (
    <div className={`mb-6 p-4 rounded-xl border ${toneStyles}`}>
      <div className="flex items-center gap-3 mb-1">
        <span className="text-[12px] font-medium">{status.label}</span>
        <span className="text-[11px] font-mono opacity-70">tenant_id: {tenantId}</span>
        {canEdit && <span className="text-[11.5px] font-medium bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Editable</span>}
      </div>
      <p className="text-[13px] leading-relaxed">{status.detail}</p>
    </div>
  )
}

function ReadOnlyCard({
  title,
  fields,
}: {
  title: string
  fields: Array<{ label: string; value: string }>
}) {
  return (
    <div className="mb-4 bg-white border border-[#E8EAEE] rounded-xl overflow-hidden">
      <div className="px-5 py-3 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <h3 className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">{title}</h3>
      </div>
      <div className="divide-y divide-[#F4F6F9]">
        {fields.map((f) => (
          <div key={f.label} className="px-5 py-3 flex items-baseline gap-4">
            <div className="w-52 shrink-0 text-[12px] text-[#666D7A] font-mono">{f.label}</div>
            <div className="flex-1 text-[13px] text-[#141821] font-mono break-all">
              {f.value || <span className="text-[#98A0AD] italic">(empty)</span>}
            </div>
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
