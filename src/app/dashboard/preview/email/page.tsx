import { darkEmailSignature } from '@/lib/email-signature'
import Link from 'next/link'

const BOOKING_LINK = 'https://bodyrecode.au/book'
const firstName = 'Sarah'
const dateStr = 'Thursday, 17 April 2026'
const timeStr = '10:00 am'
const meetingLink = 'https://zoom.us/j/123456789'

const bookingLinkHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.75;">Use the link below to pick a time for your Zoom call. It takes 30 seconds and you will get a confirmation straight away.</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              <tr>
                <td><a href="${BOOKING_LINK}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Book your Zoom call</a></td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#999999;">Or copy this link: ${BOOKING_LINK}</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`

const confirmationHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="dark"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
            <img src="https://bodyrecode.au/logo-black.png" width="130" alt="Body Recode" style="display:block;"/>
          </td>
        </tr>
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
            <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Hi ${firstName},</p>
            <p style="margin:0 0 24px;font-size:15px;color:#4A4A4A;line-height:1.75;">Your Zoom call with Kade is confirmed.</p>
            <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:24px;">
              <tr>
                <td style="padding:20px 24px;background:#F8F8F8;border-radius:12px;border:1px solid #E5E5E5;">
                  <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#1A1A1A;">${dateStr}</p>
                  <p style="margin:0 0 16px;font-size:14px;color:#4A4A4A;">${timeStr} Brisbane · 30 min</p>
                  <a href="${meetingLink}" style="display:inline-block;padding:12px 24px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;">Join Zoom ↗</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 24px;font-size:13px;color:#999999;">Open the attached file to add this to your calendar.</p>
            ${darkEmailSignature()}
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`

export default function EmailPreviewPage() {
  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <div className="w-7 h-0.5 bg-blue-500 rounded mb-4" />
        <h1 className="text-xl font-bold text-[#1A1A1A] mb-1">Email Previews</h1>
        <p className="text-sm text-stone-500">Booking emails sent from the lead profile.</p>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Booking Link Email</p>
        <p className="text-xs text-stone-400 mb-3">Sent when you click "Send booking link" on a lead profile. Directs them to pick a time themselves.</p>
        <div className="rounded-xl overflow-hidden border border-stone-200">
          <iframe srcDoc={bookingLinkHtml} className="w-full border-0" style={{ height: '480px' }} />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-3">Booking Confirmation Email</p>
        <p className="text-xs text-stone-400 mb-3">Sent when you click "Send booking confirmation" on a lead profile. Confirms a time you have already agreed on.</p>
        <div className="rounded-xl overflow-hidden border border-stone-200">
          <iframe srcDoc={confirmationHtml} className="w-full border-0" style={{ height: '560px' }} />
        </div>
      </div>

      <Link href="/dashboard/preview" className="inline-block text-xs text-stone-500 hover:text-stone-700 transition-colors">
        ← Back to all assets
      </Link>
    </div>
  )
}
