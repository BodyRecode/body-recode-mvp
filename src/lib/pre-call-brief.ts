/**
 * Pre-call brief generator.
 *
 * Takes a lead's scorecard data and produces a tani-shaped brief
 * (see `~/Dropbox/01_BODY_RECODE/06_SAAS_PLATFORM_BUILD/2026-05-05_Pre_Call_Brief_Template_v2.0.md`).
 *
 * Pure function. Deterministic. Run inline after scorecard submit.
 */

import { pronounsFor, resolveLeadSex } from '@/lib/lead-sex'
import {
  type SectionKey,
  type SectionScores,
  type StateName,
  type Profile,
  type BiologicalSex,
  type AgeBand,
  type FatStorage,
  type CycleStatus,
  type StorageDirection,
  PROFILE_DRIVERS,
  PROFILE_DESCRIPTORS,
  pickFloor,
  typeFatMapProfile,
} from './fat-map-profile'

type Quality = 'green' | 'yellow' | 'red'
type AnswerLetter = 'A' | 'B' | 'C' | 'D'

export interface LeadBriefInput {
  name: string
  scorecard_score: number
  scorecard_body_state: StateName
  scorecard_section_scores: SectionScores
  approach_response?: AnswerLetter | null
  investment_readiness?: AnswerLetter | null
  lead_quality?: Quality | null
  // Fat Map typing signals (optional — legacy leads/briefs omit them).
  biological_sex?: BiologicalSex | null
  /** Secondary sex key, written by the enrol/signup routes only. Pronouns and
   *  the companion's pattern gate fall back to it; typing never does. */
  gender?: string | null
  age_band?: AgeBand | null
  fat_storage?: FatStorage | null
  cycle_status?: CycleStatus | null
  /** Estrogen-Shift phase discriminator. Women only. */
  storage_direction?: StorageDirection | null
  /**
   * Verbatim pre-call form answers (the `prep_form_completed` lead event notes).
   * Drives the "What they told you" block and the scope-flag scan. Optional —
   * most leads have not completed the form when the brief is first generated.
   */
  prep_notes?: string | null
  /** Human-readable call time, e.g. "Thu 13 Aug, 4:30pm Brisbane". */
  call_date?: string | null
}

const SECTIONS: Record<SectionKey, { name: string; descriptors: [string, string, string] }> = {
  '01': { name: 'Energy', descriptors: [
    'Tired most of the day, relying on caffeine, crashing',
    'Inconsistent. Some good days, some bad',
    'Steady energy through the day',
  ] },
  '02': { name: 'Sleep', descriptors: [
    'Poor quality, waking through the night, not rested',
    'Okay most nights but not consistently recovering',
    'Sleeping well. Waking rested. Recovery feels solid',
  ] },
  '03': { name: 'Stress', descriptors: [
    'High and ongoing',
    'Moderate. Manageable but not low',
    'Low to moderate. Not carrying a heavy chronic stress load',
  ] },
  '04': { name: 'Training Response', descriptors: [
    'Not progressing. Performance flat or declining',
    'Some progress, inconsistent',
    'Responding well. Getting stronger, fitter',
  ] },
  '05': { name: 'Fat Loss', descriptors: [
    'Nothing is moving despite effort',
    'Slow, stalled',
    'Body is responding. Composition shifting',
  ] },
}

const APPROACH_LABELS: Record<AnswerLetter, string> = {
  A: 'I look at what my body is doing and adjust',
  B: 'I give it more time and stay consistent',
  C: 'I push harder and expect it to break through',
  D: 'I get frustrated and want the program changed immediately',
}

const INVESTMENT_LABELS: Record<AnswerLetter, string> = {
  A: 'Yes - ready to invest in 1-on-1 coaching now',
  B: 'Within the next 1-3 months',
  C: 'Just exploring for now',
  D: 'Looking for free resources only',
}

// =============================================================
// State banks
// =============================================================

interface StateBank {
  patternIntro: (floorName: string) => string
  mechanismBullets: (floorName: string) => string[]
  watchListIntro: string
  watchList: string[]
  readbackLeadWith: (floorName: string, score: number, scores: SectionScores) => string
  readbackThen: (score: number) => string
  callbacks: string[]
  threeXNote: string
  commitmentWeeks: number
  tail: (floorName: string) => string
  objections: Array<{ trigger: string; response: string }>
  keyLines: string[]
  /** Self-guided recommendations if they go Path A/B. */
  recommendations: string[]
}

const TRANSITIONING_BANK: StateBank = {
  patternIntro: (floor) =>
    `Almost everything's at a 2. The bottom is ${floor.toLowerCase()} at 1. That's the centre of gravity for the whole picture.`,
  mechanismBullets: () => [
    'Sleep stops being restorative',
    'Energy runs on cortisol, not recovery',
    'Training input goes in, body doesn\'t allocate to adapt',
    'Fat loss stalls - storage mode, not release mode',
  ],
  watchListIntro: 'Dashboard says watch where output drops. For this lead, the bottleneck is autonomic, not muscular:',
  watchList: [
    'HR not coming down between rounds (cortisol-loaded systems don\'t down-regulate)',
    'Traps loading on pulls/carries (sympathetic recruitment)',
    'ROM shrinking under fatigue (cortisol limiting tissue tolerance)',
    'Pacing - hands on hips, can\'t sit, stays "switched on"',
    'Breath holds, jaw clench under load',
  ],
  readbackLeadWith: (floor) =>
    `Almost everything's at a 2. The bottom is ${floor.toLowerCase()} at 1. That's the centre of gravity for the whole picture.`,
  readbackThen: (score) =>
    `Body Recode language for this is Transitioning State. ${score}/15. Foundation's not broken. The system's compensating.`,
  callbacks: [
    '"Your HR didn\'t come down between rounds the way a body in balance would."',
    '"Your traps loaded up under [movement]. Body running sympathetic all day."',
    '"When output dropped, you wanted more weight not less. Same pattern keeping the system switched on."',
  ],
  threeXNote: 'NOT for them yet given the load',
  commitmentWeeks: 8,
  tail: (floor) =>
    `For Transitioning, this surfaces the bottleneck. Yours is ${floor.toLowerCase()}. Pull it, the rest comes up with it.`,
  objections: [
    {
      trigger: 'I\'m not THAT [stressed/tired/etc]',
      response: 'At this level it normalises. Stops feeling like load, starts feeling like baseline. Body still reads it as load.',
    },
    {
      trigger: 'I should be further along',
      response: 'That pressure is part of what\'s keeping the system switched on. Same problem, not separate.',
    },
    {
      trigger: 'Just tell me what to do',
      response: 'If I prescribe before I read, I\'m guessing. That\'s why what you\'ve tried hasn\'t fully landed.',
    },
  ],
  keyLines: [
    '"Stress at that level stops feeling like stress, starts feeling like baseline."',
    '"Pushing harder into a stress-driven body makes it tighter, not looser."',
    '"Pull stress, the rest comes up."',
    '"You haven\'t been failing. You\'ve been doing the right things in the wrong sequence."',
    '"The scorecard isn\'t telling you something abstract. It\'s telling you what your body just did."',
  ],
  recommendations: [
    'RPE 6-7 ceiling on training. No failure. No grind. Quality over volume.',
    'Walk 7-10k steps daily. Underrated baseline for autonomic recovery.',
    'Protein at every meal. 4x/day. Critical for a transitioning body.',
    'Track sleep + energy + training quality weekly in a notes app. The pattern is the answer.',
    'One recovery practice you can actually stick to. Sauna, cold, breathing, walking - pick one and do it 4x/wk.',
  ],
}

