'use client'

import { useState } from 'react'

/** Copy the quote with the name already on it, so it can be pasted as it stands. */
export default function CopyQuote({ text }: { text: string }) {
  const [done, setDone] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text)
          setDone(true)
          setTimeout(() => setDone(false), 1800)
        } catch { /* clipboard blocked; the quote is on screen to select */ }
      }}
      className="text-[11px] font-bold px-2.5 py-[3px] rounded-full border transition-colors"
      style={{
        color: done ? '#0F1115' : '#C2C6CC',
        background: done ? '#FAFAF8' : 'transparent',
        borderColor: done ? '#FAFAF8' : '#2A2F39',
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  )
}
