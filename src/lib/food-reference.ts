/**
 * Food macros reference table — deterministic per-gram source of truth.
 *
 * The nutrition generator was previously asking Claude to recall food macros
 * from training data. It got it wrong on at least three substitutions in
 * Ruby-Cate's published plan (2026-05-12):
 *   - "100g dry rice ↔ 150g raw potato — equal carb substitution" was off
 *     by 3x (86g vs 28g carbs)
 *   - "120g banana ↔ 150g berries / 200g melon / 20g honey" — all subs
 *     deliver ~half the original's carbs
 *   - "180g salmon ↔ trout/mackerel/white fish of equivalent raw weight"
 *     — salmon has ~22g more fat per meal than cod
 *
 * This table is the lookup the validator uses to verify a substitution
 * actually delivers what it claims. Per-gram values, sourced from
 * USDA / common Australian nutritional references, deliberately rounded
 * to keep the comparison robust (intra-supplier variance is real).
 *
 * Coverage targets the Tier 1 + Tier 2 foods the nutrition prompt allows.
 * Foods outside this table are not lookupable; validator returns
 * { found: false } for them and the coach reviews manually.
 *
 * Added 2026-06-09 (item C in the licensee-readiness plan).
 */

export interface FoodMacros {
  /** Per-gram macros, all unitless grams. Stored per-gram so the table
   *  is composable: 165g raw chicken breast = 165 * pgMacros. */
  pg_protein: number
  pg_carb: number
  pg_fat: number
  /** Per-gram kilocalories. Derived from 4P + 4C + 9F. */
  pg_kcal: number
  /** Description of which form the macros refer to. Important: 100g dry
   *  rice is NOT 100g cooked rice. */
  state: 'raw' | 'cooked' | 'dry' | 'fresh' | 'drained'
  /** Common aliases the parser checks. Always lowercase. */
  aliases: string[]
}

/**
 * Per-gram values. ALL numeric values are per 1g; multiply by quantity to
 * get total macros for a portion. Names are canonical keys.
 *
 * Reading: white rice (dry) → 0.78 carbs per gram → 100g dry → 78g carbs.
 */
