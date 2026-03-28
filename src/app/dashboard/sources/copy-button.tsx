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
      className="shrink-0 text-xs font-medium px-3 py-2 bg-stone-800 border border-stone-700 text-stone-300 rounded-lg hover:bg-stone-700 hover:text-white transition-colors"
    >
      {copied ? 'Copied ✓' : 'Copy'}
    </button>
  )
}
