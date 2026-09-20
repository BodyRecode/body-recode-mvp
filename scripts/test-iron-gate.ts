/**
 * The iron gate: what fires it, at what urgency, and what it refuses to do.
 * Run: npx tsx scripts/test-iron-gate.ts
 *
 * The gate exists to REFER, never to work out whether she is iron deficient.
 * So these tests check tiers and quoting, and deliberately check that nothing
 * produces a score, a rank, or an opinion about which answer matters most.
 */
import { ironFlag } from '../src/lib/iron-gate'

let failed = 0
const check = (n: string, ok: boolean, d?: unknown) => { if (ok) console.log(`ok    ${n}`); else { failed++; console.log(`FAIL  ${n}`, JSON.stringify(d)) } }

check('nothing answered raises nothing', ironFlag(null).open === false)
check('"No" and "None of these" raise nothing',
  ironFlag({ iq_bleeding: 'No', iq_bowel: 'No', iq_cardiac: ['None of these'], iq_pica_rls: ['None of these'] }).open === false)

const heavy = ironFlag({ iq_bleeding: 'Yes' })
check('heavy bleeding alone is same-week', heavy.open && heavy.tier === 'same-week', heavy)

const pmb = ironFlag({ iq_postmenopausal_bleeding: 'Yes' })
check('bleeding after a year without a period is same-week', pmb.tier === 'same-week', pmb)

const bowel = ironFlag({ iq_bowel: 'Yes' })
check('blood in stool or unintended weight loss is same-week', bowel.tier === 'same-week', bowel)

const chest = ironFlag({ iq_cardiac: ['Chest pain or tightness'] })
check('chest pain is an emergency', chest.tier === 'emergency', chest)
check('and it is the only thing that stops training', chest.stopTraining === true)

const racing = ironFlag({ iq_cardiac: ['Heart racing when I am not moving'] })
check('a racing heart at rest is same-day rather than emergency', racing.tier === 'same-day', racing)

const both = ironFlag({ iq_bleeding: 'Yes', iq_cardiac: ['Feeling faint, or actually fainting'] })
check('heavy bleeding WITH faintness escalates to emergency', both.tier === 'emergency', both)

const pica = ironFlag({ iq_pica_rls: ['A strong urge to chew or eat ice'] })
check('craving ice is routine, and does not stop training',
  pica.tier === 'routine' && pica.stopTraining === false, pica)

const many = ironFlag({ iq_bleeding: 'Yes', iq_bowel: 'Yes', iq_pica_rls: ['An urge to move my legs at night that eases when I move them'] })
check('several answers take the highest tier, not a sum', many.tier === 'same-week', many)
check('and every answer is quoted back, unranked', many.answers.length === 3, many.answers)

check('her word that she has seen a doctor clears it',
  ironFlag({ iq_bleeding: 'Yes', iq_cardiac: ['Chest pain or tightness'], iq_gp_seen: 'Yes' }).open === false)

const flag = ironFlag({ iq_bleeding: 'Yes' })
check('nothing in the result is a score, a rank or a probability',
  !('score' in flag) && !('rank' in flag) && !('likelihood' in flag))

console.log('')
console.log(failed === 0 ? 'IRON GATE HOLDS' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
