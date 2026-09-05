/**
 * GET /api/cron/funnel-week-advance
 *
 * Daily Vercel cron. Reconciles the week a self-serve enrollment is sitting on
 * against the week it should be sitting on, computed from the purchase date.
 *
 * WHY THIS EXISTS. Blueprint, Membership and Extension weeks were advanced
 * only by a long-lived Inngest run that slept its way through the programme:
 *
 *     sleep 7d -> align to 7am -> advance -> sleep 2d -> align -> remind
 *
 * The two sleeps are sequential, so a "week" cost 7d + 2d + up to two morning
 * alignments, and the error COMPOUNDED. Dee Berry bought the Blueprint on
 * 19 Aug; Week 2 opened on schedule, Week 3 was not due to open until 7 Sep
 * instead of 2 Sep, and Week 6 would have landed on 9 Oct instead of 23 Sep.
 * She emailed on 5 Sep asking why her portal had not opened Week 3. The sleep
 * chain is also lost on any run that fails or is cancelled, with nothing to
 * notice it.
 *
 * A date is not a stopwatch. The week someone is on is a pure function of how
 * long ago they bought, so this recomputes it every morning:
 *
 *     expected week = floor((now - purchase_date) / 7 days) + 1
 *
 * That is self-healing (a missed day catches up the next morning), immune to
 * deploys and cancelled runs, and cannot drift. The Inngest advance loops are
 * left in place as a second writer but made monotonic - whichever mechanism
 * gets there first wins and neither can move a client backwards.
 *
 * Advancing is idempotent: the row is only written when the expected week is
 * genuinely ahead of the stored one, and the check-in prompt email is sent on
 * that same transition, so a second run in the same day sends nothing.
 *
 * Auth: Bearer ${CRON_SECRET}.
 * Schedule registered in vercel.json at "0 21 * * *" (7am Brisbane).
 */

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createAdminClient } from '@/lib/supabase/admin'
import { appUrl } from '@/lib/app-url'
import { fromCoach } from '@/lib/email-shell'
import { buildBlueprintCheckinPromptEmail } from '@/lib/blueprint-emails'
import { buildMembershipCheckinPromptEmail } from '@/lib/membership-emails'
import { buildExtensionWeekEmail } from '@/lib/extension-emails'

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const BLUEPRINT_WEEKS = 6
const EXTENSION_WEEKS = 12
const MEMBERSHIP_BLOCKS = ['A', 'B', 'C']
const WEEKS_PER_BLOCK = 6

/**
 * Seeded preview and demo rows share the real tables. They must never advance
 * and must never be emailed - they were created months ago, so the week maths
 * would push them straight to the end of the programme and fire a real email
 * at a fake address. Blueprint marks them with status 'preview'; Membership and
 * Extension only have the address to go on.
 */
const DEMO_EMAIL = /^(mem-demo|ext-demo|videocheck\+)/i
const isDemo = (email: string | null) => !email || DEMO_EMAIL.test(email)

/** Week number owed today, 1-based, capped at the length of the programme. */
function expectedWeek(startedAt: string, cap: number): number {
  const elapsed = Date.now() - new Date(startedAt).getTime()
  return Math.max(1, Math.min(cap, Math.floor(elapsed / WEEK_MS) + 1))
}