/**
 * Depleted lead-with line, built from the lead's actual section scores
 * rather than the canonical "all 3 foundations at the floor" phrasing.
 *
 * Why: the static line claimed "Recovery, energy, stress are at the floor"
 * even when the lead's energy was 2/3, which read as inaccurate when the
 * coach delivered it verbatim in the room.
 */
function buildDepletedLeadWith(scores: SectionScores): string {
  const NAME: Record<SectionKey, string> = {
    '01': 'energy', '02': 'sleep', '03': 'stress',
    '04': 'training response', '05': 'fat loss',
  }
  const foundationKeys: SectionKey[] = ['02', '01', '03']
  const outcomeKeys: SectionKey[] = ['04', '05']

  const foundationsAtFloor = foundationKeys.filter(k => scores[k] === 1)
  const outcomesAtFloor = outcomeKeys.filter(k => scores[k] === 1)
  const aboveFoundations = foundationKeys.filter(k => scores[k] != null && (scores[k] as number) > 1)

  const list = (keys: SectionKey[]): string => {
    if (keys.length === 0) return ''
    if (keys.length === 1) return NAME[keys[0]]
    if (keys.length === 2) return `${NAME[keys[0]]} and ${NAME[keys[1]]}`
    return `${keys.slice(0, -1).map(k => NAME[k]).join(', ')}, and ${NAME[keys[keys.length - 1]]}`
  }
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
  const fVerb = foundationsAtFloor.length === 1 ? 'is' : 'are'
  const oVerb = outcomesAtFloor.length === 1 ? 'is' : 'are'
  const aVerb = aboveFoundations.length === 1 ? 'is' : 'are'

  // Every section at the floor.
  if (foundationsAtFloor.length === 3 && outcomesAtFloor.length === 2) {
    return 'Every section is at the floor. Sleep, energy, stress, training response, fat loss, all at one. There is nothing left in the system to allocate. That is depletion at its most acute.'
  }
  // Classic Depleted - all foundations at 1, outcomes higher (kept as the
  // canonical script Kade has drilled).
  if (foundationsAtFloor.length === 3 && outcomesAtFloor.length === 0) {
    return 'Three of your foundations are at the floor. Recovery, energy, stress. Your training and fat loss numbers are actually higher than your foundation numbers - that tells me you have been putting effort in.'
  }
  // Mixed: some foundations at the floor and outcomes also at the floor.
  if (foundationsAtFloor.length > 0 && outcomesAtFloor.length > 0) {
    if (aboveFoundations.length > 0) {
      return `${cap(list(foundationsAtFloor))} ${fVerb} at the floor. So ${oVerb} ${list(outcomesAtFloor)}. ${cap(list(aboveFoundations))} ${aVerb} the only thing keeping the picture from being completely flat. And at this load, that does not last long.`
    }
    return `${cap(list(foundationsAtFloor))} ${fVerb} at the floor, and so ${oVerb} ${list(outcomesAtFloor)}. The body is in protection mode and the response to effort has stopped coming through.`
  }
  // Foundations at the floor, outcomes still above.
  if (foundationsAtFloor.length > 0) {
    return `${cap(list(foundationsAtFloor))} ${fVerb} at the floor. Your training and fat loss are higher, but holding that up against this much foundation load is the loop that put the body here.`
  }
  // Outcomes at the floor, foundations holding (unusual for Depleted, but safe).
  if (outcomesAtFloor.length > 0) {
    return `${cap(list(outcomesAtFloor))} ${oVerb} at the floor. Foundations are holding, but the response to effort has stopped coming through. The depletion is showing up downstream first.`
  }
  return 'Body in protection mode. Pushing harder against this makes it tighter, not looser.'
}

