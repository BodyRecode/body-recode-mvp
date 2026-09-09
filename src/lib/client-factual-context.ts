/**
 * The facts a client-facing reading must not get wrong, loaded once and shared
 * by the generator that writes the reading and the guard that checks it.
 *
 * ── Why this exists ──
 *
 * On 8 Sep 2026 Razia's Foundational Reading described her as a beginner being
 * eased in: *"we're building your on-ramp conservatively rather than assuming a
 * fitness base that isn't there yet."* She was sixteen weeks in, one day into
 * her third training block, and had trained with her coach that week.
 *
 * The model was not being careless. It was never told when she started. The
 * generator receives her intake, her live plan and program, and the CFFS. There
 * is no start date, no elapsed time, no count of what she has already done. So
 * it wrote from the only story available: the intake, which in May was correct.
 *
 * **A missing input is not a prompting problem.** No system prompt fixes a fact
 * that was never in the room, which is why this is code and not wording. It is
 * also the class of defect that matters most for licensing: fixed once here, it
 * is fixed for every coach on the platform, forever.
 *
 * ── Why the generator and the guard share it ──
 *
 * The guard's lint asks "does this text contradict what was true?". If it
 * assembled its own idea of what was true, the two could disagree, and a
 * reading could be blocked for contradicting a fact the generator never had, or
 * pass while contradicting one it did. One loader, both callers.
 *
 * ── What this deliberately is not ──
 *
 * It is not the reading's source material. Intake, CFFS and coach guidance are
 * what a reading is written FROM. These are constraints written AGAINST: do not
 * contradict them, do not describe a person these facts say she is not. Several
 * are unsuitable as material in their own right, and the prompt section below
 * says so in as many words, because a model handed a number will use it.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ClientFactualContext {
  /** Whole weeks since coaching started. Null when no start date is recorded. */
  weeksInCoaching: number | null
  /** Completed blocks, i.e. programs that are no longer the active one. */
  blocksCompleted: number
  /** 1-based ordinal of the block they are on now, null when none is active. */
  currentBlockNumber: number | null
  currentBlockName: string | null
  /**
   * Logged sessions. Carries its own health warning: three logging faults
   * between July and September lost sessions for clients who did turn up, so a
   * low count is not evidence of a low attendance.
   */
  sessionsLogged: number
  lastSessionAt: string | null
  sessionCountTrustworthy: boolean
  /** False when this client has had a reading of this kind published before. */
  isFirstReading: boolean
  /** Age in weeks of the foundational read this reading is built on. */
  sourceAgeWeeks: number | null
  /** Free text exactly as recorded on the client record. */
  medications: string | null
  /** Slugs of everything currently assigned. */
  assignedSupplements: string[]
  measurements: {
    firstAt: string | null
    latestAt: string | null
    /** Only the entries that moved, or held when the scale did not. */
    changes: { name: string; from: number; to: number; unit: string }[]
  } | null
  /** The state on the record, so a reading naming a different one is catchable. */
  bodyState: string | null
}

const WEEK_MS = 7 * 86400000

function weeksSince(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return null
  const w = Math.floor((Date.now() - t) / WEEK_MS)
  return w < 0 ? null : w
}

/**
 * Sessions logged before 8 Sep 2026 are not a reliable record of attendance.
 * Three separate faults dropped them: a block week that rolled at activation
 * time rather than midnight, a day label matched against the whole compound
 * string, and a hard refusal to log anything past a block's final week. All
 * three are fixed; the history they damaged is not recoverable.
 */
const LOGGING_TRUSTWORTHY_FROM = new Date('2026-09-08T00:00:00Z').getTime()

export async function loadClientFactualContext(
  admin: SupabaseClient,
  clientId: string,
  opts: {
    /** Which reading is being written, for the first-reading check. */
    kind: 'cffs' | 'program' | 'nutrition' | 'trajectory'
    /** Generation timestamp of the foundational read being used as source. */
    sourceGeneratedAt?: string | null
  }
): Promise<ClientFactualContext> {
  const [
    { data: client },
    { data: programs },
    { data: sessions },
    { data: supplements },
    { data: baselines },
    { data: cffs },
  ] = await Promise.all([
    admin.from('clients').select('coaching_started_at, medications').eq('id', clientId).maybeSingle(),
    admin.from('programs').select('block_name, is_active, generated_at').eq('client_id', clientId).order('generated_at'),
    admin.from('session_completions').select('completed_at').eq('client_id', clientId).not('completed_at', 'is', null).order('completed_at', { ascending: false }),
    admin.from('supplement_assignments').select('substance_slug').eq('client_id', clientId).eq('status', 'active'),
    admin.from('baselines').select('*').eq('client_id', clientId).order('captured_at'),
    admin.from('cffs').select('body_state_classification, client_reading_published_at').eq('client_id', clientId).eq('is_archived', false).order('generated_at', { ascending: false }).limit(1).maybeSingle(),
  ])

  const allPrograms = programs ?? []
  const activeIdx = allPrograms.findIndex(p => p.is_active)
  const sessionRows = sessions ?? []
  const lastSessionAt = sessionRows[0]?.completed_at ?? null

  return {
    weeksInCoaching: weeksSince(client?.coaching_started_at),
    blocksCompleted: allPrograms.filter(p => !p.is_active).length,
    currentBlockNumber: activeIdx >= 0 ? activeIdx + 1 : null,
    currentBlockName: activeIdx >= 0 ? (allPrograms[activeIdx].block_name as string) : null,
    sessionsLogged: sessionRows.length,
    lastSessionAt,
    sessionCountTrustworthy: sessionRows.every(
      s => new Date(s.completed_at as string).getTime() >= LOGGING_TRUSTWORTHY_FROM
    ),
    isFirstReading: opts.kind === 'cffs' ? !cffs?.client_reading_published_at : true,
    sourceAgeWeeks: weeksSince(opts.sourceGeneratedAt),
    medications: (client?.medications as string | null) ?? null,
    assignedSupplements: (supplements ?? []).map(s => s.substance_slug as string),
    measurements: summariseMeasurements(baselines ?? []),
    bodyState: (cffs?.body_state_classification as string | null) ?? null,
  }
}

