'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { LifeBuoy, X } from 'lucide-react'
import { CATEGORIES, CATEGORY_LABELS, STATUS_LABELS, statusAccent, categoryAccent, type SupportCategory, type SupportStatus } from '@/lib/support-tickets'
import { LAUNCHER_BUTTON, launcherStyle, LAUNCHER_PANEL_SHADOW } from '@/components/launcher-style'

/**
 * Coach-facing Support launcher. Mounted globally in the dashboard layout.
 * Bottom-LEFT so it does not collide with the co-pilot bubble bottom-right.
 * Two tabs: Report an issue (default) + My tickets. Auto-captures the current
 * pathname as ticket context so Kade sees where the coach was when they filed.
 */

const MONO = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"
const SIGNAL = '#1B6DFC'
const AMBER = '#B7791F'
const RED = '#DC2626'
const SAGE = '#7A8A6B'

type Ticket = {
  id: string
  category: SupportCategory
  subject: string
  status: SupportStatus
  status_note: string | null
  page_url: string | null
  created_at: string
  updated_at: string
  resolved_at: string | null
}

const HIDE_ON = [
  /^\/dashboard\/support(?:\/|$)/,
]

function accentToHex(a: 'red' | 'amber' | 'blue' | 'sage' | 'neutral'): string {
  if (a === 'red') return RED
  if (a === 'amber') return AMBER
  if (a === 'blue') return SIGNAL
  if (a === 'sage') return SAGE
  return '#666D7A'
}

