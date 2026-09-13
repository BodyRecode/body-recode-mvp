/**
 * Generates the Progress Check question-by-question appendix FROM THE INTAKE SOURCE.
 *
 * Why a script and not a hand-written table: the intake changes. It was 230 on
 * 3 Sep and 234 by 13 Sep, and a spec that quoted 230 from memory was wrong for
 * ten days without anyone noticing. A list generated from src/lib/intake-questions.ts
 * cannot drift from it. Re-run after any intake change:
 *
 *   npx tsx scripts/build-progress-check-question-list.ts > <spec folder>/..._APPENDIX_question_list.md
 */
import { INTAKE_SECTIONS, getTotalQuestions } from '../src/lib/intake-questions'

// Every question is RE-ASKED unless it is listed here with a reason. Subtract from
// the full intake; never add to a short form. See Progress Read spec §2a.
const NOT_REASKED: Record<string, string> = {
  full_name: 'Identity. Held on her record.',
  date_of_birth: 'Identity. Cannot change.',
  gender: 'Identity. Re-asked only if she chooses to update it, never as part of the check.',
  occupation: 'Identity. A change is captured by "what has changed since your last read".',
  mobile_number: 'Contact detail, managed in her portal.',
  emergency_contact_name: 'Contact detail, managed in her portal.',
  emergency_contact_phone: 'Contact detail, managed in her portal.',
  how_did_you_hear: 'Acquisition. Cannot change.',
  intake_confirmation: 'Replaced by the Progress Check’s own confirmation.',
  inj_06: 'Past injury history is fixed. New injuries are captured by "what has changed".',
  final_disclosure: 'Replaced by the Progress Check’s own confirmation.',
  final_system_alignment: 'Replaced by the Progress Check’s own confirmation.',
  final_accuracy: 'Replaced by the Progress Check’s own confirmation.',
}

// Added to the intake around 9 Sep 2026 by the Extended Zones rebuild. Verified 13 Sep:
// all 10 intakes on file PREDATE these, so no client has a previous answer. Reveal-on-commit
// must show the no-previous-answer state, and the change doctrine must not read
// "nothing, then an answer" as movement.
const NO_PREVIOUS_FOR_CURRENT_CLIENTS = new Set(['fm_26', 'fm_27', 'fm_28', 'fm_29'])

const total = getTotalQuestions()
let kept = 0, dropped = 0
const out: string[] = []

out.push('# Progress Check — question-by-question list')
out.push('')
out.push(`**Generated from \`src/lib/intake-questions.ts\`. Do not edit by hand — re-run the script.**`)
out.push('')
out.push(`Intake total at generation: **${total}**.`)
out.push('')

for (const section of INTAKE_SECTIONS) {
  const rows: string[] = []
  for (const q of section.questions) {
    const reason = NOT_REASKED[q.id]
    const flag = NO_PREVIOUS_FOR_CURRENT_CLIENTS.has(q.id) ? ' ⚠ no previous answer for any current client' : ''
    const text = (q.text || '').replace(/\n/g, ' ').replace(/\|/g, '/').slice(0, 110)
    if (reason) { dropped++; rows.push(`| \`${q.id}\` | ~~${text}~~ | **not re-asked** — ${reason} |`) }
    else { kept++; rows.push(`| \`${q.id}\` | ${text} | re-asked${flag} |`) }
  }
  const secKept = section.questions.filter(q => !NOT_REASKED[q.id]).length
  out.push(`## ${section.title} — ${secKept} of ${section.questions.length} re-asked`)
  out.push('')
  out.push('| id | question | Progress Check |')
  out.push('|---|---|---|')
  out.push(...rows)
  out.push('')
}

out.splice(5, 0, `**Re-asked: ${kept}. Not re-asked: ${dropped}.** Plus the new hormonal status questions (spec §4), the measurements and three photos, and "what has changed since your last read".`, '')
console.log(out.join('\n'))
