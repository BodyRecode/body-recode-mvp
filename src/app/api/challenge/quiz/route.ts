import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { pickPatternSlug, type Gender, type QuizAnswer } from '@/lib/pattern-mapping'
import { buildDay7ProgressEmail, buildDay14BodyDecodeReportEmail } from '@/lib/challenge-checkin-emails'
import { fromCoach } from '@/lib/email-shell'
import { PORTAL_ACCESS_STATUSES } from '@/lib/challenge-access'

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { token, result, answers } = body as {
    token: string
    result: string
    answers: Record<string, string>
  }

  if (!token || !result || !answers) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  // The portal submits result as the Q2 answer letter ('a'|'b'|'c'|'d').
  // Compute the gender-keyed canonical pattern slug from (gender, answer).
  const answerLetter = (['a', 'b', 'c', 'd'].includes(result) ? result : 'a') as QuizAnswer

  const admin = createAdminClient()

  const { data: enrollment, error: fetchError } = await admin
    .from('challenge_enrollments')
    .select('id, enrolled_at, product, leads(name, email, gender, cycle_status, age_band)')
    .eq('token', token)
    .in('status', PORTAL_ACCESS_STATUSES)
    .single()

  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }

  // This route sends Challenge Day 7 / Day 14 emails, and it looked leads up by
  // token with no product check - so a Body Decode token submitted here would
  // have been emailed a full 14-Day Challenge report describing a Day 7 Check-In
  // and a Day 14 reveal that no longer exist.
  //
  // Nothing in /decode links to /challenge/[token]/check-in, so this needed a
  // hand-edited URL or an old email to reach. But the sibling Challenge routes
  // are deliberately kept alive for people who finished the real thing, so the
  // door stays open - it just should not open for the wrong product.
  if (enrollment.product === 'decode') {
    return NextResponse.json({
      error: 'This check-in belongs to the retired 14-Day Challenge. Your Body Decode read is already complete.',
    }, { status: 409 })
  }

  const leadRecord = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const gender = (leadRecord?.gender ?? null) as Gender
  // sq3 is the phase-2 Estrogen-Shift discriminator, asked only of women in the
  // menopausal band. `to_middle` overrides the sq2-derived pattern; anything else
  // (or its absence, for everyone who was never asked) leaves sq2 standing.
  const patternSlug = pickPatternSlug(answerLetter, gender, {
    cycleStatus: leadRecord?.cycle_status as string | null,
    ageBand: leadRecord?.age_band as string | null,
    directionOfTravel: answers?.sq3 ?? null,
  })

  const { error: updateError } = await admin
    .from('challenge_enrollments')
    .update({
      quiz_completed_at: new Date().toISOString(),
      quiz_result: patternSlug,
      quiz_answers: answers,
    })
    .eq('id', enrollment.id)

  if (updateError) {
    console.error('[challenge/quiz] update error:', updateError)
    return NextResponse.json({ error: 'Failed to save result.' }, { status: 500 })
  }

  // Calculate progress score from answers
  const progressScore = Object.entries(answers)
    .filter(([key, val]) => !key.startsWith('sq') && val === 'better')
    .length

  const firstName = leadRecord?.name?.split(' ')[0] ?? 'there'
  const email = leadRecord?.email

  // Day 14 reveal gate (locked 2026-05-30): result is HELD until Day 14.
  // The Check-In itself runs at Day 7+ (the form unlocks then), but the
  // result email + in-portal display are gated until currentDay >= 14 so
  // the participant experiences a single reveal moment at Challenge
  // completion. If they happen to submit on/after Day 14 (rare late-takers),
  // result emails immediately as before.
  const enrolledAt = new Date(enrollment.enrolled_at as string)
  const msPerDay = 1000 * 60 * 60 * 24
  const currentDay = Math.min(
    Math.floor((Date.now() - enrolledAt.getTime()) / msPerDay) + 1,
    14
  )
  const resultRevealUnlocked = currentDay >= 14

  // Extract just the 8 marker ratings from answers (excludes sq1, sq2)
  const markerRatings = Object.fromEntries(
    Object.entries(answers).filter(([k]) => !k.startsWith('sq'))
  )

  // Email branch:
  //   Day 7-13 (normal flow): Day 7 Progress email - progress + Week 2
  //     guidance + Day 14 teaser. NO pattern reveal.
  //   Day 14+ (late-takers): Day 14 Body Decode Report email immediately.
  //     Equivalent to what Inngest would have sent at Day 14, including
  //     pattern + actions + Blueprint push.
  if (email) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const built = resultRevealUnlocked
        ? buildDay14BodyDecodeReportEmail({ firstName, patternSlug, progressScore })
        : buildDay7ProgressEmail({ firstName, progressScore, markerRatings })
      await resend.emails.send({
        from: fromCoach(),
        to: email,
        subject: built.subject,
        html: built.html,
      })
    } catch (e) {
      console.error('[challenge/quiz] email error:', e)
    }
  }

  return NextResponse.json({
    success: true,
    pattern: patternSlug,
    resultRevealUnlocked,
  })
}
