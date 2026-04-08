'use client'

import { useState } from 'react'

export default function AdminButtons() {
  const [previewStatus, setPreviewStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [reportEmailStatus, setReportEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [reportBodyState, setReportBodyState] = useState('Depleted State')
  const [blastStatus, setBlastStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [blastResult, setBlastResult] = useState<{ sent: number; failed: number } | null>(null)
  const [retriggerStatus, setRetriggerStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [retriggerResult, setRetriggerResult] = useState<{ triggered: number; failed: number; skipped: number } | null>(null)

  const sendPreview = async () => {
    setPreviewStatus('sending')
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report-preview' }),
      })
      setPreviewStatus(res.ok ? 'sent' : 'error')
    } catch {
      setPreviewStatus('error')
    }
    setTimeout(() => setPreviewStatus('idle'), 4000)
  }

  const sendTestReportEmail = async () => {
    setReportEmailStatus('sending')
    try {
      const res = await fetch('/api/admin/test-report-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_ADMIN_SECRET, body_state: reportBodyState }),
      })
      setReportEmailStatus(res.ok ? 'sent' : 'error')
    } catch {
      setReportEmailStatus('error')
    }
    setTimeout(() => setReportEmailStatus('idle'), 4000)
  }

  const sendBlast = async () => {
    if (!confirm('This will send the performance report to ALL leads in the system. Are you sure?')) return
    setBlastStatus('sending')
    try {
      const res = await fetch('/api/admin/resend-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: process.env.NEXT_PUBLIC_ADMIN_SECRET }),
      })
      const data = await res.json()
      setBlastResult(data)
      setBlastStatus(res.ok ? 'done' : 'error')
    } catch {
      setBlastStatus('error')
    }
  }

  const retriggerScorecard = async () => {
    if (!confirm('This will send the scorecard follow-up emails to any leads who completed the scorecard but never received the automation. Are you sure?')) return
    setRetriggerStatus('sending')
    try {
      const res = await fetch('/api/admin/retrigger-scorecard', { method: 'POST' })
      const data = await res.json()
      setRetriggerResult(data)
      setRetriggerStatus(res.ok ? 'done' : 'error')
    } catch {
      setRetriggerStatus('error')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <select
          value={reportBodyState}
          onChange={e => setReportBodyState(e.target.value)}
          className="text-sm bg-stone-800 border border-stone-700 text-stone-300 rounded-lg px-3 py-2 focus:outline-none focus:border-teal-500"
        >
          <option>Depleted State</option>
          <option>Transitioning State</option>
          <option>Ready State</option>
        </select>
        <button
          onClick={sendTestReportEmail}
          disabled={reportEmailStatus !== 'idle'}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition-colors disabled:opacity-50"
        >
          {reportEmailStatus === 'sending' ? 'Sending...' : reportEmailStatus === 'sent' ? 'Sent to your inbox' : reportEmailStatus === 'error' ? 'Failed' : 'Test report email'}
        </button>
      </div>
      <button
        onClick={sendPreview}
        disabled={previewStatus !== 'idle'}
        className="text-sm font-semibold px-4 py-2 rounded-lg border border-stone-700 text-stone-300 hover:border-stone-500 hover:text-white transition-colors disabled:opacity-50"
      >
        {previewStatus === 'sending' ? 'Sending...' : previewStatus === 'sent' ? 'Sent to your inbox' : previewStatus === 'error' ? 'Failed' : 'Send preview email'}
      </button>
      <div className="flex items-center gap-3">
        {blastResult && (
          <span className="text-xs text-teal-400">{blastResult.sent} sent, {blastResult.failed} failed</span>
        )}
        <button
          onClick={sendBlast}
          disabled={blastStatus !== 'idle'}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-amber-700/50 text-amber-400 hover:border-amber-600 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {blastStatus === 'sending' ? 'Sending...' : blastStatus === 'done' ? 'Done' : blastStatus === 'error' ? 'Failed' : 'Resend reports to all leads'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        {retriggerResult && (
          <span className="text-xs text-teal-400">{retriggerResult.triggered} triggered, {retriggerResult.skipped} already had it, {retriggerResult.failed} failed</span>
        )}
        <button
          onClick={retriggerScorecard}
          disabled={retriggerStatus !== 'idle'}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-amber-700/50 text-amber-400 hover:border-amber-600 hover:text-amber-300 transition-colors disabled:opacity-50"
        >
          {retriggerStatus === 'sending' ? 'Sending...' : retriggerStatus === 'done' ? 'Done' : retriggerStatus === 'error' ? 'Failed' : 'Send scorecard emails to missed leads'}
        </button>
      </div>
    </div>
  )
}
