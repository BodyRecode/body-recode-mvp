'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeedbackRow {
  id: string
  created_at: string
  stage: string
  moment: string
  accuracy_score: number | null
  nps_score: number | null
  response_text: string | null
  first_name: string | null
  last_initial: string | null
  permission_status: string
  permission_token: string | null
  publish_as: string | null
  coach_seen_at: string | null
  coach_notes: string | null
  testimonial_published_at: string | null
  testimonial_published_in: string | null
  sentiment: string | null
  churn_risk: boolean
  source: string | null
}

type Filter = 'all' | 'unseen' | 'awaiting_consent' | 'granted_unpublished' | 'churn_risk' | 'published'

const STAGE_LABELS: Record<string, string> = {
  scorecard: 'Scorecard',
  challenge: 'Challenge',
  blueprint: 'Blueprint',
  membership: 'Membership',
  coaching: '1:1 Coaching',
  churn: 'Churn',
}

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string; label: string }> = {
  pending: { bg: '#FEF3C7', color: '#92400E', border: '#FBBF24', label: 'Pending' },
  requested: { bg: '#DBEAFE', color: '#1E40AF', border: '#60A5FA', label: 'Consent requested' },
  granted: { bg: '#D1FAE5', color: '#065F46', border: '#34D399', label: 'Granted' },
  denied: { bg: '#FEE2E2', color: '#991B1B', border: '#FCA5A5', label: 'Denied' },
  withdrawn: { bg: '#E5E7EB', color: '#374151', border: '#9CA3AF', label: 'Withdrawn' },
}

