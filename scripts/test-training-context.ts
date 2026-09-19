/**
 * Proves the E1b intake questions change what the generators see, rather than
 * being asked and filed. Run: npx tsx scripts/test-training-context.ts
 */
import {
  needsHeatGuidance,
  trainingContextPromptBlock,
  trainingReferralFlags,
  type TrainingContext,
} from '../src/lib/electrolyte-safety-gates'

let failed = 0
function check(name: string, got: boolean, want: boolean) {
  if (got !== want) { failed++; console.log(`FAIL  ${name}: expected ${want}, got ${got}`) }
  else console.log(`ok    ${name}`)
}

const coolGym: TrainingContext = { tr_gym_heat: 'Always cool or air-conditioned', tr_session_length: 'Under 60 minutes', tr_sweat_level: 'About average' }
const hotGym: TrainingContext = { tr_gym_heat: 'Usually hot or outdoors', tr_session_length: '60 to 90 minutes', tr_sweat_level: 'Heavy sweater' }
const longSession: TrainingContext = { tr_gym_heat: 'Always cool or air-conditioned', tr_session_length: 'Over 90 minutes' }

check('cool gym, short session: no heat wording', needsHeatGuidance(coolGym), false)
check('hot gym: heat wording earned', needsHeatGuidance(hotGym), true)
check('long session in a cool gym: heat wording earned', needsHeatGuidance(longSession), true)

const coolBlock = trainingContextPromptBlock(coolGym)
check('cool gym block tells the model NOT to prescribe electrolytes', coolBlock.includes('Do NOT prescribe electrolyte drinks'), true)
check('cool gym block gives no sodium figure', coolBlock.includes('500 to 700'), false)
check('hot gym block gives the sodium figure', trainingContextPromptBlock(hotGym).includes('500 to 700 mg of sodium'), true)

check('creatine user is protected from the cramp myth',
  trainingContextPromptBlock({ ...coolGym, tr_performance_supps: ['Creatine'] }).includes('never warn that creatine causes cramps'), true)
check('past heat illness raises the heat gate',
  trainingContextPromptBlock({ ...coolGym, tr_heat_illness: 'Yes' }).includes('without medical clearance'), true)
check('competitor triggers the contest refusal',
  trainingContextPromptBlock({ ...coolGym, tr_competes: 'Yes' }).includes('CONTEST PREP HARD RULE'), true)
check('non-competitor gets no contest rule here',
  trainingContextPromptBlock({ ...coolGym, tr_competes: 'No' }).includes('CONTEST PREP HARD RULE'), false)

check('night cramps become a referral, not a salt suggestion',
  trainingReferralFlags({ tr_cramps: 'Also at rest or at night' }).length === 1, true)
check('training cramps alone raise nothing',
  trainingReferralFlags({ tr_cramps: 'Sometimes during or after training' }).length === 0, true)
check('a competitor on diuretics raises a flag',
  trainingReferralFlags({ cp_compounds: ['Fluid tablets or water tablets (diuretics)'] }).length === 1, true)
check('"None of these" raises nothing',
  trainingReferralFlags({ cp_compounds: ['None of these'] }).length === 0, true)
check('planned potassium products raise a flag',
  trainingReferralFlags({ cp_potassium_products: 'Yes' }).length === 1, true)
check('an empty intake raises nothing at all',
  trainingReferralFlags({}).length === 0, true)

console.log('')
console.log(failed === 0 ? 'TRAINING CONTEXT HOLDS' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
