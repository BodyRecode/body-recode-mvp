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
    navigator.clipboard.writeText(`https://app.bodyrecode.au${path}/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-medium px-3 py-1.5 border border-[#1c1917] text-[#a8a29e] rounded-lg hover:border-[#292524] hover:text-[#e7e5e4] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
