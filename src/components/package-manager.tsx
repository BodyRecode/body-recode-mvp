'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const PACKAGES = [
  { value: 'online', label: 'Online - $149/week', stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02' },
  { value: '2x', label: 'In-Person 2x - $299/week', stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00' },
  { value: '3x', label: 'In-Person 3x - $409/week', stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03' },
]

export default function PackageManager({ clientId, currentPackage }: { clientId: string; currentPackage?: string }) {
  const router = useRouter()
  const [pkg, setPkg] = useState(currentPackage ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)

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
    const found = PACKAGES.find(p => p.value === pkg)
    if (!found) return
    await navigator.clipboard.writeText(found.stripe)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const currentInfo = PACKAGES.find(p => p.value === pkg)

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {PACKAGES.map(p => (
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
        <button
          onClick={copyLink}
          className="text-xs font-bold px-4 py-2 bg-[#10E1C2]/10 border border-[#10E1C2]/30 text-[#10E1C2] rounded-lg hover:bg-[#10E1C2]/20 transition-colors"
        >
          {copied ? 'Link Copied!' : `Copy ${currentInfo.label} Subscription Link`}
        </button>
      )}
    </div>
  )
}
