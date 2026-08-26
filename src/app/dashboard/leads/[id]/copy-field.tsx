'use client'

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

/** Click-to-copy contact value. Small thing, used constantly. */
export default function CopyField({ value, label }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        setTimeout(() => setCopied(false), 1400)
      }}
      title={`Copy ${label ?? value}`}
      className="group inline-flex items-center gap-1.5 text-[13px] text-[#43474F] hover:text-[#1B6DFC] transition-colors max-w-full"
    >
      <span className="truncate">{value}</span>
      {copied
        ? <Check size={12} className="text-green-600 shrink-0" />
        : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />}
    </button>
  )
}
