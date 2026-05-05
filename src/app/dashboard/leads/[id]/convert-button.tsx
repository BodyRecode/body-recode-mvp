'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConvertButton({ leadId, leadName, alreadyConverted, clientId }: {
  leadId: string
  leadName: string
  alreadyConverted: boolean
  clientId?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [intakeLink, setIntakeLink] = useState('')
  const [copied, setCopied] = useState(false)

  if (alreadyConverted && clientId && !intakeLink) {
    return (
      <a
        href={`/dashboard/clients/${clientId}`}
        className="inline-block text-sm font-medium text-teal-400 hover:underline"
      >
        View client profile →
      </a>
    )
  }

  async function convert() {
    if (!confirm(`Convert ${leadName} to an active client? This will create their client profile and generate an intake link.`)) return
    setLoading(true)

    const res = await fetch(`/api/leads/${leadId}/convert`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      const link = `${window.location.origin}/intake/${data.intake_token}`
      setIntakeLink(link)
      router.refresh()
    } else {
      alert(data.error || 'Conversion failed')
    }
    setLoading(false)
  }

  function copy() {
    navigator.clipboard.writeText(intakeLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (intakeLink) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-teal-400 font-medium">Client created. Send this intake link:</p>
        <div className="bg-[#1c1917] rounded-lg px-4 py-3 flex items-center gap-3">
          <p className="text-[#a8a29e] text-xs font-mono flex-1 truncate">{intakeLink}</p>
          <button
            onClick={copy}
            className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-md border border-[#292524] text-[#d4cfc9] hover:border-[#3c3835] hover:text-white transition-colors"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={convert}
      disabled={loading}
      className="bg-teal-500 text-black text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-teal-400 transition-colors disabled:opacity-50"
    >
      {loading ? 'Converting...' : 'Convert to Client'}
    </button>
  )
}
