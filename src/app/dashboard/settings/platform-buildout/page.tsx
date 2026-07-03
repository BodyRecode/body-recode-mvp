import Link from 'next/link'
import { PageHeader } from '@/components/dashboard/ui'
import {
  PHASES,
  allSteps,
  stepsByStatus,
  phaseProgress,
  nextUpStep,
  phaseGateReview,
  type Phase,
  type Step,
  type StepStatus,
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
      </div>

      {/* Next up + phase gate */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {next && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50">
            <div className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-1">Next up</div>
            <div className="text-[15px] font-semibold text-stone-900 mb-1">
              Phase {next.phase.id} · {next.step.title}
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed">{next.step.description}</p>
          </div>
        )}
        {gate && (
          <div className="p-4 rounded-xl border border-green-200 bg-green-50">
            <div className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-1">Phase gate</div>
            <div className="text-[15px] font-semibold text-stone-900 mb-1">
              Phase {gate.id} complete — review before starting Phase {gate.id + 1}
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              All non-deferred steps in this phase have shipped. Take a beat to validate outcomes before absorbing the next phase&apos;s cost.
            </p>
          </div>
        )}
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

      <ul className="divide-y divide-stone-100">
        {phase.steps.map((step) => (
          <StepRow key={step.id} step={step} />
        ))}
      </ul>
    </section>
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
