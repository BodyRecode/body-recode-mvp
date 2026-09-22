import { BRAND, READINESS_COLOUR } from '@/lib/brand-tokens'

/**
 * The dot that carries a readiness on any surface where the level is scanned
 * rather than read.
 *
 * 22 September 2026. It exists because of one thing found while choosing the
 * meaning colours: under red-green colour blindness, which is roughly one man
 * in twelve and coaches skew male, REMEDIATION AND ATTENTION BOTH GO OLIVE and
 * separate only by lightness. On a page somebody reads, that is harmless, since
 * the level is always named in words beside the dot. On a list of forty clients
 * that somebody SCANS, the dot is doing the work on its own.
 *
 * So Attention is a different SHAPE as well as a different colour: a ring
 * around it, which reads at eight pixels and survives any colour vision, any
 * screen and a greyscale print. Nothing about the palette changed to get it.
 *
 * ATTENTION IS NOT A FOURTH READINESS LEVEL. It means a safety gate has fired,
 * which is a different axis, and the ring says so before the colour does.
 *
 * The rule this encodes, worth keeping past this component: WHEN A COLOUR IS
 * THE ONLY THING DISTINGUISHING TWO STATES, IT IS NOT ENOUGH. Add the shape.
 */
export type Readiness = 'Remediation' | 'Optimisation' | 'Post-Optimisation' | 'Attention'

export function ReadinessDot({
  level,
  tone = 'light',
  size = 8,
}: {
  level: Readiness | string | null | undefined
  /** 'light' for a pale ground, 'dark' for a graphite one. */
  tone?: 'light' | 'dark'
  size?: number
}) {
  const onDark = tone === 'dark'
  const attention = level === 'Attention'

  const colour = attention
    ? onDark
      ? BRAND.attentionOnDark
      : BRAND.attention
    : (READINESS_COLOUR[String(level)]?.[onDark ? 'dark' : 'light'] ?? BRAND.noReading)

  return (
    <span
      aria-hidden
      className="inline-block shrink-0 rounded-full"
      style={{
        width: size,
        height: size,
        background: colour,
        // The ring, and the only reason this is a component rather than a span.
        boxShadow: attention ? `0 0 0 ${Math.max(2, Math.round(size / 4))}px ${colour}38` : undefined,
        // Keeps a ringed dot from shunting its neighbours in a tight row.
        margin: attention ? Math.max(2, Math.round(size / 4)) : 0,
      }}
    />
  )
}
