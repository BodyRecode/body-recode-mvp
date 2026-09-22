import { brand } from '@/config/tenant'
import { BRAND } from '@/lib/brand-tokens'

/**
 * The wordmark, drawn rather than loaded.
 *
 * 21 September 2026. The sign-in page showed no logo, because the dark logo
 * file has never existed: the tenant config has pointed at /logo-white.png
 * since it was written, and it has always returned a 404. Every dark surface
 * that asked for it got nothing, and nobody noticed because there were no dark
 * surfaces until today.
 *
 * WHY DRAWN AND NOT A FILE. An image needs one version per background, and
 * that is exactly how a missing one goes unnoticed for months. Type works on
 * any background, stays sharp at any size, takes a tenant's own colour without
 * a new asset, and cannot 404.
 *
 * It is the lockup already used on every branded PDF and in the dashboard
 * sidebar, so it is the de facto identity rather than a new one. Whether it
 * REPLACES the current logo is Kade's decision, not this component's.
 *
 * THE SYMBOL IS TEAL, on light and on dark alike. 22 September 2026: the
 * designer's 2025 guideline specifies Electric Teal as the primary preferred
 * for DIGITAL use, and it had never appeared on a screen. The mark is the one
 * place that is not negotiable, because the mark is what identifies us. The
 * blue stays where it belongs, on things you press.
 *
 * A white-label tenant passes its own `colour`, which is the whole reason this
 * is drawn rather than loaded.
 */
export function BrandMark({
  tone = 'light',
  size = 'md',
  showName = true,
  name: nameOverride,
  colour,
}: {
  /** 'light' for a dark background, 'dark' for a light one. */
  tone?: 'light' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  /**
   * Passed by a client component that already holds the tenant's name, so this
   * does not have to reach for the tenant cache from the browser.
   */
  name?: string
  /** A white-label tenant's own mark colour. Defaults to Electric Teal. */
  colour?: string
}) {
  const name = nameOverride ?? brand().name
  const initials =
    name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase() || name.slice(0, 2).toUpperCase()

  const dims = {
    sm: { box: 30, radius: 8, mark: 12, word: 15 },
    md: { box: 40, radius: 10, mark: 15.5, word: 19 },
    lg: { box: 52, radius: 13, mark: 20, word: 25 },
  }[size]

  const onDark = tone === 'light'
  // The symbol keeps its colour on both grounds. Only the letters inside it and
  // the wordmark beside it change, which is what keeps it one recognisable mark
  // rather than two that happen to share a name.
  const markBg = colour ?? BRAND.brand
  const markFg = BRAND.ink
  const wordFg = onDark ? BRAND.darkInk : BRAND.ink

  return (
    <span className="inline-flex items-center gap-3 select-none">
      <span
        aria-hidden
        className="inline-flex items-center justify-center font-extrabold shrink-0"
        style={{
          width: dims.box,
          height: dims.box,
          borderRadius: dims.radius,
          background: markBg,
          color: markFg,
          fontSize: dims.mark,
          letterSpacing: '-0.04em',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
      {showName && (
        <span
          style={{
            fontSize: dims.word,
            fontWeight: 700,
            letterSpacing: '-0.025em',
            color: wordFg,
            lineHeight: 1,
          }}
        >
          {name}
        </span>
      )}
    </span>
  )
}
