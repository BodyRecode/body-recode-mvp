import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/dashboard/ui'
import {
  boardStats,
  phaseProgress,
  nextUpStepIn,
  phaseGateReviewIn,
  type Phase,
  type Step,
  type StepStatus,
  type Doc,
} from '@/lib/buildout-types'

/**
 * One board, two uses: the Body Recode build and the Performance Coaching build.
 * Extracted from the single platform-buildout page on 9 Sep 2026 so the split
 * along the Layer 1 / Layer 2 line does not mean two copies of this UI.
 *
 * Everything specific to a board — its heading, its explainer, its docs and its
 * source-of-truth footer — comes in as props. The rendering, the maths and the
 * legend are shared.
 */
export type BuildoutBoardProps = {
  phases: Phase[]
  crossPhaseDocs: Doc[]
  eyebrow: string
  title: string
  subtitle: string
  /** Board-specific "how to read this page" panel. */
  explainer: ReactNode
  /** Sentence under the progress bar explaining what 100% would mean for THIS board. */
  progressNote: string
  /** Source-of-truth line at the bottom. */
  footer: ReactNode
}

export function BuildoutBoard({
  phases,
  crossPhaseDocs,
  eyebrow,
  title,
  subtitle,
  explainer,
  progressNote,
  footer,
}: BuildoutBoardProps) {

  const {
    shipped: shippedSteps,
    inProgress: inProgressSteps,
    planned: plannedSteps,
    deferred: deferredSteps,
    blocked: blockedSteps,
    pct: overallPct,
  } = boardStats(phases)

  const next = nextUpStepIn(phases)
  const gate = phaseGateReviewIn(phases)

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
      />

      {explainer}

      {/* Legend: statuses + effort */}
      <details className="mb-6 p-4 rounded-xl border border-[#E8EAEE] bg-[#FBFCFD]/60">
        <summary className="cursor-pointer text-[13.5px] font-semibold text-[#141821] tracking-[-0.015em] select-none">
          Legend · statuses + effort
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-[#141821] leading-relaxed">
          <div>
            <div className="text-[11px] font-medium text-[#666D7A] mb-2">Status badges</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <StatusChip status="shipped" />
                <span>Landed in production. <code className="text-[11px]">shippedAt</code> is stamped and commit SHAs are attached.</span>
              </li>
              <li className="flex items-start gap-2">
                <StatusChip status="in_progress" />
                <span>Currently being worked on. At most one step per phase should be in progress at a time.</span>
              </li>
              <li className="flex items-start gap-2">
                <StatusChip status="planned" />
                <span>Scoped and ready to build. Not started. If it has a <code className="text-[11px]">blockedBy</code> ref, it&apos;s waiting on that step to ship.</span>
              </li>
              <li className="flex items-start gap-2">
                <StatusChip status="blocked" />
                <span>Was in progress but hit a wall. The <code className="text-[11px]">notes</code> field explains the blocker + what unblocks it.</span>
              </li>
              <li className="flex items-start gap-2">
                <StatusChip status="deferred" />
                <span>Deliberately deprioritised — decided-not-now, not incomplete. Excluded from progress %. Notes explain why.</span>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-[11px] font-medium text-[#666D7A] mb-2">Effort sizing</div>
            <ul className="space-y-2">
              <li><span className="inline-block w-6 text-[11px] font-mono font-medium text-[#666D7A]">S</span> <strong>Small</strong> — a few hours to a day. Config change, small helper, single-file fix, non-build decision.</li>
              <li><span className="inline-block w-6 text-[11px] font-mono font-medium text-[#666D7A]">M</span> <strong>Medium</strong> — 1-2 weeks. New schema + a handful of endpoints + a UI, or a codemod across a bounded set of files.</li>
              <li><span className="inline-block w-6 text-[11px] font-mono font-medium text-[#666D7A]">L</span> <strong>Large</strong> — weeks. Cross-cutting refactor, new subsystem, or 100+ file mutation with per-file decisions.</li>
            </ul>
            <p className="text-[11px] text-[#666D7A] mt-3 italic">Sizes match the original build-plan notation. A single L can bundle several M work units — the estimate captures elapsed calendar time, not lines of code.</p>
          </div>
        </div>
      </details>

      {/* Progress overview */}
      <div className="mb-8 p-5 rounded-xl border border-[#E8EAEE] bg-white">
        <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-medium text-[#666D7A]">Overall progress</div>
            <div className="text-[36px] font-bold text-[#141821] mt-1 font-mono">
              {overallPct}<span className="text-[20px] text-[#98A0AD]">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-medium text-[#666D7A]">Steps</div>
            <div className="text-[13px] text-[#141821] mt-1 font-mono">
              {shippedSteps} shipped · {inProgressSteps} in progress · {plannedSteps} planned · {deferredSteps} deferred
              {blockedSteps > 0 && <> · <span className="text-[#C82626]">{blockedSteps} blocked</span></>}
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-[#F4F6F9] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1B6DFC]"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="text-[11px] text-[#666D7A] mt-3 leading-relaxed">
          Overall progress = shipped steps ÷ (total steps − deferred). Deferred steps are decided-not-now (excluded from the denominator), not incomplete. {progressNote}</p>
      </div>

      {/* Next up + phase gate */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {next && (
          <div className="p-4 rounded-xl border border-[#B5CFFC] bg-[rgba(27,109,252,0.08)]">
            <div className="text-[11px] font-medium text-[#1056D6] mb-1">Next up</div>
            <div className="text-[15px] font-semibold text-[#141821] mb-1">
              Phase {next.phase.id} · {next.step.title}
            </div>
            <p className="text-[13px] text-[#141821] leading-relaxed mb-2">{next.step.description}</p>
            <p className="text-[11px] text-[#0B4FCB]/80 italic leading-relaxed">
              Why this: it&apos;s the first in-progress step (or the first planned step with no active blocker) across all phases in order.
            </p>
          </div>
        )}
        {gate && (
          <div className="p-4 rounded-xl border border-[#CAE7D5] bg-[#EDF8F1]">
            <div className="text-[11px] font-medium text-[#177245] mb-1">Phase gate</div>
            <div className="text-[15px] font-semibold text-[#141821] mb-1">
              Phase {gate.id} complete — review before starting Phase {gate.id + 1}
            </div>
            <p className="text-[13px] text-[#141821] leading-relaxed mb-2">
              All non-deferred steps in this phase have shipped. Take a beat to validate outcomes before absorbing the next phase&apos;s cost.
            </p>
            <p className="text-[11px] text-[#125C37]/80 italic leading-relaxed">
              Why this: this phase has zero non-deferred planned/in-progress steps left, and the next phase has zero shipped/in-progress steps. That&apos;s a natural checkpoint.
            </p>
          </div>
        )}
      </div>

      {/* Reference library — cross-phase docs */}
      <div className="mb-8 br-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E8EAEE] bg-[#FBFCFD]">
          <div className="text-[10px] font-medium text-[#666D7A]">Reference library</div>
          <h2 className="text-[16px] font-bold text-[#141821] mt-0.5">Cross-phase docs</h2>
          <p className="text-[12px] text-[#666D7A] leading-relaxed mt-1">
            The strategic + operational docs that span multiple phases. Both .md (source) and .docx (Word-friendly) versions served from the deployment — click either to open.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {crossPhaseDocs.map((d) => (
            <DocCard key={d.mdUrl} doc={d} />
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {phases.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      {footer}
    </div>
  )
}

function PhaseCard({ phase }: { phase: Phase }) {
  const p = phaseProgress(phase)
  const barColor = p.pct === 100 ? 'bg-[#22A05A]' : p.pct >= 50 ? 'bg-[#1B6DFC]' : p.pct > 0 ? 'bg-[#B7791F]' : 'bg-[#E8EAEE]'

  return (
    <section className="br-card overflow-hidden">
      <div className="px-5 py-4 border-b border-[#E8EAEE] bg-[#FBFCFD]">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-medium text-[#666D7A]">Phase {phase.id}</div>
            <h2 className="text-[18px] font-bold text-[#141821] mt-0.5">{phase.title}</h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-[#666D7A] font-mono">
              {p.shipped} / {p.total} steps
              {phase.steps.some((s) => s.status === 'deferred') && (
                <span className="text-[#98A0AD]"> · {phase.steps.filter((s) => s.status === 'deferred').length} deferred</span>
              )}
            </div>
            <div className="text-[18px] font-bold font-mono mt-0.5" style={{ color: p.pct === 100 ? '#059669' : '#1B6DFC' }}>
              {p.pct}%
            </div>
          </div>
        </div>
        <p className="text-[13px] text-[#666D7A] leading-relaxed mt-2">{phase.description}</p>
        <div className="w-full h-1.5 bg-[#EFF1F4] rounded-full overflow-hidden mt-3">
          <div className={`h-full ${barColor}`} style={{ width: `${p.pct}%` }} />
        </div>
      </div>

      {/* Phase explainer — full context on what this phase means, why it exists, when to tackle it */}
      <details className="px-5 py-3 border-b border-[#F4F6F9] bg-[rgba(27,109,252,0.08)]/20">
        <summary className="cursor-pointer text-[11px] font-medium text-[#0A46B2] select-none">
          What this phase means
        </summary>
        <div className="mt-3 space-y-2 text-[13px] text-[#141821] leading-relaxed">
          {phase.longDescription.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </details>

      {/* Phase docs */}
      {phase.docs && phase.docs.length > 0 && (
        <div className="px-5 py-3 border-b border-[#F4F6F9] bg-[#FBFCFD]/50">
          <div className="text-[11px] font-medium text-[#666D7A] mb-3">Docs for this phase</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phase.docs.map((d) => (
              <DocCard key={d.mdUrl} doc={d} />
            ))}
          </div>
        </div>
      )}

      <ul className="divide-y divide-[#F4F6F9]">
        {phase.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ul>
    </section>
  )
}

function DocCard({ doc }: { doc: Doc }) {
  const isSql = doc.mdUrl.endsWith('.sql')
  return (
    <div className="p-3 rounded-xl border border-[#E8EAEE] bg-white hover:border-[#9CC0FB] transition-colors">
      <div className="text-[13px] font-semibold text-[#141821] mb-1 break-all">{doc.title}</div>
      <p className="text-[11px] text-[#666D7A] leading-relaxed mb-2">{doc.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {doc.pdfUrl && (
          <a
            href={doc.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[12px] font-medium px-2 py-1 rounded bg-[#1560E0] text-white hover:bg-[#1056D6]"
          >
            View .pdf
          </a>
        )}
        <a
          href={doc.mdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[12px] font-medium px-2 py-1 rounded bg-[#F4F6F9] text-[#141821] hover:bg-[#DDE9FD] hover:text-[#1056D6]"
        >
          {isSql ? 'View .sql' : 'View .md'}
        </a>
        {!isSql && (
          <a
            href={doc.docxUrl}
            download
            className="text-[12px] font-medium px-2 py-1 rounded bg-[#F4F6F9] text-[#141821] hover:bg-[#DDE9FD] hover:text-[#1056D6]"
          >
            Download .docx
          </a>
        )}
      </div>
    </div>
  )
}

function StatusChip({ status }: { status: StepStatus }) {
  const badge = statusBadge(status)
  return (
    <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex-shrink-0 ${badge.classes}`}>
      {badge.label}
    </span>
  )
}

function StepRow({ step }: { step: Step }) {
  const badge = statusBadge(step.status)
  const rowTint =
    step.status === 'in_progress' ? 'bg-[rgba(27,109,252,0.08)]/50' : step.status === 'blocked' ? 'bg-[#FDEDED]/40' : ''

  return (
    <li className={`px-5 py-4 ${rowTint}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 pt-0.5">
          <span className={`inline-block text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${badge.classes}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1">
            <div className="text-[14px] font-semibold text-[#141821]">{step.title}</div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#98A0AD]">
              <span className="uppercase tracking-widest">{step.effort}</span>
              {step.shippedAt && <span>· shipped {step.shippedAt}</span>}
            </div>
          </div>
          <p className="text-[13px] text-[#141821] leading-relaxed mb-2">{step.description}</p>

          {step.notes && (
            <p className="text-[12px] text-[#666D7A] leading-relaxed mb-2 italic">
              {step.notes}
            </p>
          )}

          {step.blockedBy && (
            <div className="text-[11px] text-[#A96A12] mb-2">
              Blocked by: <code className="bg-[#FDF6E9] px-1 py-0.5 rounded text-[10px]">{step.blockedBy}</code>
            </div>
          )}

          {step.commits && step.commits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {step.commits.map((sha) => (
                <span
                  key={sha}
                  className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F4F6F9] text-[#666D7A] border border-[#E8EAEE]"
                >
                  {sha}
                </span>
              ))}
            </div>
          )}

          {step.surfaces && step.surfaces.length > 0 && (
            <details className="text-[11px] text-[#666D7A] mt-1">
              <summary className="cursor-pointer hover:text-[#141821] select-none">Surfaces ({step.surfaces.length})</summary>
              <ul className="mt-1 space-y-0.5 pl-3">
                {step.surfaces.map((s) => (
                  <li key={s} className="font-mono">
                    {s.startsWith('src/') ? (
                      <Link href={`/${s}`} className="text-[#1560E0] hover:text-[#1056D6] underline">
                        {s}
                      </Link>
                    ) : (
                      s
                    )}
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </li>
  )
}

function statusBadge(status: StepStatus): { label: string; classes: string } {
  switch (status) {
    case 'shipped':
      return { label: 'Shipped', classes: 'bg-[#D8EFE1] text-[#177245]' }
    case 'in_progress':
      return { label: 'In progress', classes: 'bg-[#DDE9FD] text-[#1056D6]' }
    case 'planned':
      return { label: 'Planned', classes: 'bg-[#F4F6F9] text-[#666D7A]' }
    case 'blocked':
      return { label: 'Blocked', classes: 'bg-[#FBDCDC] text-[#C82626]' }
    case 'deferred':
      return { label: 'Deferred', classes: 'bg-[#F4F6F9] text-[#98A0AD]' }
  }
}
