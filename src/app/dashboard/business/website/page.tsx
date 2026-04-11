'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type DayData = { date: string; views: number; visitors: number }

type AnalyticsData = {
  overview: { total: number; devices: number; bounceRate: number }
  daily: DayData[]
}

function StatCard({ label, value, sub, highlight }: {
  label: string
  value: string | number
  sub?: string
  highlight?: boolean
}) {
  return (
    <div className={`bg-[#111110] border rounded-xl p-5 ${highlight ? 'border-teal-500/40' : 'border-stone-800'}`}>
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">{label}</p>
      <p className={`text-3xl font-black ${highlight ? 'text-teal-400' : 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs mt-1 font-medium text-stone-500">{sub}</p>}
    </div>
  )
}

function DailyChart({ data }: { data: DayData[] }) {
  if (!data || data.length === 0) return <div className="bg-[#111110] border border-stone-800 rounded-xl p-5"><p className="text-sm text-stone-600">No data yet.</p></div>
  const max = data.reduce((m, d) => Math.max(m, d.views), 1)
  const hasData = data.some(d => d.views > 0)

  return (
    <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-5">Daily Page Views</p>
      {!hasData ? (
        <p className="text-sm text-stone-600 py-4">No data yet for this period.</p>
      ) : (
        <div className="flex items-end gap-1 h-32">
          {data.map((d) => {
            const height = max > 0 ? Math.max((d.views / max) * 100, d.views > 0 ? 4 : 0) : 0
            const date = new Date(d.date + 'T12:00:00')
            const label = isNaN(date.getTime()) ? d.date : date.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
            const isToday = d.date === new Date().toISOString().split('T')[0]
            return (
              <div key={d.date} className="flex-1 flex flex-col items-center gap-1 group relative">
                {d.views > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-stone-800 border border-stone-700 rounded px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {d.views} views · {d.visitors} visitors
                  </div>
                )}
                <div
                  className={`w-full rounded-sm transition-all ${isToday ? 'bg-teal-500' : d.views > 0 ? 'bg-stone-500 group-hover:bg-stone-400' : 'bg-stone-900'}`}
                  style={{ height: `${height}%`, minHeight: d.views > 0 ? '4px' : '2px' }}
                />
                {data.length <= 14 && (
                  <span className="text-[9px] text-stone-600 rotate-0 truncate w-full text-center">{label}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {data.length > 14 && (
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-stone-600">{data[0]?.date}</span>
          <span className="text-[10px] text-stone-600">{data[data.length - 1]?.date}</span>
        </div>
      )}
    </div>
  )
}

export default function WebsitePage() {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [leadCount, setLeadCount] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/website-analytics?days=${days}`)
      const json = await res.json()
      if (!res.ok) setError(json.error ?? 'Failed to load analytics')
      else setData(json)
    } catch {
      setError('Failed to load analytics')
    }
    setLoading(false)
  }, [days])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const supabase = createClient()
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', since)
      .then(({ count }) => setLeadCount(count ?? 0))
  }, [days])

  const visitors = data?.overview?.devices ?? 0
  const pageViews = data?.overview?.total ?? 0
  const bounceRate = Number(data?.overview?.bounceRate ?? 0)
  const conversionRate = visitors > 0 && leadCount != null && leadCount > 0
    ? ((leadCount / visitors) * 100).toFixed(1)
    : null

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Website</h1>
          <p className="text-sm text-stone-500 mt-0.5">performance.bodyrecode.au</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${days === d ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'bg-stone-800 text-stone-400 border border-stone-700 hover:text-white'}`}
            >
              {d}d
            </button>
          ))}
          <a
            href="https://performance.bodyrecode.au"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-stone-800 border border-stone-700 text-stone-400 hover:text-white transition-colors"
          >
            View site ↗
          </a>
        </div>
      </div>

      {loading && <p className="text-sm text-stone-500 py-8 text-center">Loading analytics...</p>}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-400 mb-1">Analytics unavailable</p>
          <p className="text-xs text-stone-400">{error}</p>
        </div>
      )}

      {!loading && data && visitors < 50 && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-400/80">Analytics tracking was enabled recently - visitor data only covers the last few days. Conversion rate and bounce rate will stabilise as more data accumulates.</p>
        </div>
      )}

      {!loading && data && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard label="Visitors" value={visitors.toLocaleString()} />
            <StatCard label="Page Views" value={pageViews.toLocaleString()} />
            <StatCard
              label="Scorecard Submissions"
              value={leadCount ?? '—'}
              sub={conversionRate ? `${conversionRate}% conversion` : undefined}
              highlight
            />
            <StatCard
              label="Bounce Rate"
              value={`${bounceRate.toFixed(0)}%`}
            />
          </div>

          {/* Daily chart */}
          <DailyChart data={data.daily} />
        </>
      )}

      {/* Pages */}
      <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Live Pages</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: 'Homepage', path: '/' },
            { label: 'How It Works', path: '/how-it-works' },
            { label: 'Online Coaching', path: '/online' },
            { label: 'Brisbane', path: '/brisbane' },
            { label: 'Body State Scorecard', path: '/scorecard' },
            { label: 'Founder Program', path: '/founder' },
          ].map(p => (
            <a
              key={p.path}
              href={`https://performance.bodyrecode.au${p.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 bg-stone-900 hover:bg-stone-800 border border-stone-800 rounded-lg transition-colors group"
            >
              <span className="text-sm text-stone-300 group-hover:text-white transition-colors">{p.label}</span>
              <span className="text-xs text-stone-600 group-hover:text-stone-400 transition-colors">{p.path} ↗</span>
            </a>
          ))}
        </div>
      </div>

    </div>
  )
}
