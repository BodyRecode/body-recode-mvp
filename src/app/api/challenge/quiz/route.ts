import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Resend } from 'resend'
import { darkEmailSignature } from '@/lib/email-signature'

const RESULTS: Record<string, { label: string; desc: string; color: string; nextSteps: string[] }> = {
  a: {
    label: 'Cortisol-Dominant Pattern',
    color: '#ef4444',
    desc: 'Your responses suggest a cortisol-dominant pattern. Your body is likely in a state of chronic low-grade stress, which drives inflammation, fluid retention, and stubborn fat storage around the abdomen. The structure you have built this week is directly targeting this pattern.',
    nextSteps: [
      'Prioritise sleep quality above everything else - cortisol resets overnight',
      'Keep training intensity moderate - hard sessions elevate cortisol further',
      'Eat breakfast within 60 minutes of waking to support your morning cortisol curve',
      'Remove caffeine after midday to allow your evening cortisol to drop naturally',
    ],
  },
  b: {
    label: 'Rhythm-Disrupted Pattern',
    color: '#f59e0b',
    desc: 'Your responses suggest a disrupted circadian and hormonal rhythm. Wired at night, slow in the morning, low morning appetite - these are classic signs of a reversed cortisol curve. Sleep timing and morning light exposure are your highest leverage points right now.',
    nextSteps: [
      'Get outside within 20 minutes of waking - morning light resets your cortisol curve',
      'Set a fixed sleep time and stick to it, even on weekends',
      'Avoid screens and bright lights after 8pm',
      'Eat a protein-rich breakfast even if you are not hungry - it anchors your rhythm',
    ],
  },
  c: {
    label: 'Insulin-Sensitivity Pattern',
    color: '#8b5cf6',
    desc: 'Your responses suggest blood sugar and insulin sensitivity are the primary driver. Energy crashes, afternoon cravings, and poor training response all point here. Meal timing, carbohydrate quality, and training type are the levers that will move your results the most.',
    nextSteps: [
      'Never skip breakfast - blood sugar stability starts with the first meal',
      'Keep starchy carbohydrates to the post-training window only',
      'Include resistance training - it is the most effective tool for improving insulin sensitivity',
      'Walk after meals, especially after dinner, to lower post-meal blood sugar',
    ],
  },
  d: {
    label: 'Adaptation-Stalled Pattern',
    color: '#14b8a6',
    desc: 'Your responses suggest your body has adapted to its current environment and stopped responding. You are not in a depleted state - you are in a plateau. Your biology needs a new signal. Progressive overload, nutrition periodisation, and recovery emphasis are the next steps.',
    nextSteps: [
      'Introduce progressive overload to your training - your body needs a new stimulus',
      'Cycle your nutrition - higher carb on training days, lower on rest days',
      'Prioritise recovery as hard as you train - this is where adaptation happens',
      'Consider a deload week - sometimes the body needs permission to reset',
    ],
  },
}

function emailShell(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background-color:#0c0a09;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:520px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:28px 40px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#888888;">
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

  const admin = createAdminClient()

  const { data: enrollment, error: fetchError } = await admin
    .from('challenge_enrollments')
    .select('id, leads(name, email)')
    .eq('token', token)
    .eq('status', 'active')
    .single()

  if (fetchError || !enrollment) {
    return NextResponse.json({ error: 'Enrollment not found.' }, { status: 404 })
  }

  // Save result
  const { error: updateError } = await admin
    .from('challenge_enrollments')
    .update({
      quiz_completed_at: new Date().toISOString(),
      quiz_result: result,
      quiz_answers: answers,
    })
    .eq('id', enrollment.id)

  if (updateError) {
    console.error('[challenge/quiz] update error:', updateError)
    return NextResponse.json({ error: 'Failed to save result.' }, { status: 500 })
  }

  // Send result email
  const lead = Array.isArray(enrollment.leads) ? enrollment.leads[0] : enrollment.leads
  const firstName = lead?.name?.split(' ')[0] ?? 'there'
  const email = lead?.email

  if (email && RESULTS[result]) {
    const r = RESULTS[result]
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Kade at Body Recode <kade@bodyrecode.au>',
        to: email,
        subject: `Your hormone pattern result - ${r.label}`,
        html: emailShell(`
          <p style="color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.02em;margin:0 0 16px;">
            Your Mini Hormone Quiz Result
          </p>
          <p>Hi ${firstName},</p>
          <p>You completed the Mini Hormone Quiz inside your challenge portal. Here is your result.</p>
          <div style="background:#1a1a19;border:1px solid ${r.color}30;border-left:3px solid ${r.color};border-radius:12px;padding:20px 24px;margin:24px 0;">
            <p style="font-size:11px;font-weight:700;color:${r.color};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Your Pattern</p>
            <p style="font-size:19px;font-weight:800;color:#ffffff;margin:0 0 14px;letter-spacing:-0.01em;">${r.label}</p>
            <p style="font-size:14px;color:#a8a29e;line-height:1.75;margin:0;">${r.desc}</p>
          </div>
          <p style="color:#ffffff;font-size:16px;font-weight:700;margin:24px 0 12px;">What this means for you right now</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${r.nextSteps.map((step, i) => `
              <tr>
                <td style="padding:8px 0;vertical-align:top;width:28px;">
                  <span style="font-size:11px;font-weight:800;color:${r.color};font-family:monospace;">${String(i + 1).padStart(2, '0')}</span>
                </td>
                <td style="padding:8px 0;font-size:14px;color:#a8a29e;line-height:1.65;">${step}</td>
              </tr>
            `).join('')}
          </table>
          <div style="background:#0d2d29;border:1px solid rgba(20,184,166,0.2);border-radius:12px;padding:20px 24px;margin:24px 0;">
            <p style="font-size:14px;color:#99d6d0;line-height:1.7;margin:0 0 16px;">
              This is your starting point. The full picture - your Fat Map, your specific biological drivers, and your personalised prescription - comes through the Body State Scorecard.
            </p>
            <a href="https://bodyrecode.au/scorecard" style="display:inline-block;padding:12px 22px;border-radius:8px;background:#14b8a6;color:#0c0a09;font-size:13px;font-weight:700;text-decoration:none;">
              Take the Full Body State Scorecard
            </a>
          </div>
          <p>Keep going. You are doing well.</p>
        `),
      })
    } catch (e) {
      console.error('[challenge/quiz] email error:', e)
      // Don't fail the request if email fails
    }
  }

  return NextResponse.json({ success: true })
}
