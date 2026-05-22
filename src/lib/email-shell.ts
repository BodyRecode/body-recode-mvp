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

/**
 * Body Recode email design tokens. Match the /challenge landing page palette:
 * Pure White canvas, Graphite Black text, Signal Blue accents. Use the
 * helpers below (`emailEyebrow`, `emailHeading`, `emailDivider`,
 * `emailFeaturedCard`, `emailCallout`, `emailStatusCard`, `emailCta`,
 * `emailNumberedList`) when composing any new email so the look stays
 * uniform without reimplementing the same inline-styled markup each time.
 */
export const EMAIL_FF = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`
export const EMAIL_MONO = `'Courier New',Consolas,monospace`
export const EMAIL_BLUE = '#1B6DFC'
export const EMAIL_BLUE_DARK = '#1056D6'
export const EMAIL_BLUE_BG = '#F3F7FF'
export const EMAIL_BLUE_BORDER = 'rgba(27,109,252,0.25)'
export const EMAIL_GRAPHITE = '#1A1A1A'
export const EMAIL_BODY = '#4A4A4A'
export const EMAIL_BODY_SOFT = '#3A3A3A'
export const EMAIL_MUTED = '#6B6B6B'
export const EMAIL_HAIRLINE = '#E5E5E5'
export const EMAIL_GREY_BG = '#F7F7F7'

/** Logo at the top of every email. Defaults to the 150px width used on /challenge. */
export function emailLogo(width = 150): string {
  return `<div style="margin-bottom:36px;"><img src="https://bodyrecode.au/logo-black.png" width="${width}" alt="Body Recode" style="display:block;border:0;" /></div>`
}

/** Small uppercase Signal Blue label that sits above headings (the "ACCOUNT UPDATE" line on Samantha's refund email, the "FREE 14-DAY CHALLENGE" badge on /challenge). */
export function emailEyebrow(text: string, color: string = EMAIL_BLUE): string {
  return `<p style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 14px;font-family:${EMAIL_FF};">${text}</p>`
}

/** Hero heading in Graphite Black with tight letter-spacing. */
export function emailHeading(text: string, opts?: { size?: number; color?: string }): string {
  const size = opts?.size ?? 32
  const color = opts?.color ?? EMAIL_GRAPHITE
  return `<h1 style="font-size:${size}px;font-weight:800;letter-spacing:-0.025em;line-height:1.2;color:${color};margin:0 0 16px;font-family:${EMAIL_FF};">${text}</h1>`
}

/** 48×3px Signal Blue divider that sits under the heading. Pass a colour for non-default accents (e.g. amber for medical-clearance alerts). */
export function emailDivider(color: string = EMAIL_BLUE): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td bgcolor="${color}" height="3" style="background-color:${color};width:48px;line-height:3px;font-size:0;">&nbsp;</td></tr></table>`
}

/** Standard body paragraph. */
export function emailBody(text: string, opts?: { color?: string; size?: number; bottom?: number }): string {
  const color = opts?.color ?? EMAIL_BODY
  const size = opts?.size ?? 16
  const bottom = opts?.bottom ?? 18
  return `<p style="font-size:${size}px;color:${color};line-height:1.7;margin:0 0 ${bottom}px;font-family:${EMAIL_FF};">${text}</p>`
}

/** White card with Signal Blue left border. Used for primary content — "what I did", actions to take, the featured row on /challenge's "what you walk away with". `inner` is raw HTML composed by the caller. */
export function emailFeaturedCard(inner: string, opts?: { eyebrow?: string }): string {
  const eyebrow = opts?.eyebrow
    ? `<p style="font-size:10px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;margin:0 0 14px;font-family:${EMAIL_FF};">${opts.eyebrow}</p>`
    : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="#FFFFFF" style="background-color:#FFFFFF;margin:0 0 20px;"><tr><td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:22px 24px;border:1px solid ${EMAIL_HAIRLINE};border-left:3px solid ${EMAIL_BLUE};border-radius:12px;">${eyebrow}${inner}</td></tr></table>`
}

