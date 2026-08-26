'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { brand } from "@/config/tenant";

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
    <div className={`bg-[#FFFFFF] border rounded-xl p-5 ${highlight ? 'border-blue-300' : 'border-[#E8EAEE]'}`}>
      <p className="text-[12.5px] font-medium text-[#666D7A] mb-2">{label}</p>
      <p className={`text-3xl font-black ${highlight ? 'text-blue-500' : 'text-[#141821]'}`}>{value}</p>
      {sub && <p className="text-[12.5px] mt-1 font-medium text-[#666D7A]">{sub}</p>}
    </div>
  )
}

function Insight({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5">
      <p className="text-[12.5px] font-medium text-[#666D7A] mb-3">{title}</p>
      <div className="space-y-2 text-sm text-[#666D7A] leading-relaxed">
        {children}
      </div>
    </div>
  )
}

function DailyChart({ data }: { data: DayData[] }) {
  if (!data || data.length === 0) return <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5"><p className="text-sm text-[#98A0AD]">No data yet.</p></div>
  const max = data.reduce((m, d) => Math.max(m, d.views), 1)
  const hasData = data.some(d => d.views > 0)

  return (
    <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5">
      <p className="text-[12.5px] font-medium text-[#666D7A] mb-5">Daily Page Views</p>
      {!hasData ? (
        <p className="text-sm text-[#98A0AD] py-4">No data yet for this period.</p>
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
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#EFF1F4] border border-[#E8EAEE] rounded px-1.5 py-0.5 text-[10px] text-[#141821] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {d.views} views · {d.visitors} visitors
                  </div>
                )}
                <div
                  className={`w-full rounded-sm transition-all ${isToday ? 'bg-blue-500' : d.views > 0 ? 'bg-[#FBFCFD]0 group-hover:bg-[#666D7A]' : 'bg-[#F4F6F9]'}`}
                  style={{ height: `${height}%`, minHeight: d.views > 0 ? '4px' : '2px' }}
                />
                {data.length <= 14 && (
                  <span className="text-[9px] text-[#98A0AD] rotate-0 truncate w-full text-center">{label}</span>
                )}
              </div>
            )
          })}
        </div>
      )}
      {data.length > 14 && (
        <div className="flex justify-between mt-2">
          <span className="text-[10px] text-[#98A0AD]">{data[0]?.date}</span>
          <span className="text-[10px] text-[#98A0AD]">{data[data.length - 1]?.date}</span>
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
  const pagesPerVisit = visitors > 0 ? (pageViews / visitors).toFixed(1) : null
  const isSparse = visitors < 50

  return (
    <div className="max-w-4xl space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between br-page-header sticky top-0 z-20 mb-7 pt-4 pb-3.5 border-b border-[#E8EAEE] bg-white/[0.88] backdrop-blur-md print:static print:bg-transparent">
        <div>
          <h1 className="text-[22px] font-semibold text-[#141821] tracking-[-0.025em]">Website</h1>
          <p className="text-sm text-[#666D7A] mt-0.5">performance.bodyrecode.au</p>
        </div>
        <div className="flex items-center gap-2">
          {[7, 30, 90].map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${days === d ? 'bg-blue-100 text-blue-500 border border-blue-200' : 'bg-[#EFF1F4] text-[#666D7A] border border-[#E8EAEE] hover:text-[#141821]'}`}
            >
              {d}d
            </button>
          ))}
          <a
            href={brand().performanceDomain}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-3 py-1.5 rounded-lg text-[12.5px] font-semibold bg-[#EFF1F4] border border-[#E8EAEE] text-[#666D7A] hover:text-[#141821] transition-colors"
          >
            View site ↗
          </a>
        </div>
      </div>

      {loading && <p className="text-sm text-[#666D7A] py-8 text-center">Loading analytics...</p>}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-red-700 mb-1">Analytics unavailable</p>
          <p className="text-[12.5px] text-[#666D7A]">{error}</p>
        </div>
      )}

      {!loading && data && isSparse && (
        <div className="bg-amber-50 border border-amber-500/20 rounded-xl px-4 py-3">
          <p className="text-[12.5px] text-amber-700/80">Analytics tracking was enabled in April 2026 - visitor data only covers the last few days. Conversion rate and bounce rate will stabilise as more traffic accumulates over the coming weeks.</p>
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
              value={leadCount ?? '-'}
              sub={conversionRate ? `${conversionRate}% conversion` : undefined}
              highlight
            />
            <StatCard
              label="Bounce Rate"
              value={`${bounceRate.toFixed(0)}%`}
            />
          </div>

          {/* Stats insight */}
          <Insight title="What these numbers mean">
            <p>
              <span className="text-[#141821] font-medium">Visitors</span> is the number that matters most right now. Every visitor is someone who found the site - from a post, a DM, a Google search, or a direct link. At this stage, growing this number is the primary job. The site exists to convert visitors into scorecard submissions, but you can&apos;t convert visitors you don&apos;t have.
            </p>
            <p>
              <span className="text-[#141821] font-medium">Scorecard submissions</span> is the conversion event - the moment a visitor becomes a lead in the system. The conversion rate is submissions divided by visitors. A healthy benchmark for a warm audience (Instagram followers landing from a post) is 10-20%. Cold traffic converts lower. Right now, the goal is to get the scorecard in front of people who already have context on who you are.
            </p>
            {pagesPerVisit && (
              <p>
                <span className="text-[#141821] font-medium">Pages per visit: {pagesPerVisit}.</span>{' '}
                {parseFloat(pagesPerVisit) >= 2
                  ? 'Visitors are exploring beyond the first page - the site is holding attention.'
                  : 'Most visitors are only viewing one page. This is normal at early traffic volumes and from direct scorecard links, but worth watching as traffic grows.'}
              </p>
            )}
            <p>
              <span className="text-[#141821] font-medium">Bounce rate</span> measures sessions where the visitor left without going to a second page. A high bounce rate on a scorecard-focused site isn&apos;t necessarily bad - if someone lands directly on /scorecard and completes it, that counts as a bounce even though it was a conversion. Context matters more than the raw number.
            </p>
          </Insight>

          {/* Daily chart */}
          <DailyChart data={data.daily} />

          {/* Chart insight */}
          <Insight title="How to read the traffic pattern">
            <p>
              Each bar is one day of page views. Today is highlighted in teal. Hover any bar to see exact views and unique visitors for that day.
            </p>
            <p>
              <span className="text-[#141821] font-medium">What to look for:</span> spikes that line up with posts or DMs you sent that day. If a post goes out on Monday and traffic jumps Tuesday, that&apos;s the post working. If traffic is flat across the week with no spikes, content is either not reaching people or not compelling them to click through.
            </p>
            <p>
              <span className="text-[#141821] font-medium">What needs to keep happening:</span> daily Instagram activity - posts, stories, and direct outreach - is what drives consistent traffic. The chart should start showing a rhythm that maps to your posting schedule. Weeks without posts will show up as flatlines.
            </p>
            {isSparse && (
              <p className="text-amber-700/70">The chart currently only has a few days of data. It will fill out over the coming weeks and become much more useful as a pattern-recognition tool once there are 14+ days of activity to compare.</p>
            )}
          </Insight>
        </>
      )}

      {/* Pages */}
      <div className="bg-[#FFFFFF] border border-[#E8EAEE] rounded-xl p-5">
        <p className="text-[12.5px] font-medium text-[#666D7A] mb-2">Live Pages</p>
        <p className="text-sm text-[#666D7A] mb-4">All six pages are live. The scorecard is the primary conversion point - every other page should funnel toward it. The Founder Program page is the current active offer.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {[
            { label: 'Homepage', path: '/', note: 'Top of funnel - positions the approach, drives to scorecard' },
            { label: 'How It Works', path: '/how-it-works', note: 'Explains the Body Recode method and the two-layer system' },
            { label: 'Online Coaching', path: '/online', note: 'Service page for online clients - links to scorecard' },
            { label: 'Brisbane', path: '/brisbane', note: 'Geo-targeted page for face-to-face clients' },
            { label: 'Readiness Scorecard', path: '/scorecard', note: 'Primary conversion point - lead capture via quiz' },
            { label: 'Founder Program', path: '/founder', note: 'Active offer page - current primary CTA destination' },
          ].map(p => (
            <a
              key={p.path}
              href={`${brand().performanceDomain}${p.path}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between px-3 py-3 bg-[#F4F6F9] hover:bg-[#EFF1F4] border border-[#E8EAEE] rounded-lg transition-colors group"
            >
              <div>
                <span className="text-sm text-[#141821] group-hover:text-[#141821] transition-colors block">{p.label}</span>
                <span className="text-[12.5px] text-[#98A0AD] mt-0.5 block">{p.note}</span>
              </div>
              <span className="text-[12.5px] text-[#98A0AD] group-hover:text-[#666D7A] transition-colors shrink-0 ml-3 mt-0.5">{p.path} ↗</span>
            </a>
          ))}
        </div>
      </div>

      {/* What needs to happen */}
      <Insight title="What needs to keep happening">
        <p>
          <span className="text-[#141821] font-medium">Content drives traffic.</span> The website does not rank organically yet and there are no paid ads running. Every visitor right now is coming from Instagram - either from posts, stories, or direct links you send in DMs. The number one lever is posting consistently and directing people to the scorecard.
        </p>
        <p>
          <span className="text-[#141821] font-medium">The scorecard is the only metric that matters right now.</span> Visitors are a means to an end. A visitor who doesn&apos;t submit the scorecard doesn&apos;t enter the system. Focus content and outreach on getting people to /scorecard - that is where traffic becomes pipeline.
        </p>
        <p>
          <span className="text-[#141821] font-medium">As traffic grows, watch the chart for content-traffic correlation.</span> Once there are 30+ days of data, patterns will become clear. Posts that spike traffic are your highest-performing content - double down on those formats and topics. Posts with no visible traffic effect need to be reconsidered.
        </p>
        <p>
          <span className="text-[#141821] font-medium">SEO is a longer-term play.</span> The site copy is strong and structured well. Over 3-6 months, search visibility for relevant terms (online fitness coaching Brisbane, body composition coaching, etc.) will build. This will layer organic traffic on top of the social-driven traffic you are building now.
        </p>
      </Insight>

    </div>
  )
}