const MEASURED = [
  { key: 'bodyweight_kg', name: 'bodyweight', unit: 'kg' },
  { key: 'waist_cm', name: 'waist', unit: 'cm' },
  { key: 'hips_cm', name: 'hips', unit: 'cm' },
  { key: 'chest_cm', name: 'chest', unit: 'cm' },
]

function summariseMeasurements(rows: Record<string, unknown>[]): ClientFactualContext['measurements'] {
  if (rows.length < 2) return null
  const first = rows[0]
  const latest = rows[rows.length - 1]
  const changes: { name: string; from: number; to: number; unit: string }[] = []
  for (const m of MEASURED) {
    const a = Number(first[m.key])
    const b = Number(latest[m.key])
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue
    changes.push({ name: m.name, from: a, to: b, unit: m.unit })
  }
  if (!changes.length) return null
  return {
    firstAt: (first.captured_at as string) ?? null,
    latestAt: (latest.captured_at as string) ?? null,
    changes,
  }
}

/**
 * Render the facts for a prompt.
 *
 * Written as constraints, not material. The distinction is load-bearing: a
 * model handed "waist 106 to 105" will write a sentence about her waist, and
 * a 1 cm move over fifteen weeks is measurement noise, not a result. So the
 * numbers arrive with their meaning already bounded.
 */
export function formatFactualContextForPrompt(ctx: ClientFactualContext): string {
  const lines: string[] = [
    '',
    'FACTS ABOUT THIS CLIENT (constraints, not subject matter).',
    'Do not write about these. Do not contradict them. They exist so you do not',
    'describe a person this client is not.',
  ]

  if (ctx.weeksInCoaching != null) {
    lines.push(
      `- She has been coached here for ${ctx.weeksInCoaching} weeks.` +
        (ctx.weeksInCoaching >= 8
          ? ' She is NOT new and NOT starting out. Do not write about on-ramps, getting started, first steps, easing in, or building from scratch. Where her training history before joining was limited, say that in the past tense.'
          : '')
    )
  }
  if (ctx.currentBlockNumber != null) {
    lines.push(
      `- She is on training block ${ctx.currentBlockNumber}${ctx.currentBlockName ? ` (${ctx.currentBlockName})` : ''}, with ${ctx.blocksCompleted} block${ctx.blocksCompleted === 1 ? '' : 's'} already completed.`
    )
  }
  if (!ctx.isFirstReading) {
    lines.push('- She has read a reading from us before. Do not introduce concepts as though for the first time.')
  }
  if (ctx.sourceAgeWeeks != null && ctx.sourceAgeWeeks >= 6) {
    lines.push(
      `- The assessment behind this reading is ${ctx.sourceAgeWeeks} weeks old. Do not present it as a description of her today.`
    )
  }
  if (ctx.medications) {
    // Deliberately NOT the text itself. This field is a coach's working note:
    // on Razia it carries her drug and dose, her lab values and the numbers
    // they were measured against. Handing that to a generator whose output
    // goes to the client is how a lab value ends up in a portal. The
    // constraint needs the existence of medication, not its content.
    lines.push(
      '- She has medication recorded on her file. NEVER name, discuss, interpret or advise on medication in client-facing text. This line exists so you do not confidently attribute a change in her body to diet or training when something else may explain it.'
    )
  }
  if (ctx.assignedSupplements.length) {
    lines.push(
      `- She has ${ctx.assignedSupplements.length} supplement${ctx.assignedSupplements.length === 1 ? '' : 's'} currently assigned (${ctx.assignedSupplements.join(', ')}). Do not say nothing is being added.`
    )
  }
  if (ctx.measurements?.changes.length) {
    const parts = ctx.measurements.changes.map(c => {
      const d = c.to - c.from
      const moved = Math.abs(d) >= (c.unit === 'cm' ? 2 : 2)
      return `${c.name} ${c.from}${c.unit} to ${c.to}${c.unit}${moved ? '' : ' (unchanged within measurement error)'}`
    })
    lines.push(
      `- Measurements between ${String(ctx.measurements.firstAt).slice(0, 10)} and ${String(ctx.measurements.latestAt).slice(0, 10)}: ${parts.join('; ')}. Treat anything marked unchanged as unchanged. Do not narrate a trend from it.`
    )
  }
  if (!ctx.sessionCountTrustworthy) {
    lines.push(
      '- Her attendance record is known to be incomplete because of past logging faults. Do not comment on how consistently she has or has not trained.'
    )
  } else if (ctx.sessionsLogged) {
    lines.push(`- ${ctx.sessionsLogged} sessions logged, most recently ${String(ctx.lastSessionAt).slice(0, 10)}.`)
  }

  return lines.length > 4 ? lines.join('\n') : ''
}
