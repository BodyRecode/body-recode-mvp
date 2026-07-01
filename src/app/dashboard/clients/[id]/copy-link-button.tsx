'use client'

import { useState } from 'react'
import { appUrl } from "@/lib/app-url";

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
    navigator.clipboard.writeText(`${appUrl()}${path}/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs font-medium px-3 py-1.5 border border-[#E5E5E5] text-[#6B6B6B] rounded-lg hover:border-[#1B6DFC] hover:bg-blue-50 hover:text-[#1B6DFC] transition-colors"
    >
      {copied ? 'Copied!' : label}
    </button>
  )
}