type Advance = { product: string; email: string; from: string; to: string; emailed: boolean }

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const admin = createAdminClient()
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  const APP_URL = appUrl()

  const advanced: Advance[] = []
  const errors: string[] = []

  // ── Blueprint: 6 weeks, flat ───────────────────────────────────────────────
  const { data: blueprints, error: bpError } = await admin
    .from('blueprint_enrollments')
    .select('id, token, email, first_name, pattern, current_week, purchase_date, status, completed_at')
    .eq('status', 'active')
    .is('completed_at', null)

  if (bpError) {
    errors.push(`blueprint query: ${bpError.message}`)
  }

  for (const e of blueprints ?? []) {
    if (isDemo(e.email) || !e.purchase_date) continue
    const target = expectedWeek(e.purchase_date, BLUEPRINT_WEEKS)
    const current = e.current_week ?? 1
    if (target <= current) continue

    const { error: upError } = await admin
      .from('blueprint_enrollments')
      .update({ current_week: target })
      .eq('id', e.id)
      .eq('current_week', current) // lost update guard against the Inngest run

    if (upError) {
      errors.push(`blueprint ${e.email}: ${upError.message}`)
      continue
    }

    let emailed = false
    const completedWeek = target - 1
    if (resend && completedWeek >= 1) {
      try {
        const built = buildBlueprintCheckinPromptEmail({
          firstName: e.first_name,
          completedWeek,
          newWeek: target,
          portalUrl: `${APP_URL}/blueprint/${e.token}`,
        })
        await resend.emails.send({ from: fromCoach(), to: e.email, subject: built.subject, html: built.html })
        emailed = true
      } catch (err) {
        errors.push(`blueprint email ${e.email}: ${String(err)}`)
      }
    }
    advanced.push({ product: 'blueprint', email: e.email, from: `W${current}`, to: `W${target}`, emailed })
  }

  // ── Extension: 12 weeks, flat (the portal maps 1-6 / 7-12 onto blocks) ─────
  const { data: extensions, error: extError } = await admin
    .from('extension_enrollments')
    .select('id, token, email, first_name, pattern, current_week, purchase_date')

  if (extError) {
    errors.push(`extension query: ${extError.message}`)
  }

  for (const e of extensions ?? []) {
    if (isDemo(e.email) || !e.purchase_date) continue
    const target = expectedWeek(e.purchase_date, EXTENSION_WEEKS)
    const current = e.current_week ?? 1
    if (target <= current) continue

    const { error: upError } = await admin
      .from('extension_enrollments')
      .update({ current_week: target })
      .eq('id', e.id)
      .eq('current_week', current)

    if (upError) {
      errors.push(`extension ${e.email}: ${upError.message}`)
      continue
    }

    let emailed = false
    if (resend) {
      try {
        const built = buildExtensionWeekEmail({
          week: target,
          firstName: e.first_name,
          portalUrl: `${APP_URL}/extension/${e.token}`,
          pattern: e.pattern ?? 'stress-stored',
        })
        await resend.emails.send({ from: fromCoach(), to: e.email, subject: built.subject, html: built.html })
        emailed = true
      } catch (err) {
        errors.push(`extension email ${e.email}: ${String(err)}`)
      }
    }
    advanced.push({ product: 'extension', email: e.email, from: `W${current}`, to: `W${target}`, emailed })
  }

  // ── Membership: 18 weeks across Blocks A, B and C ──────────────────────────
  const { data: memberships, error: memError } = await admin
    .from('membership_enrollments')
    .select('id, token, email, first_name, current_block, current_week, joined_at, cancelled_at')
    .is('cancelled_at', null)

  if (memError) {
    errors.push(`membership query: ${memError.message}`)
  }

  for (const e of memberships ?? []) {
    if (isDemo(e.email) || !e.joined_at) continue
    // Absolute week 1-18, then split back into block + week within block.
    const target = expectedWeek(e.joined_at, MEMBERSHIP_BLOCKS.length * WEEKS_PER_BLOCK)
    const currentBlockIndex = Math.max(0, MEMBERSHIP_BLOCKS.indexOf(e.current_block ?? 'A'))
    const current = currentBlockIndex * WEEKS_PER_BLOCK + (e.current_week ?? 1)
    if (target <= current) continue

    const targetBlock = MEMBERSHIP_BLOCKS[Math.floor((target - 1) / WEEKS_PER_BLOCK)]
    const targetWeek = ((target - 1) % WEEKS_PER_BLOCK) + 1

    const { error: upError } = await admin
      .from('membership_enrollments')
      .update({ current_block: targetBlock, current_week: targetWeek })
      .eq('id', e.id)
      .eq('current_week', e.current_week ?? 1)

    if (upError) {
      errors.push(`membership ${e.email}: ${upError.message}`)
      continue
    }

    let emailed = false
    // The prompt names the week just completed, in the block that week sat in.
    const completedBlock = MEMBERSHIP_BLOCKS[Math.floor((target - 2) / WEEKS_PER_BLOCK)]
    const completedWeek = ((target - 2) % WEEKS_PER_BLOCK) + 1
    if (resend && target > 1) {
      try {
        const built = buildMembershipCheckinPromptEmail({
          firstName: e.first_name,
          block: completedBlock,
          completedWeek,
          newWeek: targetWeek,
          portalUrl: `${APP_URL}/membership/${e.token}`,
        })
        await resend.emails.send({ from: fromCoach(), to: e.email, subject: built.subject, html: built.html })
        emailed = true
      } catch (err) {
        errors.push(`membership email ${e.email}: ${String(err)}`)
      }
    }
    advanced.push({
      product: 'membership',
      email: e.email,
      from: `${e.current_block ?? 'A'}${e.current_week ?? 1}`,
      to: `${targetBlock}${targetWeek}`,
      emailed,
    })
  }

  if (errors.length) console.error('[funnel-week-advance]', errors)
  if (advanced.length) console.log('[funnel-week-advance] advanced', advanced)

  return NextResponse.json({
    scanned: (blueprints?.length ?? 0) + (extensions?.length ?? 0) + (memberships?.length ?? 0),
    advanced,
    errors,
  })
}
