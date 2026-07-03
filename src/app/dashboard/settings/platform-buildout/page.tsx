import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import {
  PHASES,
  allSteps,
  stepsByStatus,
  phaseProgress,
  nextUpStep,
  phaseGateReview,
  CROSS_PHASE_DOCS,
  type Phase,
  type Step,
  type StepStatus,
  type Doc,
} from '@/lib/saas-buildout-manifest'

export const metadata = { title: 'Platform Buildout · Settings' }

export default function PlatformBuildoutPage() {
  const totalSteps = allSteps().length
  const shippedSteps = stepsByStatus('shipped').length
  const inProgressSteps = stepsByStatus('in_progress').length
  const plannedSteps = stepsByStatus('planned').length
  const deferredSteps = stepsByStatus('deferred').length
  const blockedSteps = stepsByStatus('blocked').length
  const meaningful = totalSteps - deferredSteps
  const overallPct = meaningful === 0 ? 0 : Math.round((shippedSteps / meaningful) * 100)

  const next = nextUpStep()
  const gate = phaseGateReview()

  return (
    <div className="max-w-[1100px]">
      <PageHeader
        eyebrow="Settings · Platform Buildout"
        title="SaaS / white-label buildout"
        subtitle="End-to-end plan for the powered platform. Every phase, every step, current status. Manifest at src/lib/saas-buildout-manifest.ts is the source of truth — the ship checklist requires updating it on every SaaS commit."
      />

      {/* Page explainer — how to read this page */}
      <details className="mb-6 p-4 rounded-2xl border border-blue-200 bg-blue-50/40">
        <summary className="cursor-pointer text-[13px] font-bold text-blue-900 uppercase tracking-widest select-none">
          How to read this page
        </summary>
        <div className="mt-3 space-y-3 text-[13px] text-stone-700 leading-relaxed">
          <p><strong>What this is.</strong> The platform buildout is Kade&apos;s already-scoped plan to turn Body Recode from a solo coach business into a licensable multi-tenant platform (Studio of Ten). It has five phases (0-4) that must be tackled in order — earlier phases lock decisions and unblock later ones.</p>
          <p><strong>What the manifest tracks.</strong> Every phase has a list of concrete steps. Each step has a status (shipped / in progress / planned / blocked / deferred), an effort estimate (S/M/L), commit SHAs where it was landed, files it touched, and notes on blockers or deferrals. Deferred steps don&apos;t count against progress — they&apos;re decisions to skip, not incomplete work.</p>
          <p><strong>What the callouts mean.</strong> The blue &quot;Next up&quot; card at the top surfaces the highest-priority actionable step (the first in-progress step, or the first planned step with no blocker). The green &quot;Phase gate&quot; card appears when a phase is 100% shipped but the next phase hasn&apos;t started — a signal to pause + review before absorbing the next phase&apos;s cost.</p>
          <p><strong>Where it&apos;s enforced.</strong> The manifest is at <code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-[11px]">src/lib/saas-buildout-manifest.ts</code>. The ship checklist (<code className="bg-white px-1 py-0.5 rounded border border-blue-200 text-[11px]">feedback_ship_checklist</code>) requires updating the manifest entry on every SaaS/white-label commit — status bump + commit SHA + shippedAt in the same commit. Silent drift is not allowed.</p>
        </div>
      </details>

      {/* Legend: statuses + effort */}
      <details className="mb-6 p-4 rounded-2xl border border-stone-200 bg-stone-50/60">
        <summary className="cursor-pointer text-[13px] font-bold text-stone-900 uppercase tracking-widest select-none">
          Legend · statuses + effort
        </summary>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] text-stone-700 leading-relaxed">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Status badges</div>
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
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-2">Effort sizing</div>
            <ul className="space-y-2">
              <li><span className="inline-block w-6 text-[11px] font-mono font-bold text-stone-500">S</span> <strong>Small</strong> — a few hours to a day. Config change, small helper, single-file fix, non-build decision.</li>
              <li><span className="inline-block w-6 text-[11px] font-mono font-bold text-stone-500">M</span> <strong>Medium</strong> — 1-2 weeks. New schema + a handful of endpoints + a UI, or a codemod across a bounded set of files.</li>
              <li><span className="inline-block w-6 text-[11px] font-mono font-bold text-stone-500">L</span> <strong>Large</strong> — weeks. Cross-cutting refactor, new subsystem, or 100+ file mutation with per-file decisions.</li>
            </ul>
            <p className="text-[11px] text-stone-500 mt-3 italic">Sizes match the original build-plan notation. A single L can bundle several M work units — the estimate captures elapsed calendar time, not lines of code.</p>
          </div>
        </div>
      </details>

      {/* Progress overview */}
      <div className="mb-8 p-5 rounded-2xl border border-stone-200 bg-white">
        <div className="flex items-baseline justify-between mb-3 gap-3 flex-wrap">
          <div>
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Overall progress</div>
            <div className="text-[36px] font-bold text-stone-900 mt-1 font-mono">
              {overallPct}<span className="text-[20px] text-stone-400">%</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest">Steps</div>
            <div className="text-[13px] text-stone-700 mt-1 font-mono">
              {shippedSteps} shipped · {inProgressSteps} in progress · {plannedSteps} planned · {deferredSteps} deferred
              {blockedSteps > 0 && <> · <span className="text-red-600">{blockedSteps} blocked</span></>}
            </div>
          </div>
        </div>
        <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
        <p className="text-[11px] text-stone-500 mt-3 leading-relaxed">
          Overall progress = shipped steps ÷ (total steps − deferred). Deferred steps are decided-not-now (excluded from the denominator), not incomplete. 100% means the platform is ready to license as-is; realistic target is 100% of Phase 2 before partner #2 signs, all phases before scaling past ten partners.
        </p>
      </div>

      {/* Next up + phase gate */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {next && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-1">Next up</div>
            <div className="text-[15px] font-semibold text-stone-900 mb-1">
              Phase {next.phase.id} · {next.step.title}
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">{next.step.description}</p>
            <p className="text-[11px] text-blue-800/80 italic leading-relaxed">
              Why this: it&apos;s the first in-progress step (or the first planned step with no active blocker) across all phases in order.
            </p>
          </div>
        )}
        {gate && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50">
            <div className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-1">Phase gate</div>
            <div className="text-[15px] font-semibold text-stone-900 mb-1">
              Phase {gate.id} complete — review before starting Phase {gate.id + 1}
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed mb-2">
              All non-deferred steps in this phase have shipped. Take a beat to validate outcomes before absorbing the next phase&apos;s cost.
            </p>
            <p className="text-[11px] text-green-800/80 italic leading-relaxed">
              Why this: this phase has zero non-deferred planned/in-progress steps left, and the next phase has zero shipped/in-progress steps. That&apos;s a natural checkpoint.
            </p>
          </div>
        )}
      </div>

      {/* Reference library — cross-phase docs */}
      <div className="mb-8 bg-white border border-stone-200 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Reference library</div>
          <h2 className="text-[16px] font-bold text-stone-900 mt-0.5">Cross-phase docs</h2>
          <p className="text-[12px] text-stone-600 leading-relaxed mt-1">
            The strategic + operational docs that span multiple phases. Both .md (source) and .docx (Word-friendly) versions served from the deployment — click either to open.
          </p>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {CROSS_PHASE_DOCS.map((d) => (
            <DocCard key={d.mdUrl} doc={d} />
          ))}
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-6">
        {PHASES.map((phase) => (
          <PhaseCard key={phase.id} phase={phase} />
        ))}
      </div>

      {/* Footer */}
      <div className="mt-10 p-4 rounded-xl border border-stone-200 bg-stone-50 text-[12px] text-stone-600 leading-relaxed">
        <strong className="text-stone-900">Source of truth:</strong> <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">src/lib/saas-buildout-manifest.ts</code>. Every SaaS commit MUST update the relevant step entry in the same commit (see <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">feedback_ship_checklist</code>). Strategic doc:{' '}
        <Link href="/dashboard/help#platform-buildout" className="text-blue-600 hover:text-blue-700 underline">
          POWERED_PLATFORM_BUILD_PLAN.md
        </Link>
        {' '}(Dropbox). Deployment runbook: PHASE_2_TENANT_DEPLOYMENT_CHECKLIST.md.
      </div>
    </div>
  )
}