const DEPLETED_BANK: StateBank = {
  patternIntro: () =>
    'The foundations of recovery - sleep, energy, stress - are all sitting at the floor. Your training and fat loss numbers being higher tells me you\'ve been putting effort in. The reason it isn\'t producing isn\'t effort.',
  mechanismBullets: () => [
    'Body is in protection mode',
    'Cortisol elevated, metabolism suppressed',
    'Biology is actively resisting fat loss and performance gains',
    'Pushing harder makes the depletion worse, not better',
  ],
  watchListIntro: 'Dashboard says low intensity, light load - that is deliberate. For this lead, watch for:',
  watchList: [
    'Visible fatigue early in warmup (foundation already low)',
    'Whole-body bracing instead of localised cueing (sympathetic dominance)',
    'Caffeine-driven energy that crashes mid-session',
    'Pushing for more weight when the body is signalling stop',
    'Resistance to the "this is deliberate" framing',
  ],
  readbackLeadWith: (_floor, _score, scores) => buildDepletedLeadWith(scores),
  readbackThen: (score) =>
    `Body Recode language for this is Depleted State. ${score}/15. Body in protection mode. Pushing harder against this makes it tighter.`,
  callbacks: [
    '"You felt the warm-up - we kept it deliberate. That\'s exactly the load your body can handle right now."',
    '"You wanted to go heavier - that\'s the pattern that put you here. Not your fault, but it\'s the loop we\'d need to interrupt first."',
    '"Your body responded to the lighter load - that tells me the foundation is there, it\'s just under load."',
  ],
  threeXNote: 'NO. Not for them. 2x is the ceiling',
  commitmentWeeks: 12,
  tail: () =>
    'For Depleted, the work isn\'t more effort. It\'s the right thing in the right order so the body comes out of protection. Once it does, the response comes back online.',
  objections: [
    {
      trigger: 'I just need to push harder',
      response: 'That\'s exactly what put you here. Pushing harder against a depleted body deepens the depletion. The protection mode tightens.',
    },
    {
      trigger: 'I should be further along by now',
      response: 'That pressure is itself part of the stress load. It\'s not a separate issue, it\'s the same one.',
    },
    {
      trigger: 'I tried this before and it didn\'t work',
      response: 'Most likely it was the wrong prescription for the state you were in. Not a failure of effort, a failure of interpretation.',
    },
  ],
  keyLines: [
    '"Effort going in. Adaptation isn\'t coming out. That\'s a state problem, not a willpower problem."',
    '"Pushing harder against a depleted body deepens the depletion."',
    '"The work isn\'t more. It\'s the right thing first, in the right order."',
    '"You haven\'t been failing. You\'ve been doing the right things in the wrong sequence."',
    '"Bringing a body out of protection is the work. The result follows."',
  ],
  recommendations: [
    'Sleep first. 7-8 hours, lights out by 10pm, no screens after 9. Non-negotiable for this state.',
    'Pull training back. Max 3 sessions/wk at RPE 5-6. No high intensity until your foundations come up.',
    'Eat enough. 1.8-2.2g protein per kg of bodyweight, daily. Don\'t undereat - that deepens the depletion.',
    'Caffeine before noon only. Late caffeine compounds the cortisol cycle.',
    '10-minute walk after dinner. Blood sugar regulation + parasympathetic shift in one move.',
    'One nervous system reset daily. 5 min belly breathing morning OR evening. Whichever fits.',
  ],
}

const READY_BANK: StateBank = {
  patternIntro: () =>
    'Sleep, stress, recovery are doing their job. Where the read points is the lower scores - that\'s not a stuck body, that\'s a body with capacity that isn\'t being expressed.',
  mechanismBullets: () => [
    'Body has capacity - foundation is intact',
    'The thing in the way isn\'t recovery, stress, or effort',
    'Something in the prescription, training, nutrition, or sequencing',
    'Output is on the table, just not being accessed',
  ],
  watchListIntro: 'Dashboard says push them - watch output quality under fatigue. For this lead, watch for:',
  watchList: [
    'Where output drops across rounds (the prescription mismatch shows up here)',
    'Recovery between rounds (Ready bodies down-regulate cleanly - if not, something else is going on)',
    'Form holding under fatigue (capacity vs prescription tell)',
    'Whether they pace or go all-out (prescription literacy signal)',
    'How they describe the session afterwards (is it accurate or off?)',
  ],
  readbackLeadWith: () =>
    'Sleep solid. Stress not compounding. Body responding to inputs. The drag-points are the lower scores - those aren\'t broken, they\'re unaddressed.',
  readbackThen: (score) =>
    `Body Recode language for this is Ready State. ${score}/15. Highest of the three. Foundation\'s done. What\'s missing is the read.`,
  callbacks: [
    '"You held output across the rounds - that confirms the foundation."',
    '"You backed off when fatigue hit form - that tells me the body is reading itself accurately."',
    '"Your recovery between rounds was clean. That\'s a Ready body talking."',
  ],
  threeXNote: 'OK to discuss if their schedule and recovery support it',
  commitmentWeeks: 6,
  tail: () =>
    'For Ready, this layer is where optimisation actually compounds. The hard work is done. We\'re precision-tuning what you\'re already producing.',
  objections: [
    {
      trigger: 'I don\'t need coaching, things are mostly working',
      response: 'They\'re working enough to keep you at 12+. They\'re not working well enough to give you the result you came in for. That gap is the prescription, not your body.',
    },
    {
      trigger: 'I just want to skip the diagnostic and start training',
      response: 'You\'re Ready - which means a generic prescription will work, slowly. The diagnostic is what makes it precise. The difference is months of compounding.',
    },
    {
      trigger: 'I should be further along by now',
      response: 'Ready bodies that aren\'t producing are running prescription mismatches. The signal comes through fast once we adjust.',
    },
  ],
  keyLines: [
    '"Your body is in a position to respond. The hard work has already been done."',
    '"At Ready, what\'s missing isn\'t biology - it\'s the read."',
    '"Generic programs work slowly on a Ready body. A precise one compounds."',
    '"You\'re not waiting for the system to come back online. You\'re already there."',
    '"The signal here comes through fast because there\'s nothing in the way."',
  ],
  recommendations: [
    'Audit the prescription, not the body. Your foundation\'s intact - the issue is what you\'re running.',
    'Periodise. New stimulus every 6-8 weeks. Don\'t do the same program for 6 months and expect it to keep producing.',
    'Add what\'s missing. Most Ready bodies are missing zone 2, true high intensity, OR strength work - figure out which.',
    'Track output across blocks. Plateau is data - what\'s the prescription telling you?',
    'Get blood work. Confirms the biology read on paper.',
    'Sleep doesn\'t get easier when you\'re Ready. Stay militant. 7-8 hours, locked in.',
  ],
}

const STATE_BANKS: Record<StateName, StateBank> = {
  'Depleted State': DEPLETED_BANK,
  'Transitioning State': TRANSITIONING_BANK,
  'Ready State': READY_BANK,
}

const STATE_SHORT: Record<StateName, string> = {
  'Depleted State': 'Depleted',
  'Transitioning State': 'Transitioning',
  'Ready State': 'Ready',
}

// =============================================================
// Critical Hold + Path probability + Watch list extras
// =============================================================

