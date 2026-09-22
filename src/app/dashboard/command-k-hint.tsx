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
      className="w-full flex items-center gap-2 text-[12.5px] text-[#8A9099] hover:text-[#FAFAF8] px-2.5 py-[7px] rounded-lg border border-[#2A2F39] bg-[#14171D] hover:border-[#676D76] transition-colors"
    >
      <Search size={13} className="shrink-0" />
      <span className="truncate">Search or jump to</span>
      <span
        className="ml-auto shrink-0 inline-flex items-center gap-0.5 text-[10px] text-[#676D76] px-1.5 py-0.5 rounded border border-[#2A2F39] bg-[#0F1115]"
        style={{ fontFamily: MONO_FONT }}
      >
        {isMac ? '⌘' : 'Ctrl'} K
      </span>
    </button>
  )
}
