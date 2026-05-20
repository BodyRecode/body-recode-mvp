export function emailSignature(): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #E5E5E5;">
      <tr>
        <td style="padding-right:16px;vertical-align:middle;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;"
            alt="Kade Dunstone" />
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#4A4A4A;">Performance Coach · Body Recode</p>
          <a href="https://performance.bodyrecode.au" style="font-size:12px;color:#1B6DFC;text-decoration:none;">performance.bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}

/**
 * Light email signature. Function name is historical (predates the palette
 * overhaul); body is now light. Treat the prefix as legacy.
 *
 * Uses bgcolor attributes (not just CSS background) so Outlook for Windows
 * preserves the white canvas underneath the signature row.
 */
export function darkEmailSignature(): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin-top:32px;border-top:1px solid #E5E5E5;width:100%;">
      <tr>
        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:24px 16px 0 0;vertical-align:middle;width:64px;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:0;"
            alt="Kade Dunstone" />
        </td>
        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding-top:24px;vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#4A4A4A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Performance Coach · Body Recode</p>
          <a href="https://performance.bodyrecode.au" style="font-size:12px;color:#1B6DFC;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">performance.bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}
