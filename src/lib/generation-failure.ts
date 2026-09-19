import { createAdminClient } from './supabase/admin'

/**
 * Recording, and telling someone about, a generation that failed in front of a
 * coach.
 *
 * WHY (19 September 2026): the nutrition engine wrote validator telemetry, the
 * program and routine generators wrote nothing, and none of it raised an alert.
 * A real 422 returned to the coach on 8 September sat in a table nobody reads.
 *
 * With his own clients Kade is the person clicking Generate, so he sees the
 * error himself. The moment another coach is using this, a failure they see and
 * he does not is how a pilot dies quietly: they try twice, decide the thing is
 * broken, and never say anything.
 *
 * WHAT IS AND IS NOT A FAILURE. Only what the coach actually saw. A first
 * attempt that failed validation and passed on the second is the system working
 * as designed, and recording it would bury the ones that matter. A safety gate
 * that fired and was fixed on retry is likewise a success.
 *
 * NEVER THROWS. This is instrumentation. A generation must not fail because the
 * record of its failure could not be written.
 */

export type GenerationSurface =
  | 'nutrition'
  | 'program'
  | 'routine'
  | 'reading_foundational'
  | 'reading_nutrition'
  | 'reading_program'
  | 'reading_trajectory'

export type FailureReason =
  | 'validation_exhausted'
  | 'safety_gate'
  | 'ai_error'
  | 'parse_failure'
  | 'truncated'
  | 'unknown'

export interface GenerationFailureInput {
  surface: GenerationSurface
  reason: FailureReason
  clientId?: string | null
  coachId?: string | null
  /** What the coach was told, so an alert can quote it back to them. */
  detail?: string | null
  attempts?: number | null
  codes?: string[] | null
}

const SURFACE_WORDS: Record<GenerationSurface, string> = {
  nutrition: 'an eating plan',
  program: 'a training block',
  routine: 'a daily routine',
  reading_foundational: 'a foundational read',
  reading_nutrition: 'a nutrition read',
  reading_program: 'a program read',
  reading_trajectory: 'a trajectory read',
}

const REASON_WORDS: Record<FailureReason, string> = {
  validation_exhausted: 'it could not produce one that passed the rules, after every attempt',
  safety_gate: 'it kept writing something that is unsafe for that client',
  ai_error: 'the model call itself failed',
  parse_failure: 'the model returned something that could not be read',
  truncated: 'the model ran out of room mid-answer',
  unknown: 'the reason was not recorded',
}

export async function recordGenerationFailure(input: GenerationFailureInput): Promise<void> {
  try {
    const admin = createAdminClient()

    // The caller rarely has the coach to hand, because generation happens deep
    // inside a function the session never reaches, and an admin script has no
    // session at all. The client knows who owns them, which is the same answer
    // and one that survives both cases.
    let coachId = input.coachId ?? null
    if (!coachId && input.clientId) {
      const { data: owner } = await admin.from('clients').select('coach_id').eq('id', input.clientId).maybeSingle()
      coachId = (owner?.coach_id as string | null) ?? null
    }
    const { data } = await admin
      .from('generation_failures')
      .insert({
        surface: input.surface,
        reason: input.reason,
        client_id: input.clientId ?? null,
        coach_id: coachId,
        detail: input.detail ? input.detail.slice(0, 2000) : null,
        attempts: input.attempts ?? null,
        codes: input.codes && input.codes.length > 0 ? Array.from(new Set(input.codes)).slice(0, 25) : null,
      })
      .select('id, coach_id')
      .single()

    if (data) void alertIfSomeoneElsesCoach(data.id as string, { ...input, coachId })
  } catch (err) {
    console.error('[generation-failure] could not record:', err)
  }
}

/**
 * Kade is emailed immediately when the coach who hit this is NOT him, because
 * that is the case he cannot see. His own failures are in front of him on the
 * screen, and they still appear in the daily health check, so alerting on them
 * would only teach him to ignore the alert.
 */
async function alertIfSomeoneElsesCoach(failureId: string, input: GenerationFailureInput): Promise<void> {
  try {
    const { coach } = await import('@/config/tenant')
    const admin = createAdminClient()

    let coachEmail: string | null = null
    if (input.coachId) {
      const { data: authUser } = await admin.auth.admin.getUserById(input.coachId)
      coachEmail = authUser?.user?.email?.toLowerCase() ?? null
    }
    const kade = coach().email.toLowerCase()
    const adminEmail = coach().adminEmail.toLowerCase()
    if (!coachEmail || coachEmail === kade || coachEmail === adminEmail) return

    let clientName = 'a client'
    if (input.clientId) {
      const { data: client } = await admin.from('clients').select('name').eq('id', input.clientId).maybeSingle()
      if (client?.name) clientName = client.name as string
    }

    const { Resend } = await import('resend')
    const { fromBrand } = await import('./email-shell')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const subject = `A coach hit a failure: ${SURFACE_WORDS[input.surface]} for ${clientName}`
    const lines = [
      `<p><strong>${coachEmail}</strong> tried to generate ${SURFACE_WORDS[input.surface]} for ${clientName} and it failed.</p>`,
      `<p>What happened: ${REASON_WORDS[input.reason]}.</p>`,
      input.detail ? `<p>What they were told: "${escapeHtml(input.detail.slice(0, 500))}"</p>` : '',
      input.codes && input.codes.length ? `<p>Codes: ${input.codes.slice(0, 10).join(', ')}</p>` : '',
      `<p style="color:#6B6B6B;font-size:13px">They are looking at this now, and you are not. Reference ${failureId}.</p>`,
    ]
    await resend.emails.send({
      from: fromBrand(),
      to: coach().adminEmail,
      subject,
      html: lines.filter(Boolean).join('\n'),
    })
    await admin.from('generation_failures').update({ alerted_at: new Date().toISOString() }).eq('id', failureId)
  } catch (err) {
    console.error('[generation-failure] could not alert:', err)
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