function buildCriticalHold(input: LeadBriefInput, profile: Profile): string[] {
  const holds: string[] = []
  const approach = input.approach_response
  // These are read off the lead page seconds before the call. A male lead
  // reading his own brief back as "her" is the same failure as showing him a
  // pattern he cannot have.
  const p = pronounsFor(resolveLeadSex({ biological_sex: input.biological_sex, gender: input.gender }))

  // Hold #1 — derived from approach answer
  if (approach === 'D') {
    holds.push('Will push to change the program when frustrated. Don\'t. The frustration IS the pattern showing up live.')
  } else if (approach === 'C') {
    holds.push(`Will want to push harder when output drops. Don't let ${p.object}. Pushing harder is what put the body here.`)
  } else if (profile === 'Indeterminate') {
    holds.push('No single Fat Map signal in the scorecard. Hold the read open - intake decides which profile applies. Don\'t pre-commit to one in the room.')
  } else {
    holds.push(`${profile} profile - hold the read steady. Don't let ${p.object} pull you off it just because you don't have all the data yet.`)
  }

  // Hold #2 — derived from investment + state
  const inv = input.investment_readiness
  if (inv === 'C' || inv === 'D') {
    holds.push(`${p.Contracted} exploring/free-only. Don't sell. Read ${p.object}, give the picture, let the offer land flat.`)
  } else if (inv === 'A') {
    holds.push(`${p.Contracted} ready to invest. Run the close cleanly - don't under-pitch.`)
  } else {
    holds.push(`Read ${p.possessive} warmth in the room. Investment signal is mid - the conversation determines path.`)
  }

  // Hold #3 — path probability headline
  if (inv === 'C') holds.push('Path B (needs time) most likely outcome. Don\'t read it as a fail.')
  else if (inv === 'D') holds.push('Path A (out) most likely. Run the soft close, trigger declined follow-up.')
  else if (inv === 'A') holds.push('Path C (yes) most likely. Companion-ready close.')
  else holds.push('Path B/C roughly equal. Read the room.')

  return holds
}

function buildFrustrationTell(approach?: AnswerLetter | null): string[] | null {
  if (approach !== 'C' && approach !== 'D') return null
  if (approach === 'D') {
    return [
      'Pushes for more weight when output\'s already dropping',
      'Apologises for missed reps',
      'Wants the program changed mid-session',
    ]
  }
  return [
    'Pushes harder when fatigue shows',
    'Treats backing-off as failure rather than data',
    'Talks about "grinding through" as a virtue',
  ]
}

/** Floor-specific top recommendation for Transitioning state. */
const FLOOR_RECOMMENDATIONS: Record<SectionKey, string> = {
  '01': 'Cut caffeine after 12pm. Protein within 1hr of waking. Anchor energy with food and timing, not stimulants.',
  '02': 'Anchor wake time first. Same time every day, including weekends. Sleep length comes after consistency.',
  '03': 'Identify your top 2 stressors and physically remove or reduce one. Even small. The body needs the load lower, not better managed.',
  '04': 'Reduce volume by 25% for 2 weeks. Quality > volume. Training response comes back when the load matches recovery.',
  '05': 'Audit total daily energy intake honestly across a week. Most stalled fat loss in this state is stress and recovery debt, not under-eating.',
}

function pathOrder(inv?: AnswerLetter | null): string[] {
  if (inv === 'A') return ['• PATH C (most likely) - yes. Companion → Path C → Send Foundational Read → Mark Complete.',
                            '• PATH B (possible) - needs time. Dashboard "Path B" handoff.',
                            '• PATH A (less likely) - out. Dashboard "Path A" handoff + trigger declined follow-up.']
  if (inv === 'B') return ['• PATH C / PATH B (mixed) - read the room.',
                            '• PATH C - yes. Companion → Path C → Send Foundational Read → Mark Complete.',
                            '• PATH B - needs time. Dashboard "Path B" handoff.',
                            '• PATH A (less likely) - out. Trigger declined follow-up.']
  if (inv === 'C') return ['• PATH B (most likely) - needs time. Dashboard "Path B" handoff.',
                            '• PATH A (possible) - out. Dashboard "Path A" handoff + trigger declined follow-up.',
                            '• PATH C (less likely) - yes. Companion → Path C → Send Foundational Read → Mark Complete.']
  if (inv === 'D') return ['• PATH A (most likely) - out. Dashboard "Path A" handoff + trigger declined follow-up.',
                            '• PATH B (less likely) - needs time. Send post-session recap email.',
                            '• PATH C (unlikely) - yes. Companion → Path C → Send Foundational Read.']
  return ['• PATH B - needs time. Dashboard "Path B" handoff.',
          '• PATH A - out. Dashboard "Path A" handoff + trigger declined follow-up.',
          '• PATH C - yes. Companion → Path C → Send Foundational Read → Mark Complete.']
}

// =============================================================
// One-line pattern read for AT A GLANCE
// =============================================================

function patternRead(input: LeadBriefInput, floor: SectionKey | null): string {
  if (input.scorecard_body_state === 'Depleted State') {
    return 'Foundations on the floor. Body in protection mode.'
  }
  if (input.scorecard_body_state === 'Transitioning State') {
    if (!floor) return 'Mixed signals. No clear single floor in the scorecard pattern.'
    const floorName = SECTIONS[floor].name
    return `${floorName} is the floor. Everything else dragged down by it.`
  }
  return 'Foundation intact. Capacity unused. Prescription, not biology.'
}

// =============================================================
// Main generator
// =============================================================

// =============================================================
// Scope-of-practice flags
// =============================================================

/**
 * Scan the lead's own words for things that sit outside S&ES scope.
 *
 * Added 2026-08-12 after a lead arrived at a Zoom with diagnosed Hashimoto's,
 * on T3/T4 replacement, and four months into a GLP-1 — none of which appeared
 * anywhere on her lead page or in her brief. The coach would have walked in
 * blind to the two things most likely driving what she was describing.
 *
 * Deliberately crude. It is a prompt to ASK and to refer, never a conclusion.
 * A false positive costs one question. A miss costs a scope breach.
 */
