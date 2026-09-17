import { createAdminClient } from '@/lib/supabase/admin'

/**
 * How much co-pilot a coach gets in a day.
 *
 * WHY (17 September 2026): the co-pilot is the part of the platform a coach
 * will use most, and the only part that costs money per message. A pilot coach
 * who leaves a conversation running, or who discovers they like it, should not
 * be able to run up the model bill quietly. A ceiling also makes the cost of
 * the pilot knowable before it starts rather than after.
 *
 * The owner has no cap. Everyone else gets DAILY_LIMIT messages per Brisbane
 * day across both co-pilots, the client bubble and the general one.
 *
 * Refusing is deliberately friendly and specific: a coach mid-thought who hits
 * an unexplained error assumes the product is broken.
 */

const DAILY_LIMIT = Number(process.env.COPILOT_DAILY_LIMIT ?? 150)

/** Brisbane day, because that is the day the coach is having. */
function today(): string {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Australia/Brisbane' }))
    .toISOString()
    .slice(0, 10)
}

export interface CopilotAllowance {
  allowed: boolean
  used: number
  limit: number
  /** Set when allowed is false. Shown to the coach as-is. */
  message?: string
}

/**
 * Counts this message against the coach's day and says whether it may run.
 * Call before generating, so a refused message costs nothing.
 *
 * The owner is waved through without a row being written: their usage is the
 * business's own, and counting it would make the pilot numbers meaningless.
 */
export async function checkCopilotAllowance(coachId: string, isOwner: boolean): Promise<CopilotAllowance> {
  if (isOwner) return { allowed: true, used: 0, limit: 0 }

  const admin = createAdminClient()
  const day = today()

  const { data: existing } = await admin
    .from('copilot_usage_daily')
    .select('messages')
    .eq('coach_id', coachId)
    .eq('day', day)
    .maybeSingle()

  const used = existing?.messages ?? 0

  if (used >= DAILY_LIMIT) {
    return {
      allowed: false,
      used,
      limit: DAILY_LIMIT,
      message: `You have used your ${DAILY_LIMIT} co-pilot messages for today. It resets at midnight. Everything else in the platform still works, and if this limit is getting in your way, say so, because that is useful to know.`,
    }
  }

  // Count it now rather than after the answer: a crash mid-generation should
  // not hand back a free message, and being one out on a cap of 150 matters to
  // nobody.
  await admin
    .from('copilot_usage_daily')
    .upsert({ coach_id: coachId, day, messages: used + 1 }, { onConflict: 'coach_id,day' })

  return { allowed: true, used: used + 1, limit: DAILY_LIMIT }
}
