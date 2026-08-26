'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import type { ArtefactAuditResult } from '@/lib/artefact-audit'

/**
 * Per-artefact audit pill. Drops into FR / PR / NR section headers on the
 * client profile, showing green / amber / red status at-a-glance.
 *
 * Click expands to show the specific failures: which banned terms leaked,
 * whether the doctrine version is stale, and any validator issues
 * (substitution drift, macro arithmetic) for nutrition.
 *
 * The audit is computed server-side via the auditFoundationalReading /
 * auditProgramReading / auditNutritionPlan helpers in
 * src/lib/artefact-audit.ts. This component is a pure renderer of those
 * results.
 *
 * Added 2026-06-09 (item H — pre-publish dry-run preview UI).
 */
export default function ArtefactAuditPill({ audit }: { audit: ArtefactAuditResult | null }) {
  const [expanded, setExpanded] = useState(false)

  if (!audit) {
    return (
      <span className="inline-flex items-center gap-1 text-[11.5px] font-medium px-1.5 py-0.5 rounded bg-[#F3F3F0] border border-[#E8EAEE] text-[#98A0AD]">
        Not published
      </span>
    )
  }

  const statusColours: Record<typeof audit.status, { border: string; bg: string; text: string; icon: string }> = {
    green: { border: 'border-[#CAE7D5]', bg: 'bg-[#EDF8F1]', text: 'text-[#177245]', icon: 'text-[#177245]' },
    amber: { border: 'border-[#F1DEB8]', bg: 'bg-[#FDF6E9]', text: 'text-[#A96A12]', icon: 'text-[#A96A12]' },
    red:   { border: 'border-[#F5C9C9]',   bg: 'bg-[#FDEDED]',   text: 'text-[#C82626]',   icon: 'text-[#C82626]' },
  }
  const s = statusColours[audit.status]
  const Icon = audit.status === 'green' ? CheckCircle : audit.status === 'amber' ? AlertCircle : AlertTriangle

  const summary =
    audit.status === 'green' ? 'Audit passes'
      : audit.status === 'amber' ? buildAmberSummary(audit)
      : buildRedSummary(audit)

  return (
    <div className="inline-flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className={`inline-flex items-center gap-1.5 text-[11.5px] font-medium px-2 py-1 rounded border ${s.border} ${s.bg} ${s.text} hover:opacity-90 transition-opacity`}
        aria-expanded={expanded}
      >
        <Icon size={11} className={s.icon} />
        <span>{summary}</span>
        {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
      </button>

      {expanded && (
        <div className={`mt-1 rounded-md border ${s.border} ${s.bg} px-3 py-2 text-[11px] text-[#43474F] max-w-md space-y-2`}>
          <DetailRow
            label="Doctrine version"
            value={audit.storedDoctrineVersion
              ? `${audit.storedDoctrineVersion}${audit.isStale ? ` (current ${audit.currentDoctrineVersion})` : ''}`
              : 'Not stamped'}
            ok={!audit.isStale}
          />
          <DetailRow
            label="Banned-term leaks"
            value={audit.leakedTerms.length === 0 ? 'None' : audit.leakedTerms.join(', ')}
            ok={audit.leakedTerms.length === 0}
          />
          {audit.issues.length > 0 && (
            <div>
              <p className="text-[11.5px] font-medium text-[#666D7A] mb-1">Validator findings</p>
              <ul className="space-y-1">
                {audit.issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2 leading-snug">
                    <span className={`mt-0.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${issue.severity === 'error' ? 'bg-[#DC2626]' : 'bg-[#B7791F]'}`} />
                    <span><span className="font-mono text-[10px]">{issue.code}</span> · {issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {audit.publishedAt && (
            <p className="text-[10px] text-[#98A0AD]">
              Published {new Date(audit.publishedAt).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function DetailRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className={`mt-0.5 inline-block w-1.5 h-1.5 rounded-full shrink-0 ${ok ? 'bg-[#22A05A]' : 'bg-[#B7791F]'}`} />
      <div className="min-w-0">
        <p className="text-[11.5px] font-medium text-[#666D7A]">{label}</p>
        <p className="text-[11px] text-[#141821] break-words">{value}</p>
      </div>
    </div>
  )
}

function buildAmberSummary(audit: ArtefactAuditResult): string {
  const warnings = audit.issues.filter(i => i.severity === 'warning').length
  const bits: string[] = []
  if (audit.isStale) bits.push('stale doctrine')
  if (warnings > 0) bits.push(`${warnings} warning${warnings === 1 ? '' : 's'}`)
  return bits.length === 0 ? 'Audit passes with warnings' : `Review: ${bits.join(', ')}`
}

function buildRedSummary(audit: ArtefactAuditResult): string {
  const errors = audit.issues.filter(i => i.severity === 'error').length
  const bits: string[] = []
  if (audit.leakedTerms.length > 0) bits.push(`${audit.leakedTerms.length} banned term${audit.leakedTerms.length === 1 ? '' : 's'}`)
  if (errors > 0) bits.push(`${errors} blocking error${errors === 1 ? '' : 's'}`)
  return `Regenerate: ${bits.join(', ')}`
}
