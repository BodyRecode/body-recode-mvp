/**
 * The thyroid hold: when it fires, when it does not, and what it stops.
 * Run: npx tsx scripts/test-thyroid-hold.ts
 *
 * The threshold is deliberately LOW, because the research found a symptom
 * score performs close to chance in women over fifty. A low threshold costs a
 * doctor's appointment. A high one costs a missed case. These tests exist to
 * check it is low WITHOUT firing on everybody, which would be the same as not
 * firing at all.
 */
import { thyroidFlagFromScreen, thyroidFlag } from '../src/lib/thyroid-hold'

let failed = 0
const check = (n: string, ok: boolean, d?: unknown) => { if (ok) console.log(`ok    ${n}`); else { failed++; console.log(`FAIL  ${n}`, JSON.stringify(d)) } }

check('nothing answered raises nothing', thyroidFlagFromScreen(null).open === false)
check('"None of these" everywhere raises nothing',
  thyroidFlagFromScreen({ tq_history: ['None of these'], tq_changed: ['None of these'], tq_products: ['None of these'] }).open === false)

check('one case-finding tick is enough, by design',
  thyroidFlagFromScreen({ tq_history: ['Coeliac disease'] }).open === true)
check('a family history tick is enough',
  thyroidFlagFromScreen({ tq_history: ['A parent, brother, sister or child with a thyroid problem'] }).open === true)

check('ONE changed symptom is not enough',
  thyroidFlagFromScreen({ tq_changed: ['Skin drier'] }).open === false)
check('two changed symptoms fire it',
  thyroidFlagFromScreen({ tq_changed: ['Skin drier', 'Bowels slower'] }).open === true)

check('kelp alone fires it',
  thyroidFlagFromScreen({ tq_products: ['Kelp, seaweed or iodine'] }).open === true)
check('biotin alone does NOT fire it (it falsifies the test, it is not a cause)',
  thyroidFlagFromScreen({ tq_products: ['Biotin, or a hair, skin and nails supplement'] }).open === false)

check('pregnancy plus one changed symptom fires it',
  thyroidFlagFromScreen({ tq_changed: ['Tiredness that sleep does not fix'] }, { pregnancyState: true }).open === true)
check('pregnancy with nothing changed does not',
  thyroidFlagFromScreen({}, { pregnancyState: true }).open === false)

check('the tracked reverse flag fires it on its own',
  thyroidFlag({ reverseFlag: true }).open === true)

check('a confirmed GP review clears it, whatever else is ticked',
  thyroidFlagFromScreen({ tq_history: ['Coeliac disease'], tq_changed: ['Skin drier', 'Bowels slower'] }, { gpReviewConfirmed: true }).open === false)

const reasons = thyroidFlagFromScreen({ tq_history: ['Coeliac disease'], tq_products: ['Kelp, seaweed or iodine'] }).reasons
check('it says WHY, in words a coach can read', reasons.length === 2 && reasons.every(r => r.length > 20), reasons)

console.log('')
console.log(failed === 0 ? 'THYROID HOLD HOLDS' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