const SCOPE_PATTERNS: Array<{ test: RegExp; flag: string; route: string }> = [
  {
    test: /\b(mounjaro|ozempic|wegovy|saxenda|trulicity|tirzepatide|semaglutide|liraglutide|glp-?1)\b/i,
    flag: 'GLP-1 agonist',
    route: 'Outside S&ES scope entirely. Ask what they were told and by whom. Note it, do not interpret it, do not advise on dose or duration.',
  },
  {
    test: /\b(hashimoto'?s?|thyroid|levothyroxine|thyroxine|eltroxin|euthyrox|t3\/t4|t3 and t4|hypothyroid|graves)\b/i,
    flag: 'Thyroid condition or medication',
    route: 'Refer to Arete or GP. Named in every profile document as a confounder that overlaps the whole symptom set. Do not interpret bloods or antibodies.',
  },
  { test: /\bpcos\b/i, flag: 'PCOS', route: 'Refer if suspected. Insulin resistance is central to it and it will mimic Insulin-Drift while needing different management.' },
  { test: /\b(hrt|hormone replacement|oestrogen patch|estrogen patch|progesterone)\b/i, flag: 'Hormone therapy', route: 'Ask, note, never advise for or against. Medical matter.' },
  { test: /\b(prednisone|prednisolone|corticosteroid|cortisone injection)\b/i, flag: 'Corticosteroid', route: 'Produces the Stress-Stored picture directly. Refer before committing to a cortisol read.' },
  { test: /\b(sleep apnoea|sleep apnea|cpap)\b/i, flag: 'Sleep apnoea', route: 'Refer for assessment. Independently produces the whole fatigue and composition picture.' },
  { test: /\b(metformin|pre-?diabet|type 2 diabet|hba1c|insulin resistance diagnosed)\b/i, flag: 'Glucose diagnosis or medication', route: 'Medical picture, not a coaching one. Refer. Never tell a client they are pre-diabetic.' },
  { test: /\b(antidepressant|ssri|sertraline|escitalopram|venlafaxine|depression|anxiety disorder)\b/i, flag: 'Mood condition or medication', route: 'Refer. Alters HPA function and sleep, and coaching around a clinical mood disorder is not appropriate.' },
  { test: /\b(pregnan|postpartum|post-partum|breastfeeding)\b/i, flag: 'Pregnancy or postpartum', route: 'Different physiology altogether. Confirm stage before any prescription.' },
  { test: /\b(anorexi|bulimi|disordered eating|red-?s\b|binge)\b/i, flag: 'Disordered eating signal', route: 'Refer. The correction is the opposite of what they will expect and this must not be coached around.' },
  { test: /\b(shift work|night shift|nightshift|rotating roster|on call overnight|sleep on site)\b/i, flag: 'Shift work', route: 'INSIDE scope, and probably your biggest lever. But it makes the insulin timing tell unreadable — establish the actual daily structure before reading timing.' },
]

export interface ScopeFlag { flag: string; route: string }

export function detectScopeFlags(text: string | null | undefined): ScopeFlag[] {
  if (!text) return []
  const out: ScopeFlag[] = []
  for (const p of SCOPE_PATTERNS) {
    if (p.test.test(text)) out.push({ flag: p.flag, route: p.route })
  }
  return out
}

// =============================================================
// Main generator — ZOOM 1
// =============================================================

/**
 * Zoom 1 pre-call brief.
 *
 * Reshaped 2026-08-12. This used to emit an in-person AF Newstead session
 * brief: a runsheet with a pre-session block, a during-the-working-block watch
 * list, and a post-session scorecard read-back. That was most of its length and
 * none of it applies to a Zoom call, which is now the default path out of the
 * Challenge. The gym runsheet moved to `generateInPersonSessionSupplement`
 * below and is produced on demand rather than stored on every lead.
 */
export function generatePreCallBrief(input: LeadBriefInput): string {
  const state = input.scorecard_body_state
  const stateShort = STATE_SHORT[state]
  const bank = STATE_BANKS[state]
  if (!bank) {
    return `Unable to generate brief - unknown body state "${state}".`
  }

  const scores = input.scorecard_section_scores ?? {}
  const floor = pickFloor(scores)
  const floorName = floor ? SECTIONS[floor].name : 'Unclear (no section scores recorded)'
  const { profile, confidence: profileConfidence } = typeFatMapProfile(scores, state, {
    sex: input.biological_sex,
    ageBand: input.age_band,
    fatStorage: input.fat_storage,
    cycleStatus: input.cycle_status,
    storageDirection: input.storage_direction,
  })
  const isIndeterminate = profile === 'Indeterminate'
  const driver = PROFILE_DRIVERS[profile]
  const profileDescriptor = PROFILE_DESCRIPTORS[profile]
  const generatedDate = new Date().toISOString().slice(0, 10)

  const approach = input.approach_response
  const investment = input.investment_readiness
  const redCount = (approach === 'C' || approach === 'D' ? 1 : 0)
                 + (investment === 'C' || investment === 'D' ? 1 : 0)
  const quality = input.lead_quality
    ? input.lead_quality.toUpperCase()
    : (approach && investment ? (redCount === 0 ? 'GREEN' : redCount === 1 ? 'YELLOW' : 'RED') : 'UNKNOWN')
  const approachFlag = (approach === 'C' || approach === 'D') ? '   ← red flag' : ''
  const investmentFlag = (investment === 'C' || investment === 'D') ? '   ← red flag' : ''

  const criticalHold = buildCriticalHold(input, profile)
  const scopeFlags = detectScopeFlags(input.prep_notes)

  const lines: string[] = []

  lines.push(`${input.name.toUpperCase()} - ZOOM 1 PRE-CALL BRIEF`)
  lines.push(input.call_date
    ? `Generated ${generatedDate}. Call: ${input.call_date}. 30-45 min on Zoom.`
    : `Generated ${generatedDate}. Call date TBC. 30-45 min on Zoom.`)
  lines.push('')
  lines.push('')

  // ── Scope flags come FIRST when present. Nothing else on this page matters
  //    if the coach is about to talk past a medical picture.
  if (scopeFlags.length) {
    lines.push('═══════════════════════════════════════════')
    lines.push('READ THIS FIRST - SCOPE FLAGS')
    lines.push('═══════════════════════════════════════════')
    lines.push('')
    lines.push('Picked up from their own words on the pre-call form. Ask about each,')
    lines.push('note the answer, and do not interpret it.')
    lines.push('')
    scopeFlags.forEach(f => {
      lines.push(`• ${f.flag}`)
      lines.push(`  → ${f.route}`)
      lines.push('')
    })
    lines.push('Safe framing: "That sits with your doctor, not me. What I can do is make')
    lines.push('sure everything on my side is working with it rather than against it."')
    lines.push('')
    lines.push('NEVER: name or rule out a condition, interpret bloods, or say anything that')
    lines.push('reads as advice to change a prescribed medication.')
    lines.push('')
    lines.push('')
  }

  // ── At a glance ────────────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('AT A GLANCE')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  if (isIndeterminate) {
    const reason = state === 'Ready State'
      ? 'Ready body, no compensation pattern to name'
      : 'scorecard does not point cleanly at one of the four'
    lines.push(`${input.scorecard_score}/15 ${stateShort}. Profile: TBD on intake (${reason}).`)
  } else {
    const suffix = profileConfidence === 'low' ? ' [PROVISIONAL - do not name it with confidence]' : ''
    lines.push(`${input.scorecard_score}/15 ${stateShort}. Profile: ${profile} (${driver})${suffix}.`)
  }
  const sectionLine = (['01','02','03','04','05'] as SectionKey[])
    .filter(k => scores[k] != null)
    .map(k => `${SECTIONS[k].name} ${scores[k]}`)
    .join(' · ')
  if (sectionLine) lines.push(sectionLine)
  lines.push(patternRead(input, floor))
  lines.push('')

  if (scopeFlags.length) {
    lines.push('⚠ Scope flags present (above). Treat the profile as weaker than the label')
    lines.push('  suggests — a medical picture overlaps most of what the scorecard scores.')
    lines.push('')
  }
  if (profileConfidence === 'low' && !isIndeterminate) {
    lines.push('Confidence is LOW. Use "points toward", never "you are".')
    lines.push('')
  }

  const ones = (['01','02','03','04','05'] as SectionKey[]).filter(k => scores[k] === 1)
  const threes = (['01','02','03','04','05'] as SectionKey[]).filter(k => scores[k] === 3)
  if (ones.length || threes.length) {
    lines.push('KEY SIGNALS')
    if (ones.length) {
      lines.push('  Floors (1/3) — where the body is actually struggling:')
      ones.forEach(k => lines.push(`  • ${SECTIONS[k].name} - ${SECTIONS[k].descriptors[0]}`))
    }
    if (threes.length) {
      lines.push('  Holds (3/3) — what is already in place, lean on these:')
      threes.forEach(k => lines.push(`  • ${SECTIONS[k].name} - ${SECTIONS[k].descriptors[2]}`))
    }
    lines.push('')
  }

  lines.push(`LEAD QUALITY: ${quality}  (${redCount} red flag${redCount === 1 ? '' : 's'})`)
  lines.push('')
  if (approach) {
    lines.push('Q "When your training or nutrition stops producing results, what is your honest first response?"')
    lines.push(`  → ${approach}: "${APPROACH_LABELS[approach]}"${approachFlag}`)
    lines.push('')
  }
  if (investment) {
    lines.push('Q "If the scorecard identifies what is blocking your progress, are you in a position to invest in addressing it?"')
    lines.push(`  → ${investment}: "${INVESTMENT_LABELS[investment]}"${investmentFlag}`)
    lines.push('')
  }
  lines.push('CRITICAL HOLD')
  criticalHold.forEach((h, i) => lines.push(`${i + 1}. ${h}`))
  lines.push('')
  lines.push('')

  // ── Their own words ────────────────────────────────────────
  if (input.prep_notes) {
    lines.push('═══════════════════════════════════════════')
    lines.push('WHAT THEY TOLD YOU')
    lines.push('═══════════════════════════════════════════')
    lines.push('')
    lines.push('Verbatim from the pre-call form. Use their words back, do not paraphrase.')
    lines.push('')
    input.prep_notes.split('\n').forEach(l => lines.push(l))
    lines.push('')
    lines.push('')
  }

  // ── Running the call ───────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('OPENING')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  lines.push('SET THE AGENDA (verbatim):')
  lines.push('')
  lines.push('  "Here\'s how this\'ll go. I\'ll ask you a few things so I understand where')
  lines.push('  you\'re actually at, then I\'ll walk you through what your scorecard is')
  lines.push('  telling me and what I\'d do about it. If it\'s a fit I\'ll tell you what')
  lines.push('  working together looks like. No need to decide anything today."')
  lines.push('')
  lines.push('THEN ASK, and capture verbatim:')
  lines.push('')
  lines.push('• "What was going on that made you fill this in?"')
  lines.push('• "What have you already tried, and what happened?"')
  lines.push('• "When did you last feel really good? What was different then?"')
  lines.push('• "If we sorted this, what actually changes day to day?"')
  if (scopeFlags.length) {
    lines.push('• Then work through the scope flags above. Ask, note, move on.')
  }
  lines.push('')
  lines.push('')

  // ── The read ───────────────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('THE READ - WALKING THEM THROUGH IT')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  lines.push('LEAD WITH')
  lines.push(`"${bank.readbackLeadWith(floorName, input.scorecard_score, scores)}"`)
  lines.push('')
  lines.push('MECHANISM')
  bank.mechanismBullets(floorName).forEach(b => lines.push(`• ${b}`))
  lines.push('')
  lines.push('THEN')
  lines.push(`"${bank.readbackThen(input.scorecard_score)}"`)
  if (!isIndeterminate) {
    if (profileConfidence === 'low') {
      lines.push(`"Where it sits on you points toward ${profile}, but I want the intake before I commit to that."`)
    } else {
      lines.push(`"Yours is ${profile.toLowerCase()} specifically."`)
    }
    lines.push('')
    lines.push(`(${profile}: ${profileDescriptor})`)
  }
  lines.push('')
  lines.push('ASK: "What was your reaction when you saw the result?"')
  lines.push('')
  lines.push('')

  // ── What coaching is ───────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('WHAT COACHING IS')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  lines.push('Bridge: "Based on what you told me about [their words], here\'s exactly how')
  lines.push('my coaching gets to that."')
  lines.push('')
  lines.push('• 230-question intake → Foundational Read. From you, not a template.')
  lines.push('• Fat Map - four location-plus-signal pairs. Location narrows, the signal decides.')
  if (!isIndeterminate) {
    lines.push(`  Yours points at ${profile}${profileConfidence === 'low' ? ', provisionally' : ''}.`)
  }
  lines.push('• Portal - training, nutrition, weekly check-ins, all driven by your read.')
  lines.push('• Weekly check-in - I read your response, adjust next week. A loop, not a static plan.')
  lines.push('')
  lines.push(`TAIL: "${bank.tail(floorName)}"`)
  lines.push('')
  lines.push('')

  // ── The offer ──────────────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('THE OFFER')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  const exploring = investment === 'C' || investment === 'D'
  if (exploring) {
    lines.push('THEY ANSWERED "EXPLORING" OR "FREE ONLY". DO NOT PITCH 1:1.')
    lines.push('Read them, give them the picture, let the offer land flat. If they push,')
    lines.push('the next rung is the one below, not the top one.')
    lines.push('')
  }
  if (state === 'Depleted State') {
    lines.push('State maps to: 14-Day Challenge (free), then Blueprint at $97.')
    lines.push('A Depleted body has no capacity for a heavier prescription yet. Say so.')
  } else if (state === 'Transitioning State') {
    lines.push('State maps to: Blueprint at $97. Membership if they are already moving.')
  } else {
    lines.push('State maps to: Membership at $49/wk, or 1:1 if they want the read built in.')
  }
  lines.push('')
  if (!exploring) {
    lines.push('IF 1:1 IS GENUINELY ON THE TABLE')
    lines.push('• Online coaching - $149/wk. Intake + Foundational Read, training, nutrition,')
    lines.push('  weekly check-in, direct access between sessions.')
    lines.push('• $240 commencement, one-off.')
    lines.push(`• Minimum ${bank.commitmentWeeks}-week interpretive window.`)
    lines.push('')
    lines.push('IF "THAT\'S A LOT"')
    lines.push('"You\'re not paying for a program. You\'re paying for me reading your body the')
    lines.push('whole time, adjusting as it changes. The question isn\'t whether it\'s')
    lines.push('expensive. It\'s whether what you\'ve been doing has been working."')
    lines.push('')
  }
  lines.push('')

  // ── Objections ─────────────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('OBJECTION TUNING')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  bank.objections.forEach(o => {
    lines.push(`• "${o.trigger}"`)
    lines.push(`  → "${o.response}"`)
    lines.push('')
  })
  lines.push('')

  // ── Path probability ───────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('PATH PROBABILITY')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  if (redCount >= 2) {
    lines.push('• PATH B (most likely) - needs time. Two red flags.')
    lines.push('• PATH A (possible) - out. Trigger the declined follow-up.')
    lines.push('• PATH C (unlikely) - yes.')
  } else if (redCount === 1) {
    lines.push('• PATH B (most likely) - needs time.')
    lines.push('• PATH C (possible) - yes.')
    lines.push('• PATH A - out. Trigger the declined follow-up.')
  } else {
    lines.push('• PATH C (most likely) - yes. Send the commencement fee, mark complete.')
    lines.push('• PATH B (possible) - needs time.')
    lines.push('• PATH A (less likely) - out.')
  }
  lines.push('')
  lines.push('Path B is not a fail. Say the door stays open and mean it.')
  lines.push('')
  lines.push('')

  // ── Key lines ──────────────────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('KEY LINES (in your pocket)')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  bank.keyLines.forEach(k => lines.push(`• ${k}`))
  lines.push('')
  lines.push('')

  // ── If they don't proceed ──────────────────────────────────
  lines.push('═══════════════════════════════════════════')
  lines.push('IF THEY DON\'T PROCEED (Path A or B)')
  lines.push('═══════════════════════════════════════════')
  lines.push('')
  lines.push('Give them this regardless. Practical, tuned to their state and floor.')
  lines.push('')
  lines.push(`For ${input.name}, ${stateShort} state, floor on ${floorName}:`)
  lines.push('')
  const recommendations = bank.recommendations
  recommendations.forEach((r, i) => lines.push(`${i + 1}. ${r}`))
  lines.push('')
  lines.push('CLOSING LINE')
  lines.push('"That\'s a real starting point. What it can\'t tell you is which one to pull')
  lines.push('first, or when to change what. Most people on their own end up doing the right')
  lines.push('things in the wrong order. If you want the read built in, the door\'s open."')
  lines.push('')

  return lines.join('\n')
}

