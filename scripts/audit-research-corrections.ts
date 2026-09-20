/**
 * Every statement the research contradicted, checked against the code.
 *
 * WHY: the findings document said "more than sixty statements", which was the
 * sum of what each pass reported in its own headline list. Kade asked for a
 * number defensible to an outsider, so this counts them the only way that is
 * defensible: each one must have EXISTED in the shipped code before the
 * research, and must NOT survive in anything a client or a model reads now.
 *
 * A claim quoted inside an explanatory comment or a "we used to say this"
 * coach note does not count as surviving. That distinction is the whole job,
 * and it is checked rather than assumed.
 *
 * Run: npx tsx scripts/audit-research-corrections.ts
 */
import { execSync } from 'child_process'

const BASELINE = '1f58a8c0' // last commit before the research work began, 17 Sep 2026

interface Correction {
  claim: string
  pass: string
  /**
   * A claim that still appears in live text because it was REFRAMED rather
   * than deleted, with the reason it is defensible. Counted separately,
   * because "we removed it" and "we kept it and labelled it unproven" are
   * different things and an outsider is entitled to the difference.
   */
  reframed?: string
}

const CORRECTIONS: Correction[] = [
  // E1a and E1b, electrolytes and fluid
  { claim: '2-3 litres of water daily', pass: 'E1a' },
  { claim: 'Pinch of salt in morning water', pass: 'E1a' },
  { claim: 'Pinch of salt in your first glass every morning', pass: 'E1a' },
  { claim: 'Electrolytes during training', pass: 'E1a' },
  { claim: '500ml water + pinch of salt', pass: 'E1a' },
  { claim: 'Most people are chronically under-hydrated and low on electrolytes', pass: 'E1a' },
  { claim: 'Rehydrate with electrolytes afterward', pass: 'E1a' },
  { claim: 'Exit, shower cool, rehydrate with electrolytes', pass: 'E1a' },
  { claim: 'electrolytes on waking', pass: 'E1a' },
  { claim: 'Add a pinch of salt or an electrolyte tab', pass: 'E1a' },
  { claim: 'Dehydration before training drops performance more than people realise', pass: 'E1a' },
  { claim: 'A glass or two of water with electrolytes', pass: 'E1a' },
  { claim: 'Currently dehydrated or fasted more than 16 hours', pass: 'E1a' },
  { claim: 'hydration and electrolyte balance matter more', pass: 'E1a' },

  // R2 group 1, heat
  { claim: 'Increases plasma volume, activates heat shock proteins, mimics moderate cardiovascular training', pass: 'R2 heat' },
  { claim: 'Deeper tissue penetration at lower ambient temperature', pass: 'R2 heat' },
  { claim: 'Better tolerated by heat-sensitive clients', pass: 'R2 heat' },
  { claim: 'Preferred over traditional sauna for clients in remediation, depleted, or heat-intolerant', pass: 'R2 heat' },
  { claim: 'Humidified heat supports respiratory clearance', pass: 'R2 heat' },
  { claim: 'Gentler than sauna', pass: 'R2 heat' },
  { claim: 'transdermal absorption modest but present', pass: 'R2 heat' },

  // R2 group 2, cold
  { claim: 'Not within 4 hours of a strength session', pass: 'R2 cold' },
  { claim: 'Not within 6 hours', pass: 'R2 cold' },
  { claim: 'Same dopamine effect as a full plunge, roughly 40 percent of the magnitude', pass: 'R2 cold' },
  { claim: 'Elevates dopamine and norepinephrine', pass: 'R2 cold' },
  { claim: 'brown fat activation', pass: 'R2 cold' },
  { claim: 'mental resilience training', pass: 'R2 cold' },
  { claim: 'fastest parasympathetic lever available', pass: 'R2 cold' },
  { claim: 'evidence for mental effect strong', pass: 'R2 cold' },

  // R2 group 3, contrast and devices
  { claim: 'Vascular pumping', pass: 'R2 devices' },
  { claim: 'Same vascular pumping as contrast shower', pass: 'R2 devices' },
  { claim: 'may reduce muscle stiffness, improve range of motion', pass: 'R2 devices' },
  { claim: 'Pre-training for mobility', pass: 'R2 devices' },
  { claim: 'Sequential inflation from feet to hips pushes fluid centrally', pass: 'R2 devices' },
  { claim: 'Modest evidence for bone-density support', pass: 'R2 devices' },
  { claim: 'Vibration triggers muscle spindle reflex activity', pass: 'R2 devices' },
  { claim: 'Photobiomodulation supports mitochondrial function via cytochrome c oxidase', pass: 'R2 devices' },
  { claim: 'moderate for sleep quality when timed correctly', pass: 'R2 devices' },

  // R2 group 4, breathwork, load and travel
  { claim: 'best-documented tool for sustained parasympathetic tone', pass: 'R2 breathwork' },
  { claim: 'Coherent Breathing (5.5 bpm)', pass: 'R2 breathwork' },
  { claim: 'Fastest documented way to lower heart rate', pass: 'R2 breathwork' },
  { claim: 'reliably shift the body toward sleep', pass: 'R2 breathwork' },
  { claim: 'The universal safe breathwork tool', pass: 'R2 breathwork' },
  { claim: 'Mental resilience and stress inoculation are the strongest documented benefits', pass: 'R2 breathwork' },
  { claim: 'The single biggest lever for jet lag is meal timing', pass: 'R2 breathwork' },
  {
    claim: 'Fast 12 to 16 hours during and after the flight',
    pass: 'R2 breathwork',
    reframed: 'kept, but moved to LAST in the protocol and explicitly labelled unproven, because its only human evidence is a self-reported military survey',
  },
  { claim: 'Requires a full week of consistent extension', pass: 'R2 breathwork' },
  { claim: 'Every 4 to 8 weeks depending on training age', pass: 'R2 breathwork' },
]

