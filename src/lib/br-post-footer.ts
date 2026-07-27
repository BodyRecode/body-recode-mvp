// The founder follow line that closes every Body Recode Instagram caption.
// Single source of truth: both publish paths — the immediate /api/ig/publish
// route and the scheduled igPublisherCron — run captions through appendBrFooter
// right before handing them to Meta, so every post gets the exact same line and
// it never double-appends when a caption already carries the tag.
export const BR_IG_FOOTER = '↳ More from our founder → @kade_dunstone_'

export function appendBrFooter(caption: string): string {
  const trimmed = caption.trimEnd()
  if (trimmed.includes('@kade_dunstone_')) return trimmed
  return `${trimmed}\n\n${BR_IG_FOOTER}`
}

// Remove a trailing footer (and the blank line above it) from a caption, so the
// editor can re-derive the raw body when a post is switched to another brand or
// re-normalised on save. Only strips the footer when it sits at the very end.
export function stripBrFooter(caption: string): string {
  return caption.replace(/(\r?\n)*[ \t]*↳ More from (?:our founder|me) → @kade_dunstone_[ \t\r\n]*$/, '').trimEnd()
}
