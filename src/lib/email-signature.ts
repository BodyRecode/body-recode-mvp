export function emailSignature(): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #e7e5e4;">
      <tr>
        <td style="padding-right:16px;vertical-align:middle;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;"
            alt="Kade Dunstone" />
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#1c1917;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#78716c;">Performance Coach · Body Recode</p>
          <a href="https://performance.bodyrecode.au" style="font-size:12px;color:#a8a29e;text-decoration:none;">performance.bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}

export function darkEmailSignature(): string {
  // Use bgcolor attributes (not just CSS background) so Outlook for Windows
  // preserves the dark canvas underneath the signature row.
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;margin-top:32px;border-top:1px solid #1c1917;width:100%;">
      <tr>
        <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:24px 16px 0 0;vertical-align:middle;width:64px;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;border:0;"
            alt="Kade Dunstone" />
        </td>
        <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding-top:24px;vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#a8a29e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">Performance Coach · Body Recode</p>
          <a href="https://performance.bodyrecode.au" style="font-size:12px;color:#a8a29e;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">performance.bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}