// =============================================================
// In-person session supplement
// =============================================================

/**
 * Compact runsheet for an in-person session at AF Newstead.
 *
 * Split out of the main brief on 2026-08-12. Zoom is the default path, so the
 * gym runsheet was dead weight on every lead. This is generated on demand and
 * is a SUPPLEMENT: it assumes the Zoom brief has been read and does not repeat
 * the read, the offer or the objections.
 */
export function generateInPersonSessionSupplement(input: LeadBriefInput): string {
  const state = input.scorecard_body_state
  const stateShort = STATE_SHORT[state]
  const bank = STATE_BANKS[state]
  if (!bank) return `Unable to generate supplement - unknown body state "${state}".`

  const scores = input.scorecard_section_scores ?? {}
  const floor = pickFloor(scores)
  const floorName = floor ? SECTIONS[floor].name : 'unclear'
  const generatedDate = new Date().toISOString().slice(0, 10)

  const lines: string[] = []

  lines.push(`${input.name.toUpperCase()} - IN-PERSON SESSION SUPPLEMENT`)
  lines.push(`Generated ${generatedDate}. AF Newstead. Read the Zoom brief first.`)
  lines.push('')
  lines.push(`${input.scorecard_score}/15 ${stateShort}. Floor: ${floorName}.`)
  lines.push('')
  lines.push('───────────────────────────────────────────')
  lines.push('BEFORE THEY ARRIVE')
  lines.push('───────────────────────────────────────────')
  lines.push('')
  lines.push(`Open /dashboard/gym-sessions → ${stateShort}.`)
  lines.push('')
  lines.push('Program type:')
  lines.push('• Machines (default) - lower neurological cost, easier to read recovery rate')
  lines.push('• Functional / Mixed - only if they are training-fluent')
  lines.push('')
  lines.push('Hold the scorecard until AFTER the session. The training is the proof.')
  lines.push('')
  lines.push('AGENDA (verbatim):')
  lines.push('  "We\'ll train first so I can see what your body\'s actually doing under load.')
  lines.push('  Then we sit down and I\'ll walk you through what I saw and what your')
  lines.push('  scorecard says. No need to decide anything today."')
  lines.push('')
  lines.push('───────────────────────────────────────────')
  lines.push('DURING THE WORKING BLOCK - WHAT TO WATCH')
  lines.push('───────────────────────────────────────────')
  lines.push('')
  lines.push(bank.watchListIntro)
  bank.watchList.forEach(w => lines.push(`• ${w}`))
  lines.push('')
  lines.push('The light load is deliberate. Expect resistance to that framing.')
  lines.push('')
  lines.push('───────────────────────────────────────────')
  lines.push('AFTER - CALLBACK TO THE SESSION')
  lines.push('───────────────────────────────────────────')
  lines.push('')
  lines.push('Pick ONE, then move into the read from the Zoom brief:')
  lines.push('')
  bank.callbacks.forEach(c => lines.push(`• ${c}`))
  lines.push('')
  lines.push(`Three-times-a-week note: ${bank.threeXNote}`)
  lines.push('')

  return lines.join('\n')
}

