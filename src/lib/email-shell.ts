/**
 * Outlook-safe Body Recode email shell.
 *
 * Background. The Body Recode email canvas is Pure White (#FFFFFF) with
 * Graphite Black (#1A1A1A) text and Signal Blue (#1B6DFC) accents - matching
 * the landing pages, customer portals, and coach dashboard. Outlook for
 * Windows renders mail with Word's HTML engine and STRIPS `background:` CSS
 * from `<body>` and `<div>`, so this shell wraps every email in a
 * 100%-width bgcolor'd table and a 600 px content table. Bgcolor on tables
 * survives Outlook's filtering, which means the canvas renders the intended
 * white in every client (and is not flipped by dark-mode auto-inversion
 * because we declare `color-scheme: light only`).
 *
 * Function name is historical - signature predates the palette overhaul and
 * is called by 20+ files. The body is now light. Treat the prefix as legacy.
 *
 * Usage:
 *   html: darkEmailShell(`
 *     <img src="..." width="130" .../>
 *     <p style="color:#4A4A4A;...">Hi ${firstName},</p>
 *     ...
 *   `)
 */
/**
 * BCC address for coach-triggered manual email sends.
 *
 * Whenever a coach clicks a button (or runs a one-off script) that sends
 * a real client an email, the same email is BCC'd to this address so the
 * coach has a copy in their own inbox to reference - useful for:
 *   - Quoting back when the client replies
 *   - Spotting send failures (if no copy lands, the send didn't happen)
 *   - Auditing what was actually said
 *
 * Apply to MANUAL sends only. Do NOT apply to:
 *   - Cron-driven sends (check-in window, session reminders, etc.) -
 *     would flood the coach inbox
 *   - Self-serve sends triggered by the client (sign-in code, portal
 *     submissions) - the coach is not the actor
 *   - Drip sequence steps fired by Inngest from a workflow
 *
 * Override via COACH_BCC_EMAIL env var if needed (e.g. to disable in
 * dev by setting it to an empty string).
 */
export const COACH_BCC: string[] =
  process.env.COACH_BCC_EMAIL === ''
    ? []
    : [process.env.COACH_BCC_EMAIL ?? 'kade@bodyrecode.au']

/**
 * Plain-text URL fallback block. Required at the bottom of every email that
 * has a CTA button, because corporate Microsoft 365 deployments (Defender
 * Safe Links / ATP) often rewrite or strip clickable `<a>` URLs - Samantha
 * at Mater being the case that surfaced this. The URL printed below is raw
 * text and not wrapped in an `<a>` tag, so the recipient can select-and-copy
 * it into a personal browser when the link inside the email is mangled.
 *
 * Style: a bordered card with an UPPERCASE label above and the URL in
 * monospace, word-break-all so it wraps cleanly inside the 600 px column.
 */
export function emailUrlFallback(url: string, label = 'Or paste this link into your browser'): string {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#F8F8F8" style="background-color:#F8F8F8;margin:24px 0 0;">
        <tr>
          <td bgcolor="#F8F8F8" style="background-color:#F8F8F8;padding:14px 16px;border:1px solid #E5E5E5;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6B6B6B;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${label}</p>
            <p style="margin:0;font-size:13px;color:#1A1A1A;line-height:1.5;word-break:break-all;font-family:'Courier New',Consolas,monospace;">${url}</p>
          </td>
        </tr>
      </table>`
}

export function darkEmailShell(inner: string, opts?: { previewText?: string }): string {
  const preview = opts?.previewText ?? ''
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light" />
<title>Body Recode</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, p, a { font-family: -apple-system, 'Segoe UI', Arial, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#FFFFFF;color:#1A1A1A;-webkit-font-smoothing:antialiased;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFFFFF;opacity:0;">${preview}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin:0;padding:0;">
  <tr>
    <td bgcolor="#FFFFFF" align="center" style="background-color:#FFFFFF;padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;width:100%;max-width:600px;">
        <tr>
          <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:48px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1A1A1A;">
${inner}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
