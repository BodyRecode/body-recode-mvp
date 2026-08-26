'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'

export default function ConvertButton({ leadId, leadName, alreadyConverted, clientId }: {
  leadId: string
  leadName: string
  alreadyConverted: boolean
  clientId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [intakeLink, setIntakeLink] = useState('')
  const [portalLink, setPortalLink] = useState('')
  const [portalEmailSent, setPortalEmailSent] = useState<boolean | null>(null)
  const [portalEmailReason, setPortalEmailReason] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [portalCopied, setPortalCopied] = useState(false)

  if (alreadyConverted && clientId && !intakeLink) {
    return (
      <a
        href={`/dashboard/clients/${clientId}`}
        className="inline-block text-sm font-medium text-blue-500 hover:underline"
      >
        View client profile →
      </a>
    )
  }

  async function runConvert(markPaid: boolean) {
    setLoading(true)
    const res = await fetch(`/api/leads/${leadId}/convert`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markPaid }),
    })
    const data = await res.json()
    if (res.ok) {
      const link = `${window.location.origin}/intake/${data.intake_token}`
      setIntakeLink(link)
      setPortalLink(data.portal_url || '')
      setPortalEmailSent(data.portal_email_sent ?? null)
      setPortalEmailReason(data.portal_email_reason ?? null)
      router.refresh()
    } else {
      alert(data.error || 'Conversion failed')
    }
    setLoading(false)
  }

  function convert() {
    const choice = window.prompt(
      `Convert ${leadName} to an active client?\n\nHas the Foundational Read been paid?\n\n` +
      `Type "paid"   - mark fee as paid (status → commencement_fee_paid)\n` +
      `Type "later"  - convert now, send the fee link later\n` +
      `(blank or anything else cancels)`,
      'later'
    )
    if (!choice) return
    const norm = choice.trim().toLowerCase()
    if (norm === 'paid') runConvert(true)
    else if (norm === 'later') runConvert(false)
  }

  function copy() {
    navigator.clipboard.writeText(intakeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function copyPortal() {
    navigator.clipboard.writeText(portalLink)
    setPortalCopied(true)
    setTimeout(() => setPortalCopied(false), 2000)
  }

  if (intakeLink) {
    return (
      <div className="space-y-4">
        {/* Portal access email status - never silent */}
        {portalEmailSent === true && (
          <p className="text-sm text-green-600 font-medium">✓ Portal access email sent to the client.</p>
        )}
        {portalEmailSent === false && (
          <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 space-y-1">
            <p className="text-sm text-red-700 font-bold inline-flex items-center gap-1.5"><AlertTriangle size={14} strokeWidth={2.5} className="shrink-0" /> Portal access email did NOT send{portalEmailReason ? ` (${portalEmailReason})` : ''}.</p>
            <p className="text-[12.5px] text-red-700">Send the client their portal link manually (below). I&apos;ve also emailed you an alert.</p>
          </div>
        )}

        {portalLink && (
          <div className="space-y-1.5">
            <p className="text-[12.5px] font-medium text-[#666D7A]">Portal link (client signs in here):</p>
            <div className="bg-[#EFF1F4] rounded-lg px-4 py-3 flex items-center gap-3">
              <p className="text-[#666D7A] text-[12.5px] font-mono flex-1 truncate">{portalLink}</p>
              <button
                onClick={copyPortal}
                className="shrink-0 text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-[#CFD4DC] text-[#43474F] hover:border-[#43474F] hover:text-[#141821] transition-colors"
              >
                {portalCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-[12.5px] font-medium text-[#666D7A]">Intake link:</p>
          <div className="bg-[#EFF1F4] rounded-lg px-4 py-3 flex items-center gap-3">
            <p className="text-[#666D7A] text-[12.5px] font-mono flex-1 truncate">{intakeLink}</p>
            <button
              onClick={copy}
              className="shrink-0 text-[12.5px] font-medium px-3 py-1.5 rounded-md border border-[#CFD4DC] text-[#43474F] hover:border-[#43474F] hover:text-[#141821] transition-colors"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={convert}
      disabled={loading}
      className="bg-blue-500 text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
    >
      {loading ? 'Converting...' : 'Convert to Client'}
    </button>
  )
}
