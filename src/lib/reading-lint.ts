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
  /** How long they have actually been coached here. */
  tenure?: {
    weeksInCoaching: number | null
    /** Past this, beginning language is a finding. Defaults to 8. */
    newUntilWeeks?: number
  } | null
  /** Values from the client's own blood panel, as printed. */
  labValues?: string[]
  /** The body state on the record, so a reading naming another is caught. */
  bodyState?: string | null
  /** Age of the assessment this reading was written from. */
  sourceAgeWeeks?: number | null
}

/**
 * Language that says "you are at the beginning". Deliberately phrases rather
 * than single words: "start" appears in perfectly good sentences and would
 * make this unusable.
 */
const BEGINNING_PHRASES: RegExp[] = [
  /\bon[-\s]ramp\b/i,
  /\bgetting started\b/i,
  /\bjust starting\b/i,
  /\bstarting out\b/i,
  /\bnew to (?:training|structured training|this|lifting|the gym)\b/i,
  /\byour first (?:few )?(?:weeks|sessions|block)\b/i,
  /\bearly (?:days|weeks|stages)\b/i,
  /\bfrom scratch\b/i,
  /\beasing you in\b/i,
  /\bfirst steps\b/i,
  /\bbuilding a base (?:that isn'?t|you don'?t)\b/i,
  /\b(?:isn'?t|is not) there yet\b/i,
  /\bbeginning of your (?:journey|training)\b/i,
]

/** The three internal state names. A reading may use them; it may not use the wrong one. */
const BODY_STATES = ['Remediation', 'Optimisation', 'Post-Optimisation']

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
      // A denial of SEVERE restriction is not a denial of restriction, and it
      // is usually the honest thing to write: "we are not chasing steep calorie
      // restriction" alongside a deliberate 200 kcal deficit is accurate.
      // Razia's reading, 9 Sep 2026, was blocked from publishing by this check
      // while its very next sentence stated the deficit plainly. Without this
      // guard the check punishes the correct wording and pushes writers toward
      // saying nothing about restriction at all.
      const QUALIFIED = /\b(aggressive|steep|severe|extreme|drastic|crash|harsh|significant|major|large|strict)\b[^.]{0,30}(?:calorie restriction|restriction|restricting|deficit|cutting calories|tightening)/i
      // Equally, a section that states the deficit somewhere is not denying it.
      const ACKNOWLEDGES = /\b(?:deliberate|modest|small|slight|gentle|conservative|deliberately)\b[^.]{0,40}\b(?:reduction|deficit|below what)\b|\bdoes include a\b[^.]{0,40}\b(?:reduction|deficit)\b/i
      for (const [field, text] of all) {
        if (ACKNOWLEDGES.test(text)) continue
        for (const s of sentences(text)) {
          if (!denial.test(s)) continue
          if (QUALIFIED.test(s)) continue
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

  // ── 4. Describing an established client as a beginner ──────────────────────
  // Razia, 8 Sep 2026: "we're building your on-ramp conservatively rather than
  // assuming a fitness base that isn't there yet", sixteen weeks in and one day
  // into her third block. The generator was never told when she started, so it
  // wrote from her intake. Passing the fact prevents most of these; this
  // catches the rest, because a model handed a four-month-old intake will
  // gravitate back to its story.
  const weeks = input.tenure?.weeksInCoaching
  if (weeks != null && weeks >= (input.tenure?.newUntilWeeks ?? 8)) {
    for (const [field, text] of all) {
      for (const s of sentences(text)) {
        const hit = BEGINNING_PHRASES.find(re => re.test(s))
        if (!hit) continue
        // "before we started your training was limited" is the correct way to
        // say this and must not be caught. Past tense about the time before
        // coaching is legitimate; present tense about now is not.
        if (/\b(before we (started|began)|before joining|before you (started|came)|when you started|at the start|back then|used to)\b/i.test(s)) continue
        findings.push({
          severity: 'block',
          code: 'TENURE_MISMATCH',
          message: `${field} describes this client as starting out, but she has been coached here for ${weeks} weeks. Say it in the past tense, or drop it.`,
          excerpt: excerpt(s),
        })
        break
      }
    }
  }

  // ── 5. A lab value in client-facing text ───────────────────────────────────
  // Scope of practice. Out-of-range markers are routed to the client's GP; a
  // reading that prints the number has quietly taken the interpretation on
  // itself. Nothing prevented this before: her panel reaches the reading only
  // as prose, but nothing stopped that prose carrying a figure through.
  for (const value of input.labValues ?? []) {
    const re = new RegExp(`(?<![\\d.])${value.replace('.', '\\.')}(?![\\d.])`)
    for (const [field, text] of all) {
      for (const s of sentences(text)) {
        if (!re.test(s)) continue
        // A bare number is only a lab value in the company of clinical framing.
        // "24" alone is a week count or an age far more often than a marker.
        if (!/\b(nmol|umol|µmol|mmol|pmol|ng|mg|mcg|iu|g\/l|u\/l|%|level|marker|reading|result|range|deficien|elevated|low|high)\b/i.test(s)) continue
        findings.push({
          severity: 'block',
          code: 'LAB_VALUE_NAMED',
          message: `${field} appears to state a value from her blood panel (${value}). Lab numbers belong with her GP, not in a reading. Describe the direction in plain words instead.`,
          excerpt: excerpt(s),
        })
        break
      }
    }
  }

  // ── 6. A body state that is not the one on file ────────────────────────────
  // Cheap to check, and everything downstream is built on the state being
  // right. A reading that renames it silently contradicts her program, her
  // plan and her portal.
  if (input.bodyState) {
    const onFile = input.bodyState.toLowerCase()
    for (const [field, text] of all) {
      for (const s of sentences(text)) {
        for (const state of BODY_STATES) {
          if (state.toLowerCase() === onFile) continue
          if (!new RegExp(`\\b${state}\\b`, 'i').test(s)) continue
          findings.push({
            severity: 'block',
            code: 'STATE_CONTRADICTION',
            message: `${field} names ${state}, but this client's recorded state is ${input.bodyState}.`,
            excerpt: excerpt(s),
          })
          break
        }
      }
    }
  }

  // ── 7. Built on an assessment that has aged ────────────────────────────────
  // A warning, not a block. Sometimes a fifteen-week-old read is still an
  // accurate description of someone, and that judgement is the coach's.
  if (input.sourceAgeWeeks != null && input.sourceAgeWeeks >= 12) {
    findings.push({
      severity: 'warn',
      code: 'STALE_SOURCE',
      message: `This reading is built on an assessment ${input.sourceAgeWeeks} weeks old. Check it still describes her before publishing.`,
    })
  }

  // ── 8. Nothing to review ───────────────────────────────────────────────────
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
