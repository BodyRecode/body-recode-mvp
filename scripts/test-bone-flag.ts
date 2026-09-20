/**
 * The bone screen: what stops us loading someone, and when impact alone is
 * not enough. Run: npx tsx scripts/test-bone-flag.ts
 *
 * It never produces a likelihood or a diagnosis. It decides two things:
 * whether we stop and refer before adding load, and whether impact alone is a
 * legitimate starting programme for her.
 */
import { boneFlagFromScreen } from '../src/lib/bone-protocol'

let failed = 0
const check = (n: string, ok: boolean, d?: unknown) => { if (ok) console.log(`ok    ${n}`); else { failed++; console.log(`FAIL  ${n}`, JSON.stringify(d)) } }

check('an empty screen raises nothing', boneFlagFromScreen(null).open === false)
check('"No" and "None of these" raise nothing',
  boneFlagFromScreen({ bq_fracture: 'No', bq_height_back: ['None of these'], bq_medicines: 'None' }).open === false)

const frac = boneFlagFromScreen({ bq_fracture: 'Yes, since I turned 50' })
check('a fracture from standing height is same-week', frac.open && frac.urgency === 'same-week', frac)

const back = boneFlagFromScreen({ bq_height_back: ['I have lost height', 'New mid-back or lower-back pain'] })
check('height loss plus new back pain is same-week', back.open && back.urgency === 'same-week', back)

const deno = boneFlagFromScreen({ bq_medicines: 'Prolia injection, last one about 7 months ago' })
check('a six-monthly bone injection is same-week', deno.open && deno.urgency === 'same-week', deno)

const steroid = boneFlagFromScreen({ bq_medicines: 'Prednisolone 10mg daily for asthma' })
check('steroids are before-loading, not same-week', steroid.open && steroid.urgency === 'before-loading', steroid)

const early = boneFlagFromScreen({ bq_periods_age: 'They stopped at 41 after my hysterectomy' })
check('periods stopping at 41 is same-week AND makes the barbell non-optional',
  early.open && early.urgency === 'same-week' && early.barbellNotOptional, early)

const normal = boneFlagFromScreen({ bq_periods_age: 'Stopped at 52' })
check('periods stopping at 52 raises nothing but still makes the barbell non-optional',
  normal.open === false && normal.barbellNotOptional === true, normal)

const cycling = boneFlagFromScreen({ bq_periods_age: 'Still regular' })
check('a still-cycling client can start with impact alone',
  cycling.open === false && cycling.barbellNotOptional === false, cycling)

const reasons = boneFlagFromScreen({ bq_fracture: 'Yes, since I turned 50' }).reasons
check('it explains itself in a sentence a coach can act on', reasons[0].length > 40, reasons)

console.log('')
console.log(failed === 0 ? 'BONE FLAG HOLDS' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