export default function SupportLauncher() {
  const pathname = usePathname() ?? ''
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'report' | 'mine'>('report')

  if (HIDE_ON.some(r => r.test(pathname))) return null

  return (
    <>
      {open && (
        <div
          className="fixed bottom-[76px] left-5 z-[100] w-[400px] max-w-[calc(100vw-2.5rem)] h-[560px] max-h-[calc(100vh-8rem)] rounded-xl print:hidden"
          style={{ boxShadow: LAUNCHER_PANEL_SHADOW }}
          role="dialog"
          aria-label="Support"
        >
          <div className="border border-[#E8EAEE] bg-[#FFFFFF] rounded-xl overflow-hidden flex flex-col h-full">
            <div className="flex items-center gap-3 px-5 py-3 border-b border-[#E8EAEE] bg-[linear-gradient(180deg,#FFFFFF,#FBFCFD)] shrink-0">
              <p className="text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em]">Support</p>
              <span className="ml-auto text-[11.5px] text-[#98A0AD]">Kade sees every ticket</span>
              <button onClick={() => setOpen(false)} aria-label="Close support" className="text-[#98A0AD] hover:text-[#141821] -my-1">
                <X size={16} />
              </button>
            </div>

            <div className="flex border-b border-[#EDEDED] bg-white shrink-0">
              <TabBtn active={tab === 'report'} onClick={() => setTab('report')}>Report</TabBtn>
              <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')}>My tickets</TabBtn>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto">
              {tab === 'report' ? <ReportForm pathname={pathname} onSubmitted={() => setTab('mine')} /> : <MyTicketsList visible={tab === 'mine'} />}
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close Support' : 'Open Support'}
        title="Support - report an issue or ask for help"
        className={`${LAUNCHER_BUTTON} bottom-5 left-5`}
        style={launcherStyle(open)}
      >
        {open ? <X size={20} /> : <LifeBuoy size={21} />}
      </button>
    </>
  )
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-[13px] py-2.5 border-b-2 -mb-px transition-colors"
      style={{
        fontWeight: active ? 500 : 400,
        color: active ? SIGNAL : '#666D7A',
        borderColor: active ? SIGNAL : 'transparent',
      }}
    >
      {children}
    </button>
  )
}

function ReportForm({ pathname, onSubmitted }: { pathname: string; onSubmitted: () => void }) {
  const [category, setCategory] = useState<SupportCategory>('question')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject: subject.trim(),
          body: body.trim(),
          page_url: pathname || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Something went wrong')
      setDone(true)
      setSubject('')
      setBody('')
      setCategory('question')
      setTimeout(() => { setDone(false); onSubmitted() }, 1600)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="p-6 flex flex-col items-center text-center gap-3">
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(122,138,107,0.15)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M5 12l4 4 10-10" stroke={SAGE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="text-[14px] font-semibold text-[#141821]">Ticket filed.</p>
        <p className="text-[12.5px] text-[#666D7A] leading-relaxed">Kade sees it now. You will get an email when the status changes.</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="p-5 space-y-4">
      <div>
        <label className="block text-[12.5px] text-[#666D7A] mb-2">What kind of thing?</label>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORIES.map(c => {
            const active = c === category
            const hex = accentToHex(categoryAccent(c))
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className="text-left text-[12.5px] rounded-lg px-3 py-2 border transition-colors"
                style={{
                  borderColor: active ? hex : '#E8EAEE',
                  background: active ? `${hex}12` : '#FFFFFF',
                  color: active ? '#141821' : '#4A4A4A',
                }}
              >
                <span className="block font-semibold">{CATEGORY_LABELS[c]}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label htmlFor="support-subject" className="block text-[12.5px] text-[#666D7A] mb-2">Subject</label>
        <input
          id="support-subject"
          type="text"
          value={subject}
          onChange={e => setSubject(e.target.value)}
          maxLength={120}
          required
          placeholder="One-line summary"
          className="w-full text-[13.5px] border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
        />
      </div>

      <div>
        <label htmlFor="support-body" className="block text-[12.5px] text-[#666D7A] mb-2">Detail</label>
        <textarea
          id="support-body"
          value={body}
          onChange={e => setBody(e.target.value)}
          maxLength={4000}
          required
          rows={5}
          placeholder="What happened, what you expected, what you were doing…"
          className="w-full text-[13.5px] resize-none border border-[#E8EAEE] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1B6DFC]"
        />
      </div>

      <div className="text-[11px] text-[#98A0AD]" style={{ fontFamily: MONO }}>
        We include the page you are on ({pathname || 'unknown'}) automatically.
      </div>

      {error && <div className="text-[12.5px] text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={submitting || subject.trim().length < 3 || body.trim().length < 4}
        className="w-full text-[13px] font-semibold px-4 py-2.5 bg-[#1B6DFC] text-white rounded-lg hover:bg-[#1558d6] transition-colors disabled:opacity-40"
      >
        {submitting ? 'Sending…' : 'File ticket'}
      </button>
    </form>
  )
}

function MyTicketsList({ visible }: { visible: boolean }) {
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!visible) return
    let cancelled = false
    setTickets(null)
    setError('')
    fetch('/api/support/tickets')
      .then(r => r.json().then(d => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (cancelled) return
        if (!ok) throw new Error(d.error || 'Failed to load')
        setTickets(d.tickets ?? [])
      })
      .catch(e => { if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load') })
    return () => { cancelled = true }
  }, [visible])

  if (error) return <div className="p-5 text-[12.5px] text-red-600">{error}</div>
  if (tickets === null) return <div className="p-5 text-[12.5px] text-[#98A0AD]">Loading…</div>
  if (tickets.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-[13px] text-[#666D7A]">No tickets yet.</p>
        <p className="text-[12px] text-[#98A0AD] mt-1">The ones you file will show here.</p>
      </div>
    )
  }

  return (
    <div className="p-3 space-y-2">
      {tickets.map(t => {
        const stHex = accentToHex(statusAccent(t.status))
        return (
          <div key={t.id} className="border border-[#E8EAEE] rounded-xl px-3.5 py-2.5">
            <div className="flex items-start gap-2 mb-1">
              <p className="text-[13px] font-semibold text-[#141821] flex-1 min-w-0 truncate">{t.subject}</p>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{ fontFamily: MONO, letterSpacing: '0.08em', color: stHex, background: `${stHex}14`, border: `1px solid ${stHex}44` }}
              >
                {STATUS_LABELS[t.status]}
              </span>
            </div>
            <p className="text-[11.5px] text-[#98A0AD]" style={{ fontFamily: MONO }}>
              {CATEGORY_LABELS[t.category]} · {formatDate(t.created_at)}
            </p>
            {t.status_note && (
              <p className="text-[12.5px] text-[#4A4A4A] mt-2 whitespace-pre-wrap leading-relaxed border-t border-[#EDEDED] pt-2">
                <span className="font-semibold text-[#141821]">Kade:</span> {t.status_note}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  if (sameDay) return `Today ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' })
}