function PhaseCard({ phase }: { phase: Phase }) {
  const p = phaseProgress(phase)
  const barColor = p.pct === 100 ? 'bg-green-500' : p.pct >= 50 ? 'bg-blue-500' : p.pct > 0 ? 'bg-amber-500' : 'bg-stone-300'

  return (
    <section className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-stone-200 bg-stone-50">
        <div className="flex items-baseline justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">Phase {phase.id}</div>
            <h2 className="text-[18px] font-bold text-stone-900 mt-0.5">{phase.title}</h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-stone-500 font-mono">
              {p.shipped} / {p.total} steps
              {phase.steps.some((s) => s.status === 'deferred') && (
                <span className="text-stone-400"> · {phase.steps.filter((s) => s.status === 'deferred').length} deferred</span>
              )}
            </div>
            <div className="text-[18px] font-bold font-mono mt-0.5" style={{ color: p.pct === 100 ? '#059669' : '#1B6DFC' }}>
              {p.pct}%
            </div>
          </div>
        </div>
        <p className="text-[13px] text-stone-600 leading-relaxed mt-2">{phase.description}</p>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden mt-3">
          <div className={`h-full ${barColor}`} style={{ width: `${p.pct}%` }} />
        </div>
      </div>

      {/* Phase explainer — full context on what this phase means, why it exists, when to tackle it */}
      <details className="px-5 py-3 border-b border-stone-100 bg-blue-50/20">
        <summary className="cursor-pointer text-[11px] font-bold text-blue-900 uppercase tracking-widest select-none">
          What this phase means
        </summary>
        <div className="mt-3 space-y-2 text-[13px] text-stone-700 leading-relaxed">
          {phase.longDescription.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>
      </details>

      {/* Phase docs */}
      {phase.docs && phase.docs.length > 0 && (
        <div className="px-5 py-3 border-b border-stone-100 bg-stone-50/50">
          <div className="text-[11px] font-bold text-stone-500 uppercase tracking-widest mb-3">Docs for this phase</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phase.docs.map((d) => (
              <DocCard key={d.mdUrl} doc={d} />
            ))}
          </div>
        </div>
      )}

      <ul className="divide-y divide-stone-100">
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
    <div className="p-3 rounded-xl border border-stone-200 bg-white hover:border-blue-300 transition-colors">
      <div className="text-[13px] font-semibold text-stone-900 mb-1 break-all">{doc.title}</div>
      <p className="text-[11px] text-stone-600 leading-relaxed mb-2">{doc.description}</p>
      <div className="flex items-center gap-2 flex-wrap">
        {doc.pdfUrl && (
          <a
            href={doc.pdfUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            View .pdf
          </a>
        )}
        <a
          href={doc.mdUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-blue-100 hover:text-blue-700"
        >
          {isSql ? 'View .sql' : 'View .md'}
        </a>
        {!isSql && (
          <a
            href={doc.docxUrl}
            download
            className="text-[11px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-stone-100 text-stone-700 hover:bg-blue-100 hover:text-blue-700"
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
    step.status === 'in_progress' ? 'bg-blue-50/50' : step.status === 'blocked' ? 'bg-red-50/40' : ''

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
            <div className="text-[14px] font-semibold text-stone-900">{step.title}</div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-stone-400">
              <span className="uppercase tracking-widest">{step.effort}</span>
              {step.shippedAt && <span>· shipped {step.shippedAt}</span>}
            </div>
          </div>
          <p className="text-[13px] text-stone-700 leading-relaxed mb-2">{step.description}</p>

          {step.notes && (
            <p className="text-[12px] text-stone-600 leading-relaxed mb-2 italic">
              {step.notes}
            </p>
          )}

          {step.blockedBy && (
            <div className="text-[11px] text-amber-700 mb-2">
              Blocked by: <code className="bg-amber-50 px-1 py-0.5 rounded text-[10px]">{step.blockedBy}</code>
            </div>
          )}

          {step.commits && step.commits.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {step.commits.map((sha) => (
                <span
                  key={sha}
                  className="inline-block text-[10px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 border border-stone-200"
                >
                  {sha}
                </span>
              ))}
            </div>
          )}

          {step.surfaces && step.surfaces.length > 0 && (
            <details className="text-[11px] text-stone-500 mt-1">
              <summary className="cursor-pointer hover:text-stone-700 select-none">Surfaces ({step.surfaces.length})</summary>
              <ul className="mt-1 space-y-0.5 pl-3">
                {step.surfaces.map((s) => (
                  <li key={s} className="font-mono">
                    {s.startsWith('src/') ? (
                      <Link href={`/${s}`} className="text-blue-600 hover:text-blue-700 underline">
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
      return { label: 'Shipped', classes: 'bg-green-100 text-green-700' }
    case 'in_progress':
      return { label: 'In progress', classes: 'bg-blue-100 text-blue-700' }
    case 'planned':
      return { label: 'Planned', classes: 'bg-stone-100 text-stone-600' }
    case 'blocked':
      return { label: 'Blocked', classes: 'bg-red-100 text-red-700' }
    case 'deferred':
      return { label: 'Deferred', classes: 'bg-stone-100 text-stone-400' }
  }
}
