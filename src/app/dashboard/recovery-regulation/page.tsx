import Link from 'next/link'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { PageHeader, Card, SectionLabel, Pill, MONO_FONT } from '@/components/dashboard/ui'
import { PLAYBOOK_PRIORITY_ORDER, getPlaybook } from '@/lib/recovery-doctrine'
import { resolveRouterMode } from '@/lib/recovery-state-machine'

const execFileAsync = promisify(execFile)

/**
 * Recovery and Regulation doctrine reference page.
 *
 * Coach-facing read-only surface that:
 *   - Shows current router mode (disabled / observe_only / live_soft / live_hard)
 *   - Lists all 10 playbooks with their constraint manifests, triggers, exit criteria
 *   - Surfaces the canonical Layer 2 doctrine sourced live from Dropbox
 *
 * The doctrine itself is sourced from Dropbox at request time so the page
 * always reflects canon — no drift between code and master files.
 */

const DOCTRINE_ROOT = path.join(
  process.env.HOME || '/Users/kadedunstone',
  'Dropbox/01_BODY_RECODE/01_Programs_and_Funnels/01_BODY_RECODE_FUNNEL/05_Interprative_System_&_Perforamnce_Coaching_SaaS/Body_Recode_Performance_Coaching_Framework_Master_Folder_v1/12_Recovery_and_Regulation_System',
)

const MSA_RRS_ROOT = path.join(
  process.env.HOME || '/Users/kadedunstone',
  'Dropbox/01_BODY_RECODE/01_Programs_and_Funnels/01_BODY_RECODE_FUNNEL/05_Interprative_System_&_Perforamnce_Coaching_SaaS/Body_Recode_Master_System_Architecture/01_Pillar_Master_Frameworks_Layer_2/04_Recovery_and_Regulation_System',
)

interface DoctrineFile {
  filename: string
  section: string
  title: string
  body: string
}

async function readDocxAsText(filePath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync('textutil', ['-convert', 'txt', '-stdout', filePath], {
      maxBuffer: 5 * 1024 * 1024,
    })
    return stdout
  } catch (err) {
    return `[unable to read: ${err instanceof Error ? err.message : String(err)}]`
  }
}

async function loadFolder12Doctrine(): Promise<DoctrineFile[]> {
  try {
    const subdirs = await fs.readdir(DOCTRINE_ROOT, { withFileTypes: true })
    const sections = subdirs.filter(d => d.isDirectory()).map(d => d.name).sort()
    const out: DoctrineFile[] = []

    for (const section of sections) {
      const sectionDir = path.join(DOCTRINE_ROOT, section)
      const files = await fs.readdir(sectionDir)
      const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$') && !f.startsWith('.'))
      docxFiles.sort()
      for (const filename of docxFiles) {
        const fullPath = path.join(sectionDir, filename)
        const body = await readDocxAsText(fullPath)
        const title = filename
          .replace(/_v\d+\.\d+(?:-\d+)?(?:_FORMATTED|_VERBATIM|_FULL|_FINAL_FULL|_FINAL_EXACT|_FINAL)?\.docx$/, '')
          .replace(/^\d+[A-Z]?_\d+_/, '')
          .replace(/_/g, ' ')
        out.push({ filename, section, title, body })
      }
    }
    return out
  } catch (err) {
    return [{
      filename: 'error',
      section: 'load_error',
      title: 'Doctrine source unavailable',
      body: `Unable to read doctrine from Dropbox. ${err instanceof Error ? err.message : String(err)}`,
    }]
  }
}

async function loadMsaRrsDoctrine(): Promise<DoctrineFile[]> {
  try {
    const subdirs = await fs.readdir(MSA_RRS_ROOT, { withFileTypes: true })
    const sections = subdirs.filter(d => d.isDirectory()).map(d => d.name).sort()
    const out: DoctrineFile[] = []

    for (const section of sections) {
      const sectionDir = path.join(MSA_RRS_ROOT, section)
      const files = await fs.readdir(sectionDir)
      const docxFiles = files.filter(f => f.endsWith('.docx') && !f.startsWith('~$') && !f.startsWith('.'))
      docxFiles.sort()
      for (const filename of docxFiles) {
        const fullPath = path.join(sectionDir, filename)
        const body = await readDocxAsText(fullPath)
        const title = filename
          .replace(/_v\d+\.\d+(?:-\d+)?_CANONICAL(?:-\d+)?\.docx$/, '')
          .replace(/^RRS_/, '')
          .replace(/_/g, ' ')
        out.push({ filename, section, title, body })
      }
    }
    return out
  } catch {
    return []
  }
}

