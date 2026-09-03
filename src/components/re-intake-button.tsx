'use client'

import { useState } from 'react'
import SendEmailButton from './send-email-button'

// Mirror of NewIntakeButton but hits /api/new-reintake-invitation so the
// resulting invitation carries kind='reintake'. The Send Email button on
// the returned card uses the same /api/send-intake-email route, which
// looks up the invitation's kind and picks the right email copy variant
// (re-intake wording for reintake, first-time wording for foundational).

interface Props {
  clientId: string
  clientName: string
  clientEmail?: string
  /** Latest kind='reintake' invitation (created_at, completed_at, status) — surfaces a compact status line above the button so the coach can see at a glance whether a re-intake has been sent recently. */
  latestInvitation?: {
    created_at: string
    completed_at: string | null
    status: string
  } | null
  /** Latest client_communications row of kind='intake_invite' with meta.mode='reintake' — the actual email send timestamp. Preferred over invitation.created_at because the coach might create an invitation and only copy the link, never firing the email. */
  latestSentAt?: string | null
}

function formatWhen(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Australia/Brisbane' })
}

function StatusLine({
  latestInvitation,
  latestSentAt,
}: {
  latestInvitation: Props['latestInvitation']
  latestSentAt: Props['latestSentAt']
}) {
  if (!latestInvitation) return null
  const completed = latestInvitation.status === 'complete'
  if (completed && latestInvitation.completed_at) {
    return (
      <p className="text-[11px] font-medium text-[#177245] mb-2 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#22A05A]" />
        Re-intake completed {formatWhen(latestInvitation.completed_at)}
      </p>
    )
  }
  if (latestSentAt) {
    return (
      <p className="text-[11px] font-medium text-[#1B6DFC] mb-2 flex items-center gap-1.5">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#1B6DFC]" />
        Re-intake sent {formatWhen(latestSentAt)} · awaiting submission
      </p>
    )
  }
  return (
    <p className="text-[11px] font-medium text-[#A96A12] mb-2 flex items-center gap-1.5">
      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#B7791F]" />
      Re-intake link created {formatWhen(latestInvitation.created_at)} · not emailed yet
    </p>
  )
}

export default function ReintakeButton({ clientId, clientName, clientEmail, latestInvitation, latestSentAt }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [token, setToken] = useState('')
  const [copied, setCopied] = useState(false)

  async function createInvitation() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/new-reintake-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setToken(data.token)
      setStatus('ready')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed'
      setErrorMsg(msg)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 5000)
    }
  }

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}/intake/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (status === 'idle' || status === 'loading' || status === 'error') {
    return (
      <div className="inline-flex flex-col items-start">
        <StatusLine latestInvitation={latestInvitation} latestSentAt={latestSentAt} />
        <button
          onClick={createInvitation}
          disabled={status === 'loading'}
          className="text-sm px-4 py-2 border border-[#E8EAEE] text-[#43474F] rounded-lg hover:border-[#1B6DFC] hover:bg-[rgba(27,109,252,0.06)] transition-colors disabled:opacity-50"
          title={status === 'error' ? errorMsg : 'Send a fresh 230-question intake to an existing client for reassessment (block-end, life-context shift, etc). Uses the same form as New Intake but with re-intake email copy.'}
        >
          {status === 'loading' ? 'Creating…' : status === 'error' ? `Error: ${errorMsg}` : 'Re-intake'}
        </button>
      </div>
    )
  }

  return (
    <div className="br-card p-5 mt-4">
      <StatusLine latestInvitation={latestInvitation} latestSentAt={latestSentAt} />
      <p className="text-[12px] font-medium text-[#1B6DFC] mb-3">Re-intake link ready</p>
      <p className="text-[12.5px] text-[#666D7A] mb-3">
        This will send the re-intake email variant when you click Send email — copy acknowledges the client is already coaching and asks for a fresh read for reassessment.
      </p>
      <div className="bg-[#FFFFFF] rounded-lg px-4 py-3 flex items-center gap-3 mb-4">
        <p className="text-[#666D7A] text-[12.5px] font-mono flex-1 truncate">
          {window.location.origin}/intake/{token}
        </p>
        <button
          onClick={copy}
          className="shrink-0 text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-[#CFD4DC] text-[#43474F] hover:border-[#98A0AD] hover:text-[#141821] transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="flex gap-3">
        {clientEmail && (
          <SendEmailButton
            clientId={clientId}
            clientName={clientName}
            clientEmail={clientEmail}
            intakeToken={token}
            variant="outline"
          />
        )}
        <button
          onClick={() => { setStatus('idle'); setToken('') }}
          className="text-[12.5px] text-[#98A0AD] hover:text-[#43474F] transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
