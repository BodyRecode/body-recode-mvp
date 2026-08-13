import { createClient } from '@/lib/supabase/server'
import { BarChart2, TrendingUp, Users, Calendar, DollarSign, CheckCircle2 } from 'lucide-react'

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: leads },
    { data: clients },
    { data: payments },
    { data: bookings },
  ] = await Promise.all([
    supabase.from('leads').select('id, status, source, created_at'),
    supabase.from('clients').select('id, created_at'),
    supabase.from('be_payments').select('id, amount, status, created_at'),
    supabase.from('be_bookings').select('id, type, status, scheduled_at'),
  ])

  // Revenue
  const totalRevenue = payments?.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0) || 0
  const revenueThisMonth = payments
    ?.filter(p => p.status === 'paid' && p.created_at >= thirtyDaysAgo)
    .reduce((s, p) => s + (p.amount || 0), 0) || 0

  // Leads
  const totalLeads = leads?.length || 0
  const leadsThisWeek = leads?.filter(l => l.created_at >= sevenDaysAgo).length || 0
  const activeLeads = leads?.filter(l =>
    !['closed_declined', 'closed_no_show', 'commencement_fee_paid', 'active_coaching'].includes(l.status)
  ).length || 0

  // Conversions
  const converted = leads?.filter(l =>
    ['commencement_fee_paid', 'active_coaching'].includes(l.status)
  ).length || 0
  const conversionRate = totalLeads > 0 ? Math.round((converted / totalLeads) * 100) : 0

  // Bookings
  const totalBookings = bookings?.length || 0
  const completedBookings = bookings?.filter(b => b.status === 'completed').length || 0
  const noShows = bookings?.filter(b => b.status === 'no_show').length || 0
  const showUpRate = (completedBookings + noShows) > 0
    ? Math.round((completedBookings / (completedBookings + noShows)) * 100)
    : 0

  // Pipeline breakdown
  const stageOrder = [
    { key: 'new_check_in', label: 'New Lead' },
    { key: 'report_sent', label: 'Report Sent' },
    { key: 'zoom_1_booked', label: 'Zoom Booked' },
    { key: 'zoom_1_completed', label: 'Zoom Done' },
    { key: 'commencement_fee_paid', label: 'Fee Paid' },
    { key: 'active_coaching', label: 'Active Client' },
  ]

  const maxStageCount = Math.max(
    ...stageOrder.map(s => leads?.filter(l => l.status === s.key).length || 0),
    1
  )

  // Source breakdown
  const sourceMap: Record<string, number> = {}
  leads?.forEach(l => {
    const src = l.source || 'direct'
    sourceMap[src] = (sourceMap[src] || 0) + 1
  })
  const topSources = Object.entries(sourceMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Analytics</h1>
        <p className="text-stone-600 text-sm">Live view of your business performance</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">${totalRevenue.toLocaleString('en-AU')}</p>
          <p className="text-xs text-stone-500 mt-1">${revenueThisMonth.toLocaleString('en-AU')} this month</p>
        </div>

        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Total Leads</p>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{totalLeads}</p>
          <p className="text-xs text-stone-500 mt-1">{leadsThisWeek} this week · {activeLeads} active</p>
        </div>

        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Conversion</p>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{conversionRate}%</p>
          <p className="text-xs text-stone-500 mt-1">{converted} of {totalLeads} converted</p>
        </div>

        <div className="bg-stone-100 border border-stone-200 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 size={14} className="text-blue-500" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Show-up Rate</p>
          </div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{showUpRate}%</p>
          <p className="text-xs text-stone-500 mt-1">{completedBookings} completed · {noShows} no show</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Pipeline funnel */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart2 size={14} className="text-stone-600" />
            <h2 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Pipeline Breakdown</h2>
          </div>
          <div className="space-y-3">
            {stageOrder.map(({ key, label }) => {
              const count = leads?.filter(l => l.status === key).length || 0
              const pct = Math.round((count / maxStageCount) * 100)
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-stone-600">{label}</p>
                    <p className="text-xs font-semibold text-[#1A1A1A]">{count}</p>
                  </div>
                  <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Lead sources */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <TrendingUp size={14} className="text-stone-600" />
            <h2 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Lead Sources</h2>
          </div>
          {topSources.length > 0 ? (
            <div className="space-y-3">
              {topSources.map(([source, count]) => {
                const pct = Math.round((count / totalLeads) * 100)
                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-stone-600 capitalize">{source.replace(/_/g, ' ')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-stone-500">{pct}%</p>
                        <p className="text-xs font-semibold text-[#1A1A1A]">{count}</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-violet-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-stone-500 text-sm">No lead data yet</p>
          )}
        </div>
      </div>

      {/* Bookings summary */}
      <div className="bg-stone-100 border border-stone-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={14} className="text-stone-600" />
          <h2 className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Bookings</h2>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Total', value: totalBookings, colour: 'text-[#1A1A1A]' },
            { label: 'Completed', value: completedBookings, colour: 'text-blue-500' },
            { label: 'No Show', value: noShows, colour: 'text-red-700' },
            { label: 'Show-up Rate', value: `${showUpRate}%`, colour: 'text-[#1A1A1A]' },
          ].map(({ label, value, colour }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${colour}`}>{value}</p>
              <p className="text-xs text-stone-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
