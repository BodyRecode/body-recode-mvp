// The founder follow line that closes every Body Recode Instagram caption.
// Single source of truth: both publish paths — the immediate /api/ig/publish
// route and the scheduled igPublisherCron — run captions through appendBrFooter
// right before handing them to Meta, so every post gets the exact same line and
// it never double-appends when a caption already carries the tag.
export const BR_IG_FOOTER = '↳ More from me → @kade_dunstone_'

export function appendBrFooter(caption: string): string {
  const trimmed = caption.trimEnd()
  if (trimmed.includes('@kade_dunstone_')) return trimmed
  return `${trimmed}\n\n${BR_IG_FOOTER}`
}
