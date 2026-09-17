/**
 * Proves the fluid and potassium gates fire where research pass E1a says they
 * must, and stay quiet where it says they must not.
 *
 * Run: npx tsx scripts/test-electrolyte-gates.ts
 */
import { electrolyteGates, electrolyteGatePromptBlock } from '../src/lib/electrolyte-safety-gates'

type Case = { name: string; text: string; potassium: boolean; fluid: boolean }

const CASES: Case[] = [
  { name: 'nothing recorded', text: '', potassium: false, fluid: false },
  { name: 'vitamin D only', text: 'Vitamin D 1000IU daily, fish oil', potassium: false, fluid: false },
  { name: 'ACE inhibitor', text: 'Perindopril 5mg for blood pressure', potassium: true, fluid: false },
  { name: 'sartan by brand', text: 'Takes Entresto', potassium: true, fluid: false },
  { name: 'spironolactone for acne', text: 'spironolactone 50mg for acne', potassium: true, fluid: false },
  { name: 'thiazide', text: 'Hydrochlorothiazide 25mg', potassium: false, fluid: true },
  { name: 'SSRI', text: 'Sertraline 100mg, started 3 weeks ago', potassium: false, fluid: true },
  { name: 'SGLT2', text: 'Empagliflozin 10mg (Jardiance)', potassium: false, fluid: true },
  { name: 'lithium', text: 'Lithium carbonate', potassium: false, fluid: true },
  { name: 'combination: ACE + thiazide', text: 'Ramipril and indapamide', potassium: true, fluid: true },
  { name: 'kidney disease, no medicines listed', text: 'Stage 3 kidney disease', potassium: true, fluid: true },
  { name: 'doctor-set fluid limit', text: 'Cardiologist has her on a fluid limit', potassium: false, fluid: true },
  { name: 'past low sodium result', text: 'History of low sodium in hospital 2023', potassium: false, fluid: true },
  { name: 'heart failure', text: 'Heart failure, sees a heart failure nurse', potassium: true, fluid: true },
]

let failed = 0
for (const c of CASES) {
  const g = electrolyteGates(c.text)
  const ok = g.potassium === c.potassium && g.fluid === c.fluid
  if (!ok) {
    failed++
    console.log(`FAIL  ${c.name}`)
    console.log(`      expected potassium=${c.potassium} fluid=${c.fluid}`)
    console.log(`      got      potassium=${g.potassium} fluid=${g.fluid} (matched: ${g.matched.join(', ') || 'nothing'})`)
  } else {
    console.log(`ok    ${c.name}  [${g.matched.join(', ') || 'no gate'}]`)
  }
}

console.log('')
console.log('Sample prompt block for "Ramipril and indapamide":')
console.log(electrolyteGatePromptBlock(electrolyteGates('Ramipril and indapamide')))
console.log('')
console.log(failed === 0 ? 'GATES HOLD' : `${failed} CASE(S) FAILED`)
process.exit(failed === 0 ? 0 : 1)
