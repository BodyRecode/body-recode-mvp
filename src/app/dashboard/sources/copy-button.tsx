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
      className="shrink-0 text-[11px] font-medium px-3 py-2 bg-[#FFFFFF] border border-[#E5E5E5] text-[#3A3A3A] rounded-lg hover:border-[#D4D4D4] hover:text-[#1A1A1A] transition-colors"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}
