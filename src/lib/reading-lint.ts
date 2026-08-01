/**
 * Mechanical checks on client-facing text, run before it can be published.
 *
 * Written 2026-08-01 after a client ended her engagement over her Foundational
 * Reading. It was signed by Kade and told her "especially alongside everything
 * going on with your family". She had never mentioned family. The model invented
 * it to satisfy an instruction to sound personal, the reading auto-published on
 * generation, and she read it before anyone else did.
 *
 * That reading also told her "calorie restriction isn't part of the picture"
 * while her live plan carried a 193 kcal deficit, and an earlier version said
 * "nine weeks is a real window" when her event was 12.6 weeks away.
 *
 * Every one of those is mechanically detectable. None of them needed judgement.
 *
 * WHAT THIS IS NOT. It is not a quality review and it cannot replace a coach
 * reading the thing. It catches the class of error where the text asserts
 * something the source material contradicts or never contained. A clean lint
 * means nothing was caught, not that the reading is good.
 */

export interface LintFinding {
  severity: 'block' | 'warn'
  code: string
  message: string
  /** The offending sentence, so the coach can see it in context. */
  excerpt?: string
}

/**
 * Life circumstances a reading has no business asserting unless the client
 * said so. Deliberately not "any noun that might be personal": these are the
 * ones a model reaches for when told to sound warm.
 */
const LIFE_TERMS = [
  'family', 'families', 'partner', 'husband', 'wife', 'spouse', 'marriage',
  'kids', 'children', 'child', 'daughter', 'son', 'grandchild', 'grandchildren',
  'divorce', 'separation', 'bereavement', 'grief', 'loss of', 'passing of',
  'caring for', 'carer', 'caregiver',
  'moving house', 'relocation', 'new job', 'career change', 'redundancy',
  'your business', 'your studies', 'your degree',
]

function sentences(text: string): string[] {
  return text.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean)
}

function excerpt(s: string, max = 180): string {
  return s.length <= max ? s : s.slice(0, max).trimEnd() + '…'
}

export interface LintInput {
  /** The client-facing sections, keyed by field name. */
  sections: Record<string, string | null | undefined>
  /** Everything the reading is allowed to know: intake, CFFS, coach guidance. */
  sourceMaterial: string
  /** Live nutrition figures, when there is an active plan. */
  nutrition?: {
    tdeeKcal?: number | null
    planKcal?: number | null
  } | null
  /** For checking any "N weeks" claim against the real runway. */
  event?: {
    date: Date
    now?: Date
  } | null
}

export function lintClientReading(input: LintInput): LintFinding[] {
  const findings: LintFinding[] = []
  const source = (input.sourceMaterial ?? '').toLowerCase()
  const all = Object.entries(input.sections)
    .filter(([, v]) => typeof v === 'string' && v.trim())
    .map(([k, v]) => [k, v as string] as const)

  // ── 1. Life circumstances the client never mentioned ───────────────────────
  // The one that ended an engagement. A term is only a finding when it appears
  // in the reading AND nowhere in the source: if she mentioned her family, the
  // reading may reference it.
  for (const [field, text] of all) {
    for (const s of sentences(text)) {
      for (const term of LIFE_TERMS) {
        const re = new RegExp(`\\b${term.replace(/\s+/g, '\\s+')}\\b`, 'i')
        if (!re.test(s)) continue
        if (source.includes(term.toLowerCase())) continue
        findings.push({
          severity: 'block',
          code: 'UNSOURCED_LIFE_REFERENCE',
          message: `"${term}" appears in ${field} but nowhere in this client's intake, CFFS or your guidance. If they did not tell you, do not tell them back.`,
          excerpt: excerpt(s),
        })
        break
      }
    }
  }

  // ── 2. Claiming no restriction while the plan restricts ────────────────────
  const n = input.nutrition
  if (n?.tdeeKcal && n?.planKcal) {
    const deficit = n.tdeeKcal - n.planKcal
    if (deficit > 75) {
      // Both orders. "not restricting calories" and "calorie restriction isn't
      // part of the picture" say the same thing; only the second was written.
      const TERM = '(?:calorie restriction|restriction|restricting|deficit|cutting calories|tightening)'
      const NEG = "(?:isn'?t|is not|aren'?t|are not|won'?t|will not|\\bnot\\b|\\bno\\b)"
      const denials = [
        new RegExp(`${NEG}[^.]{0,60}\\b${TERM}\\b`, 'i'),
        new RegExp(`\\b${TERM}\\b[^.]{0,60}${NEG}`, 'i'),
      ]
      const denial = { test: (x: string) => denials.some(r => r.test(x)) }
      for (const [field, text] of all) {
        for (const s of sentences(text)) {
          if (!denial.test(s)) continue
          findings.push({
            severity: 'block',
            code: 'CONTRADICTS_NUTRITION_PLAN',
            message: `${field} says restriction is not happening, but the live plan runs a ${Math.round(deficit)} kcal deficit against an estimated ${n.tdeeKcal} kcal maintenance.`,
            excerpt: excerpt(s),
          })
        }
      }
    }
  }

  // ── 3. Week counts that do not match the calendar ──────────────────────────
  if (input.event?.date) {
    const now = input.event.now ?? new Date()
    const realWeeks = Math.ceil((input.event.date.getTime() - now.getTime()) / (7 * 86400000))
    const WORDS: Record<string, number> = {
      one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8,
      nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14,
      fifteen: 15, sixteen: 16, eighteen: 18, twenty: 20,
    }
    for (const [field, text] of all) {
      for (const s of sentences(text)) {
        const m = s.match(/\b(\d{1,2}|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|eighteen|twenty)\s+weeks?\b/i)
        if (!m) continue
        const raw = m[1].toLowerCase()
        const claimed = /^\d+$/.test(raw) ? parseInt(raw, 10) : WORDS[raw]
        if (!claimed) continue
        if (Math.abs(claimed - realWeeks) <= 1) continue
        findings.push({
          severity: 'warn',
          code: 'WEEK_COUNT_MISMATCH',
          message: `${field} says ${m[1]} weeks; the actual runway to the event is ${realWeeks}. Check whether this refers to something else before publishing.`,
          excerpt: excerpt(s),
        })
      }
    }
  }

  // ── 4. Nothing to review ───────────────────────────────────────────────────
  if (all.length === 0) {
    findings.push({
      severity: 'block',
      code: 'EMPTY_READING',
      message: 'There is no content to publish.',
    })
  }

  return findings
}

export function blockingFindings(f: LintFinding[]): LintFinding[] {
  return f.filter(x => x.severity === 'block')
}
