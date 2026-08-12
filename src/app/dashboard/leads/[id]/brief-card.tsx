import { AlertTriangle, Ban, Route, Quote } from 'lucide-react'
import type { BriefSummary } from '@/lib/pre-call-brief'
import type { ScopeFlag } from '@/lib/pre-call-brief'

/**
 * The 30-seconds-before-dialling card.
 *
 * The full brief is thorough and that is correct for preparing. It is the wrong
 * shape for the moment just before the call, where the whole document reads as
 * one wall. This is the glanceable layer above it: scope, read, quality, offer,
 * path. Everything else stays collapsed underneath.
 */
export default function BriefCard({ summary, scopeFlags }: { summary: BriefSummary; scopeFlags: ScopeFlag[] }) {
  const qualityColour = summary.quality === 'RED' ? '#DC2626' : summary.quality === 'YELLOW' ? '#D97706' : '#16A34A'

  return (
    <div className="bg-white border border-[#E5E5E5] rounded-2xl overflow-hidden mb-4">
      {/* Scope — always first when present */}
      {scopeFlags.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200 px-5 py-3.5">
          <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <AlertTriangle size={12} /> Outside scope · ask, note, do not interpret
          </p>
          <div className="space-y-1.5">
            {scopeFlags.map(f => (
              <div key={f.flag} className="text-[13px] text-amber-900 leading-snug">
                <span className="font-semibold">{f.flag}</span>
                <span className="text-amber-800"> — {f.route}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="p-5 grid sm:grid-cols-2 gap-x-6 gap-y-4">
        {/* The read */}
        <div>
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">The read</p>
          <p className="text-[15px] font-bold text-[#1A1A1A] leading-snug">
            {summary.stateLabel}
            {summary.profileLabel && <> · {summary.profileLabel}</>}
          </p>
          {summary.provisional && (
            <p className="text-[12px] text-[#B7791F] font-semibold mt-0.5">Provisional. Say &quot;points toward&quot;, never &quot;you are&quot;.</p>
          )}
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed mt-1">{summary.headline}</p>
        </div>

        {/* Quality */}
        <div>
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">Lead quality</p>
          <p className="text-[15px] font-black" style={{ color: qualityColour }}>
            {summary.quality}
            <span className="text-[12px] font-semibold text-[#999999]"> · {summary.redCount} flag{summary.redCount === 1 ? '' : 's'}</span>
          </p>
          <div className="mt-1 space-y-0.5">
            {summary.approachLine && (
              <p className={`text-[12px] leading-snug ${summary.approachFlagged ? 'text-red-700' : 'text-[#6B6B6B]'}`}>
                When stuck: &quot;{summary.approachLine}&quot;
              </p>
            )}
            {summary.investmentLine && (
              <p className={`text-[12px] leading-snug ${summary.investmentFlagged ? 'text-red-700' : 'text-[#6B6B6B]'}`}>
                Investment: &quot;{summary.investmentLine}&quot;
              </p>
            )}
          </div>
        </div>

        {/* Offer */}
        <div>
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">Offer</p>
          {summary.doNotPitch && (
            <p className="inline-flex items-center gap-1.5 text-[12px] font-bold text-red-700 mb-1">
              <Ban size={12} /> Do not pitch 1:1
            </p>
          )}
          <p className="text-[13px] text-[#3A3A3A] leading-relaxed">{summary.offerLine}</p>
        </div>

        {/* Path */}
        <div>
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-1.5">Likely path</p>
          <p className="inline-flex items-start gap-1.5 text-[13px] text-[#3A3A3A] leading-relaxed">
            <Route size={13} className="text-[#999999] mt-0.5 shrink-0" />
            {summary.pathLine}
          </p>
        </div>
      </div>

      {/* Critical hold */}
      {summary.criticalHold.length > 0 && (
        <div className="px-5 pb-5">
          <p className="text-[10px] font-bold text-[#999999] uppercase tracking-[0.14em] mb-2">Hold these</p>
          <ol className="space-y-1.5">
            {summary.criticalHold.map((h, i) => (
              <li key={i} className="flex gap-2.5 text-[13px] text-[#3A3A3A] leading-snug">
                <span className="text-[11px] font-bold text-[#1B6DFC] tabular-nums pt-0.5">{i + 1}</span>
                <span>{h}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Key lines */}
      {summary.keyLines.length > 0 && (
        <details className="border-t border-[#E5E5E5] group">
          <summary className="px-5 py-3 cursor-pointer text-[12px] font-semibold text-[#6B6B6B] hover:text-[#1A1A1A] flex items-center gap-1.5 select-none">
            <Quote size={12} /> Lines to have ready ({summary.keyLines.length})
          </summary>
          <ul className="px-5 pb-4 space-y-2">
            {summary.keyLines.map((k, i) => (
              <li key={i} className="text-[13px] text-[#3A3A3A] italic leading-relaxed border-l-2 border-[#E5E5E5] pl-3">
                {k.replace(/^"|"$/g, '')}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
