'use client'

import { useState } from 'react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

type ButtonTone = 'neutral' | 'caution'

function ActionButton({
  label,
  loadingLabel,
  doneLabel,
  state,
  tone,
  onClick,
  ariaLabel,
}: {
  label: string
  loadingLabel: string
  doneLabel: string
  state: 'idle' | 'sending' | 'sent' | 'done' | 'error'
  tone: ButtonTone
  onClick: () => void
  ariaLabel?: string
}) {
  const display =
    state === 'sending' ? loadingLabel
    : state === 'sent' || state === 'done' ? doneLabel
    : state === 'error' ? 'Failed'
    : label

  const base = 'text-[12px] font-semibold px-3.5 py-2 rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap'
  const palette =
    tone === 'caution'
      ? 'border border-[#F0DCB4] text-[#B7791F] bg-[#FEF6E7] hover:border-[#D9B976] hover:text-[#8A5A14]'
      : 'border border-[#E8EAEE] text-[#43474F] bg-[#FFFFFF] hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC]'

  return (
    <button
      onClick={onClick}
      disabled={state !== 'idle'}
      aria-label={ariaLabel}
      className={`${base} ${palette}`}
    >
      {display}
    </button>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2 p-4 rounded-xl border border-[#E8EAEE] bg-[#FFFFFF]">
      <span
        className="text-[10px] text-[#666D7A]"
      >
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  )
}

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
    <div className="grid md:grid-cols-2 gap-3">
      <FieldRow label="Test report email">
        <select
          value={reportBodyState}
          onChange={e => setReportBodyState(e.target.value)}
          className="text-[12px] bg-[#FFFFFF] border border-[#E8EAEE] text-[#43474F] rounded-lg px-2.5 py-2 focus:outline-none focus:border-[#1B6DFC]"
        >
          <option>Depleted State</option>
          <option>Transitioning State</option>
          <option>Ready State</option>
        </select>
        <ActionButton
          label="Send to my inbox"
          loadingLabel="Sending..."
          doneLabel="Sent"
          state={reportEmailStatus}
          tone="neutral"
          onClick={sendTestReportEmail}
        />
      </FieldRow>

      <FieldRow label="Preview email">
        <ActionButton
          label="Send preview"
          loadingLabel="Sending..."
          doneLabel="Sent"
          state={previewStatus}
          tone="neutral"
          onClick={sendPreview}
        />
      </FieldRow>

      <FieldRow label="Resend reports to all leads">
        {blastResult && (
          <span className="text-[11px] text-[#1B6DFC]" style={{ fontFamily: MONO_FONT }}>
            {blastResult.sent} sent · {blastResult.failed} failed
          </span>
        )}
        <ActionButton
          label="Resend to all"
          loadingLabel="Sending..."
          doneLabel="Done"
          state={blastStatus}
          tone="caution"
          onClick={sendBlast}
        />
      </FieldRow>

      <FieldRow label="Retrigger scorecard for missed leads">
        {retriggerResult && (
          <span className="text-[11px] text-[#1B6DFC]" style={{ fontFamily: MONO_FONT }}>
            {retriggerResult.triggered} sent · {retriggerResult.skipped} skipped · {retriggerResult.failed} failed
          </span>
        )}
        <ActionButton
          label="Send to missed"
          loadingLabel="Sending..."
          doneLabel="Done"
          state={retriggerStatus}
          tone="caution"
          onClick={retriggerScorecard}
        />
      </FieldRow>
    </div>
  )
}