export default function FeedbackDashboardPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('unseen')
  const [stageFilter, setStageFilter] = useState<string>('all')
  const supabase = createClient()

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('feedback_responses')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
    setRows((data ?? []) as FeedbackRow[])
    setLoading(false)
  }

  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(() => {
    return rows.filter(r => {
      if (stageFilter !== 'all' && r.stage !== stageFilter) return false
      if (filter === 'unseen' && r.coach_seen_at) return false
      if (filter === 'awaiting_consent' && r.permission_status !== 'pending' && r.permission_status !== 'requested') return false
      if (filter === 'granted_unpublished' && (r.permission_status !== 'granted' || r.testimonial_published_at)) return false
      if (filter === 'churn_risk' && !r.churn_risk) return false
      if (filter === 'published' && !r.testimonial_published_at) return false
      return true
    })
  }, [rows, filter, stageFilter])

  const counts = useMemo(() => ({
    total: rows.length,
    unseen: rows.filter(r => !r.coach_seen_at).length,
    awaiting_consent: rows.filter(r => r.permission_status === 'pending' || r.permission_status === 'requested').length,
    granted_unpublished: rows.filter(r => r.permission_status === 'granted' && !r.testimonial_published_at).length,
    churn_risk: rows.filter(r => r.churn_risk).length,
    published: rows.filter(r => r.testimonial_published_at).length,
  }), [rows])

  async function markSeen(id: string) {
    await supabase.from('feedback_responses').update({ coach_seen_at: new Date().toISOString() }).eq('id', id)
    await load()
  }
  async function markPublished(id: string, where: string) {
    await supabase.from('feedback_responses').update({ testimonial_published_at: new Date().toISOString(), testimonial_published_in: where }).eq('id', id)
    await load()
  }
  async function flipChurnRisk(id: string, current: boolean) {
    await supabase.from('feedback_responses').update({ churn_risk: !current }).eq('id', id)
    await load()
  }
  async function setSentiment(id: string, sentiment: 'positive' | 'neutral' | 'negative') {
    await supabase.from('feedback_responses').update({ sentiment }).eq('id', id)
    await load()
  }
  async function sendConsent(id: string) {
    if (!confirm('Fire the consent email to this person?')) return
    const r = await fetch(`/api/feedback/${id}/send-consent`, { method: 'POST' })
    if (!r.ok) {
      const d = await r.json().catch(() => ({}))
      alert(`Failed: ${d.error ?? d.message ?? 'unknown'}`)
      return
    }
    await load()
  }

  return (
    <div className="min-h-screen bg-stone-50 text-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-1">Coach</p>
          <h1 className="text-2xl font-bold tracking-tight">Feedback triage</h1>
          <p className="text-sm text-stone-600 mt-1">All captured feedback across stages. Triage incoming, manage permission-to-publish, tag churn risk, mark testimonials as published.</p>
        </div>

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ['unseen', `Unseen (${counts.unseen})`],
            ['awaiting_consent', `Awaiting consent (${counts.awaiting_consent})`],
            ['granted_unpublished', `Granted, unpublished (${counts.granted_unpublished})`],
            ['churn_risk', `Churn risk (${counts.churn_risk})`],
            ['published', `Published (${counts.published})`],
            ['all', `All (${counts.total})`],
          ] as [Filter, string][]).map(([f, label]) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${filter === f ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-stone-700 border-stone-300 hover:border-blue-400'}`}>{label}</button>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="text-xs bg-white border border-stone-300 rounded px-2 py-1.5 font-medium">
            <option value="all">All stages</option>
            {Object.entries(STAGE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={load} className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded font-medium">↻ Refresh</button>
        </div>

        {loading && <p className="text-sm text-stone-500">Loading...</p>}

        {!loading && filtered.length === 0 && (
          <div className="bg-white border border-stone-200 rounded-xl p-12 text-center">
            <p className="text-stone-500">No feedback matches this filter.</p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map(r => {
            const statusStyle = STATUS_STYLES[r.permission_status] ?? STATUS_STYLES.pending
            const isUnseen = !r.coach_seen_at
            return (
              <div key={r.id} className={`bg-white border rounded-xl p-5 ${isUnseen ? 'border-blue-300 shadow-sm' : 'border-stone-200'}`}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">{STAGE_LABELS[r.stage] ?? r.stage}</span>
                    <span className="text-xs text-stone-600">·</span>
                    <span className="text-xs text-stone-700 font-medium">{r.moment}</span>
                    <span className="text-xs text-stone-400">·</span>
                    <span className="text-xs text-stone-500">{new Date(r.created_at).toLocaleString('en-AU')}</span>
                    {r.first_name && <span className="text-xs text-stone-600">· {r.first_name}{r.last_initial ? ` ${r.last_initial}.` : ''}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border" style={{ background: statusStyle.bg, color: statusStyle.color, borderColor: statusStyle.border }}>{statusStyle.label}</span>
                    {r.churn_risk && <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-red-50 text-red-700 border-red-300">⚠ Churn risk</span>}
                    {r.testimonial_published_at && <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-green-50 text-green-700 border-green-300">✓ Published</span>}
                  </div>
                </div>

                {(r.nps_score !== null || r.accuracy_score !== null) && (
                  <div className="flex items-center gap-3 mb-3">
                    {r.nps_score !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">NPS</span>
                        <span className={`text-base font-bold ${r.nps_score >= 9 ? 'text-green-700' : r.nps_score >= 7 ? 'text-amber-700' : 'text-red-700'}`}>{r.nps_score}/10</span>
                      </div>
                    )}
                    {r.accuracy_score !== null && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-stone-500 font-medium">Accuracy</span>
                        <span className="text-base font-bold text-stone-700">{r.accuracy_score}/5</span>
                      </div>
                    )}
                  </div>
                )}

                {r.response_text && (
                  <blockquote className="border-l-2 border-blue-300 bg-blue-50/50 px-4 py-3 my-3 rounded text-sm text-stone-800 italic leading-relaxed">
                    &ldquo;{r.response_text}&rdquo;
                  </blockquote>
                )}

                <div className="flex flex-wrap gap-2 mt-3">
                  {isUnseen && (
                    <button onClick={() => markSeen(r.id)} className="text-xs bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded font-medium">✓ Mark seen</button>
                  )}
                  {r.permission_status === 'pending' && r.response_text && (
                    <button onClick={() => sendConsent(r.id)} className="text-xs bg-stone-200 hover:bg-stone-300 text-stone-700 px-3 py-1.5 rounded font-medium">📧 Send consent email</button>
                  )}
                  {r.permission_status === 'granted' && !r.testimonial_published_at && (
                    <button onClick={() => {
                      const where = prompt('Where published? e.g. site_homepage, IG_story_2026-07-20, blueprint_lp')
                      if (where) markPublished(r.id, where)
                    }} className="text-xs bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded font-medium">📌 Mark published</button>
                  )}
                  <button onClick={() => flipChurnRisk(r.id, r.churn_risk)} className={`text-xs px-3 py-1.5 rounded font-medium ${r.churn_risk ? 'bg-red-100 text-red-700 border border-red-300' : 'bg-stone-100 hover:bg-red-50 text-stone-600 border border-stone-300'}`}>⚠ {r.churn_risk ? 'Clear churn risk' : 'Flag churn risk'}</button>
                  <div className="flex gap-1">
                    {(['positive', 'neutral', 'negative'] as const).map(s => (
                      <button key={s} onClick={() => setSentiment(r.id, s)} className={`text-xs px-2 py-1.5 rounded font-medium ${r.sentiment === s ? (s === 'positive' ? 'bg-green-500 text-white' : s === 'negative' ? 'bg-red-500 text-white' : 'bg-stone-500 text-white') : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                        {s === 'positive' ? '😊' : s === 'negative' ? '😟' : '😐'}
                      </button>
                    ))}
                  </div>
                </div>

                {r.source && <p className="text-xs text-stone-400 mt-3">source: {r.source}</p>}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
