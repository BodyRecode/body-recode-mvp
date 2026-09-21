/**
 * The Body Recode palette, defined once.
 *
 * 22 September 2026. Counted before deciding anything: the app used **419
 * distinct hex colours, 159 of them exactly once**. Two near-identical
 * near-blacks (#141821 2,064 times and #1A1A1A 541), two near-identical light
 * greys (#E8EAEE 1,604 and #E5E5E5 313), and a long tail of one-offs written
 * by whoever was building that screen.
 *
 * THAT IS THE REAL FINDING, and it changed the plan. The accent was never
 * wrong. There was simply no palette, only an accumulation, and inconsistent
 * greys are most of what reads as flat and unfinished.
 *
 * So the accent stays: 2,614 uses, and it is the identity. What is new is
 * everything around it being named, including the dark surfaces, which until
 * this week did not exist and were invented one hex code at a time.
 *
 * HOW TO USE IT. New work references these names. Existing work is swept in
 * passes rather than in one change, because a single sweep across six hundred
 * references is how a client-facing email quietly breaks.
 */

export const BRAND = {
  /* ── Accent ──────────────────────────────────────────────────────────
     Unchanged. It is the most-used colour in the product and the identity. */
  accent: '#1B6DFC',
  accentHover: '#3D7DFF',
  accentPressed: '#1056D6',
  accentWash: 'rgba(27,109,252,0.08)',

  /* ── Ink, on light ───────────────────────────────────────────────────
     Four steps, which is all the product has ever actually needed. The
     two near-blacks collapse here: #1A1A1A retires into #141821. */
  ink: '#141821',
  inkMuted: '#43474F',
  inkSoft: '#666D7A',
  inkFaint: '#98A0AD',

  /* ── Surfaces, on light ──────────────────────────────────────────── */
  surface: '#FFFFFF',
  surfaceRaised: '#F4F6F9',
  line: '#E8EAEE',
  lineSoft: '#EFF1F4',

  /* ── Dark surfaces ───────────────────────────────────────────────────
     New this week and previously ad hoc. Named now so the next dark screen
     does not invent its own. */
  darkBase: '#090C11',
  darkSurface: '#0C1017',
  darkPanel: '#12161D',
  darkPanelRaised: '#171D27',
  darkLine: '#242A35',
  darkLineSoft: '#1C212A',
  darkInk: '#FFFFFF',
  darkInkMuted: '#C7CCD4',
  darkInkSoft: '#8A909B',
  darkInkFaint: '#6B7280',

  /* ── State ───────────────────────────────────────────────────────────
     Used for readiness, for attendance, and for anything that needs a
     verdict colour. Deliberately muted: this product tells people things
     about their bodies, and a fire-engine red is a tone of voice. */
  good: '#3AA76D',
  goodOnDark: '#79C79C',
  caution: '#C8823A',
  cautionOnDark: '#E3B871',
  alert: '#C82626',
  alertOnDark: '#E88C8C',
  neutralState: '#8A909B',
} as const

/**
 * Readiness, which is the one place colour carries meaning rather than tone.
 *
 * Remediation is NOT red. Somebody in Remediation is not in trouble, they are
 * being asked for less, and painting that red tells a coach the opposite of
 * what the doctrine says.
 */
export const READINESS_COLOUR: Record<string, { light: string; dark: string }> = {
  Remediation: { light: BRAND.caution, dark: BRAND.cautionOnDark },
  Optimisation: { light: '#3A8FC8', dark: '#7FB8E0' },
  'Post-Optimisation': { light: BRAND.good, dark: BRAND.goodOnDark },
}

export type BrandToken = keyof typeof BRAND
