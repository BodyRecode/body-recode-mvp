import { notFound } from 'next/navigation'
import { darkEmailSignature } from '@/lib/email-signature'
import { logoUrl } from '@/config/tenant'

const STATE_LABELS: Record<string, string> = {
  depleted: 'Depleted',
  transitioning: 'Transitioning',
  ready: 'Ready',
}

export default async function PreviewDownsellEmail({
  params,
}: {
  params: Promise<{ state: string }>
}) {
  const { state } = await params
  const stateLabel = STATE_LABELS[state]
  if (!stateLabel) notFound()

  const firstName = 'Sarah'
  const checkoutUrl = '#'
  const programUrl = '#'

  const offerHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#4A4A4A;">
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Your scorecard came back as ${stateLabel} State. That tells me specifically how your body is handling stress and recovery right now, and what it can actually respond to.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">I have built a 12-week program specifically for ${stateLabel} State. Not a generic plan. Every decision in it, the training volume, intensity, rest periods, and nutrition, is designed around where you are right now.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">It is $97. One-time. Yours to keep.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${checkoutUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">Get the Program - $97</a></td></tr>
              </table>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`

  const deliveryHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="color-scheme" content="light only"/></head>
<body style="margin:0;padding:0;background-color:#FFFFFF;">
  <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" bgcolor="#FFFFFF" style="max-width:520px;background-color:#FFFFFF;border-radius:16px;border:1px solid #E5E5E5;overflow:hidden;">
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:28px 40px;border-bottom:1px solid #E5E5E5;">
              <img src="${logoUrl()}" width="130" alt="Body Recode" style="display:block;" />
            </td>
          </tr>
          <tr>
            <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:36px 40px 40px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;line-height:1.75;color:#4A4A4A;">
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Hi ${firstName},</p>
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Your 12-week ${stateLabel} State Program is ready. Everything is in there: the full training protocol, nutrition targets, priority foods, and what to expect each phase.</p>
              <p style="margin:0 0 18px;font-size:15px;color:#4A4A4A;line-height:1.75;">Bookmark the page so you can come back to it any time.</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                <tr><td><a href="${programUrl}" style="display:inline-block;padding:14px 28px;background:#1B6DFC;color:#FFFFFF;font-size:14px;font-weight:700;text-decoration:none;border-radius:8px;letter-spacing:0.03em;">View My Program</a></td></tr>
              </table>
              ${darkEmailSignature()}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body></html>`

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <p className="text-[12.5px] font-semibold text-[#666D7A] mb-1">Previewing</p>
        <h1 className="text-xl font-semibold text-[#141821]">{stateLabel} State - Downsell Emails</h1>
        <p className="text-sm text-[#666D7A] mt-1">Using placeholder name "Sarah". Buttons are non-functional in preview.</p>
      </div>

      <div>
        <p className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Email 1 - Offer (sent on decline)</p>
        <div className="rounded-xl overflow-hidden border border-[#E8EAEE]">
          <iframe
            srcDoc={offerHtml}
            className="w-full border-0"
            style={{ height: '620px' }}
          />
        </div>
      </div>

      <div>
        <p className="text-[12.5px] font-semibold text-[#666D7A] mb-3">Email 2 - Delivery (sent after payment)</p>
        <div className="rounded-xl overflow-hidden border border-[#E8EAEE]">
          <iframe
            srcDoc={deliveryHtml}
            className="w-full border-0"
            style={{ height: '560px' }}
          />
        </div>
      </div>

      <div className="flex gap-3">
        {['depleted', 'transitioning', 'ready'].map(s => (
          <a
            key={s}
            href={`/dashboard/preview/downsell-email/${s}`}
            className={`text-sm font-medium px-4 py-2 rounded-lg border transition-colors ${s === state ? 'bg-blue-50 border-blue-200 text-blue-500' : 'border-[#E8EAEE] text-[#666D7A] hover:text-[#141821] hover:border-[#CFD4DC]'}`}
          >
            {STATE_LABELS[s]}
          </a>
        ))}
      </div>
    </div>
  )
}
