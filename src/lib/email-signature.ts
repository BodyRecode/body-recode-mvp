import { brand } from "@/config/tenant";

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

// Matches the canonical signature we designed 2026-05-25
// (06_SAAS_PLATFORM_BUILD/2026-05-25_Personal_Gmail_Signature_v3): B&W circle
// headshot + name + credentials + performance link AND the Instagram handle.
const PHOTO = `${brand().marketingDomain}/kade-circle.png`
const NAME = 'Kade Dunstone'
const CREDENTIALS = 'Sports Scientist · Business Entrepreneur · Body Recode Founder'
const URL = brand().performanceDomain
const URL_LABEL = 'performance.bodyrecode.au'
const SITE_URL = '${marketingUrl()}'
const SITE_LABEL = 'bodyrecode.au'
const IG_URL = 'https://instagram.com/kade_dunstone_'
const IG_LABEL = '@kade_dunstone_'
const FF = `-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif`

const LINK_STYLE = `font-size:12px;color:#1B6DFC;text-decoration:none;font-family:${FF};font-weight:600;`
const SEP = `<span style="font-size:12px;color:#C8C8C8;font-family:${FF};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`

/** The link row (performance site | marketing site | Instagram), Signal Blue, shared by both signature variants. */
const LINK_ROW = `<a href="${URL}" style="${LINK_STYLE}">${URL_LABEL}</a>${SEP}<a href="${SITE_URL}" style="${LINK_STYLE}">${SITE_LABEL}</a>${SEP}<a href="${IG_URL}" style="${LINK_STYLE}">${IG_LABEL}</a>`

// Social icon strip - Instagram (brand) + Facebook (brand) + Instagram
// (personal) + LinkedIn (personal). Landed 2026-07-08 as part of the
// waitlist welcome revision - rendered at signature time so it lands on
// EVERY email using darkEmailShell + darkEmailSignature (which is all
// of them). Icons are inline SVG data URIs so no external asset host is
// needed and no images-blocked-by-Outlook risk.
//
// Palette: monochrome graphite so it reads as brand-adjacent metadata,
// not a competing CTA. Hover intent is provided by the underlying <a>.
const SOCIAL_ICON_SIZE = 24
const SOCIAL_ICON_STYLE = `display:inline-block;width:${SOCIAL_ICON_SIZE}px;height:${SOCIAL_ICON_SIZE}px;line-height:0;`
const SOCIAL_ICON_GAP = `<span style="display:inline-block;width:14px;">&nbsp;</span>`

const IG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_ICON_SIZE}" height="${SOCIAL_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>`
const FB_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_ICON_SIZE}" height="${SOCIAL_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>`
const LI_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="${SOCIAL_ICON_SIZE}" height="${SOCIAL_ICON_SIZE}" viewBox="0 0 24 24" fill="none" stroke="#3A3A3A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></svg>`

const BRAND_IG_URL = 'https://www.instagram.com/body_recode_/'
const BRAND_FB_URL = 'https://www.facebook.com/bodyrecode.au'
const KADE_IG_URL = 'https://www.instagram.com/kade_dunstone_/'
const KADE_LI_URL = 'https://www.linkedin.com/in/kade-dunstone-5b4535a2/'

/** Public wrapper: renders the social icon strip. Exported so a caller can
 *  inject it independently of the signature if needed. */
export function socialIconStrip(): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr><td style="line-height:0;">
    <a href="${BRAND_IG_URL}" style="${SOCIAL_ICON_STYLE}" title="@body_recode_ on Instagram">${IG_SVG}</a>${SOCIAL_ICON_GAP}<a href="${BRAND_FB_URL}" style="${SOCIAL_ICON_STYLE}" title="Body Recode on Facebook">${FB_SVG}</a>${SOCIAL_ICON_GAP}<a href="${KADE_IG_URL}" style="${SOCIAL_ICON_STYLE}" title="@kade_dunstone_ on Instagram">${IG_SVG}</a>${SOCIAL_ICON_GAP}<a href="${KADE_LI_URL}" style="${SOCIAL_ICON_STYLE}" title="Kade Dunstone on LinkedIn">${LI_SVG}</a>
  </td></tr></table>`
}
const SOCIAL_STRIP = socialIconStrip()

// Daily-rotating tagline strip under the signature (see src/app/api/sig-tag +
// src/lib/sig-taglines.ts). One brand line per UTC day, so a recipient who gets
// two emails in a week sees it change. Rendered 960x80, shown at 480x40.
const SIG_TAG = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;"><tr><td><a href="${SITE_URL}" style="text-decoration:none;display:block;"><img src="${brand().marketingDomain}/api/sig-tag" width="480" height="40" alt="" style="display:block;border:0;width:100%;max-width:480px;height:auto;" /></a></td></tr></table>`

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
          ${LINK_ROW}
        </td>
      </tr>
    </table>
    ${SOCIAL_STRIP}
    ${SIG_TAG}`
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
          ${LINK_ROW}
        </td>
      </tr>
    </table>
    ${SOCIAL_STRIP}
    ${SIG_TAG}`
}
