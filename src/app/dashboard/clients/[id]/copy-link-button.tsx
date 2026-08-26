'use client'

import { useState } from 'react'
import { appUrl } from "@/lib/app-url";
import { Btn } from '@/components/dashboard/ui'
import { Check, Link2 } from 'lucide-react'

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
    <Btn size="sm" onClick={copy} icon={copied ? Check : Link2}>
      {copied ? 'Copied' : label}
    </Btn>
  )
}
