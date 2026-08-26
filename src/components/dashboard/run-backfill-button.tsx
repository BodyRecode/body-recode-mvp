'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, CheckCircle2 } from 'lucide-react'

type BackfillResult = {
  ok: true
  stripe_customers_seen: number
  matched_clients: number
  unmatched_stripe_customers: Array<{ id: string; email: string | null; name: string | null }>
  unmatched_clients: Array<{ id: string; name: string | null; email: string | null }>
  subscriptions_synced: number
  subscriptions_by_status: Record<string, number>
  errors: string[]
  ran_at: string
}

/**
 * Triggers /api/admin/stripe/backfill. Heavy operation — paginates through all
 * Stripe customers, can take 30+ seconds depending on volume. Shows a result
 * summary inline once finished.
 */
export default function RunBackfillButton() {
  const [pending, setPending] = useState(false)
  const [result, setResult] = useState<BackfillResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function run() {
    if (!confirm('Pull every Stripe customer + subscription into the platform cache? Safe to re-run, takes ~30s.')) return
    setPending(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/admin/stripe/backfill', { method: 'POST' })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(err.error ?? res.statusText)
        return
      }
      const data: BackfillResult = await res.json()
      setResult(data)
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
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-50 border border-blue-200 hover:bg-blue-500/15 hover:border-blue-500/50 rounded-lg transition-colors disabled:opacity-50"
      >
        <RefreshCw size={14} className={pending ? 'animate-spin' : ''} />
        {pending ? 'Running backfill…' : 'Run Stripe backfill'}
      </button>

      {error && (
        <p className="text-[12.5px] text-red-700 mt-2">Error: {error}</p>
      )}

      {result && (
        <div className="mt-3 bg-[#F4F6F9] border border-[#E8EAEE] rounded-xl p-4 text-[12.5px] space-y-2">
          <div className="flex items-center gap-1.5 text-blue-500 mb-2">
            <CheckCircle2 size={13} />
            <span className="font-medium">Backfill complete</span>
            <span className="text-[#666D7A] ml-2">{new Date(result.ran_at).toLocaleTimeString('en-AU')}</span>
          </div>
          <p className="text-[#141821]">
            <span className="text-[#666D7A]">Stripe customers scanned:</span> {result.stripe_customers_seen}
            <span className="text-[#666D7A] ml-3">Matched to clients:</span> {result.matched_clients}
          </p>
          <p className="text-[#141821]">
            <span className="text-[#666D7A]">Subscriptions synced:</span> {result.subscriptions_synced}
            {Object.keys(result.subscriptions_by_status).length > 0 && (
              <span className="text-[#666D7A] ml-2">
                ({Object.entries(result.subscriptions_by_status).map(([k, v]) => `${k}: ${v}`).join(', ')})
              </span>
            )}
          </p>
          <p className="text-[#141821]">
            <span className="text-[#666D7A]">Orphan Stripe customers:</span> {result.unmatched_stripe_customers.length}
            <span className="text-[#666D7A] ml-3">Clients with no Stripe link:</span> {result.unmatched_clients.length}
          </p>
          {result.errors.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#E8EAEE]">
              <p className="text-amber-700 font-medium mb-1">Warnings:</p>
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i} className="text-[#666D7A] text-[11px]">• {e}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
