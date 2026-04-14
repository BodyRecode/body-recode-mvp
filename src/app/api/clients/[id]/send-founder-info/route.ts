import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { darkEmailSignature } from '@/lib/email-signature'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const { data: client } = await admin
    .from('clients')
    .select('id, name, email, is_founding_client')
    .eq('id', id)
    .maybeSingle()

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  if (!client.email) return NextResponse.json({ error: 'No email address for this client' }, { status: 400 })
  if (!client.is_founding_client) return NextResponse.json({ error: 'Client is not a Founding Client' }, { status: 400 })

  const firstName = client.name.split(' ')[0]
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: 'Kade at Body Recode <kade@bodyrecode.au>',
    to: client.email,
    subject: `${firstName}, welcome to the Founder Client Program`,
    html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><meta name="color-scheme" content="dark" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#0c0a09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;" bgcolor="#0c0a09">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#0c0a09" style="background-color:#0c0a09;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#111110" style="max-width:560px;background-color:#111110;border-radius:16px;border:1px solid #1c1917;overflow:hidden;">

          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px 28px;border-bottom:1px solid #1c1917;">
              <img src="https://bodyrecode.au/logo-teal.png" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>

          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:36px 40px 0;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#555;">Founder Client Program</p>
              <p style="margin:0 0 28px;font-size:22px;font-weight:700;color:#ffffff;line-height:1.3;">Welcome, ${firstName}.</p>
              <p style="margin:0 0 20px;font-size:15px;color:#888;line-height:1.8;">
                I want to make sure you have a clear picture of what you have entered and what to expect. This email covers the structure of the Founder Client Program, what participation involves, and how the fee arrangement works.
              </p>
            </td>
          </tr>

          <!-- Section: What the program is -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10E1C2;">What the program is</p>
              <p style="margin:0 0 14px;font-size:15px;color:#ccc;line-height:1.8;">
                The Body Recode™ Founder Client Program is a limited, selective participation model. It is not a standard coaching package and it is not a promotional offer. The positions are held for individuals whose profiles contribute to the validation and refinement of the Body Recode™ system.
              </p>
              <p style="margin:0 0 14px;font-size:15px;color:#888;line-height:1.8;">
                Your participation is documented as a structured case study. The data collected across your coaching journey - body state, weekly readiness, training response, nutrition adaptation - becomes part of the longitudinal validation of the system. That is the exchange. You receive adjusted-fee coaching. The system receives documented, high-integrity data.
              </p>
              <p style="margin:0;font-size:15px;color:#888;line-height:1.8;">
                This is not a discount. It is a structured trade of commercial value.
              </p>
            </td>
          </tr>

          <!-- Section: What participation involves -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10E1C2;">What participation involves</p>
              <p style="margin:0 0 12px;font-size:15px;color:#ccc;line-height:1.8;">The program has a minimum participation threshold of 12 weeks, with an intended engagement of 6 to 12 months where possible.</p>
              <p style="margin:0 0 12px;font-size:14px;color:#888;line-height:1.8;">During this time you will:</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:14px;">
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Complete foundational onboarding: Coaching Agreement, Health Declaration, Intake, Baseline</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Receive a personalised CFFS (Current Functional Fitness State) report at onboarding</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Submit structured weekly check-ins via your coaching portal</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Receive weekly data interpretation and training/nutrition direction</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Participate in re-interpretation events where justified by new data</td></tr>
                <tr><td style="padding:4px 0;font-size:14px;color:#888;line-height:1.7;">- Contribute to a case study generated from your longitudinal data</td></tr>
              </table>
              <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">
                Consistent participation is what makes the case study valid. Repeated missed check-ins or inconsistent engagement affects the integrity of the data and may affect founding client status.
              </p>
            </td>
          </tr>

          <!-- Section: Fee structure -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10E1C2;">Fee structure</p>
              <p style="margin:0 0 12px;font-size:15px;color:#ccc;line-height:1.8;">Coaching fees are adjusted by 50% for the duration of valid participation in the program. This adjustment is active only while you remain in good standing - participating, paying, and maintaining data integrity.</p>
              <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">The adjusted fee is not a permanent rate. If founding client status changes - due to withdrawal, payment failure, or participation breakdown - coaching reverts to the standard rate or ceases, depending on circumstances.</p>
            </td>
          </tr>

          <!-- Section: Consent and case study use -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10E1C2;">Case study and consent</p>
              <p style="margin:0 0 12px;font-size:15px;color:#ccc;line-height:1.8;">Your data will be used internally for system validation regardless of external consent - this is part of the participation agreement. For external use, you will select one of two consent tiers when you sign the Founder Client Case Study Agreement:</p>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:14px;">
                <tr>
                  <td style="padding:10px 14px;background:#1a1a1a;border-radius:8px;margin-bottom:8px;display:block;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#fff;">Tier 1 - External Use (Anonymised)</p>
                    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">Your identity is not disclosed. Identifying details are removed or generalised. Case study may be published in anonymised form.</p>
                  </td>
                </tr>
              </table>
              <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:14px;">
                <tr>
                  <td style="padding:10px 14px;background:#1a1a1a;border-radius:8px;">
                    <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#fff;">Tier 2 - External Use (Named)</p>
                    <p style="margin:0;font-size:13px;color:#666;line-height:1.6;">Your identity may be used. Publication remains subject to your review of identifying material. Case study may be published in named form.</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0;font-size:14px;color:#666;line-height:1.8;">You retain review rights over how you are identified externally. These rights do not extend to altering interpretation outputs or suppressing valid internal analysis.</p>
            </td>
          </tr>

          <!-- Section: Next steps -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:24px 40px 0;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#10E1C2;">Next steps</p>
              <p style="margin:0 0 12px;font-size:15px;color:#ccc;line-height:1.8;">You will receive the Founder Client Case Study Agreement separately. Please read it in full before signing - it formalises everything covered in this email and confirms your consent tier selection. If anything is unclear before you sign, reply to this email.</p>
            </td>
          </tr>

          <!-- Signature -->
          <tr>
            <td bgcolor="#111110" style="background-color:#111110;padding:32px 40px 40px;">
              ${darkEmailSignature()}
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  })

  // Record the send
  await admin
    .from('clients')
    .update({ founder_info_sent_at: new Date().toISOString() })
    .eq('id', id)

  return NextResponse.json({ sent: true })
}