export const FOOD_DB: Record<string, FoodMacros> = {
  // ─── Tier 1 proteins ─────────────────────────────────────────────────
  'chicken breast (raw)': {
    pg_protein: 0.21, pg_carb: 0, pg_fat: 0.02, pg_kcal: 1.05,
    state: 'raw', aliases: ['chicken breast', 'raw chicken breast', 'chicken breast raw'],
  },
  'chicken thigh skinless (raw)': {
    pg_protein: 0.18, pg_carb: 0, pg_fat: 0.07, pg_kcal: 1.31,
    state: 'raw', aliases: ['chicken thigh', 'skinless chicken thigh', 'chicken thigh skinless'],
  },
  'beef mince 5% fat (raw)': {
    pg_protein: 0.21, pg_carb: 0, pg_fat: 0.05, pg_kcal: 1.29,
    state: 'raw', aliases: ['beef mince 5%', 'beef mince', '5% beef mince', 'lean beef mince', 'beef mince 5% fat', '5% beef mince fat', 'beef mince 5 percent', 'lean beef mince 5%'],
  },
  'beef mince 15% fat (raw)': {
    pg_protein: 0.18, pg_carb: 0, pg_fat: 0.15, pg_kcal: 2.07,
    state: 'raw', aliases: ['beef mince 15%', '15% beef mince'],
  },
  'beef steak sirloin (raw)': {
    pg_protein: 0.22, pg_carb: 0, pg_fat: 0.05, pg_kcal: 1.33,
    state: 'raw', aliases: ['sirloin steak', 'beef sirloin', 'sirloin', 'beef steak sirloin'],
  },
  'salmon (raw)': {
    pg_protein: 0.20, pg_carb: 0, pg_fat: 0.13, pg_kcal: 1.97,
    state: 'raw', aliases: ['salmon', 'raw salmon', 'atlantic salmon'],
  },
  'cod (raw)': {
    pg_protein: 0.18, pg_carb: 0, pg_fat: 0.007, pg_kcal: 0.78,
    state: 'raw', aliases: ['cod', 'white fish', 'hake', 'whitefish'],
  },
  'mackerel (raw)': {
    pg_protein: 0.19, pg_carb: 0, pg_fat: 0.13, pg_kcal: 1.93,
    state: 'raw', aliases: ['mackerel'],
  },
  'trout (raw)': {
    pg_protein: 0.20, pg_carb: 0, pg_fat: 0.07, pg_kcal: 1.43,
    state: 'raw', aliases: ['trout', 'rainbow trout'],
  },
  'tuna in spring water (drained)': {
    pg_protein: 0.25, pg_carb: 0, pg_fat: 0.01, pg_kcal: 1.09,
    state: 'drained', aliases: ['canned tuna', 'tuna canned', 'tuna in water', 'tuna in spring water', 'tuna spring water', 'canned tuna spring water', 'tuna'],
  },
  'whole egg': {
    pg_protein: 0.13, pg_carb: 0.011, pg_fat: 0.10, pg_kcal: 1.43,
    state: 'fresh', aliases: ['egg', 'eggs', 'whole eggs'],
  },
  // ─── Tier 1 carbs ────────────────────────────────────────────────────
  'white rice (dry)': {
    pg_protein: 0.07, pg_carb: 0.78, pg_fat: 0.007, pg_kcal: 3.46,
    state: 'dry', aliases: ['white rice dry', 'dry white rice', 'rice (dry)', 'rice dry', 'white rice', 'rice'],
  },
  'white rice (cooked)': {
    pg_protein: 0.026, pg_carb: 0.28, pg_fat: 0.003, pg_kcal: 1.30,
    state: 'cooked', aliases: ['white rice cooked', 'cooked white rice', 'rice cooked'],
  },
  'white potato (raw)': {
    pg_protein: 0.02, pg_carb: 0.17, pg_fat: 0.001, pg_kcal: 0.77,
    state: 'raw', aliases: ['white potato', 'raw white potato', 'potato'],
  },
  'sweet potato (raw)': {
    pg_protein: 0.016, pg_carb: 0.20, pg_fat: 0.001, pg_kcal: 0.86,
    state: 'raw', aliases: ['sweet potato', 'raw sweet potato'],
  },
  'sourdough bread': {
    pg_protein: 0.10, pg_carb: 0.56, pg_fat: 0.012, pg_kcal: 2.75,
    state: 'fresh', aliases: ['sourdough', 'sourdough slice', 'homemade sourdough'],
  },
  'banana (fresh)': {
    pg_protein: 0.011, pg_carb: 0.23, pg_fat: 0.003, pg_kcal: 0.96,
    state: 'fresh', aliases: ['banana', 'fresh banana', 'ripe banana', 'medium banana'],
  },
  'mixed berries (fresh)': {
    pg_protein: 0.009, pg_carb: 0.10, pg_fat: 0.005, pg_kcal: 0.48,
    state: 'fresh', aliases: ['berries', 'mixed berries', 'fresh berries', 'blueberries', 'raspberries'],
  },
  'melon (fresh)': {
    pg_protein: 0.005, pg_carb: 0.072, pg_fat: 0.001, pg_kcal: 0.31,
    state: 'fresh', aliases: ['melon', 'rockmelon', 'cantaloupe', 'fresh melon'],
  },
  'honey': {
    pg_protein: 0.003, pg_carb: 0.82, pg_fat: 0, pg_kcal: 3.30,
    state: 'fresh', aliases: ['honey'],
  },
  // ─── Fats ────────────────────────────────────────────────────────────
  'ghee': {
    pg_protein: 0, pg_carb: 0, pg_fat: 0.99, pg_kcal: 8.95,
    state: 'fresh', aliases: ['ghee'],
  },
  'tallow': {
    pg_protein: 0, pg_carb: 0, pg_fat: 1.0, pg_kcal: 9.0,
    state: 'fresh', aliases: ['tallow', 'beef tallow', 'beef dripping', 'dripping'],
  },
  'olive oil': {
    pg_protein: 0, pg_carb: 0, pg_fat: 1.0, pg_kcal: 8.84,
    state: 'fresh', aliases: ['olive oil', 'evoo', 'extra virgin olive oil'],
  },
  'avocado oil': {
    pg_protein: 0, pg_carb: 0, pg_fat: 1.0, pg_kcal: 8.84,
    state: 'fresh', aliases: ['avocado oil'],
  },
  'butter': {
    pg_protein: 0.009, pg_carb: 0.001, pg_fat: 0.81, pg_kcal: 7.34,
    state: 'fresh', aliases: ['butter'],
  },
}

