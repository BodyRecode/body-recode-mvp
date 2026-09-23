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
      className="shrink-0 text-[11px] font-medium px-3 py-2 bg-[#14171D] border border-[#2A2F39] text-[#C2C6CC] rounded-lg hover:border-[#FAFAF8] hover:text-[#FAFAF8] hover:bg-[rgba(27,109,252,0.06)] transition-colors"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}
