/**
 * Body Recode email signatures. Both functions render LIGHT — Pure White
 * background, Graphite Black text, Signal Blue link — matching the new
 * design system everywhere. The `dark` prefix on `darkEmailSignature` is
 * historical (predates the palette overhaul); keeping the name because
 * 20+ callers import it. Body is light. Do not add any dark styling.
 *
 * Matches the founder byline shown on the /scorecard hero exactly:
 * circular photo + "Kade Dunstone" name + credentials line. Email
 * version adds a clickable performance.bodyrecode.au URL underneath
 * since email recipients benefit from a clickable link.
 */

const PHOTO = 'https://bodyrecode.au/kade.jpg'
const NAME = 'Kade Dunstone'
const CREDENTIALS = 'Human Movement Scientist · Business Entrepreneur · Body Recode Founder'
const URL = 'https://performance.bodyrecode.au'
const URL_LABEL = 'performance.bodyrecode.au'
const FF = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`

export function emailSignature(): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E5E5;">
      <tr>
        <td style="padding-right:14px;vertical-align:middle;">
          <img src="${PHOTO}" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:1px solid #E5E5E5;"
            alt="${NAME}" />
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:800;color:#1A1A1A;font-family:${FF};line-height:1.3;">${NAME}</p>
          <p style="margin:3px 0 4px;font-size:12px;color:#6B6B6B;font-family:${FF};line-height:1.4;">${CREDENTIALS}</p>
          <a href="${URL}" style="font-size:12px;color:#1B6DFC;text-decoration:none;font-family:${FF};font-weight:600;">${URL_LABEL}</a>
        </td>
      </tr>
    </table>`
}

/**
 * Light email signature. Function name is historical (predates the palette
 * overhaul); body is light. Treat the prefix as legacy.
 *
 * Uses bgcolor attributes (not just CSS background) so Outlook for Windows
 * preserves the white canvas underneath the signature row.
 */
export function darkEmailSignature(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin-top:32px;border-top:1px solid #E5E5E5;width:100%;">
      <tr>
        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:24px 14px 0 0;vertical-align:middle;width:62px;">
          <img src="${PHOTO}" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:1px solid #E5E5E5;"
            alt="${NAME}" />
        </td>
        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding-top:24px;vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:800;color:#1A1A1A;font-family:${FF};line-height:1.3;">${NAME}</p>
          <p style="margin:3px 0 4px;font-size:12px;color:#6B6B6B;font-family:${FF};line-height:1.4;">${CREDENTIALS}</p>
          <a href="${URL}" style="font-size:12px;color:#1B6DFC;text-decoration:none;font-family:${FF};font-weight:600;">${URL_LABEL}</a>
        </td>
      </tr>
    </table>`
}
