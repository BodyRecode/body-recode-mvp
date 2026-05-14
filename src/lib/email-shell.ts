/**
 * Outlook-safe dark email shell.
 *
 * Background. Every Body Recode email uses a dark canvas (#0a0a0a) per the
 * brand template. The old pattern was `<body style="background:#0a0a0a">`
 * with a centered `<div>` — that works in Gmail/Apple Mail, but Outlook for
 * Windows renders mail with Word's HTML engine and STRIPS `background:` CSS
 * from `<body>` and `<div>`. Result on Outlook (desktop + corporate M365):
 * forced white background, light-gray text on white = nearly invisible, mail
 * looks blank.
 *
 * Outlook does respect the `bgcolor` HTML attribute on `<table>` and `<td>`,
 * so this shell wraps every email in a 100%-width bgcolor'd table and a 600
 * px content table. The inner content can keep using inline color styles —
 * because the table cell genuinely IS dark in every client, light text on
 * dark surfaces renders correctly everywhere.
 *
 * Usage:
 *   html: darkEmailShell(`
 *     <img src="..." width="130" .../>
 *     <p style="color:#aaa;...">Hi ${firstName},</p>
 *     ...
 *   `)
 *
 * The caller does NOT need to provide its own `<!DOCTYPE>`, `<html>`,
 * `<body>`, or outer centering `<div>` — the shell provides all of them. The
 * inner content goes straight inside the 600 px column.
 *
 * Optional previewText sets the inbox-preview snippet that appears next to
 * the subject in most clients. Defaults to empty so the client falls back to
 * the first visible text in the body.
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
 * Safe Links / ATP) often rewrite or strip clickable `<a>` URLs — Samantha
 * at Mater being the case that surfaced this. The URL printed below is raw
 * text and not wrapped in an `<a>` tag, so the recipient can select-and-copy
 * it into a personal browser when the link inside the email is mangled.
 *
 * Style: a bordered card with an UPPERCASE label above and the URL in
 * monospace, word-break-all so it wraps cleanly inside the 600 px column.
 */
export function emailUrlFallback(url: string, label = 'Or paste this link into your browser'): string {
  return `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#0a0a0a" style="background-color:#0a0a0a;margin:24px 0 0;">
        <tr>
          <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:14px 16px;border:1px solid #1c1917;border-radius:8px;">
            <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#a8a29e;letter-spacing:0.08em;text-transform:uppercase;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">${label}</p>
            <p style="margin:0;font-size:13px;color:#cfcfcf;line-height:1.5;word-break:break-all;font-family:'Courier New',Consolas,monospace;">${url}</p>
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
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>Body Recode</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, p, a { font-family: -apple-system, 'Segoe UI', Arial, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#0a0a0a;color:#cfcfcf;-webkit-font-smoothing:antialiased;">
${preview ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#0a0a0a;opacity:0;">${preview}</div>` : ''}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;margin:0;padding:0;">
  <tr>
    <td bgcolor="#0a0a0a" align="center" style="background-color:#0a0a0a;padding:0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" bgcolor="#0a0a0a" style="background-color:#0a0a0a;width:100%;max-width:600px;">
        <tr>
          <td bgcolor="#0a0a0a" style="background-color:#0a0a0a;padding:48px 32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#cfcfcf;">
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
