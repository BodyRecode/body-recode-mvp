'use client'

import Link from 'next/link'
import { useState } from 'react'

/**
 * The controls, which do not print.
 *
 * Anonymising is a LINK rather than a stored copy: same page, one parameter.
 * Two stored artefacts would drift, and a coach could send the wrong one.
 */
export default function ProofActions({ clientId, anonymous }: { clientId: string; anonymous: boolean }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="flex items-center gap-3 flex-wrap mb-10 print:hidden">
      <Link href={`/dashboard/clients/${clientId}`} className="text-[12.5px] text-[#6E747D] hover:text-[#0F1115]">
        &larr; Their file
      </Link>
      <span className="flex-1" />
      <Link
        href={anonymous ? `/dashboard/clients/${clientId}/proof` : `/dashboard/clients/${clientId}/proof?anon=1`}
        className="text-[12.5px] font-semibold px-3.5 py-[7px] rounded-lg border border-[#DCDCD7] text-[#0F1115] hover:border-[#0F1115]"
      >
        {anonymous ? 'Show their name' : 'Hide their name'}
      </Link>
      <button
        onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
        className="text-[12.5px] font-semibold px-3.5 py-[7px] rounded-lg border border-[#DCDCD7] text-[#0F1115] hover:border-[#0F1115]"
      >
        {copied ? 'Link copied' : 'Copy link'}
      </button>
      <button
        onClick={() => window.print()}
        className="text-[12.5px] font-bold px-3.5 py-[7px] rounded-lg bg-[#0F1115] text-[#FAFAF8]"
      >
        Print or save as PDF
      </button>
    </div>
  )
}
