// The sign-off block that closes every Body Recode Instagram caption.
//
//     → Link in bio
//
//     ↳ More from our founder → @kade_dunstone_
//
// Single source of truth: both publish paths - the immediate /api/ig/publish
// route and the scheduled igPublisherCron - run captions through appendBrFooter
// right before handing them to Meta, so every post gets the exact same block and
// it never double-appends when a caption already carries either line.
//
// WHY BOTH LINES LIVE HERE (2026-08-06). The founder line was already in code and
// survived every caption rewrite untouched. "Link in bio" lived in the caption
// text instead, so it was silently lost the moment captions were regenerated -
// 14 of 32 feed posts had no link line at all. Anything that must appear on
// every post belongs in this file, not in seeded copy, because seeded copy gets
// rewritten and this does not.
//
// Instagram only. LinkedIn rows (platform='linkedin') never pass through here,
// and "link in bio" would be meaningless there. Stories don't publish natively,
// so they're unaffected too.

export const BR_IG_LINK_LINE = '→ Link in bio'
export const BR_IG_FOUNDER_LINE = '↳ More from our founder → @kade_dunstone_'

/** The full block, for previews and the caption editor. */
export const BR_IG_FOOTER = `${BR_IG_LINK_LINE}\n\n${BR_IG_FOUNDER_LINE}`

// A caption often already says "link's in the bio" inside its own CTA (the Sunday
// promo reel does). Appending the footer line as well would say it twice, so each
// line is checked independently and only the missing ones get added.
const HAS_LINK = /link'?s?\s+(is\s+)?in\s+(the\s+)?bio/i
const HAS_FOUNDER = /@kade_dunstone_/

// A trailing block of hashtags, if the caption ends with one.
const TRAILING_TAGS = /(?:\n\s*)((?:#[\w]+[ \t]*)+)$/

export function appendBrFooter(caption: string): string {
  const trimmed = caption.trimEnd()
  const missing: string[] = []
  if (!HAS_LINK.test(trimmed)) missing.push(BR_IG_LINK_LINE)
  if (!HAS_FOUNDER.test(trimmed)) missing.push(BR_IG_FOUNDER_LINE)
  if (!missing.length) return trimmed

  // Hashtags belong at the very bottom, below the sign-off. Appending blindly
  // would bury "Link in bio" and the founder tag underneath them, which is
  // exactly where nobody reads.
  const tags = trimmed.match(TRAILING_TAGS)
  if (tags) {
    const body = trimmed.slice(0, tags.index).trimEnd()
    return `${body}\n\n${missing.join('\n\n')}\n\n${tags[1].trim()}`
  }
  return `${trimmed}\n\n${missing.join('\n\n')}`
}

// Remove a trailing sign-off block (and the blank lines above it) from a caption,
// so the editor can re-derive the raw body when a post is switched to another
// brand or re-normalised on save. Only strips lines sitting at the very end, and
// strips the founder line first so the link line above it is then also trailing.
export function stripBrFooter(caption: string): string {
  return caption
    .replace(/(\r?\n)*[ \t]*↳ More from (?:our founder|me) → @kade_dunstone_[ \t\r\n]*$/, '')
    .replace(/(\r?\n)*[ \t]*→ Link in bio[ \t\r\n]*$/, '')
    .trimEnd()
}
