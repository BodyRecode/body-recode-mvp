'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

type AnalyticsData = {
  overview: {
    visitors: { value: number; previousValue?: number }
    pageViews: { value: number; previousValue?: number }
    bounceRate?: { value: number }
    visitDuration?: { value: number }
  }
  pages: { path: string; visitors: number; pageViews: number }[]
  referrers: { referrer: string; visitors: number }[]
}

function StatCard({ label, value, prev, format = 'number' }: {
  label: string
  value: number | undefined
  prev?: number
  format?: 'number' | 'percent' | 'duration'
}) {
  const display = value == null ? '—' :
    format === 'percent' ? `${(value * 100).toFixed(1)}%` :
    format === 'duration' ? `${Math.round(value)}s` :
    value.toLocaleString()

  const change = value != null && prev != null && prev > 0
    ? Math.round(((value - prev) / prev) * 100)
    : null

  return (
    <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
      <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">{label}</p>
      <p className="text-3xl font-black text-white">{display}</p>
      {change != null && (
        <p className={`text-xs mt-1 font-medium ${change >= 0 ? 'text-teal-400' : 'text-red-400'}`}>
          {change >= 0 ? '+' : ''}{change}% vs prev period
        </p>
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
      if (!res.ok) {
        setError(json.error ?? 'Failed to load analytics')
      } else {
        setData(json)
      }
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

  const conversionRate = data?.overview?.visitors?.value && leadCount != null && leadCount > 0
    ? ((leadCount / data.overview.visitors.value) * 100).toFixed(1)
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

      {loading && (
        <p className="text-sm text-stone-500 py-8 text-center">Loading analytics...</p>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-400 mb-1">Analytics unavailable</p>
          <p className="text-xs text-stone-400">{error}</p>
          {error.includes('not enabled') && (
            <p className="text-xs text-stone-500 mt-2">
              Enable Web Analytics in the Vercel dashboard: <span className="text-teal-400">vercel.com → performance-bodyrecode → Analytics → Enable</span>
            </p>
          )}
        </div>
      )}

      {!loading && data && (
        <>
          {/* Overview stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Visitors"
              value={data.overview?.visitors?.value}
              prev={data.overview?.visitors?.previousValue}
            />
            <StatCard
              label="Page Views"
              value={data.overview?.pageViews?.value}
              prev={data.overview?.pageViews?.previousValue}
            />
            <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-2">Scorecard Submissions</p>
              <p className="text-3xl font-black text-white">{leadCount ?? '—'}</p>
              {conversionRate && (
                <p className="text-xs mt-1 font-medium text-teal-400">{conversionRate}% conversion</p>
              )}
            </div>
            <StatCard
              label="Bounce Rate"
              value={data.overview?.bounceRate?.value}
              format="percent"
            />
          </div>

          {/* Top pages */}
          {data.pages.length > 0 && (
            <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Top Pages</p>
              <div className="space-y-2">
                {data.pages.map((p) => {
                  const max = data.pages[0]?.pageViews ?? 1
                  const pct = Math.round((p.pageViews / max) * 100)
                  return (
                    <div key={p.path} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-300 truncate">{p.path || '/'}</span>
                          <span className="text-xs text-stone-500 shrink-0 ml-2">{p.pageViews.toLocaleString()} views · {p.visitors.toLocaleString()} visitors</span>
                        </div>
                        <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Referrers */}
          {data.referrers.length > 0 && (
            <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
              <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Traffic Sources</p>
              <div className="space-y-2">
                {data.referrers.map((r) => {
                  const max = data.referrers[0]?.visitors ?? 1
                  const pct = Math.round((r.visitors / max) * 100)
                  return (
                    <div key={r.referrer} className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-stone-300 truncate">{r.referrer || 'Direct'}</span>
                          <span className="text-xs text-stone-500 shrink-0 ml-2">{r.visitors.toLocaleString()} visitors</span>
                        </div>
                        <div className="h-1 bg-stone-800 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Quick links */}
      <div className="bg-[#111110] border border-stone-800 rounded-xl p-5">
        <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-4">Pages</p>
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
