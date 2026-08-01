/**
 * Tests for the pre-publish checks on client-facing readings.
 *
 * Every case is a real failure that reached Vicki S before she ended her
 * engagement on 31 July 2026.
 *
 *   npm run test:reading-lint
 */
import { lintClientReading, blockingFindings } from '../src/lib/reading-lint'

let failed = 0, passed = 0
function check(name: string, cond: boolean, detail?: string) {
  if (cond) { passed++; console.log(`  PASS  ${name}`) }
  else { failed++; console.log(`  FAIL  ${name}${detail ? `\n        ${detail}` : ''}`) }
}

const VICKI_SOURCE = `52-year-old female. DCIS 2026, annual surveillance, no endocrine therapy.
Sacroiliac currently symptomatic. Feet, ankles, wrists, neck history. Fragmented sleep.
No car, walks and cycles for transport. Freelance work, office 3 days. Batch cooks.
Dairy protein, egg and capsicum intolerance. Goal: 7 Bridges walk, late October.`

console.log('\nTHE ONE THAT ENDED AN ENGAGEMENT')
{
  const f = lintClientReading({
    sections: {
      cr_coach_note: 'Vicki, working through an intake this thorough, especially alongside everything going on with your family, takes real effort.',
    },
    sourceMaterial: VICKI_SOURCE,
  })
  check('the invented family reference is caught', f.some(x => x.code === 'UNSOURCED_LIFE_REFERENCE'))
  check('and it BLOCKS rather than warns', blockingFindings(f).length > 0)
  check('the message names the term', f[0]?.message.includes('family'), f[0]?.message)
  check('and quotes the sentence so it can be found', !!f[0]?.excerpt?.includes('your family'))
}

console.log('\nA REFERENCE THE CLIENT ACTUALLY MADE IS FINE')
{
  const f = lintClientReading({
    sections: { cr_coach_note: 'Fitting sessions around caring for your mother is the real constraint here.' },
    sourceMaterial: VICKI_SOURCE + ' Client reports caring for her mother three days a week.',
  })
  check('no finding when the source mentions it', f.length === 0, JSON.stringify(f))
}

console.log('\nCONTRADICTING THE LIVE NUTRITION PLAN')
{
  const f = lintClientReading({
    sections: {
      cr_what_were_not_doing_yet: "Calorie restriction isn't part of the picture either, your nutrition structure is already a strength and tightening it further isn't what this stage calls for.",
    },
    sourceMaterial: VICKI_SOURCE,
    nutrition: { tdeeKcal: 1986, planKcal: 1793 },
  })
  check('caught when the plan runs a real deficit', f.some(x => x.code === 'CONTRADICTS_NUTRITION_PLAN'))
  check('and it blocks', blockingFindings(f).length > 0)
  check('the message states the actual deficit', f.some(x => /193 kcal deficit/.test(x.message)), JSON.stringify(f.map(x => x.message)))

  // Same sentence, but the plan really is at maintenance.
  const g = lintClientReading({
    sections: { cr_what_were_not_doing_yet: "Calorie restriction isn't part of the picture." },
    sourceMaterial: VICKI_SOURCE,
    nutrition: { tdeeKcal: 1986, planKcal: 1960 },
  })
  check('NOT caught when the claim is true', !g.some(x => x.code === 'CONTRADICTS_NUTRITION_PLAN'))
}

console.log('\nWEEK COUNTS AGAINST THE CALENDAR')
{
  const now = new Date('2026-07-28T00:00:00+10:00')
  const event = new Date('2026-10-24T00:00:00+10:00') // 12.6 weeks
  const f = lintClientReading({
    sections: { cr_what_were_focusing_on_first: 'With your walk in late October in view, nine weeks is a real window to work with.' },
    sourceMaterial: VICKI_SOURCE,
    event: { date: event, now },
  })
  check('"nine weeks" against a 13-week runway is caught', f.some(x => x.code === 'WEEK_COUNT_MISMATCH'))
  check('it warns rather than blocks, since it may mean something else',
    f.find(x => x.code === 'WEEK_COUNT_MISMATCH')?.severity === 'warn')

  const g = lintClientReading({
    sections: { cr_what_were_focusing_on_first: 'You have about thirteen weeks before the walk.' },
    sourceMaterial: VICKI_SOURCE,
    event: { date: event, now },
  })
  check('a correct count passes', !g.some(x => x.code === 'WEEK_COUNT_MISMATCH'))

  const h = lintClientReading({
    sections: { cr_what_were_focusing_on_first: 'This block runs for four weeks.' },
    sourceMaterial: VICKI_SOURCE,
    event: { date: event, now },
  })
  check('a block duration is flagged as a warning only, not a block',
    h.every(x => x.severity === 'warn'))
}

console.log('\nA CLEAN READING PASSES')
{
  const f = lintClientReading({
    sections: {
      cr_where_you_are: 'Your body is prioritising stability over change right now, which is a coherent response to broken sleep and active pain.',
      cr_coach_note: 'Vicki, you answered this intake with more precision than most people manage, including the parts that are not easy to write down. Kade',
    },
    sourceMaterial: VICKI_SOURCE,
    nutrition: { tdeeKcal: 1986, planKcal: 1793 },
  })
  check('no findings on clean text', f.length === 0, JSON.stringify(f))
}

console.log('\nEDGE CASES')
{
  check('empty reading blocks', lintClientReading({ sections: {}, sourceMaterial: VICKI_SOURCE })
    .some(x => x.code === 'EMPTY_READING'))
  check('missing nutrition figures skip that check rather than crash',
    lintClientReading({ sections: { a: "restriction isn't part of this" }, sourceMaterial: VICKI_SOURCE, nutrition: null })
      .every(x => x.code !== 'CONTRADICTS_NUTRITION_PLAN'))
  check('no event skips the week check',
    lintClientReading({ sections: { a: 'nine weeks from now' }, sourceMaterial: VICKI_SOURCE, event: null })
      .every(x => x.code !== 'WEEK_COUNT_MISMATCH'))
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