function existsAt(ref: string, claim: string): boolean {
  try {
    execSync(`git grep -qiF ${JSON.stringify(claim)} ${ref} -- src/`, { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

/** Where it survives now, if it does: live text, or an explanatory note about its removal. */
function survivesLive(claim: string): boolean {
  let out = ''
  try {
    out = execSync(`git grep -iF ${JSON.stringify(claim)} HEAD -- src/`, { encoding: 'utf8' })
  } catch {
    return false
  }
  return out
    .split('\n')
    .filter(Boolean)
    .some(line => {
      const text = line.replace(/^HEAD:[^:]+:/, '')
      const isComment = /^\s*(\/\/|\*|\{\/\*)/.test(text)
      const isRemovalNote =
        /Rewritten|Removed|removed|deleted|Qualified|was never|used to say|It used to|it was called|Was:|old "|RESEARCH PASS|research pass/i.test(text)
      return !isComment && !isRemovalNote
    })
}

let shipped = 0
let gone = 0
let reframed = 0
const problems: string[] = []
const byPass = new Map<string, number>()

for (const c of CORRECTIONS) {
  const wasShipped = existsAt(BASELINE, c.claim)
  if (!wasShipped) {
    problems.push(`NOT IN THE BASELINE, so it cannot be counted: "${c.claim}"`)
    continue
  }
  shipped++
  if (survivesLive(c.claim)) {
    if (c.reframed) {
      reframed++
      continue
    }
    problems.push(`STILL LIVE somewhere a client or a model reads: "${c.claim}"`)
    continue
  }
  gone++
  byPass.set(c.pass, (byPass.get(c.pass) ?? 0) + 1)
}

console.log(`baseline: ${BASELINE} (last commit before the research work)\n`)
for (const [pass, n] of [...byPass.entries()].sort()) console.log(`  ${pass.padEnd(16)} ${n}`)
console.log('')
console.log(`${shipped} statements were verifiably in the shipped code before the research`)
console.log(`${gone} are GONE from everything a client or a model reads`)
console.log(`${reframed} were KEPT AND RELABELLED rather than removed, listed below`)
for (const c of CORRECTIONS.filter(x => x.reframed)) console.log(`    "${c.claim}" — ${c.reframed}`)
if (problems.length) {
  console.log('')
  for (const p of problems) console.log(`  ${p}`)
}
console.log('')
const unresolved = shipped - gone - reframed
console.log('')
console.log(
  unresolved === 0
    ? `DEFENSIBLE COUNT: ${gone} statements removed, ${reframed} relabelled, from ${shipped} verified as shipped.`
    : `${unresolved} unresolved`,
)
process.exit(unresolved === 0 ? 0 : 1)
