// Fails if any question a generator renders into a client-facing prompt uses
// vocabulary that the banned-terms audit will then reject in the output.
//
// The failure this prevents (30 Aug 2026): pc_wired_tired asks "I feel wired
// but tired", formatProgressCheck rendered it verbatim into the prompt, the
// model quoted the client's own signal back, and the audit rejected the entire
// Progress Read. Four of four attempts. Because it was the first Progress Check
// ever completed, the feature had been unusable and silent since 11 Aug.
//
// Fix a hit by giving the question a `promptText` (see Question.promptText):
// the client keeps the natural phrasing, the model never sees the banned term.
//
//   cd ~/body-recode-mvp && npx tsx scripts/audit-question-text.ts

import { findLeakedTerms } from '@/lib/banned-client-terms'
import { PROGRESS_CHECK_SECTIONS } from '@/lib/progress-check-questions'
import { FORM_A_SECTIONS, FORM_B_SECTIONS } from '@/lib/weekly-checkin-questions'
import { INTAKE_SECTIONS, type Section } from '@/lib/intake-questions'

const SOURCES: { label: string; sections: Section[] }[] = [
  { label: 'PROGRESS_CHECK', sections: PROGRESS_CHECK_SECTIONS },
  { label: 'CHECKIN_FORM_A', sections: FORM_A_SECTIONS as Section[] },
  { label: 'CHECKIN_FORM_B', sections: FORM_B_SECTIONS as Section[] },
  { label: 'INTAKE', sections: INTAKE_SECTIONS },
]

let failures = 0
for (const { label, sections } of SOURCES) {
  for (const section of sections) {
    for (const q of section.questions) {
      // promptText is what the prompt actually sees, so that is what matters.
      const effective = q.promptText ?? q.text
      const leaks = findLeakedTerms(effective)
      if (leaks.length) {
        failures++
        console.error(`FAIL  ${label} ${q.id}`)
        console.error(`      prompt sees: "${effective}"`)
        console.error(`      banned:      ${leaks.join(', ')}`)
        console.error(`      fix: add a promptText that avoids it\n`)
      }
      for (const opt of q.options ?? []) {
        const optLeaks = findLeakedTerms(opt)
        if (optLeaks.length) {
          failures++
          console.error(`FAIL  ${label} ${q.id} option "${opt}" -> ${optLeaks.join(', ')}\n`)
        }
      }
    }
  }
}

const total = SOURCES.reduce((n, s) => n + s.sections.reduce((m, x) => m + x.questions.length, 0), 0)
if (failures) {
  console.error(`${failures} collision(s) across ${total} questions.`)
  process.exit(1)
}
console.log(`ok — ${total} questions across ${SOURCES.length} sources, no banned-term collisions.`)
