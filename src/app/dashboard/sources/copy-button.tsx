'use client'
import { useState } from 'react'

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="shrink-0 text-[11px] font-medium px-3 py-2 bg-[#111110] border border-[#1c1917] text-[#d4cfc9] rounded-lg hover:border-[#292524] hover:text-white transition-colors"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}
