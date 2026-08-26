'use client'

import { useState } from 'react'
import { Link2, Copy, Check, Loader2 } from 'lucide-react'

interface Props {
  productId: string
  cachedUrl: string | null
}

export default function GetPaymentLinkButton({ productId, cachedUrl }: Props) {
  const [url, setUrl] = useState<string | null>(cachedUrl)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  async function generate() {
    setLoading(true)
    const res = await fetch('/api/payments/generate-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId }),
    })
    if (res.ok) {
      const { url: generatedUrl } = await res.json()
      setUrl(generatedUrl)
    }
    setLoading(false)
  }

  async function copy() {
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (url) {
    return (
      <button
        onClick={copy}
        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
          copied
            ? 'border-blue-300 text-blue-500 bg-blue-50'
            : 'border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821]'
        }`}
        title={url}
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? 'Copied!' : 'Copy Link'}
      </button>
    )
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-1.5 text-[12.5px] font-medium px-3 py-1.5 rounded-lg border border-[#E8EAEE] text-[#666D7A] hover:border-[#CFD4DC] hover:text-[#141821] disabled:opacity-50 transition-colors"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
      {loading ? 'Generating...' : 'Get Link'}
    </button>
  )
}
