'use client'

/**
 * Rest timer for the live workout logging screen. Fixed bar at the bottom of
 * the page. Client taps a preset to start, or it auto-starts from the
 * exercise's prescribed rest when they commit a set (LogClient calls start()
 * via the imperative ref). Counts down with a progress bar, ±15s, pause/resume
 * and skip. Beeps + vibrates at zero. Purely client-side — no persistence.
 */

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'

export interface RestTimerHandle {
  start: (seconds: number) => void
}

const PRESETS = [60, 90, 120, 180]

function fmt(total: number): string {
  const s = Math.max(0, total)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

/** Short double-beep via the Web Audio API. Silently no-ops if unavailable. */
function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const blip = (at: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, at)
      gain.gain.exponentialRampToValueAtTime(0.3, at + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.28)
      osc.start(at)
      osc.stop(at + 0.3)
    }
    blip(ctx.currentTime)
    blip(ctx.currentTime + 0.35)
    setTimeout(() => { try { ctx.close() } catch { /* ignore */ } }, 1000)
  } catch { /* ignore */ }
}

const RestTimer = forwardRef<RestTimerHandle>(function RestTimer(_props, ref) {
  const [total, setTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const endAtRef = useRef<number | null>(null)
  const intervalRef = useRef<number | null>(null)

  const clearTick = useCallback(() => {
    if (intervalRef.current != null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback((seconds: number) => {
    if (!seconds || seconds <= 0) return
    setTotal(seconds)
    setRemaining(seconds)
    setDone(false)
    endAtRef.current = Date.now() + seconds * 1000
    setRunning(true)
  }, [])

  useImperativeHandle(ref, () => ({ start }), [start])

  useEffect(() => {
    if (!running) {
      clearTick()
      return
    }
    clearTick()
    intervalRef.current = window.setInterval(() => {
      const end = endAtRef.current
      if (end == null) return
      const rem = Math.max(0, Math.round((end - Date.now()) / 1000))
      setRemaining(rem)
      if (rem <= 0) {
        clearTick()
        endAtRef.current = null
        setRunning(false)
        setDone(true)
        beep()
        try { navigator.vibrate?.([200, 100, 200]) } catch { /* ignore */ }
      }
    }, 250)
    return clearTick
  }, [running, clearTick])

  const pause = () => {
    const end = endAtRef.current
    if (end != null) setRemaining(Math.max(0, Math.round((end - Date.now()) / 1000)))
    endAtRef.current = null
    setRunning(false)
  }

  const resume = () => {
    if (remaining <= 0) return
    endAtRef.current = Date.now() + remaining * 1000
    setDone(false)
    setRunning(true)
  }

  const adjust = (delta: number) => {
    const base = running && endAtRef.current != null
      ? Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000))
      : remaining
    const next = Math.max(0, base + delta)
    setRemaining(next)
    setTotal(t => Math.max(t, next))
    setDone(false)
    if (running) endAtRef.current = Date.now() + next * 1000
  }

  const skip = () => {
    clearTick()
    endAtRef.current = null
    setRunning(false)
    setDone(false)
    setRemaining(0)
    setTotal(0)
  }

  const active = running || remaining > 0 || done
  const pct = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#E5E5E5] bg-white/95 backdrop-blur-sm shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-md mx-auto px-4 py-3">
        {!active ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#6B6B6B] uppercase tracking-widest whitespace-nowrap">Rest timer</span>
            <div className="flex-1 grid grid-cols-4 gap-1.5">
              {PRESETS.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => start(p)}
                  className="py-2 rounded-lg border border-[#E5E5E5] text-sm font-semibold text-[#1A1A1A] tabular-nums hover:border-[#1B6DFC] hover:bg-blue-50 transition-colors"
                >
                  {fmt(p)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            {/* Progress bar */}
            <div className="h-1.5 rounded-full bg-[#E5E5E5] overflow-hidden mb-2.5">
              <div
                className={`h-full transition-[width] duration-300 ease-linear ${done ? 'bg-[#1B6DFC]' : 'bg-[#1B6DFC]'}`}
                style={{ width: `${done ? 100 : pct}%` }}
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-[84px]">
                {done ? (
                  <p className="text-lg font-bold text-[#1B6DFC] leading-none">Rest done</p>
                ) : (
                  <p className="text-3xl font-bold text-[#1A1A1A] tabular-nums leading-none">{fmt(remaining)}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!done && (
                  <button
                    type="button"
                    onClick={() => adjust(-15)}
                    className="px-2.5 h-9 rounded-lg border border-[#E5E5E5] text-xs font-semibold text-[#6B6B6B] hover:border-[#D4D4D4] transition-colors tabular-nums"
                  >
                    −15s
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => adjust(15)}
                  className="px-2.5 h-9 rounded-lg border border-[#E5E5E5] text-xs font-semibold text-[#6B6B6B] hover:border-[#D4D4D4] transition-colors tabular-nums"
                >
                  +15s
                </button>
                {done ? (
                  <button
                    type="button"
                    onClick={skip}
                    className="px-4 h-9 rounded-lg bg-[#1B6DFC] text-white text-xs font-bold hover:bg-[#5390FF] transition-colors"
                  >
                    Done
                  </button>
                ) : running ? (
                  <button
                    type="button"
                    onClick={pause}
                    className="px-4 h-9 rounded-lg border border-[#1B6DFC] text-[#1B6DFC] text-xs font-bold hover:bg-blue-50 transition-colors"
                  >
                    Pause
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={resume}
                    className="px-4 h-9 rounded-lg bg-[#1B6DFC] text-white text-xs font-bold hover:bg-[#5390FF] transition-colors"
                  >
                    Resume
                  </button>
                )}
                <button
                  type="button"
                  onClick={skip}
                  aria-label="Dismiss rest timer"
                  className="px-2.5 h-9 rounded-lg text-xs font-semibold text-[#999999] hover:text-[#6B6B6B] transition-colors"
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

export default RestTimer
