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
  // ─── More proteins (commonly emitted as substitutions) ──────────────
  'tinned salmon (drained)': {
    pg_protein: 0.21, pg_carb: 0, pg_fat: 0.09, pg_kcal: 1.65,
    state: 'drained', aliases: ['tinned salmon', 'canned salmon', 'salmon canned', 'salmon (canned)', 'salmon tinned'],
  },
  'lamb mince (raw)': {
    pg_protein: 0.19, pg_carb: 0, pg_fat: 0.17, pg_kcal: 2.29,
    state: 'raw', aliases: ['lamb mince', 'minced lamb', 'lamb'],
  },
  'greek yoghurt full-fat': {
    pg_protein: 0.09, pg_carb: 0.036, pg_fat: 0.05, pg_kcal: 0.95,
    state: 'fresh', aliases: ['greek yoghurt', 'greek yogurt', 'greek yoghurt (full-fat)', 'full-fat greek yoghurt', 'greek yoghurt, full-fat', 'full fat greek yoghurt'],
  },
  'cottage cheese (full-fat)': {
    pg_protein: 0.11, pg_carb: 0.034, pg_fat: 0.043, pg_kcal: 0.97,
    state: 'fresh', aliases: ['cottage cheese', 'full-fat cottage cheese'],
  },
  'kefir (full-fat)': {
    pg_protein: 0.033, pg_carb: 0.049, pg_fat: 0.035, pg_kcal: 0.66,
    state: 'fresh', aliases: ['kefir', 'full-fat kefir', 'kefir unsweetened'],
  },
  // ─── Nuts ────────────────────────────────────────────────────────────
  'almonds': {
    pg_protein: 0.21, pg_carb: 0.22, pg_fat: 0.50, pg_kcal: 5.79,
    state: 'fresh', aliases: ['almonds', 'raw almonds', 'whole almonds'],
  },
  'cashews': {
    pg_protein: 0.18, pg_carb: 0.30, pg_fat: 0.44, pg_kcal: 5.55,
    state: 'fresh', aliases: ['cashews', 'cashew nuts'],
  },
  'walnuts': {
    pg_protein: 0.15, pg_carb: 0.14, pg_fat: 0.65, pg_kcal: 6.54,
    state: 'fresh', aliases: ['walnuts'],
  },
  'mixed nuts': {
    pg_protein: 0.18, pg_carb: 0.22, pg_fat: 0.53, pg_kcal: 6.05,
    state: 'fresh', aliases: ['mixed nuts'],
  },
  'avocado (fresh)': {
    pg_protein: 0.02, pg_carb: 0.085, pg_fat: 0.15, pg_kcal: 1.60,
    state: 'fresh', aliases: ['avocado', 'fresh avocado'],
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
    state: 'fresh', aliases: ['butter', 'unsalted butter', 'salted butter'],
  },
  // ─── Added 2026-07-06 (Phase 2 reference-table expansion) ───────────
  // Coach variety guidance for Amanda Stage 2 surfaced 10+ foods the
  // engine emitted that weren't in the table. Adding cooked variants of
  // the starches, kangaroo, apple, and a few phrasings coach nutrition
  // plans reach for regularly.
  'kangaroo mince (raw)': {
    pg_protein: 0.24, pg_carb: 0, pg_fat: 0.02, pg_kcal: 1.14,
    state: 'raw', aliases: ['kangaroo mince', 'kangaroo', 'roo mince', 'kangaroo mince raw'],
  },
  'kangaroo steak (raw)': {
    pg_protein: 0.22, pg_carb: 0, pg_fat: 0.02, pg_kcal: 1.06,
    state: 'raw', aliases: ['kangaroo steak', 'roo steak'],
  },
  'apple (fresh)': {
    pg_protein: 0.003, pg_carb: 0.138, pg_fat: 0.002, pg_kcal: 0.57,
    state: 'fresh', aliases: ['apple', 'medium apple', 'fresh apple', 'apple medium'],
  },
  'white potato (cooked)': {
    // Boiled/baked potato flesh, no oil. ~77 kcal/100g cooked.
    pg_protein: 0.02, pg_carb: 0.17, pg_fat: 0.001, pg_kcal: 0.77,
    state: 'cooked', aliases: ['white potato cooked', 'potato cooked', 'boiled potato', 'baked potato', 'white potato boiled', 'white potato baked'],
  },
  'sweet potato (cooked)': {
    // Boiled/baked sweet potato flesh, no oil. ~86 kcal/100g cooked.
    pg_protein: 0.016, pg_carb: 0.20, pg_fat: 0.001, pg_kcal: 0.86,
    state: 'cooked', aliases: ['sweet potato cooked', 'sweet potato boiled', 'sweet potato baked'],
  },
  'oats (dry)': {
    pg_protein: 0.13, pg_carb: 0.66, pg_fat: 0.07, pg_kcal: 3.79,
    state: 'dry', aliases: ['oats', 'rolled oats', 'oats dry', 'dry oats'],
  },
  'quinoa (cooked)': {
    pg_protein: 0.044, pg_carb: 0.213, pg_fat: 0.019, pg_kcal: 1.20,
    state: 'cooked', aliases: ['quinoa', 'cooked quinoa', 'quinoa cooked'],
  },
  'beef mince 10% fat (raw)': {
    pg_protein: 0.20, pg_carb: 0, pg_fat: 0.10, pg_kcal: 1.70,
    state: 'raw', aliases: ['beef mince 10%', '10% beef mince', 'beef mince 10% fat', 'medium-fat beef mince'],
  },
  'lamb chops (raw)': {
    pg_protein: 0.20, pg_carb: 0, pg_fat: 0.14, pg_kcal: 2.06,
    state: 'raw', aliases: ['lamb chops', 'lamb chop', 'lamb cutlet', 'lamb cutlets'],
  },
  'chicken thigh skin-on (raw)': {
    pg_protein: 0.17, pg_carb: 0, pg_fat: 0.11, pg_kcal: 1.67,
    state: 'raw', aliases: ['chicken thigh skin on', 'chicken thigh with skin', 'chicken thigh (skin on)'],
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

  // Variant expansion pipeline. Each transformation adds candidates the
  // 2026-07-06 audit found the engine emitting on Amanda Stage 2 that
  // didn't match anything:
  //   - "Beef mince, 5% fat" — comma between food + qualifier
  //   - "White rice, cooked" — comma between food + state
  //   - "Tinned tuna in springwater" — smushed alias
  //   - "Salmon, fresh" — leading article stripped as trailing qualifier
  //   - "1/2 banana (~60g)" — fractional count + parenthesised weight
  // Match takes the first hit; more-specific variants tried first.
  const variants = new Set<string>()
  variants.add(cleaned)

  // Strip trailing parenthesised qualifier ("chicken breast (raw)" → "chicken breast")
  const stripParen = (s: string) => s.replace(/\s*\([^)]*\)\s*$/, '').trim()
  // Strip leading count tokens including fractions ("1 banana" / "1/2 banana" / "3 whole eggs" → root food)
  const stripCount = (s: string) => s.replace(/^(?:\d+\/\d+|\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|half|quarter)\s+/, '').trim()
  // Collapse comma-separated qualifier into a canonical form:
  //   "beef mince, 5% fat" → "beef mince 5% fat"
  //   "white rice, cooked" → "white rice cooked"
  const stripComma = (s: string) => s.replace(/,\s+/g, ' ').trim()
  // Normalise repeated whitespace collapses ("chicken  thigh" → "chicken thigh")
  const collapseSpace = (s: string) => s.replace(/\s+/g, ' ').trim()

  const transforms: Array<(s: string) => string> = [
    (s) => s,
    stripParen,
    stripCount,
    stripComma,
    (s) => stripComma(stripParen(s)),
    (s) => stripCount(stripParen(s)),
    (s) => stripCount(stripComma(s)),
    (s) => stripCount(stripComma(stripParen(s))),
  ]
  for (const t of transforms) {
    variants.add(collapseSpace(t(cleaned)))
  }

  for (const v of variants) {
    if (!v) continue
    for (const [canonical, macros] of Object.entries(FOOD_DB)) {
      if (canonical === v) return { canonical, macros }
      if (macros.aliases.some(a => a === v)) return { canonical, macros }
    }
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

    // Percent drift with negligible-floor protection. When the ORIGINAL macro
    // is near zero (olive oil has ~0g protein/carb), a 1.5g difference in the
    // substitute produces nonsense like "90000% off on protein". Treat the
    // macro as a pass when the absolute difference is below the coaching
    // floor: 1.5g for macros, 15kcal for energy. Real signal (salmon vs
    // chicken thigh fat) still surfaces; "butter vs olive oil protein" no
    // longer noise-floods the audit.
    const pctOrZero = (sub: number, orig: number, absFloor: number): number => {
      if (Math.abs(sub - orig) < absFloor) return 0
      if (orig <= 0) return Infinity
      return Math.abs(sub - orig) / orig
    }
    const proteinPct = pctOrZero(subP, origP, 1.5)
    const carbPct = pctOrZero(subC, origC, 1.5)
    const fatPct = pctOrZero(subF, origF, 1.5)
    const kcalPct = pctOrZero(subK, origK, 15)

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
  // RHS is comma-separated, BUT commas inside parens are part of a single
  // entry (e.g. "(cooked, boiled)" describes one state). Split only on
  // top-level commas, tracking paren depth.
  for (const piece of splitTopLevel(rhs, ',')) {
    const portion = extractPortion(piece.trim())
    if (portion) subs.push(portion)
  }

  if (subs.length === 0) return { ok: false, raw: line }
  return { ok: true, original, subs, raw: line }
}

/** Split `text` on `sep` only when not inside parentheses. */
function splitTopLevel(text: string, sep: string): string[] {
  const out: string[] = []
  let depth = 0
  let buf = ''
  for (const ch of text) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === sep && depth === 0) {
      out.push(buf)
      buf = ''
    } else {
      buf += ch
    }
  }
  if (buf.length) out.push(buf)
  return out
}