// =============================================================
// Structured summary
// =============================================================

export interface BriefSummary {
  headline: string
  stateLabel: string
  profileLabel: string | null
  provisional: boolean
  quality: string
  redCount: number
  approachLine: string | null
  investmentLine: string | null
  approachFlagged: boolean
  investmentFlagged: boolean
  criticalHold: string[]
  offerLine: string
  doNotPitch: boolean
  pathLine: string
  keyLines: string[]
  // ── Everything below added 2026-08-12. The companion was carrying only the
  // generic per-state scripts while the written brief held all the
  // lead-specific intelligence, so the screen used DURING the call knew less
  // about the person than the one read before it.
  /** Sections scoring 1. Where the body is actually struggling. */
  floors: Array<{ name: string; descriptor: string }>
  /** Sections scoring 3. What is already in place, lean on these. */
  holds: Array<{ name: string; descriptor: string }>
  /** Opening line of the read, built from their actual section scores. */
  readLeadWith: string
  mechanism: string[]
  readThen: string
  /** The line naming the pattern, hedged when confidence is low. */
  readPattern: string | null
  profileDescriptor: string | null
  tail: string
  objections: Array<{ trigger: string; response: string }>
  /** Give these regardless of outcome. */
  recommendations: string[]
  floorName: string
}

