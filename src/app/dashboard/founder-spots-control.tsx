'use client'

import { useState } from 'react'

export default function FounderSpotsControl({ initial }: { initial: number }) {
  const [spots, setSpots] = useState(initial)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function update(value: number) {
    if (value < 0) return
    setSpots(value)
    setStatus('saving')
    try {
      const res = await fetch('/api/founder-spots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spots: value }),
      })
      setStatus(res.ok ? 'saved' : 'error')
    } catch {
      setStatus('error')
    }
    setTimeout(() => setStatus('idle'), 2000)
  }

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-white">Founder Client Program</p>
        <p className="text-xs text-stone-500 mt-0.5">Positions shown on performance.bodyrecode.au/founder</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-stone-500 min-w-[60px] text-right">
          {status === 'saving' ? 'Saving...' : status === 'saved' ? 'Saved' : status === 'error' ? 'Error' : ''}
        </span>
        <div className="flex items-center gap-2 bg-stone-800 border border-stone-700 rounded-lg px-3 py-2">
          <button
            onClick={() => update(spots - 1)}
            disabled={spots === 0}
            className="text-stone-400 hover:text-white transition-colors disabled:opacity-30 text-lg leading-none w-5 text-center"
          >
            −
          </button>
          <span className="text-white font-bold text-lg w-8 text-center tabular-nums">{spots}</span>
          <button
            onClick={() => update(spots + 1)}
            className="text-stone-400 hover:text-white transition-colors text-lg leading-none w-5 text-center"
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}
