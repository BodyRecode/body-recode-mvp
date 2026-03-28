import { createClient } from '@/lib/supabase/server'
import { getLeadSourceLabel, LEAD_SOURCES } from '@/lib/utils'

const BASE_URL = 'https://bodyrecode.au/check-in'

const QR_SOURCES = [
  { value: 'qr_floor_banner', label: 'Floor Banner', desc: 'Large QR code on the gym floor banner near the entrance.' },
  { value: 'qr_window', label: 'Window Decal', desc: 'QR code on the front window or door.' },
  { value: 'qr_card', label: 'Business Card', desc: 'QR code printed on business cards.' },
  { value: 'qr_flyer', label: 'Flyer', desc: 'QR code on printed flyers or handouts.' },
]

const DIGITAL_SOURCES = [
  { value: 'website', label: 'Website', desc: 'Check-in link on bodyrecode.au' },
  { value: 'instagram', label: 'Instagram', desc: 'Link in bio or story.' },
  { value: 'facebook', label: 'Facebook', desc: 'Facebook post or profile link.' },
  { value: 'google', label: 'Google', desc: 'Google Ads or search.' },
]

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

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold mb-1">Lead Sources</h1>
        <p className="text-stone-400 text-sm">Tracking URLs for QR codes and digital channels. Copy a URL and paste it into any QR code generator.</p>
      </div>

      {/* QR Tracking URLs */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-5">QR Code URLs</h2>
        <div className="space-y-4">
          {QR_SOURCES.map(src => (
            <div key={src.value} className="border border-stone-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{src.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{src.desc}</p>
                </div>
                <span className="text-xs font-semibold text-stone-500 bg-stone-800 px-2 py-1 rounded-full shrink-0">
                  {counts[src.value] ?? 0} leads
                </span>
              </div>
              <CopyUrl url={`${BASE_URL}?source=${src.value}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Digital Channel URLs */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 mb-6">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-5">Digital Channel URLs</h2>
        <div className="space-y-4">
          {DIGITAL_SOURCES.map(src => (
            <div key={src.value} className="border border-stone-800 rounded-lg p-4">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <p className="text-sm font-semibold text-white">{src.label}</p>
                  <p className="text-xs text-stone-500 mt-0.5">{src.desc}</p>
                </div>
                <span className="text-xs font-semibold text-stone-500 bg-stone-800 px-2 py-1 rounded-full shrink-0">
                  {counts[src.value] ?? 0} leads
                </span>
              </div>
              <CopyUrl url={`${BASE_URL}?source=${src.value}`} />
            </div>
          ))}
        </div>
      </div>

      {/* Source breakdown */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-stone-300 uppercase tracking-wider mb-5">All Leads by Source</h2>
        {total === 0 ? (
          <p className="text-stone-500 text-sm">No leads yet.</p>
        ) : (
          <div className="space-y-3">
            {LEAD_SOURCES.map(src => {
              const count = counts[src.value] ?? 0
              if (count === 0) return null
              const pct = Math.round((count / total) * 100)
              return (
                <div key={src.value}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-stone-300">{src.label}</span>
                    <span className="text-sm font-semibold text-white">{count} <span className="text-stone-500 font-normal text-xs">({pct}%)</span></span>
                  </div>
                  <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
            {counts['unknown'] || counts[''] ? (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-stone-500">Unknown</span>
                  <span className="text-sm font-semibold text-stone-400">{(counts['unknown'] ?? 0) + (counts[''] ?? 0)}</span>
                </div>
                <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-stone-600 rounded-full" style={{ width: `${Math.round(((counts['unknown'] ?? 0) + (counts[''] ?? 0)) / total * 100)}%` }} />
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}

function CopyUrl({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <code className="flex-1 text-xs text-teal-400 bg-stone-950 border border-stone-800 rounded-lg px-3 py-2 truncate">
        {url}
      </code>
      <CopyButton url={url} />
    </div>
  )
}

// Client component just for the copy button
import CopyButton from './copy-button'
