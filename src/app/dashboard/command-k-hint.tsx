'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'

const MONO_FONT = "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace"

export default function CommandKHint() {
  const [isMac, setIsMac] = useState(true)

  useEffect(() => {
    setIsMac(/Mac|iPod|iPhone|iPad/.test(navigator.platform))
  }, [])

  const open = () => {
    // Dispatch the same key event the palette listens for
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true }))
  }

  return (
    <button
      onClick={open}
      aria-label="Open command palette"
      className="w-full flex items-center gap-2 text-[12.5px] text-[#6E747D] hover:text-[#0F1115] px-2.5 py-[7px] rounded-lg border border-[#E4E4E0] bg-[#FFFFFF] hover:border-[#DCDCD7] transition-colors"
    >
      <Search size={13} className="shrink-0" />
      <span className="truncate">Search or jump to</span>
      <span
        className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-[10px] text-[#9CA2AB] px-1.5 py-0.5 rounded border border-[#EDEDEA] bg-[#F2F2EF]"
        style={{ fontFamily: MONO_FONT }}
      >
        {isMac ? '⌘' : 'Ctrl'} K
      </span>
    </button>
  )
}
