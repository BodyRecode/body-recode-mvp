'use client'

import { useMemo, useState } from 'react'
import { Download, Users, Calendar, Mail, MapPin } from 'lucide-react'

type Product = 'challenge' | 'blueprint' | 'membership'

type WaitlistRow = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  gender: string | null
  body_state: string | null
  product: Product
  source: string | null
  notified_at: string | null
  created_at: string
}

const PRODUCT_META: Record<Product, { label: string; accent: string; bg: string }> = {
  challenge: { label: '14-Day Body Decode Challenge', accent: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
  blueprint: { label: '6-Week Body Rewire Blueprint', accent: '#f59e0b', bg: 'rgba(245,158,11,0.06)' },
  membership: { label: 'Body Recode Membership', accent: '#1B6DFC', bg: 'rgba(27,109,252,0.06)' },
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function toCsv(rows: WaitlistRow[]): string {
  const header = ['email', 'first_name', 'last_name', 'phone', 'gender', 'body_state', 'product', 'source', 'created_at', 'notified_at']
  const escape = (v: string | null | undefined) => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [header.join(',')]
  for (const r of rows) {
    lines.push([
      escape(r.email),
      escape(r.first_name),
      escape(r.last_name),
      escape(r.phone),
      escape(r.gender),
      escape(r.body_state),
      escape(r.product),
      escape(r.source),
      escape(r.created_at),
      escape(r.notified_at),
    ].join(','))
  }
  return lines.join('\n')
}

function downloadCsv(rows: WaitlistRow[], filename: string) {
  const csv = toCsv(rows)
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function WaitlistView({ rows }: { rows: WaitlistRow[] }) {
  const [activeTab, setActiveTab] = useState<Product | 'all'>('all')

  const grouped = useMemo(() => ({
    all: rows,
    challenge: rows.filter(r => r.product === 'challenge'),
    blueprint: rows.filter(r => r.product === 'blueprint'),
    membership: rows.filter(r => r.product === 'membership'),
  }), [rows])

  const tabs: Array<{ key: Product | 'all'; label: string; count: number; accent: string }> = [
    { key: 'all',        label: 'All',        count: grouped.all.length,        accent: '#1A1A1A' },
    { key: 'challenge',  label: 'Challenge',  count: grouped.challenge.length,  accent: PRODUCT_META.challenge.accent },
    { key: 'blueprint',  label: 'Blueprint',  count: grouped.blueprint.length,  accent: PRODUCT_META.blueprint.accent },
    { key: 'membership', label: 'Membership', count: grouped.membership.length, accent: PRODUCT_META.membership.accent },
  ]

  const visible = grouped[activeTab]
  const today = new Date().toISOString().slice(0, 10)
  const csvName = `product-waitlist-${activeTab}-${today}.csv`

  return (
    <div className="mt-6 space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`text-left rounded-xl border p-4 transition ${
              activeTab === t.key
                ? 'border-stone-900 bg-white shadow-sm'
                : 'border-stone-200 bg-white hover:border-stone-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: t.accent }}
              >
                {t.label}
              </span>
              <Users className="w-3.5 h-3.5 text-stone-400" />
            </div>
            <p className="text-2xl font-black text-stone-900 leading-none">
              {t.count}
            </p>
            <p className="text-xs text-stone-500 mt-1">
              {t.count === 1 ? '1 signup' : `${t.count} signups`}
            </p>
          </button>
        ))}
      </div>

      {/* Active tab header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-stone-900">
            {activeTab === 'all'
              ? 'All product waitlist signups'
              : `${PRODUCT_META[activeTab].label} waitlist`}
          </h2>
          <p className="text-sm text-stone-500 mt-1">
            {visible.length === 0
              ? 'No signups yet.'
              : `${visible.length} ${visible.length === 1 ? 'lead' : 'leads'} waiting for launch. Sorted newest first.`}
          </p>
        </div>
        {visible.length > 0 && (
          <button
            onClick={() => downloadCsv(visible, csvName)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-stone-300 bg-white text-sm font-semibold text-stone-700 hover:border-stone-400 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Table */}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-stone-200 bg-stone-50 p-8 text-center">
          <Users className="w-6 h-6 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-700">No signups in this segment yet</p>
          <p className="text-xs text-stone-500 mt-1">
            Rows appear here as soon as leads click &quot;Join the waitlist&quot; on the scorecard result page.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 border-b border-stone-200">
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Email</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Name</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Phone</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Sex</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Body state</th>
                {activeTab === 'all' && (
                  <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Product</th>
                )}
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Source</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-widest text-stone-500 px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r, i) => {
                const meta = PRODUCT_META[r.product]
                return (
                  <tr key={r.id} className={i % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                    <td className="px-4 py-3 text-stone-900 font-medium">
                      <div className="flex items-center gap-2">
                        <Mail className="w-3 h-3 text-stone-400 flex-shrink-0" />
                        <span>{r.email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{[r.first_name, r.last_name].filter(Boolean).join(' ') || '-'}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">{r.phone ?? '-'}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs capitalize">{r.gender ? r.gender.replace(/_/g, ' ') : '-'}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {r.body_state ? (
                        <div className="inline-flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          {r.body_state}
                        </div>
                      ) : '-'}
                    </td>
                    {activeTab === 'all' && (
                      <td className="px-4 py-3">
                        <span
                          className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded"
                          style={{ color: meta.accent, background: meta.bg }}
                        >
                          {r.product}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-3 text-stone-600 text-xs">{r.source ?? '-'}</td>
                    <td className="px-4 py-3 text-stone-600 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {fmtDate(r.created_at)}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
