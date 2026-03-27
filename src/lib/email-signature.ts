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
          <a href="https://bodyrecode.au" style="font-size:12px;color:#a8a29e;text-decoration:none;">bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}

export function darkEmailSignature(): string {
  return `
    <table cellpadding="0" cellspacing="0" style="margin-top:32px;padding-top:24px;border-top:1px solid #1e1e1e;">
      <tr>
        <td style="padding-right:16px;vertical-align:middle;">
          <img src="https://bodyrecode.au/kade.jpg" width="48" height="48"
            style="border-radius:50%;display:block;object-fit:cover;object-position:top;"
            alt="Kade Dunstone" />
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0;font-size:14px;font-weight:600;color:#ffffff;">Kade Dunstone</p>
          <p style="margin:2px 0 0;font-size:13px;color:#78716c;">Performance Coach · Body Recode</p>
          <a href="https://bodyrecode.au" style="font-size:12px;color:#555555;text-decoration:none;">bodyrecode.au</a>
        </td>
      </tr>
    </table>`
}
