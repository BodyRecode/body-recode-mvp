/**
 * Block progress + workout logging panel (basic coach view, Phase A).
 *
 * Shows for the current active program block:
 *   - Week N of M
 *   - Days until block end
 *   - Sessions completed this week vs prescribed
 *   - Most recent logged session timestamp
 *
 * Full progression view (load over time, set-by-set drill-in) is Phase B.
 */

import Link from 'next/link'
import { MONO_FONT } from '@/components/dashboard/ui'

export interface BlockProgressData {
  programId: string
  blockName: string | null
  blockWeek: number
  weekDuration: number
  daysUntilBlockEnd: number
  sessionsPrescribedThisWeek: number
  sessionsCompletedThisWeek: number
  sessionsInProgressThisWeek: number
  totalSessionsLoggedThisBlock: number
  latestLoggedAt: string | null
}

export function BlockProgressPanel({ data }: { data: BlockProgressData | null }) {
  if (!data) {
    return (
      <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-2xl px-5 py-4 mb-6">
        <p className="text-[10px] uppercase tracking-widest text-[#999999] mb-1" style={{ fontFamily: MONO_FONT }}>
          Block progress
        </p>
        <p className="text-sm text-[#6B6B6B]">No active program for this client yet.</p>
      </div>
    )
  }

  const blockEndingSoon = data.daysUntilBlockEnd <= 7 && data.daysUntilBlockEnd >= 0
  const blockEnded = data.daysUntilBlockEnd < 0
  const completionPct =
    data.sessionsPrescribedThisWeek > 0
      ? Math.round((data.sessionsCompletedThisWeek / data.sessionsPrescribedThisWeek) * 100)
      : 0

  return (
    <div
      className={`bg-[#FFFFFF] border rounded-2xl px-5 py-4 mb-6 ${
        blockEnded ? 'border-amber-500/40' : blockEndingSoon ? 'border-amber-500/20' : 'border-[#E5E5E5]'
      }`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-[#999999]" style={{ fontFamily: MONO_FONT }}>
            Block progress
          </span>
          {blockEnded && (
            <span
              className="text-[10px] uppercase px-2 py-0.5 rounded-full border"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.08em',
                color: '#f59e0b',
                borderColor: '#3a2410',
                background: 'rgba(245,158,11,0.10)',
              }}
            >
              Block complete · reassessment review
            </span>
          )}
          {blockEndingSoon && !blockEnded && (
            <span
              className="text-[10px] uppercase px-2 py-0.5 rounded-full border"
              style={{
                fontFamily: MONO_FONT,
                letterSpacing: '0.08em',
                color: '#f59e0b',
                borderColor: '#3a2410',
                background: 'rgba(245,158,11,0.10)',
              }}
            >
              Block ending in {data.daysUntilBlockEnd === 0 ? 'today' : `${data.daysUntilBlockEnd}d`}
            </span>
          )}
        </div>
      </div>

      {data.blockName && <p className="text-sm font-semibold text-[#1A1A1A] mb-3">{data.blockName}</p>}

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="bg-[#0a0a0a] border border-[#E5E5E5] rounded-xl px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-[#999999]" style={{ fontFamily: MONO_FONT }}>Week</p>
          <p className="text-lg font-bold text-[#1A1A1A] tabular-nums" style={{ fontFamily: MONO_FONT }}>
            {data.blockWeek} <span className="text-[#999999] text-sm font-normal">/ {data.weekDuration}</span>
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#E5E5E5] rounded-xl px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-[#999999]" style={{ fontFamily: MONO_FONT }}>This week</p>
          <p className="text-lg font-bold text-[#1A1A1A] tabular-nums" style={{ fontFamily: MONO_FONT }}>
            {data.sessionsCompletedThisWeek}
            <span className="text-[#999999] text-sm font-normal"> / {data.sessionsPrescribedThisWeek}</span>
          </p>
          <p className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>
            {data.sessionsInProgressThisWeek > 0 ? `${data.sessionsInProgressThisWeek} in progress` : `${completionPct}% logged`}
          </p>
        </div>
        <div className="bg-[#0a0a0a] border border-[#E5E5E5] rounded-xl px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-widest text-[#999999]" style={{ fontFamily: MONO_FONT }}>Block total</p>
          <p className="text-lg font-bold text-[#1A1A1A] tabular-nums" style={{ fontFamily: MONO_FONT }}>
            {data.totalSessionsLoggedThisBlock}
          </p>
          <p className="text-[10px] text-[#999999]" style={{ fontFamily: MONO_FONT }}>sessions logged</p>
        </div>
      </div>

      {data.latestLoggedAt && (
        <p className="text-[11px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>
          Last logged{' '}
          {new Date(data.latestLoggedAt).toLocaleString('en-AU', {
            dateStyle: 'medium',
            timeStyle: 'short',
            timeZone: 'Australia/Brisbane',
          })}
        </p>
      )}

      {data.totalSessionsLoggedThisBlock === 0 && (
        <p className="text-[12px] text-[#6B6B6B] italic">
          Client hasn&apos;t logged any sessions yet.{' '}
          <Link href="/dashboard/help#training-program" className="text-blue-500 hover:underline">
            How logging works
          </Link>
        </p>
      )}
    </div>
  )
}