/**
 * Look up a food by free-text name; matches against canonical keys and
 * aliases. Returns the per-gram macros or null if not found.
 *
 * The match is intentionally loose: case-insensitive, ignores trailing
 * "(raw)" / "(cooked)" / "(dry)" qualifiers in the input, and treats
 * plural / singular as equivalent. The aliases array carries the variants
 * the nutrition prompt actually emits.
 */
export function lookupFood(name: string): { canonical: string; macros: FoodMacros } | null {
  const cleaned = name.toLowerCase().trim()
  for (const [canonical, macros] of Object.entries(FOOD_DB)) {
    if (canonical === cleaned) return { canonical, macros }
    if (macros.aliases.some(a => a === cleaned)) return { canonical, macros }
    // also try without trailing parenthesised qualifier
    const noQual = cleaned.replace(/\s*\([^)]*\)\s*$/, '')
    if (canonical === noQual) return { canonical, macros }
    if (macros.aliases.some(a => a === noQual)) return { canonical, macros }
  }
  return null
}

/**
 * Substitution-equivalence validator.
 *
 * Given an "original" portion (food name + grams) and a list of proposed
 * substitutions (each name + grams), returns the worst macro drift across
 * the substitutions vs the original.
 *
 * A swap is considered SAFE when each macro (protein, carb, fat) is
 * within the configured tolerance (default ±20%) of the original AND the
 * total kcal is within ±15% of the original. The defaults are deliberately
 * generous because intra-supplier variance is real; the goal is to catch
 * 2-3x errors like "100g dry rice ↔ 150g raw potato called equal-carb".
 *
 * Returns:
 *   - { ok: true } when every sub is within tolerance
 *   - { ok: false, drifts } with the failing subs named + their delta %
 *   - { ok: false, unknown } when a food isn't in the reference table
 */
export interface SubstitutionTarget {
  name: string
  grams: number
}

export interface SubstitutionDrift {
  sub: SubstitutionTarget
  proteinPct: number
  carbPct: number
  fatPct: number
  kcalPct: number
  worstMetric: 'protein' | 'carb' | 'fat' | 'kcal'
  worstPct: number
}

export interface SubstitutionValidationResult {
  ok: boolean
  unknown: string[]
  drifts: SubstitutionDrift[]
}

export function validateSubstitutions(
  original: SubstitutionTarget,
  subs: SubstitutionTarget[],
  tolerance = { macro: 0.20, kcal: 0.15 },
): SubstitutionValidationResult {
  const unknown: string[] = []
  const drifts: SubstitutionDrift[] = []

  const origLookup = lookupFood(original.name)
  if (!origLookup) {
    return { ok: false, unknown: [original.name], drifts: [] }
  }
  const origMacros = origLookup.macros
  const origP = origMacros.pg_protein * original.grams
  const origC = origMacros.pg_carb * original.grams
  const origF = origMacros.pg_fat * original.grams
  const origK = origMacros.pg_kcal * original.grams

  for (const sub of subs) {
    const lookup = lookupFood(sub.name)
    if (!lookup) {
      unknown.push(sub.name)
      continue
    }
    const m = lookup.macros
    const subP = m.pg_protein * sub.grams
    const subC = m.pg_carb * sub.grams
    const subF = m.pg_fat * sub.grams
    const subK = m.pg_kcal * sub.grams

    const safeDiv = (sub: number, orig: number) => (orig === 0 && sub === 0) ? 0 : Math.abs(sub - orig) / Math.max(orig, 0.0001)
    const proteinPct = safeDiv(subP, origP)
    const carbPct = safeDiv(subC, origC)
    const fatPct = safeDiv(subF, origF)
    const kcalPct = safeDiv(subK, origK)

    let worstMetric: 'protein' | 'carb' | 'fat' | 'kcal' = 'protein'
    let worstPct = proteinPct
    for (const [k, v] of [['carb', carbPct], ['fat', fatPct], ['kcal', kcalPct]] as const) {
      if (v > worstPct) { worstMetric = k; worstPct = v }
    }

    const passes =
      proteinPct <= tolerance.macro &&
      carbPct <= tolerance.macro &&
      fatPct <= tolerance.macro &&
      kcalPct <= tolerance.kcal
    if (!passes) {
      drifts.push({ sub, proteinPct, carbPct, fatPct, kcalPct, worstMetric, worstPct })
    }
  }

  return { ok: unknown.length === 0 && drifts.length === 0, unknown, drifts }
}

