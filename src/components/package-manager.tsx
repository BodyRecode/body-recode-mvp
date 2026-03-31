'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PACKAGES = [
  { value: 'online', label: 'Online - $149/week', stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02' },
  { value: '2x', label: 'In-Person 2x - $299/week', stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00' },
  { value: '3x', label: 'In-Person 3x - $409/week', stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03' },
]

const FOUNDING_PACKAGES = [
  { value: 'online', label: 'Online - $74.50/week (Founding)', stripe: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04' },
  { value: '2x', label: 'In-Person 2x - $149.50/week (Founding)', stripe: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05' },
  { value: '3x', label: 'In-Person 3x - $204.50/week (Founding)', stripe: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06' },
]

export default function PackageManager({ clientId, currentPackage, isFoundingClient }: { clientId: string; currentPackage?: string; isFoundingClient?: boolean }) {
  const router = useRouter()
  const [pkg, setPkg] = useState(currentPackage ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const packages = isFoundingClient ? FOUNDING_PACKAGES : PACKAGES

  const save = async (newPkg: string) => {
    setPkg(newPkg)
    setSaving(true)
    await fetch(`/api/clients/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: newPkg }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const copyLink = async () => {
    const found = packages.find(p => p.value === pkg)
    if (!found) return
    const url = `${found.stripe}?client_reference_id=${clientId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const sendLink = async () => {
    setSending(true)
    const res = await fetch(`/api/clients/${clientId}/send-subscription`, { method: 'POST' })
    setSending(false)
    if (res.ok) {
      setSent(true)
      setTimeout(() => setSent(false), 3000)
    }
  }

  const currentInfo = packages.find(p => p.value === pkg)

  return (
    <div className="space-y-3">
      {isFoundingClient && (
        <p className="text-xs text-violet-400 font-semibold">Founding Client rates (50% adjusted)</p>
      )}
      <div className="flex flex-wrap gap-2">
        {packages.map(p => (
          <button
            key={p.value}
            onClick={() => save(p.value)}
            disabled={saving}
            className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              pkg === p.value
                ? 'bg-teal-500/10 border-teal-500/30 text-teal-400'
                : 'border-stone-700 text-stone-400 hover:border-stone-500 hover:text-stone-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      {saved && <p className="text-xs text-teal-400">Package updated</p>}
      {currentInfo && (
        <div className="flex items-center gap-3">
          <button
            onClick={sendLink}
            disabled={sending || sent}
            className="text-xs font-bold px-4 py-2 bg-[#10E1C2] text-black rounded-lg hover:bg-[#0ecfb2] transition-colors disabled:opacity-50"
          >
            {sending ? 'Sending...' : sent ? 'Sent!' : 'Send to Client'}
          </button>
          <button
            onClick={copyLink}
            className="text-xs font-bold px-4 py-2 border border-stone-700 text-stone-300 rounded-lg hover:border-stone-500 hover:text-white transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
        </div>
      )}
    </div>
  )
}
