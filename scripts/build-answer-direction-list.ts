/**
 * Writes the answer-direction list as a document Kade can check, from the code.
 * Re-run after changing lib/answer-direction.ts or adding an intake scale question:
 *
 *   npx tsx scripts/build-answer-direction-list.ts > <spec folder>/2026-09-14_Progress_Check_APPENDIX_answer_directions.md
 */
import { INTAKE_SECTIONS } from '../src/lib/intake-questions'
import { ANSWER_DIRECTION } from '../src/lib/answer-direction'

const WORDS = { strain: 'higher = worse', capacity: 'higher = better', neutral: 'not counted' } as const
const out: string[] = []
out.push('# Progress Check: which way is better, per question')
out.push('')
out.push('**Generated from `src/lib/answer-direction.ts`. Do not edit by hand.** Drafted by Claude on 14 Sep 2026 from the wording of each question, **for Kade to check.**')
out.push('')
out.push('The comparison only calls a section changed when enough of its questions move the same way. Within a section some statements are good things ("I fall asleep easily") and some are bad ("I wake during the night"), so each question needs a direction. A wrong one makes that question push its section the wrong way.')
out.push('')
out.push('- **higher = worse**: a higher answer means more strain, symptom or limitation')
out.push('- **higher = better**: a higher answer means more ease, stability or capacity')
out.push('- **not counted**: history, preference or attribution. Still shown if it moves, never counted. Most "I have ..." history questions are here on purpose, because they only ever rise with coaching and counting them would flatter every read.')
out.push('')
out.push('In Section A, "higher = worse" means only that more of the signal is present. What that means for the person is the read\'s job.')
for (const s of INTAKE_SECTIONS) {
  const qs = s.questions.filter(q => q.type === 'scale')
  if (!qs.length) continue
  out.push('', `## ${s.title}`, '', '| id | question | direction |', '|---|---|---|')
  for (const q of qs) out.push(`| \`${q.id}\` | ${q.text.replace(/\|/g, '/')} | ${WORDS[ANSWER_DIRECTION[q.id]] ?? '**MISSING**'} |`)
}
console.log(out.join('\n'))