/** Numbered list with monospace blue numerals — the 01/02/03 pattern from the sample Day 14 result card. */
export function emailNumberedList(items: string[]): string {
  const rows = items.map((item, i) => {
    const num = String(i + 1).padStart(2, '0')
    const lastBottom = i === items.length - 1 ? '0' : '14px'
    return `<tr><td valign="top" width="28" style="padding:0 0 ${lastBottom};font-family:${EMAIL_FF};"><span style="font-size:12px;font-weight:800;color:${EMAIL_BLUE};font-family:${EMAIL_MONO};">${num}</span></td><td valign="top" style="padding:0 0 ${lastBottom};font-family:${EMAIL_FF};"><p style="margin:0;font-size:14px;color:${EMAIL_BODY_SOFT};line-height:1.65;">${item}</p></td></tr>`
  }).join('')
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">${rows}</table>`
}

/** Blue-tinted callout for the headline number / fact / amount. `unit` renders smaller and muted next to the value. */
export function emailCallout(opts: { eyebrow: string; value: string; unit?: string }): string {
  const unit = opts.unit ? ` <span style="font-size:14px;font-weight:700;color:${EMAIL_MUTED};letter-spacing:0;">${opts.unit}</span>` : ''
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${EMAIL_BLUE_BG}" style="background-color:${EMAIL_BLUE_BG};margin:0 0 28px;"><tr><td bgcolor="${EMAIL_BLUE_BG}" style="background-color:${EMAIL_BLUE_BG};padding:20px 24px;border:1px solid ${EMAIL_BLUE_BORDER};border-radius:12px;"><p style="margin:0 0 4px;font-size:10px;font-weight:700;color:${EMAIL_BLUE_DARK};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">${opts.eyebrow}</p><p style="margin:0;font-size:28px;font-weight:800;color:${EMAIL_GRAPHITE};letter-spacing:-0.02em;font-family:${EMAIL_FF};">${opts.value}${unit}</p></td></tr></table>`
}

/** Soft-grey card for secondary status info (e.g. "Your subscription is still active"). */
export function emailStatusCard(opts: { eyebrow: string; headline: string; body: string }): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${EMAIL_GREY_BG}" style="background-color:${EMAIL_GREY_BG};margin:0 0 28px;"><tr><td bgcolor="${EMAIL_GREY_BG}" style="background-color:${EMAIL_GREY_BG};padding:18px 22px;border:1px solid ${EMAIL_HAIRLINE};border-radius:12px;"><p style="margin:0 0 6px;font-size:10px;font-weight:700;color:${EMAIL_MUTED};letter-spacing:0.12em;text-transform:uppercase;font-family:${EMAIL_FF};">${opts.eyebrow}</p><p style="margin:0 0 6px;font-size:15px;color:${EMAIL_GRAPHITE};font-weight:700;line-height:1.5;font-family:${EMAIL_FF};">${opts.headline}</p><p style="margin:0;font-size:14px;color:${EMAIL_BODY};line-height:1.6;font-family:${EMAIL_FF};">${opts.body}</p></td></tr></table>`
}

/** Signal Blue solid CTA button. Pair with `emailUrlFallback(href)` underneath for Microsoft 365 Safe-Links environments. Pass `bg` for non-default accents (e.g. amber #B7791F for clearance alerts, red #DC2626 for urgent). */
export function emailCta(opts: { href: string; label: string; bg?: string }): string {
  const bg = opts.bg ?? EMAIL_BLUE
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 28px;"><tr><td bgcolor="${bg}" style="background-color:${bg};border-radius:10px;"><a href="${opts.href}" style="display:inline-block;padding:15px 28px;color:#FFFFFF;font-size:15px;font-weight:800;text-decoration:none;letter-spacing:0.01em;font-family:${EMAIL_FF};">${opts.label}</a></td></tr></table>`
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
