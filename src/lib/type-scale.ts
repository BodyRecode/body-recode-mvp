/**
 * The type scale, defined once.
 *
 * 22 September 2026. Counted before deciding: the dashboard used **36 distinct
 * font sizes**, and TEN of them sat inside a four-pixel range: 9, 9.5, 10,
 * 10.5, 11, 11.5, 12, 12.5, 13, 13.5. Nobody can see the difference between
 * 12px and 12.5px, and every one of those pairs guarantees two rows on two
 * pages do not line up.
 *
 * It is the same failure as the 419 hex colours and it has the same cause:
 * every screen chose for itself, and a number typed by hand is never the same
 * number twice.
 *
 * NINE STEPS, and the gaps between them are deliberate. A scale works when the
 * steps are far enough apart to read as a decision. Two sizes half a pixel
 * apart are not a hierarchy, they are an accident.
 *
 * HOW TO USE IT. New work uses these names. If a screen needs a size that is
 * not here, it almost certainly needs an existing one, because the reason to
 * add a tenth step is hierarchy and nine steps is already more than most
 * products carry.
 */
export const TYPE = {
  /** One number that belongs to a whole page. Never two on a screen. */
  metric: 'text-[58px] font-extrabold tracking-[-0.045em] leading-[0.85] tabular-nums',
  /** The page title. */
  title: 'text-[38px] sm:text-[46px] font-extrabold tracking-[-0.038em] leading-[0.98]',
  /** A number inside a panel. */
  figure: 'text-[34px] font-extrabold tracking-[-0.045em] leading-none tabular-nums',
  /** A person's name in a list. The loudest thing in a row. */
  name: 'text-[20px] font-bold tracking-[-0.028em] leading-tight',
  /** A heading inside a page. */
  subhead: 'text-[16px] font-semibold tracking-[-0.02em]',
  /** Body copy. Anything read as a sentence. */
  body: 'text-[13.5px] leading-[1.55]',
  /** Secondary copy, captions, table cells. The workhorse. */
  small: 'text-[12.5px] leading-[1.5]',
  /** Uppercase section and field labels. */
  label: 'text-[11px] font-bold uppercase tracking-[0.17em]',
  /** The quietest thing on a screen. Timestamps, legal, help. */
  micro: 'text-[10px] font-bold uppercase tracking-[0.18em]',
} as const

export type TypeStep = keyof typeof TYPE
