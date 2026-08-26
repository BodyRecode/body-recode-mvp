'use client'

/**
 * One-shot backfill: scan be_payments for $240 no-subscription rows
 * (commencement fee payments that landed before client_payment_plan was
 * being populated) and write commencement_fee_paid_at on the matching
 * plan rows. See /api/admin/payments/backfill-commencement/route.ts.
 *
 * Idempotent — safe to run repeatedly. Used to fix Luke's case and every
 * other historical client that paid the commencement before this layer
 * was wired.
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wrench, CheckCircle2 } from 'lucide-react'

type Result = {
  scanned: number
  uniqueClients: number
  alreadyMarked: number
  newlyMarked: number
  failed: number
}

export default function RunCommencementBackfillButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run() {
    if (!confirm('Scan be_payments for $240 commencement payments and write commencement_fee_paid_at on client_payment_plan for any that are missing it. Safe to re-run.')) return
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/payments/backfill-commencement', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? res.statusText)
        return
      }
      setResult(data as Result)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Backfill failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={pending}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[rgba(27,109,252,0.08)] border border-[#B5CFFC] hover:bg-[#1560E0]/15 hover:border-[#1B6DFC]/50 rounded-lg transition-colors disabled:opacity-50"
      >
        <Wrench size={14} className={pending ? 'animate-pulse' : ''} />
        {pending ? 'Backfilling…' : 'Backfill commencement fees'}
      </button>

      {error && <p className="text-[12.5px] text-[#C82626] mt-2">Error: {error}</p>}

      {result && (
        <div className="mt-3 bg-[#F4F6F9] br-card p-4 text-[12.5px] space-y-1.5">
          <div className="flex items-center gap-1.5 text-[#1B6DFC] mb-1">
            <CheckCircle2 size={13} />
            <span className="font-medium">Backfill complete</span>
          </div>
          <p className="text-[#141821]">
            <span className="text-[#666D7A]">Scanned:</span> {result.scanned}
            <span className="text-[#666D7A] ml-3">Unique clients:</span> {result.uniqueClients}
          </p>
          <p className="text-[#141821]">
            <span className="text-[#666D7A]">Newly marked paid:</span> {result.newlyMarked}
            <span className="text-[#666D7A] ml-3">Already marked:</span> {result.alreadyMarked}
            {result.failed > 0 && (
              <span className="text-[#A96A12] ml-3">Failed: {result.failed}</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
