import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { fromBrand } from '@/lib/email-shell'
import { coach } from '@/config/tenant'

export const runtime = 'nodejs'

interface EnquiryPayload {
  name?: string
  email?: string
  organisation?: string
  role?: string
  environment?: string
  intent?: string
  message?: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function row(label: string, value: string | undefined): string {
  if (!value) return ''
  return `
    <tr>
      <td style="padding:6px 14px 6px 0;color:#6B6B6B;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;font-weight:700;vertical-align:top;white-space:nowrap;">${label}</td>
      <td style="padding:6px 0;color:#3A3A3A;font-size:14px;line-height:1.7;">${escapeHtml(value)}</td>
    </tr>`
}

export async function POST(request: Request) {
  let body: EnquiryPayload
  try {
    body = (await request.json()) as EnquiryPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  const name = (body.name || '').trim()
  const email = (body.email || '').trim()
  const organisation = (body.organisation || '').trim()
  const role = (body.role || '').trim()
  const environment = (body.environment || '').trim()
  const intent = (body.intent || '').trim()
  const message = (body.message || '').trim()

  if (!name || !email || !message) {
    return NextResponse.json(
      { error: 'Name, email and message are required.' },
      { status: 400 },
    )
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Email looks invalid.' }, { status: 400 })
  }

  // Cap message length to avoid abuse.
  if (message.length > 4000) {
    return NextResponse.json({ error: 'Message is too long.' }, { status: 400 })
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.error('[licensing-enquiry] RESEND_API_KEY missing')
    return NextResponse.json(
      { error: 'Email service not configured.' },
      { status: 500 },
    )
  }

  const resend = new Resend(apiKey)

  const subjectLine = `Body Recode™ licensing enquiry · ${name}${
    organisation ? ` · ${organisation}` : ''
  }`

  const html = `
  <div style="background:#FFFFFF;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;">
    <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E5E5;border-radius:16px;overflow:hidden;">
      <div style="padding:28px 28px 0;">
        <div style="width:32px;height:3px;background:#1B6DFC;border-radius:2px;margin-bottom:14px;"></div>
        <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:0.18em;color:#1B6DFC;text-transform:uppercase;">Licensing Enquiry</p>
        <h1 style="margin:10px 0 24px;font-size:22px;font-weight:800;color:#1A1A1A;letter-spacing:-0.02em;">${escapeHtml(name)}${organisation ? ` · ${escapeHtml(organisation)}` : ''}</h1>
      </div>
      <table style="width:100%;border-collapse:collapse;padding:0 28px;">
        <tbody>
          ${row('Name', name)}
          ${row('Email', email)}
          ${row('Organisation', organisation)}
          ${row('Role', role)}
          ${row('Environment', environment)}
          ${row('Intent', intent)}
        </tbody>
      </table>
      <div style="padding:24px 28px 0;border-top:1px solid #E5E5E5;margin-top:18px;">
        <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#6B6B6B;text-transform:uppercase;">Message</p>
        <p style="margin:0;color:#3A3A3A;font-size:14px;line-height:1.8;white-space:pre-wrap;">${escapeHtml(message)}</p>
      </div>
      <div style="padding:24px 28px 28px;">
        <a href="mailto:${escapeHtml(email)}" style="display:inline-block;background:#1B6DFC;color:#FFFFFF;font-weight:700;font-size:14px;padding:12px 20px;border-radius:10px;text-decoration:none;">Reply to ${escapeHtml(name.split(' ')[0] || name)}</a>
      </div>
    </div>
    <p style="text-align:center;font-size:11px;color:#3f3936;margin-top:18px;">bodyrecode.au · /api/licensing-enquiry</p>
  </div>`

  const text = [
    `BODY RECODE LICENSING ENQUIRY`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    organisation ? `Organisation: ${organisation}` : null,
    role ? `Role: ${role}` : null,
    environment ? `Environment: ${environment}` : null,
    intent ? `Intent: ${intent}` : null,
    ``,
    `Message:`,
    message,
  ]
    .filter(Boolean)
    .join('\n')

  try {
    const { error } = await resend.emails.send({
      from: fromBrand(),
      to: coach().email,
      replyTo: email,
      subject: subjectLine,
      html,
      text,
    })

    if (error) {
      console.error('[licensing-enquiry] resend error', error)
      return NextResponse.json(
        { error: 'Could not send. Please try again.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[licensing-enquiry] unexpected error', err)
    return NextResponse.json(
      { error: 'Unexpected error. Please try again.' },
      { status: 500 },
    )
  }
}