function fmtRange(r: readonly [number, number] | null): string {
  if (!r) return '—'
  return r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`
}

function modePill(mode: ReturnType<typeof resolveRouterMode>) {
  switch (mode) {
    case 'disabled':
      return <Pill accent="neutral">Router disabled</Pill>
    case 'observe_only':
      return <Pill accent="amber">Phase 0 — observe-only</Pill>
    case 'live_soft_gate':
      return <Pill accent="blue">Live — soft gate</Pill>
    case 'live_hard_gate':
      return <Pill accent="teal">Live — hard gate</Pill>
  }
}

// Cache the doctrine page for 1 hour. Reading 50+ docx files via textutil takes
// ~2 minutes on a cold load; the doctrine itself is locked at v1.0 and rarely
// changes. Coach reloads will hit the cache; explicit Vercel rebuilds bust it.
export const revalidate = 3600

export default async function RecoveryRegulationPage() {
  const mode = resolveRouterMode()
  const [folder12, msaRrs] = await Promise.all([loadFolder12Doctrine(), loadMsaRrsDoctrine()])

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-8">
      <PageHeader
        eyebrow="System Doctrine"
        title="Recovery and Regulation"
        subtitle="Layer 2 doctrine + 10 applied execution playbooks from 13D. Read-only canonical reference."
        accent="teal"
      />

      <div className="mt-6 flex items-center gap-3 text-[13px]" style={{ fontFamily: MONO_FONT }}>
        <span className="text-[#6B6B6B]">Router mode:</span>
        {modePill(mode)}
        <span className="text-[#999999]">·</span>
        <span className="text-[#6B6B6B]">
          {mode === 'observe_only'
            ? 'Decisions logged to recovery_adjustments. No states activated, no programs constrained.'
            : mode === 'disabled'
              ? 'Router not running. Set RRS_ROUTER_ENABLED=true to enable.'
              : mode === 'live_soft_gate'
                ? 'States activated. Constraints flagged on program/nutrition gen as override-able policy.'
                : 'States activated. Constraints hard-block program changes that violate doctrine.'}
        </span>
      </div>

      {/* ===========================================================
          The 10 playbooks — primary coach-facing surface
          =========================================================== */}
      <section className="mt-12">
        <SectionLabel>Applied Execution Playbooks (13D)</SectionLabel>
        <p className="text-[13px] text-[#6B6B6B] mt-2 max-w-3xl">
          One dominant playbook may govern execution at a time. Priority order (13D_15): tier 1 overrides
          all others. Single-dominant rule: states do not stack. Lock-in durations (13D_14) prevent oscillation.
        </p>

        <div className="mt-6 grid gap-4">
          {PLAYBOOK_PRIORITY_ORDER.map(pid => {
            const p = getPlaybook(pid)
            const tierAccent = p.tier === 1 ? '#DC2626' : p.tier === 2 ? '#B7791F' : p.tier <= 4 ? '#60a5fa' : '#999999'
            return (
              <Card key={pid} className="relative overflow-hidden">
                <span className="absolute left-0 top-0 bottom-0 w-[3px]" style={{ background: tierAccent }} />
                <div className="flex items-start justify-between gap-6 mb-4 pl-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>
                      <span>{p.source}</span>
                      <span className="text-[#999999]">·</span>
                      <span>Tier {p.tier}</span>
                      <span className="text-[#999999]">·</span>
                      <span>{p.permissibleCategory.replace(/_/g, ' ')}</span>
                    </div>
                    <h3 className="text-[18px] text-[#1A1A1A] mt-1">{p.name}</h3>
                    <p className="text-[13px] text-[#6B6B6B] mt-1 max-w-2xl">{p.purpose}</p>
                  </div>
                  <div className="text-right text-[12px] text-[#6B6B6B] shrink-0" style={{ fontFamily: MONO_FONT }}>
                    Lock-in {p.minDurationDays}d<br />
                    Max {p.maxDurationDays === 9999 ? '∞' : `${p.maxDurationDays}d`}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-[12px]" style={{ fontFamily: MONO_FONT }}>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#999999] mb-2">Training constraints</div>
                    <dl className="space-y-1 text-[#d6d3d1]">
                      <ConstraintRow label="Load reduction" value={p.trainingConstraints.loadReductionPct ? `${fmtRange(p.trainingConstraints.loadReductionPct)}%` : '—'} />
                      <ConstraintRow label="Density rest +" value={p.trainingConstraints.densityRestIncreasePct ? `${fmtRange(p.trainingConstraints.densityRestIncreasePct)}%` : '—'} />
                      <ConstraintRow label="Sessions/wk cap" value={p.trainingConstraints.sessionsPerWeekCap ?? '—'} />
                      <ConstraintRow label="Sessions removed" value={p.trainingConstraints.sessionsRemovedPerWeek ? fmtRange(p.trainingConstraints.sessionsRemovedPerWeek) : '—'} />
                      <ConstraintRow label="Session duration cap" value={p.trainingConstraints.sessionDurationPctCap ? `${p.trainingConstraints.sessionDurationPctCap}%` : '—'} />
                      <ConstraintRow label="Training removal" value={p.trainingConstraints.trainingRemovalDays ? `${fmtRange(p.trainingConstraints.trainingRemovalDays)}d` : '—'} />
                      <ConstraintRow label="Reintro load cap" value={p.trainingConstraints.reintroductionLoadPctCap ? `${p.trainingConstraints.reintroductionLoadPctCap}%` : '—'} />
                      <ConstraintRow label="Progression locked" value={p.trainingConstraints.progressionLocked ? 'YES' : 'no'} highlight={p.trainingConstraints.progressionLocked} />
                      <ConstraintRow label="Conditioning blocked" value={p.trainingConstraints.conditioningBlocked ? 'YES' : 'no'} highlight={p.trainingConstraints.conditioningBlocked} />
                      <ConstraintRow label="Testing blocked" value={p.trainingConstraints.testingBlocked ? 'YES' : 'no'} highlight={p.trainingConstraints.testingBlocked} />
                    </dl>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-[#999999] mb-2">Exit criteria</div>
                    <ul className="space-y-1 text-[#d6d3d1]">
                      {p.exitCriteria.stableRecoveryDaysMin && (
                        <li>Stable recovery markers ≥ {p.exitCriteria.stableRecoveryDaysMin} days</li>
                      )}
                      {p.exitCriteria.postSessionRecoveryHoursMax && (
                        <li>Post-session recovery ≤ {p.exitCriteria.postSessionRecoveryHoursMax}h</li>
                      )}
                      {p.exitCriteria.sleepStableDaysMin && (
                        <li>Sleep stable ≥ {p.exitCriteria.sleepStableDaysMin} days</li>
                      )}
                      {p.exitCriteria.behaviouralStabilityDaysMin && (
                        <li>Behavioural stability ≥ {p.exitCriteria.behaviouralStabilityDaysMin} days</li>
                      )}
                      {p.exitCriteria.additionalCriteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                    <div className="text-[10px] uppercase tracking-wider text-[#999999] mt-4 mb-2">Escalation</div>
                    <ul className="space-y-1 text-[#d6d3d1]">
                      <li>T1 review at {p.escalation.tier1ReviewDays} days</li>
                      <li>T2 → {p.escalation.tier2EscalateTo.replace(/_/g, ' ')} at {p.escalation.tier2EscalateDays} days</li>
                      <li>T3 cycling within {p.escalation.tier3CyclesWithinDays} days → system review</li>
                    </ul>
                  </div>
                </div>

                {p.prohibitions.length > 0 && (
                  <details className="mt-4 group">
                    <summary className="text-[12px] text-[#6B6B6B] cursor-pointer hover:text-[#1A1A1A]" style={{ fontFamily: MONO_FONT }}>
                      Prohibitions ({p.prohibitions.length}) · Common failures ({p.commonFailures.length})
                    </summary>
                    <div className="grid md:grid-cols-2 gap-4 mt-3 text-[12px]" style={{ fontFamily: MONO_FONT }}>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#999999] mb-2">Prohibited</div>
                        <ul className="space-y-1 text-[#d6d3d1] list-disc list-inside">
                          {p.prohibitions.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-[#999999] mb-2">Common failures</div>
                        <ul className="space-y-1 text-[#d6d3d1] list-disc list-inside">
                          {p.commonFailures.map((x, i) => <li key={i}>{x}</li>)}
                        </ul>
                      </div>
                    </div>
                  </details>
                )}
              </Card>
            )
          })}
        </div>
      </section>

      {/* ===========================================================
          Layer 2 doctrine — Folder 12 + MSA RRS
          =========================================================== */}
      <section className="mt-16">
        <SectionLabel>Layer 2 doctrine — sourced live from Dropbox</SectionLabel>
        <p className="text-[13px] text-[#6B6B6B] mt-2 max-w-3xl">
          Read directly from <code className="text-[#1B6DFC]">~/Dropbox/01_BODY_RECODE/.../12_Recovery_and_Regulation_System/</code>{' '}
          and <code className="text-[#1B6DFC]">.../04_Recovery_and_Regulation_System/</code>. This page is the canonical
          coach-facing reference; if a file changes in Dropbox, this page reflects it on next request.
        </p>

        <div className="mt-6 space-y-2">
          {Array.from(groupBySection(folder12).entries()).map(([section, files]) => (
            <details key={section} className="border border-[#E5E5E5] rounded-md">
              <summary className="px-4 py-3 cursor-pointer text-[14px] text-[#1A1A1A] hover:bg-[#FFFFFF]">
                <span className="text-[12px] text-[#1B6DFC] mr-2" style={{ fontFamily: MONO_FONT }}>PCF</span>
                {section.replace(/^\d+[A-Z]?_/, '').replace(/_/g, ' ')}
                <span className="text-[12px] text-[#999999] ml-2">({files.length} {files.length === 1 ? 'file' : 'files'})</span>
              </summary>
              <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                {files.map(f => (
                  <details key={f.filename} className="px-4 py-2.5">
                    <summary className="cursor-pointer text-[13px] text-[#d6d3d1] hover:text-[#1A1A1A]">
                      {f.title}
                    </summary>
                    <pre className="mt-3 text-[12px] text-[#6B6B6B] whitespace-pre-wrap leading-relaxed font-sans max-h-[60vh] overflow-y-auto">
                      {f.body}
                    </pre>
                  </details>
                ))}
              </div>
            </details>
          ))}

          {msaRrs.length > 0 && Array.from(groupBySection(msaRrs).entries()).map(([section, files]) => (
            <details key={`msa-${section}`} className="border border-[#E5E5E5] rounded-md">
              <summary className="px-4 py-3 cursor-pointer text-[14px] text-[#1A1A1A] hover:bg-[#FFFFFF]">
                <span className="text-[12px] text-[#B7791F] mr-2" style={{ fontFamily: MONO_FONT }}>MSA</span>
                {section.replace(/^\d+[A-Z]?_/, '').replace(/_/g, ' ')}
                <span className="text-[12px] text-[#999999] ml-2">({files.length} {files.length === 1 ? 'file' : 'files'})</span>
              </summary>
              <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                {files.map(f => (
                  <details key={f.filename} className="px-4 py-2.5">
                    <summary className="cursor-pointer text-[13px] text-[#d6d3d1] hover:text-[#1A1A1A]">
                      {f.title}
                    </summary>
                    <pre className="mt-3 text-[12px] text-[#6B6B6B] whitespace-pre-wrap leading-relaxed font-sans max-h-[60vh] overflow-y-auto">
                      {f.body}
                    </pre>
                  </details>
                ))}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ===========================================================
          Footer / cross-links
          =========================================================== */}
      <section className="mt-12 text-[12px] text-[#6B6B6B]" style={{ fontFamily: MONO_FONT }}>
        <p>
          Code:{' '}
          <Link href="https://github.com/BodyRecode/body-recode-mvp/blob/main/src/lib/recovery-doctrine.ts" className="text-[#1B6DFC] hover:underline">recovery-doctrine.ts</Link>{' '}·{' '}
          <Link href="https://github.com/BodyRecode/body-recode-mvp/blob/main/src/lib/recovery-router.ts" className="text-[#1B6DFC] hover:underline">recovery-router.ts</Link>{' '}·{' '}
          <Link href="https://github.com/BodyRecode/body-recode-mvp/blob/main/src/lib/recovery-state-machine.ts" className="text-[#1B6DFC] hover:underline">recovery-state-machine.ts</Link>
        </p>
        <p className="mt-1">
          DB tables: <code>recovery_signal_block</code>, <code>recovery_states</code>, <code>recovery_adjustments</code>
        </p>
        <p className="mt-1">
          Env flags: <code>RRS_ROUTER_ENABLED</code>, <code>RRS_OBSERVE_ONLY</code>, <code>RRS_HARD_ENFORCEMENT</code>
        </p>
      </section>
    </div>
  )
}

/* ===========================================================
 * Helpers
 * =========================================================== */

function ConstraintRow({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#6B6B6B]">{label}</dt>
      <dd className={highlight ? 'text-[#B7791F] font-semibold' : 'text-[#d6d3d1]'}>{value}</dd>
    </div>
  )
}

function groupBySection(files: DoctrineFile[]): Map<string, DoctrineFile[]> {
  const m = new Map<string, DoctrineFile[]>()
  for (const f of files) {
    const arr = m.get(f.section) ?? []
    arr.push(f)
    m.set(f.section, arr)
  }
  return m
}