/**
 * The six things worth glancing at in the 30 seconds before dialling.
 *
 * Exists so the lead page can render a scannable card without parsing the
 * plain-text brief back apart. Added 2026-08-12: the brief is thorough, but
 * thorough is the wrong shape for the moment just before a call.
 */
export function buildBriefSummary(input: LeadBriefInput): BriefSummary | null {
  const state = input.scorecard_body_state
  const bank = STATE_BANKS[state]
  if (!bank) return null

  const scores = input.scorecard_section_scores ?? {}
  const { profile, confidence } = typeFatMapProfile(scores, state, {
    sex: input.biological_sex,
    ageBand: input.age_band,
    fatStorage: input.fat_storage,
    cycleStatus: input.cycle_status,
    storageDirection: input.storage_direction,
  })

  const approach = input.approach_response
  const investment = input.investment_readiness
  const approachFlagged = approach === 'C' || approach === 'D'
  const investmentFlagged = investment === 'C' || investment === 'D'
  const redCount = (approachFlagged ? 1 : 0) + (investmentFlagged ? 1 : 0)
  const quality = input.lead_quality
    ? input.lead_quality.toUpperCase()
    : (approach && investment ? (redCount === 0 ? 'GREEN' : redCount === 1 ? 'YELLOW' : 'RED') : 'UNKNOWN')

  const offerLine = state === 'Depleted State'
    ? '14-Day Challenge (free), then Blueprint at $97. A Depleted body has no capacity for a heavier prescription yet.'
    : state === 'Transitioning State'
      ? 'Blueprint at $97. Membership if they are already moving.'
      : 'Membership at $49/wk, or 1:1 if they want the read built in.'

  const pathLine = redCount >= 2
    ? 'Path B most likely, needs time. Two red flags.'
    : redCount === 1
      ? 'Path B most likely, needs time. Path C possible.'
      : 'Path C most likely, yes. Send the commencement fee.'

  const floor = pickFloor(scores)
  const floorName = floor ? SECTIONS[floor].name : 'unclear'
  const keys: SectionKey[] = ['01', '02', '03', '04', '05']
  const named = profile !== 'Indeterminate'

  return {
    floors: keys.filter(k => scores[k] === 1).map(k => ({ name: SECTIONS[k].name, descriptor: SECTIONS[k].descriptors[0] })),
    holds: keys.filter(k => scores[k] === 3).map(k => ({ name: SECTIONS[k].name, descriptor: SECTIONS[k].descriptors[2] })),
    readLeadWith: bank.readbackLeadWith(floorName, input.scorecard_score, scores),
    mechanism: bank.mechanismBullets(floorName),
    readThen: bank.readbackThen(input.scorecard_score),
    readPattern: named
      ? (confidence === 'low'
          ? `Where it sits on you points toward ${profile}, but I want the intake before I commit to that.`
          : `Yours is ${profile.toLowerCase()} specifically.`)
      : null,
    profileDescriptor: named ? PROFILE_DESCRIPTORS[profile] : null,
    tail: bank.tail(floorName),
    objections: [...bank.objections],
    recommendations: [...bank.recommendations],
    floorName,
    headline: patternRead(input, floor),
    stateLabel: `${input.scorecard_score}/15 ${STATE_SHORT[state]}`,
    profileLabel: profile === 'Indeterminate' ? null : profile,
    provisional: confidence === 'low',
    quality,
    redCount,
    approachLine: approach ? APPROACH_LABELS[approach] : null,
    investmentLine: investment ? INVESTMENT_LABELS[investment] : null,
    approachFlagged,
    investmentFlagged,
    criticalHold: buildCriticalHold(input, profile),
    offerLine,
    doNotPitch: investmentFlagged,
    pathLine,
    keyLines: bank.keyLines,
  }
}
