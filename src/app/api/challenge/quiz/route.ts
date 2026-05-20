import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'
import { pickPatternSlug, type Gender, type QuizAnswer } from '@/lib/pattern-mapping'

const PATTERNS: Record<string, { label: string; desc: string; color: string; actions: string[] }> = {
  'stress-stored': {
    label: 'Stress-Stored Pattern',
    color: '#DC2626',
    desc: 'Your body is storing and retaining in response to a chronic stress load. Cortisol and adrenaline are keeping your system in a state of low-grade alert, which signals your body to hold fat around the midsection as an energy reserve. The reset you have done this week is directly targeting this. The full picture requires understanding exactly how your stress hormones are behaving across the day.',
    actions: [
      'Sleep is your highest leverage point. Cortisol resets overnight. Prioritise sleep quality above everything else this week.',
      'Keep training intensity moderate. Hard sessions spike cortisol further and can slow progress in this pattern.',
      'Eat breakfast within 60 minutes of waking. This supports your morning cortisol curve and begins the process of hormonal regulation for the day.',
    ],
  },
  'metabolic-drift': {
    label: 'Insulin-Drift Pattern',
    color: '#B7791F',
    desc: 'Your body\'s ability to manage blood sugar has drifted. Insulin is staying elevated longer than it should, which drives energy crashes, persistent cravings, and the heaviness you feel after meals. Common in former athletes whose training response has changed but whose fuelling strategy has not adjusted. The nutrition structure you have been following this week is designed specifically for this. Restricting starchy carbohydrates to the post-training window forces your body to rebuild insulin sensitivity over time.',
    actions: [
      'Never skip breakfast. Blood sugar stability starts with your first meal. Skipping it creates a deficit that drives cravings throughout the rest of the day.',
      'Walk after your evening meal. Even 15-20 minutes significantly lowers post-meal blood sugar.',
      'Keep starchy carbohydrates strictly to the post-training window. Fruit is fine throughout the day. It metabolises differently to refined carbohydrates.',
    ],
  },
  'hormonal-shift': {
    label: 'Estrogen-Shift Pattern',
    color: '#8b5cf6',
    desc: 'Your body is in an oestrogen-driven conservation state. Storing and retaining as a protective mechanism driven by reproductive hormone signalling. Commonly associated with perimenopause, post-hormonal contraceptive adjustment, and states of chronic under-eating. One of the most common patterns and one of the most mismanaged. Typically treated with more restriction, which makes it worse.',
    actions: [
      'Avoid under-eating. This pattern responds poorly to caloric restriction. The body conserves harder when it perceives scarcity.',
      'Prioritise sleep and recovery. Oestrogen balance is deeply tied to overnight restoration.',
      'Be consistent with meal timing. Irregular eating disrupts the hormonal signals your body uses to decide whether to conserve or release stored energy.',
    ],
  },
  'system-overload': {
    label: 'Androgen-Decline Pattern',
    color: '#1B6DFC',
    desc: 'Your body is in a state of declining androgen function. Testosterone is no longer signalling muscle maintenance and recovery the way it once did. The result is reduced drive, slower recovery, and a sense that capacity is slipping despite consistent effort. Commonly presenting in men from their mid-thirties onward, and frequently missed or attributed to ageing as a fixed variable rather than a manageable hormonal state. Progress requires reducing total system demand and rebuilding the inputs that support testosterone signalling.',
    actions: [
      'Protect deep sleep. Testosterone synthesis happens during deep sleep. It is non-negotiable. Prioritise it above everything.',
      'Eat enough protein and fat. Low-fat diets actively suppress testosterone production. Build meals around protein and do not fear dietary fat.',
      'Train hard but rest harder. Strength stimulus is what signals testosterone synthesis. Recovery is what realises it. Do not chase volume.',
    ],
  },
}

function emailShell(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#999999;">
              ${body}
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`
}

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
    .select('id, leads(name, email, gender)')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }

  const leadRecord = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const gender = (leadRecord?.gender ?? null) as Gender
  const patternSlug = pickPatternSlug(answerLetter, gender)

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

  if (email && PATTERNS[patternSlug]) {
    const p = PATTERNS[patternSlug]
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your Day 7 Body Decode Check-In result`,
        html: emailShell(`
          <p style="color:#1A1A1A;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
            Your Body Decode Check-In
          </p>
          <p>Hi ${firstName},</p>
          <p>You completed the Day 7 Body Decode Check-In. Here is your result.</p>

          <div style="background:#1a1a19;border:1px solid #2a2826;border-radius:12px;padding:18px 22px;margin:20px 0;">
            <p style="font-size:11px;font-weight:700;color:#999999;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Your 7-Day Progress</p>
            <p style="font-size:28px;font-weight:900;color:#1B6DFC;margin:0 0 4px;letter-spacing:-0.02em;">${progressScore}<span style="font-size:15px;font-weight:500;color:#999999;letter-spacing:0;"> of 8 markers improving</span></p>
            <p style="font-size:13px;color:#999999;margin:0;line-height:1.6;">
              ${progressScore >= 6
                ? 'Strong week. Your system is responding well to the structure.'
                : progressScore >= 4
                ? 'Solid progress. The markers that have not shifted yet will often follow in week two.'
                : 'Your body is still adjusting. Week two is typically where the clearer shifts happen.'}
            </p>
          </div>

          <div style="background:#1a1a19;border:1px solid ${p.color}25;border-left:3px solid ${p.color};border-radius:12px;padding:20px 24px;margin:20px 0;">
            <p style="font-size:11px;font-weight:700;color:${p.color};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Your Biological Pattern</p>
            <p style="font-size:19px;font-weight:800;color:#1A1A1A;margin:0 0 14px;letter-spacing:-0.01em;line-height:1.2;">${p.label}</p>
            <p style="font-size:14px;color:#6B6B6B;line-height:1.75;margin:0;">${p.desc}</p>
          </div>

          <p style="color:#1A1A1A;font-size:15px;font-weight:700;margin:24px 0 12px;">What to focus on this week</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${p.actions.map((action, i) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;">
                  <span style="font-size:11px;font-weight:800;color:${p.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
                </td>
                <td style="padding:8px 0;font-size:14px;color:#6B6B6B;line-height:1.65;">${action}</td>
              </tr>
            `).join('')}
          </table>

          <div style="background:#0d2d29;border:1px solid rgba(27,109,252,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;">
            <p style="font-size:14px;color:#99d6d0;line-height:1.7;margin:0 0 16px;">
              This is the beginning. The full picture, your complete biological map, your specific hormone drivers, and what is structurally driving your pattern, comes through the Body State Scorecard.
            </p>
            <a href="https://bodyrecode.au/scorecard" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#1B6DFC;color:#FFFFFF;font-size:13px;font-weight:700;text-decoration:none;">
              Take the Full Body State Scorecard
            </a>
          </div>

          <p>Keep going. Week two is where the clearer changes happen.</p>
        `),
      })
    } catch (e) {
      console.error('[challenge/quiz] email error:', e)
    }
  }

  return NextResponse.json({ success: true, pattern: patternSlug })
}
