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


// ── Added 2026-09-09 with TENURE_MISMATCH, LAB_VALUE_NAMED, STATE_CONTRADICTION
// and STALE_SOURCE. The real sentence from Razia's reading is the anchor case.

console.log('\nTENURE_MISMATCH')
{
  const ONRAMP = "Your training history shows limited prior structured exposure, so we're building your on-ramp conservatively rather than assuming a fitness base that isn't there yet."
  const f = lintClientReading({
    sections: { cr_what_were_focusing_on_first: ONRAMP },
    sourceMaterial: VICKI_SOURCE,
    tenure: { weeksInCoaching: 15 },
  })
  check('the real Razia sentence blocks at 15 weeks',
    f.some(x => x.code === 'TENURE_MISMATCH' && x.severity === 'block'))

  const g = lintClientReading({
    sections: { cr_what_were_focusing_on_first: ONRAMP },
    sourceMaterial: VICKI_SOURCE,
    tenure: { weeksInCoaching: 2 },
  })
  check('the same sentence is fine in week 2', !(g.some(x => x.code === 'TENURE_MISMATCH')))

  // The corrected wording must pass, or the check makes the fix impossible.
  const h = lintClientReading({
    sections: { a: "Your training history before we started was limited, so we've built your first few blocks conservatively rather than assuming a base that wasn't there." },
    sourceMaterial: VICKI_SOURCE,
    tenure: { weeksInCoaching: 15 },
  })
  check('past tense about the time before coaching passes', !(h.some(x => x.code === 'TENURE_MISMATCH')))

  check('no tenure supplied skips the check', !(lintClientReading({ sections: { a: ONRAMP }, sourceMaterial: VICKI_SOURCE }).some(x => x.code === 'TENURE_MISMATCH')))
}

console.log('\nLAB_VALUE_NAMED')
{
  const f = lintClientReading({
    sections: { a: 'Your vitamin D came back at 24 nmol/L, which is low.' },
    sourceMaterial: VICKI_SOURCE,
    labValues: ['24', '5', '650'],
  })
  check('a marker value with a unit blocks',
    f.some(x => x.code === 'LAB_VALUE_NAMED' && x.severity === 'block'))

  check('the same number in ordinary prose passes', !(lintClientReading({
      sections: { a: 'We will look at this again in 24 weeks once things have settled.' },
      sourceMaterial: VICKI_SOURCE,
      labValues: ['24'],
    }).some(x => x.code === 'LAB_VALUE_NAMED')))

  check('a value inside a longer number is not matched', !(lintClientReading({
      sections: { a: 'Your target sits around 2400 kcal on training days.' },
      sourceMaterial: VICKI_SOURCE,
      labValues: ['24'],
    }).some(x => x.code === 'LAB_VALUE_NAMED')))
}

console.log('\nSTATE_CONTRADICTION')
{
  check('naming a different state blocks',
    lintClientReading({
      sections: { a: 'You are in Optimisation, which means we can push harder.' },
      sourceMaterial: VICKI_SOURCE,
      bodyState: 'Remediation',
    }).some(x => x.code === 'STATE_CONTRADICTION' && x.severity === 'block'))

  check('naming the correct state passes', !(lintClientReading({
      sections: { a: 'Right now your body is best described as being in a Remediation state.' },
      sourceMaterial: VICKI_SOURCE,
      bodyState: 'Remediation',
    }).some(x => x.code === 'STATE_CONTRADICTION')))
}

console.log('\nSTALE_SOURCE')
{
  const f = lintClientReading({ sections: { a: 'Anything.' }, sourceMaterial: VICKI_SOURCE, sourceAgeWeeks: 15 })
  check('a 15 week old source warns', f.some(x => x.code === 'STALE_SOURCE' && x.severity === 'warn'))
  check('and does not block', f.filter(x => x.severity === 'block').length === 0)
  check('a fresh source is silent', !(lintClientReading({ sections: { a: 'Anything.' }, sourceMaterial: VICKI_SOURCE, sourceAgeWeeks: 1 })
      .some(x => x.code === 'STALE_SOURCE')))
}

console.log('\nQUALIFIED DENIALS ARE NOT DENIALS')
{
  // Razia's real section, 9 Sep 2026. It denies STEEP restriction and states
  // the modest deficit in the next breath. The check blocked it from publishing.
  const RAZIA = "We are not chasing aggressive fat loss or steep calorie restriction right now. Your nutrition plan does include a deliberate, modest reduction below what your body likely needs to maintain its current weight, but it's set small and conservative on purpose, not as a push for rapid change."
  check('a denial of STEEP restriction alongside a stated deficit passes',
    !lintClientReading({
      sections: { cr_what_were_not_doing_yet: RAZIA },
      sourceMaterial: VICKI_SOURCE,
      nutrition: { tdeeKcal: 2006, planKcal: 1800 },
    }).some(x => x.code === 'CONTRADICTS_NUTRITION_PLAN'))

  check('a flat denial of any restriction still blocks',
    lintClientReading({
      sections: { a: "Calorie restriction isn't part of the picture here." },
      sourceMaterial: VICKI_SOURCE,
      nutrition: { tdeeKcal: 2006, planKcal: 1800 },
    }).some(x => x.code === 'CONTRADICTS_NUTRITION_PLAN'))
}

console.log(`\n${passed} passed, ${failed} failed\n`)
process.exit(failed > 0 ? 1 : 0)
