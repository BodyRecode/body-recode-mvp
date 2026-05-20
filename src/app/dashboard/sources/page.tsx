import { createClient } from '@/lib/supabase/server'
import { LEAD_SOURCES } from '@/lib/utils'
import { PageHeader, Card, SectionLabel, Pill, MONO_FONT } from '@/components/dashboard/ui'
import CopyButton from './copy-button'

const QR_BASE_URL = 'https://bodyrecode.au/scorecard'
const DIGITAL_BASE_URL = 'https://bodyrecode.au/performance-check-in-quiz'
const SCORECARD_BASE_URL = 'https://bodyrecode.au/scorecard'

const QR_SOURCES = [
  { value: 'qr_floor_banner', label: 'Floor Banner', desc: 'Large QR code on the gym floor banner near the entrance.' },
  { value: 'qr_window',       label: 'Window Decal', desc: 'QR code on the front window or door.' },
  { value: 'qr_card',         label: 'Business Card', desc: 'QR code printed on business cards.' },
  { value: 'qr_flyer',        label: 'Flyer',         desc: 'QR code on printed flyers or handouts.' },
]

const DIGITAL_SOURCES = [
  { value: 'website',   label: 'Website',   desc: 'Check-in link on bodyrecode.au' },
  { value: 'instagram', label: 'Instagram', desc: 'Link in bio or story.' },
  { value: 'facebook',  label: 'Facebook',  desc: 'Facebook post or profile link.' },
  { value: 'google',    label: 'Google',    desc: 'Google Ads or search.' },
]

const SCORECARD_SOURCES = [
  { value: 'instagram', label: 'Instagram', desc: 'Link in bio. Primary scorecard entry point for organic content.' },
  { value: 'website',   label: 'Website',   desc: 'Scorecard link on bodyrecode.au' },
  { value: 'facebook',  label: 'Facebook',  desc: 'Facebook post or profile link.' },
]

function SourceItem({
  label,
  desc,
  count,
  url,
  showCount = true,
}: {
  label: string
  desc: string
  count: number
  url: string
  showCount?: boolean
}) {
  return (
    <div className="border border-[#E5E5E5] bg-[#FFFFFF] rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-[#1A1A1A]">{label}</p>
          <p className="text-[12px] text-[#999999] mt-0.5">{desc}</p>
        </div>
        {showCount && (
          <Pill accent={count > 0 ? 'teal' : 'neutral'}>
            {count} {count === 1 ? 'lead' : 'leads'}
          </Pill>
        )}
      </div>
      <div className="flex items-center gap-2">
        <code
          className="flex-1 text-[11px] text-[#1B6DFC] bg-[#FFFFFF] border border-[#E5E5E5] rounded-lg px-3 py-2 truncate"
          style={{ fontFamily: MONO_FONT }}
        >
          {url}
        </code>
        <CopyButton url={url} />
      </div>
    </div>
  )
}

export default async function SourcesPage() {
  const supabase = await createClient()

  const { data: leads } = await supabase
    .from('leads')
    .select('id, source')
    .not('source', 'is', null)

  const counts: Record<string, number> = {}
  for (const lead of leads ?? []) {
    const s = lead.source ?? 'unknown'
    counts[s] = (counts[s] ?? 0) + 1
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  const unknownCount = (counts['unknown'] ?? 0) + (counts[''] ?? 0)

  return (
    <div className="max-w-[900px]">
      <PageHeader
        eyebrow="Attribution"
        title="Lead Sources"
        subtitle="Tracking URLs for QR codes and digital channels. Copy a URL and paste it into any QR code generator."
      />

      <Card className="mb-5">
        <SectionLabel>QR Code URLs</SectionLabel>
        <div className="space-y-3">
          {QR_SOURCES.map(src => (
            <SourceItem
              key={src.value}
              label={src.label}
              desc={src.desc}
              count={counts[src.value] ?? 0}
              url={`${QR_BASE_URL}?source=${src.value}`}
            />
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <SectionLabel meta="Performance Check-In Quiz">Digital Channel URLs</SectionLabel>
        <div className="space-y-3">
          {DIGITAL_SOURCES.map(src => (
            <SourceItem
              key={src.value}
              label={src.label}
              desc={src.desc}
              count={counts[src.value] ?? 0}
              url={`${DIGITAL_BASE_URL}?source=${src.value}`}
            />
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <SectionLabel meta="Body State Scorecard">Scorecard URLs</SectionLabel>
        <div className="space-y-3">
          {SCORECARD_SOURCES.map(src => (
            <SourceItem
              key={src.value}
              label={src.label}
              desc={src.desc}
              count={counts[src.value] ?? 0}
              url={`${SCORECARD_BASE_URL}?source=${src.value}`}
              showCount={false}
            />
          ))}
        </div>
      </Card>

      <Card>
        <SectionLabel meta={total > 0 ? `${total} total` : undefined}>
          All Leads by Source
        </SectionLabel>
        {total === 0 ? (
          <p className="text-[#999999] text-[13px]">No leads yet.</p>
        ) : (
          <div className="space-y-3">
            {LEAD_SOURCES.map(src => {
              const count = counts[src.value] ?? 0
              if (count === 0) return null
              const pct = Math.round((count / total) * 100)
              return (
                <div key={src.value}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] text-[#3A3A3A]">{src.label}</span>
                    <span
                      className="text-[13px] font-semibold text-[#1A1A1A]"
                      style={{ fontVariantNumeric: 'tabular-nums' }}
                    >
                      {count}
                      <span className="text-[#999999] font-normal text-[11px] ml-1.5">{pct}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-full overflow-hidden">
                    <div className="h-full bg-[#1B6DFC] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {unknownCount > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[13px] text-[#999999]">Unknown</span>
                  <span
                    className="text-[13px] font-semibold text-[#6B6B6B]"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {unknownCount}
                  </span>
                </div>
                <div className="h-1.5 bg-[#FFFFFF] border border-[#E5E5E5] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#999999] rounded-full"
                    style={{ width: `${Math.round((unknownCount / total) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
