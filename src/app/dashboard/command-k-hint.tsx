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
      className="hidden md:inline-flex items-center gap-2 text-[11px] text-[#6B6B6B] hover:text-[#1B6DFC] px-2.5 py-1 rounded-md border border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors"
    >
      <Search size={12} />
      <span>Search</span>
      <span
        className="inline-flex items-center gap-0.5 text-[10px] text-[#999999] px-1.5 py-0.5 rounded border border-[#E5E5E5] bg-[#FFFFFF]"
        style={{ fontFamily: MONO_FONT }}
      >
        {isMac ? '⌘' : 'Ctrl'} K
      </span>
    </button>
  )
}
