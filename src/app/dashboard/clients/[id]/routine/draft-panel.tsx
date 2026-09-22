'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sparkles, Loader2, Check, X, Sunrise, Moon, FileText } from 'lucide-react'
import type { DailyRoutine } from '@/lib/daily-routine-defaults'

/**
 * Draft panel — shows the LLM-generated draft (if present) with rationale,
 * a Generate button (fire-and-poll for 60-120s server calls), and
 * Publish / Discard actions.
 *
 * Fire-and-poll: the server can take 60-120s. Browsers abort long-idle
 * fetches around 60s with "failed to fetch" even though the server
 * completes and saves the draft. We poll router.refresh() every 15s so
 * the draft appears in the panel as soon as the server writes it,
 * regardless of whether the initial fetch response ever comes back.
 * Hard timeout at 3 minutes.
 */
export default function DraftPanel({
  clientId,
  clientName,
  draft,
  rationale,
  generatedAt,
  hasLive,
}: {
  clientId: string
  clientName: string
  draft: DailyRoutine | null
  rationale: string | null
  generatedAt: string | null
  hasLive: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [discarding, setDiscarding] = useState(false)
  const timersRef = useRef<{ pollId: ReturnType<typeof setInterval> | null; giveUpId: ReturnType<typeof setTimeout> | null }>({ pollId: null, giveUpId: null })

  useEffect(() => {
    return () => {
      if (timersRef.current.pollId !== null) clearInterval(timersRef.current.pollId)
      if (timersRef.current.giveUpId !== null) clearTimeout(timersRef.current.giveUpId)
    }
  }, [])

  const stopTimers = () => {
    if (timersRef.current.pollId !== null) { clearInterval(timersRef.current.pollId); timersRef.current.pollId = null }
    if (timersRef.current.giveUpId !== null) { clearTimeout(timersRef.current.giveUpId); timersRef.current.giveUpId = null }
  }

  const generate = async () => {
    if (busy) return
    const hasExisting = draft !== null
    const confirmMsg = hasExisting
      ? `Regenerate ${clientName}'s draft routine? The current draft will be replaced.`
      : `Generate ${clientName}'s daily routine from their intake, body state, medications, and training schedule?`
    if (!confirm(confirmMsg)) return

    setError(null)
    setBusy(true)

    timersRef.current.pollId = setInterval(() => {
      startTransition(() => router.refresh())
    }, 15_000)
    timersRef.current.giveUpId = setTimeout(() => {
      stopTimers()
      startTransition(() => router.refresh())
      setBusy(false)
    }, 3 * 60 * 1000)

    try {
      const res = await fetch('/api/generate-daily-routine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id: clientId }),
      })
      stopTimers()
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || `Server returned ${res.status}`)
        setBusy(false)
        return
      }
      startTransition(() => router.refresh())
      setBusy(false)
    } catch (e) {
      void e
    }
  }

  const publish = async () => {
    if (!draft) return
    if (!confirm(`Publish this draft as ${clientName}'s live routine? The old live version will be replaced.`)) return
    setPublishing(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/daily-routine/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server returned ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not publish')
    } finally {
      setPublishing(false)
    }
  }

  const discard = async () => {
    if (!draft) return
    if (!confirm('Discard this draft? Cannot be undone.')) return
    setDiscarding(true)
    setError(null)
    try {
      const res = await fetch(`/api/clients/${clientId}/daily-routine/draft`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Server returned ${res.status}`)
      }
      startTransition(() => router.refresh())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not discard')
    } finally {
      setDiscarding(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#E4E4E0] bg-white overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#E4E4E0]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0F1115]/10 flex items-center justify-center">
            <Sparkles size={16} className="text-[#0F1115]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0F1115]">Personalised draft</h2>
            <p className="text-[11px] text-[#6E747D]">
              {draft
                ? `Generated ${generatedAt ? new Date(generatedAt).toLocaleString('en-AU', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : 'recently'}`
                : 'No draft yet. Generate from client data to see it here.'}
            </p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={busy || isPending || publishing || discarding}
          className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-1.5 bg-[#0F1115] text-white rounded-lg hover:bg-[#000000] transition-colors disabled:opacity-40"
        >
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
          {busy ? 'Generating...' : draft ? 'Regenerate' : 'Generate from client data'}
        </button>
      </div>

      {busy && (
        <div className="px-5 py-4 bg-[rgba(27,109,252,0.08)] border-b border-[#E4E4E0]">
          <p className="text-[12.5px] text-[#0F1115] leading-relaxed">
            Reading intake, body state, medications, and training schedule. Then writing morning + evening sequences tailored to {clientName}. Typical 40 to 90 seconds - the page is not frozen, please don&apos;t refresh.
          </p>
        </div>
      )}

      {error && (
        <div className="px-5 py-3 bg-[#FDF8F1] border-b border-[#EADCC4]">
          <p className="text-[12.5px] text-[#B06E1F]">{error}</p>
        </div>
      )}

      {draft ? (
        <>
          {rationale && (
            <div className="px-5 py-4 bg-[#FAFAF8] border-b border-[#E4E4E0]">
              <div className="flex items-start gap-2">
                <FileText size={12} className="text-[#6E747D] mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-medium text-[#6E747D] mb-1">Why this fits {clientName} (coach only, not shown to client)</p>
                  <p className="text-[13px] text-[#0F1115] leading-relaxed">{rationale}</p>
                </div>
              </div>
            </div>
          )}

          <div className="px-5 py-4 space-y-4">
            <SequencePreview icon={<Sunrise size={14} className="text-[#0F1115]" />} sequence={draft.morning} />
            <SequencePreview icon={<Moon size={14} className="text-[#0F1115]" />} sequence={draft.evening} />
          </div>

          <div className="flex items-center justify-between gap-3 px-5 py-3 border-t border-[#E4E4E0] bg-[#FAFAF8]">
            <button
              onClick={discard}
              disabled={discarding || publishing || busy}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium text-[#6E747D] hover:text-[#8F2D2D] disabled:opacity-40 transition-colors"
            >
              <X size={12} />
              {discarding ? 'Discarding...' : 'Discard draft'}
            </button>
            <button
              onClick={publish}
              disabled={publishing || discarding || busy}
              className="inline-flex items-center gap-1.5 text-[12.5px] font-medium px-4 py-2 bg-[#0F1115] text-white rounded-lg hover:bg-[#000000] disabled:opacity-40 transition-colors"
            >
              {publishing ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              {publishing ? 'Publishing...' : hasLive ? 'Replace live routine' : 'Publish as live'}
            </button>
          </div>
        </>
      ) : (
        !busy && (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-[#6E747D] leading-relaxed">
              Click <span className="font-medium text-[#0F1115]">Generate from client data</span> above to create a personalised morning and evening sequence for {clientName}.
              <br />
              <span className="text-[11px] text-[#9CA2AB] mt-1 inline-block">Uses their intake, body state, medications, training days, and health flags to shape the steps.</span>
            </p>
          </div>
        )
      )}
    </div>
  )
}

function SequencePreview({ icon, sequence }: { icon: React.ReactNode; sequence: { title: string; tagline: string; steps: string[]; coach_note?: string | null } }) {
  return (
    <div className="rounded-xl border border-[#E4E4E0] overflow-hidden">
      <div className="flex items-start gap-2 px-4 py-3 border-b border-[#E4E4E0] bg-white">
        <div className="w-6 h-6 rounded-lg bg-[#0F1115]/10 flex items-center justify-center shrink-0 mt-0.5">{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#0F1115]">{sequence.title}</h3>
          <p className="text-[12px] text-[#6E747D] mt-0.5">{sequence.tagline}</p>
        </div>
      </div>
      <div className="px-4 py-3 bg-white">
        <ol className="space-y-2">
          {sequence.steps.map((step, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0F1115]/10 text-[#0F1115] text-[10px] font-medium flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              <p className="text-[13px] text-[#0F1115] leading-relaxed flex-1">{step}</p>
            </li>
          ))}
        </ol>
        {sequence.coach_note && sequence.coach_note.trim().length > 0 && (
          <div className="mt-3 pt-3 border-t border-[#F2F2EF]">
            <p className="text-[9px] font-medium text-[#0F1115] mb-1">Coach note</p>
            <p className="text-[12px] text-[#6E747D] leading-relaxed">{sequence.coach_note}</p>
          </div>
        )}
      </div>
    </div>
  )
}
