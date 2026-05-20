'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

export default function ScorecardPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('scorecard_popup_dismissed')) return
    const t = setTimeout(() => setVisible(true), 4000)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    sessionStorage.setItem('scorecard_popup_dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={dismiss}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-stone-300 bg-[#FFFFFF] p-8"
        style={{ boxShadow: '0 0 60px rgba(27,109,252,0.12)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Teal accent bar */}
        <div className="w-8 h-0.5 bg-blue-500 mb-5" />

        <p className="text-xs font-bold tracking-widest text-blue-500 uppercase mb-3">Free · 2 minutes</p>
        <h2 className="text-2xl font-extrabold text-[#1A1A1A] tracking-tight leading-tight mb-3">
          Why is your body not responding?
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-6">
          The Body State Scorecard tells you which state your body is currently operating in — and why your training and fat loss may not be responding the way you expect.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/scorecard"
            onClick={dismiss}
            className="block w-full text-center bg-blue-600 hover:bg-blue-500 text-stone-50 font-bold text-sm py-3.5 px-6 rounded-xl transition-colors"
          >
            Take the Scorecard
          </Link>
          <button
            onClick={dismiss}
            className="text-xs text-stone-400 hover:text-stone-600 transition-colors"
          >
            No thanks
          </button>
        </div>
      </div>
    </div>
  )
}
