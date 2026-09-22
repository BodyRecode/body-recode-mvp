/**
 * The Body Recode palette, defined once.
 *
 * 22 September 2026, second version, and the first one that is not inherited.
 *
 * WHAT WENT WRONG THE FIRST TIME. I found the 2025 designer's guideline, saw
 * that it named Electric Teal as the primary "preferred for digital" and that
 * the product had used it zero times, and restored it. The finding was true and
 * it did not matter. Kade had asked for the NEW brand. Teal is the cover of the
 * 2025 document. Blue is the 2025 logo sheet. Picking either one out of that
 * document and calling it new is how you spend a week rebuilding what you had.
 *
 * THE DECISION. The identity is GRAPHITE AND PAPER. There is no brand colour,
 * because a brand colour is what every product in this market reaches for and
 * they have all reached for the same blue. What sets this apart is restraint.
 *
 * THE RULE THAT MAKES IT WORK, and it is the whole system in one line:
 *
 *   COLOUR ONLY APPEARS WHERE IT MEANS SOMETHING.
 *
 * Structure, type, surfaces, the mark and every button are graphite or paper.
 * The moment a colour appears on a screen it is carrying information: her
 * readiness, an attendance drift, something that needs attention. Nothing is
 * coloured to look nice. That is what makes a coloured thing READ, and it is
 * also the answer to the finding that actually explains why the product looked
 * flat: 419 distinct hex colours, 159 of them used exactly once. You cannot fix
 * that by choosing a better accent. You fix it by removing the reason to reach
 * for a colour at all.
 *
 * HOW TO USE IT. New work references these names. Existing work is swept in
 * passes, never in one change, because one sweep across six hundred references
 * is how a client-facing email quietly breaks.
 *
 * THIS FILE IS THE LOCK, AND IT IS ALREADY BEEN TESTED ONCE. The login page was
 * built the same day this file was written and introduced SIX colours that are
 * not in it, three of them within four points of a token that already existed:
 * #14181F beside darkSurface #14171D, #262B34 beside darkLine #2A2F39. That is
 * how 419 happens, and it happens in a day, to somebody who knows the rule.
 *
 * So: THREE were real gaps and are now named here (darkWell, lineStrong, and
 * the Stop wash pair). THREE were drift and were snapped back. If a screen
 * needs a colour that is not in this file, add it here first with a reason, or
 * use the one that is already within four points of it.
 */

export const BRAND = {
  /* ── The identity ────────────────────────────────────────────────────
     Graphite and paper. This is the brand. The mark is graphite on paper
     and paper on graphite, and it is the same mark either way.

     Paper is deliberately OFF-white and very slightly warm. Pure #FFFFFF
     is the default nobody chose, and at full-page size the difference
     between chosen and default is most of what reads as considered. */
  base: '#0F1115',
  paper: '#FAFAF8',

  /* ── Ink, on paper ─────────────────────────────────────────────────── */
  ink: '#0F1115',
  inkMuted: '#4A4F57',
  inkSoft: '#6E747D',
  inkFaint: '#9CA2AB',

  /* ── Surfaces, on paper ────────────────────────────────────────────── */
  surface: '#FFFFFF',
  surfaceRaised: '#F2F2EF',
  line: '#E4E4E0',
  lineSoft: '#EDEDEA',
  /* A stronger hairline for something a person types into, where the
     ordinary line is too quiet to read as an edge. */
  lineStrong: '#DCDCD7',

  /* ── Surfaces, on graphite ───────────────────────────────────────────
     Named because before this week there were no dark screens and each
     one was inventing its own hex code.

     `darkWell` is the deepest ground in the product and exists for a
     full-bleed panel that another surface sits against, such as one half
     of a split screen. Added 22 Sep after the login page invented it. */
  darkWell: '#0B0D10',
  darkBase: '#0F1115',
  darkSurface: '#14171D',
  darkPanel: '#1A1E26',
  darkPanelRaised: '#21262F',
  darkLine: '#2A2F39',
  darkLineSoft: '#1F242C',
  darkInk: '#FAFAF8',
  darkInkMuted: '#C2C6CC',
  darkInkSoft: '#8A9099',
  darkInkFaint: '#676D76',

  /* ── Action ──────────────────────────────────────────────────────────
     A button is graphite on paper, or paper on graphite. It is not a
     colour. In a near-monochrome system the thing you press is the
     highest-contrast thing on the screen, which is what contrast is for. */
  action: '#0F1115',
  actionHover: '#242932',
  actionPressed: '#000000',
  actionInk: '#FAFAF8',
  actionQuiet: '#F2F2EF',

  /* ── Meaning ─────────────────────────────────────────────────────────
     THE ONLY COLOUR IN THE PRODUCT. If one of these appears, it is
     telling somebody something. Muted on purpose: this product says
     things to people about their bodies, and a fire-engine red is a tone
     of voice, not a status. */
  signalCalm: '#3A7D8C',
  signalCalmOnDark: '#7FB3BF',
  signalSteady: '#4A7C59',
  signalSteadyOnDark: '#8FB79A',
  signalHold: '#B5803C',
  signalHoldOnDark: '#D9AE73',
  signalStop: '#A63D3D',
  signalStopOnDark: '#D98C8C',
  signalNone: '#9CA2AB',
  /* The Stop state as a panel on paper rather than as a dot. The only
     tinted surfaces in the product, and they exist because an error has to
     read as an error without shouting. */
  stopWash: '#FBF1F1',
  stopWashLine: '#E8C9C9',

  /* ── Retired, kept so old references still compile ───────────────────
     These are the 2025 colours. They are no longer the brand. Nothing new
     references them, and the existing hardcoded uses are swept in passes.
     Left here so the sweep can be done deliberately rather than by a
     build breaking at an awkward moment. */
  legacyAccent: '#1B6DFC',
  legacyTeal: '#10E1C2',
} as const

/**
 * Readiness. The one place colour is not decoration, and the reason the rest
 * of the product is deliberately colourless.
 *
 * REMEDIATION IS NOT RED. Somebody in Remediation is not in trouble, they are
 * being asked for less. Painting that red tells a coach the opposite of what
 * the doctrine says, on a screen they read before they speak to a client.
 */
export const READINESS_COLOUR: Record<string, { light: string; dark: string }> = {
  Remediation: { light: BRAND.signalHold, dark: BRAND.signalHoldOnDark },
  Optimisation: { light: BRAND.signalCalm, dark: BRAND.signalCalmOnDark },
  'Post-Optimisation': { light: BRAND.signalSteady, dark: BRAND.signalSteadyOnDark },
}

export type BrandToken = keyof typeof BRAND
