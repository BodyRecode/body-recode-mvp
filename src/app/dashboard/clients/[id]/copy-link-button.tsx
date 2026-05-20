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
      className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#D4D4D4] hover:text-[#e7e5e4] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
