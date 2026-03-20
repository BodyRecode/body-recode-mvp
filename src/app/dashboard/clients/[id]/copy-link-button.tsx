'use client'

import { useState } from 'react'

export default function CopyLinkButton({
  token,
  label = 'Copy intake link',
  path = '/intake',
}: {
  token: string
  label?: string
  path?: string
}) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(`${window.location.origin}${path}/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-medium px-3 py-1.5 border border-stone-700 text-stone-400 rounded-lg hover:border-stone-500 hover:text-stone-200 transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