/**
 * Parse a substitution-options line into structured items.
 *
 * The nutrition generator currently emits prose like
 * "Chicken breast (165g raw) ↔ chicken thigh skinless (185g raw), turkey,
 *  tuna canned in spring water (100g drained)"
 *
 * This function tries to extract { name, grams } pairs from such lines. It
 * is a best-effort parser; lines that don't match the expected shape fall
 * through with the original text returned so the audit can show "unparsed"
 * rather than silently passing.
 *
 * Returns:
 *   - { ok: true, original, subs }    structured pair extracted
 *   - { ok: false }                    line couldn't be parsed
 */
export interface ParsedSubLine {
  ok: boolean
  original?: SubstitutionTarget
  subs?: SubstitutionTarget[]
  raw: string
}

export function parseSubstitutionLine(line: string): ParsedSubLine {
  // Strip any trailing prose after an em dash, en dash, or hyphen-space (e.g.
  // "...A (Ng raw), B (Ng raw) — note about the swap" -> "...A (Ng raw), B (Ng raw)").
  // The note text breaks comma-splitting because it can contain its own
  // parentheticals.
  const trimmed = line.replace(/\s*[—–]\s+[^()]*$/, '').replace(/\s+-\s+[^()]*$/, '').trim()

  // Match "Food (Ng state) ↔ rest"
  const arrowMatch = trimmed.match(/^(.+?)\s*[↔↔↔]\s*(.+)$/u) ?? trimmed.match(/^(.+?)\s*<->\s*(.+)$/) ?? null
  if (!arrowMatch) return { ok: false, raw: line }
  const [, lhs, rhs] = arrowMatch

  const extractPortion = (text: string): SubstitutionTarget | null => {
    // Strip trailing parens that don't contain grams. Catches the engine
    // drift where the LHS gets meal-context tacked on ("Chicken (raw)
    // (lunch)" -> "Chicken (raw)"; "almonds (breakfast)" -> "almonds").
    // Keep stripping as long as the rightmost paren is gram-free. A "~Ng"
    // approximation still counts as grams.
    let cleaned = text.trim()
    while (true) {
      const m = cleaned.match(/^(.*?)\s*\(([^()]*)\)\s*$/)
      if (!m) break
      if (/~?\s*\d+(?:\.\d+)?\s*g\b/i.test(m[2])) break
      cleaned = m[1].trim()
      if (!cleaned) return null
    }

    // Canonical: "Food name (Ng [state])". State is optional after the grams.
    const canonical = cleaned.match(/^(.+?)\s*\(~?\s*(\d+(?:\.\d+)?)\s*g(?:\s+[^)]+)?\)\s*$/)
    if (canonical) return { name: canonical[1].trim(), grams: parseFloat(canonical[2]) }

    // Drift: "Ng Food name" with grams as a prefix instead of inside parens.
    // Common with one-word foods ("10g almonds", "15g olive oil").
    const gramsPrefix = cleaned.match(/^~?\s*(\d+(?:\.\d+)?)\s*g\s+(.+?)\s*$/)
    if (gramsPrefix) return { name: gramsPrefix[2].trim(), grams: parseFloat(gramsPrefix[1]) }

    return null
  }

  const original = extractPortion(lhs.trim())
  if (!original) return { ok: false, raw: line }

  const subs: SubstitutionTarget[] = []
  // RHS may be comma-separated; some entries lack portion info ("turkey",
  // "lean ground turkey") — we skip those rather than fail the whole line.
  for (const piece of rhs.split(',')) {
    const portion = extractPortion(piece.trim())
    if (portion) subs.push(portion)
  }

  if (subs.length === 0) return { ok: false, raw: line }
  return { ok: true, original, subs, raw: line }
}
