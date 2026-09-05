/**
 * Call companion content.
 *
 * KADE'S LANGUAGE. Extracted verbatim from the previous companion on
 * 2026-08-12 when that file was rebuilt. Nothing in here is generated or
 * paraphrased — these are the scripts he actually uses on calls, and they were
 * written for the room.
 *
 * The one deliberate change: the "Where it shows up" stage was a pure-location
 * model (four anatomical zones). Fat_Map_Definitions_LOCKED v2.0 retired that,
 * because three of the four drivers push fat centrally so location alone
 * misclassifies. It has been rewritten as four location-plus-signal pairs,
 * keeping his sentence rhythm. Approved by Kade 2026-08-12.
 *
 * Edit this file, not the component.
 */

export const SECTION_LABELS: Record<string, string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress Load',
  '04': 'Training Response',
  '05': 'Fat Loss Response',
}

// What the lead actually selected — the description text matching their score.
// Mirrors the public scorecard at /scorecard exactly.
export const SECTION_DESCRIPTIONS: Record<string, Record<number, string>> = {
  '01': {
    1: 'Tired most of the day. Relying on caffeine. Crashes after lunch or training.',
    2: 'Inconsistent. Some good days, some bad. Not reliable.',
    3: 'Steady energy through the day. No need for caffeine to function.',
  },
  '02': {
    1: 'Poor quality. Waking through the night. Not rested in the morning.',
    2: 'Okay most nights but not consistently recovering.',
    3: 'Sleeping well. Waking rested. Recovery feels solid.',
  },
  '03': {
    1: 'High stress. Work, life, or emotional load is significant and ongoing.',
    2: 'Moderate. Manageable most of the time but not low.',
    3: 'Low to moderate. Not carrying a heavy chronic stress load right now.',
  },
  '04': {
    1: 'Not progressing. Performance is flat or declining. Body feels beaten up.',
    2: 'Some progress but inconsistent. Hard to build momentum.',
    3: 'Responding well. Getting stronger, fitter, recovering between sessions.',
  },
  '05': {
    1: 'Nothing is moving despite effort. Diet is clean, training is consistent. No result.',
    2: 'Slow or stalled. Some movement but not matching the input.',
    3: 'Body is responding. Composition is shifting in the right direction.',
  },
}

// Coach-facing interpretation — what each per-section score means in clinical terms.
export const SECTION_INTERPRETATIONS: Record<string, Record<number, string>> = {
  '01': {
    1: 'Energy is significantly depleted, relying on caffeine, crashing through the day. Core signal that the body is running on reserves.',
    2: 'Energy is inconsistent day to day. The variation itself is the signal.',
    3: 'Energy is steady and self-sustaining. Not a limiting factor right now.',
  },
  '02': {
    1: 'Sleep quality is poor. The single biggest recovery suppressor when compromised.',
    2: 'Sleep is okay most nights but not consistently restorative.',
    3: 'Sleep is solid and consistently restorative. Recovery rhythm intact.',
  },
  '03': {
    1: 'Stress load is high and ongoing. Directly suppresses fat loss and training response.',
    2: 'Stress is moderate, has an ongoing background effect.',
    3: 'Stress load is low to moderate. Not a significant driver in the current picture.',
  },
  '04': {
    1: 'Training response has stalled or regressed. Classic depletion-state pattern.',
    2: 'Training response is inconsistent. Hit and miss.',
    3: 'Training response is good, getting stronger, fitter, recovering between sessions.',
  },
  '05': {
    1: 'Fat loss has stopped despite effort. Biology problem, not a behaviour problem.',
    2: 'Fat loss is slow or stalled. Some movement but not matching the input.',
    3: 'Body is responding. Composition is shifting in the right direction.',
  },
}

export const BODY_STATE_LANGUAGE: Record<string, { colour: string; badge: string; opening: string; interpretation: string; pattern: string }> = {
  'Depleted State': {
    colour: 'text-red-700 border-red-200 bg-red-50',
    badge: 'bg-red-400',
    // Coach-facing — what's going on under the hood. Not spoken aloud.
    opening: 'Their scorecard came back as Depleted State. Body is in protection mode, cortisol elevated, metabolism suppressed, fat loss and performance shut down. The scorecard surfaced the signal. The call is about understanding what\'s driving it.',
    // Spoken to the lead. Plain, direct.
    interpretation: 'What you\'re seeing isn\'t an effort or willpower thing, your body\'s protecting itself. When more is going in than your body can recover from, it shifts into preservation mode. The fact that fat loss has stalled and training feels harder than it should, those are two sides of the same thing.',
    pattern: 'Depleted State: body in protection mode. Cortisol up, metabolism down. Adding more training stimulus makes it worse. The fix is smarter management, not harder work.',
  },
  'Transitioning State': {
    colour: 'text-amber-700 border-amber-200 bg-amber-50',
    badge: 'bg-amber-400',
    opening: 'Their scorecard came back as Transitioning State. They\'ve got capacity but something\'s blocking consistent response. Sleep, stress, recovery rhythm, or a mismatch between training load and where their body is right now. Call is about identifying which.',
    interpretation: 'You\'ve got the capacity, you\'re just not consistently expressing it. Some weeks things click, other weeks they don\'t. That inconsistency is the actual issue. Usually it\'s one or two things holding the rest of it back.',
    pattern: 'Transitioning State: capacity is there, consistency isn\'t. Usually one or two sections dragging the picture. Identify the specific drivers and address them in order.',
  },
  'Ready State': {
    colour: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    badge: 'bg-blue-500',
    opening: 'Their scorecard came back as Ready State. Foundations are in place. If results aren\'t happening at this score, it\'s a prescription problem, the what and how of training and nutrition, not the foundation.',
    interpretation: 'You\'ve got the foundations, energy, sleep, stress, recovery are all in the right place. So when results aren\'t happening, it\'s not a foundation issue. It\'s the training or the nutrition approach not matching where you actually are.',
    pattern: 'Ready State: foundations solid. If results aren\'t happening, it\'s the prescription. Focus on the training and nutrition approach.',
  },
}

// ─── Sex gate ──────────────────────────────────────────────────────────────
//
// Two of the four patterns are hard-gated by sex, and `typeFatMapProfile`
// already enforces it: a male can never be typed Estrogen-Shift, a female can
// never be typed Androgen-Decline. Until 26 Aug 2026 the companion showed all
// four to everyone, so a male lead sat through a card for a pattern he cannot
// have, next to a line about oestrogen. Garv (25 Aug, scorecard, male) is the
// lead that surfaced it.
//
// The page copy this mirrors is written for women, because the site is. That
// is correct for the site and wrong in the room when the lead is a man, so the
// audience noun is a token here rather than a fixed word.
//
// `null` is the common case: 99 of 130 leads predate the details step. Unknown
// shows everything and says so, rather than guessing.

export type LeadSex = 'M' | 'F' | null

/** women / men / people. Never guess it from a name. */
export function audienceNoun(sex: LeadSex): string {
  return sex === 'F' ? 'women' : sex === 'M' ? 'men' : 'people'
}

/** Drops the pattern this lead cannot be typed as. */
export function patternsForSex<T extends { name: string }>(patterns: readonly T[], sex: LeadSex): T[] {
  if (sex === 'M') return patterns.filter(p => p.name !== 'Estrogen-Shift')
  if (sex === 'F') return patterns.filter(p => p.name !== 'Androgen-Decline')
  return [...patterns]
}

/** The spoken causes list, built from whatever patterns are actually in play. */
export function causesPhrase(patterns: readonly { plain: string }[]): string {
  const parts = patterns.map(p => p.plain)
  if (parts.length === 0) return 'Stress, blood sugar, or hormones'
  const joined = parts.length === 1
    ? parts[0]
    : `${parts.slice(0, -1).join(', ')}, or ${parts[parts.length - 1]}`
  return joined.charAt(0).toUpperCase() + joined.slice(1)
}

/** Fills {audience} and {causes} in any companion string. */
export function fillCopy(text: string, sex: LeadSex, patterns: readonly { plain: string }[]): string {
  return text
    .split('{audience}').join(audienceNoun(sex))
    .split('{causes}').join(causesPhrase(patterns))
}

/** What to put on screen so he knows which way the companion is gated. */
export const SEX_GATE_NOTE: Record<'M' | 'F' | 'unknown', string> = {
  M: 'Male lead. Estrogen-Shift is hidden, he cannot be typed as it. Everything below reads "men".',
  F: 'Female lead. Androgen-Decline is hidden, she cannot be typed as it.',
  unknown: 'Sex was never captured on this lead, so nothing is gated and all four patterns are showing. Ask early, and do not name a pattern until you have.',
}

// ─── How The System Works ──────────────────────────────────────────────────
//
// Mirrors performance.bodyrecode.au/how-it-works verbatim (rebuilt 2026-08-25).
// The lead may have read that page before the call, so what he says here has to
// be the same five stages in the same order, in the same words.
//
// The old model here (Biological Intake → Where it shows up → What type of body
// → Execution → Continuous Loop) is retired. Two things changed:
//   - readiness is now stated OUTWARD as readiness, not "body state"
//   - the four anatomical zones are gone; the read places her two ways,
//     readiness first, then pattern
//
// TWO deliberate differences from the page, both only in what he SAYS:
//
// 1. PLAIN WORDS FIRST. The written detail is the page verbatim, because she may
//    have read it. The spoken script is not. Read, readiness and pattern are our
//    words, and a stranger on a first call has to translate every one of them, so
//    each script says what the thing plainly is and only then names it: "you fill
//    out a long questionnaire ... I write you a document ... that is what I call
//    your Foundational Read." Say_It_Plainly_First, 24 Aug 2026.
//
// 2. NO PATTERN COUNT. Four is true of the model, three is true of what a woman
//    can be (Androgen-Decline is male-only), so any number in a sentence said to
//    her contradicts one or the other. The count stays in the written detail,
//    which describes the model. Pattern_Count_Scope_Rule, 24 Aug 2026.

export const HOW_IT_WORKS_STAGES = [
  {
    number: '01',
    title: 'The Foundational Read',
    subtitle: 'Stage One · 234 data points',
    heading: 'I read your body before I prescribe anything',
    body: 'This is the Foundational Read: 234 data points across eight signal domains, plus baseline measurements, photos, and any recent bloodwork. Nothing assumed, nothing pulled from a template. It exists to surface what is actually happening, not to confirm what I expect.',
    domains: [
      { n: '01', name: 'Training Load', desc: 'Volume, intensity, recovery debt' },
      { n: '02', name: 'Sleep Quality', desc: 'Depth, duration, regularity' },
      { n: '03', name: 'Nutritional Pattern', desc: 'Timing, composition, adequacy' },
      { n: '04', name: 'Stress Load', desc: 'Cumulative system pressure' },
      { n: '05', name: 'Recovery Capacity', desc: 'Resilience between stressors' },
      { n: '06', name: 'Hormonal State', desc: 'Cortisol, insulin, sex hormones' },
      { n: '07', name: 'Movement History', desc: 'Past training, current capacity' },
      { n: '08', name: 'Behavioural Context', desc: 'Adherence, environment, identity' },
    ],
    output: 'Your Foundational Read: your body\'s current state, the pattern driving it, and what to address first.',
    coachScript: '"Before I write you anything, you fill out a long questionnaire. 234 questions across eight areas: training, sleep, food, stress, recovery, hormones, your history, and what your day to day actually looks like. Plus your measurements, photos, and any recent blood tests. I go through the lot and write you a document that says what\'s actually going on with your body and why. That document is what I call your Foundational Read. None of it is a template, and none of it is me confirming what I already think."',
  },
  {
    number: '02',
    title: 'The read places you two ways',
    subtitle: 'Stage Two · Readiness, then pattern',
    heading: 'The read places you two ways',
    body: 'I read your data through five analytical frameworks (the Body Recode™ Interpretive Pillars). The output is your Foundational Read, and it answers two questions: how much load your body can handle right now, and what is actually driving the stall.',
    statesIntro: 'Which of three states your body is in decides whether it is safe to push at all, or whether we rebuild capacity first. Most people are further back than they expect, and that is the single most important thing to get right.',
    states: [
      { n: '01', name: 'Depleted', plain: 'run down', line: 'Under load it cannot clear', desc: 'Run-down and carrying more than it can recover from. Training hard here digs the hole deeper. Most {audience} are further into this than they think.' },
      { n: '02', name: 'Transitioning', plain: 'steadying', line: 'Stabilised, building capacity', desc: 'The system has settled and can take real work again. This is where change actually starts to show.' },
      { n: '03', name: 'Ready', plain: 'ready to push', line: 'Performing', desc: 'Recovered and responding. Now the work is sharpening what you have and holding it for the long run.' },
    ],
    patternsIntro: 'Every client also sorts into a pattern. Each one needs a materially different approach to training, nutrition, and recovery.',
    patterns: [
      { name: 'Stress-Stored', plain: 'stress', driver: 'Cortisol-driven', line: 'Holding tight under load', desc: 'Chronic stress keeps the system in protection. Fat stores around the midsection. Pushing harder closes the door further.' },
      { name: 'Insulin-Drift', plain: 'blood sugar', driver: 'Blood-sugar driven', line: 'Energy is inconsistent', desc: 'Insulin sensitivity has drifted. Afternoon crashes, persistent cravings, heaviness after meals. Fuelling needs restructuring.' },
      { name: 'Estrogen-Shift', plain: 'hormones changing', driver: 'Hormonal-driven', line: 'Your body has changed', desc: 'Oestrogen shift drives conservation. Fat distribution shifts. Recovery feels different. Restriction makes it worse.' },
      { name: 'Androgen-Decline', plain: 'capacity dropping off', driver: 'Testosterone-driven', line: 'Capacity is slipping', desc: 'Declining androgen signal. Recovery slower, drive flat, muscle no longer responding. System needs less demand, more inputs.' },
    ],
    note: 'These name observed patterns of where the body stores and how it signals. They describe how your body is behaving, not a measurement of your hormone levels.',
    coachScript: '"That document answers two questions. First: how much training you can actually handle right now. There are three levels, run down, steadying, or ready to push, and most {audience} are further back than they expect. Getting that wrong is usually why the last few things didn\'t work. Second: what\'s actually causing the stall. {causes}. That one I call your pattern, and it changes how I train you and how I feed you."',
  },
  {
    number: '03',
    title: 'I build training and nutrition around your read',
    subtitle: 'Stage Three · Program, nutrition, portal',
    heading: 'I build training and nutrition around your read',
    body: 'With your Foundational Read in place, I build everything within its boundaries: training, nutrition, weekly check-in flow. All delivered through your client portal.',
    pieces: [
      { name: 'Training Program', desc: 'Load, volume, and modality derived entirely from your read. Not a generic phase. Not a template.' },
      { name: 'Nutrition Plan', desc: 'Built around your biological profile. I adjust it as your body responds.' },
      { name: 'Weekly Check-In', desc: 'Each week I read your data and produce a weekly read, a snapshot of how your body is responding.' },
      { name: 'Progress Tracking', desc: 'Photos, measurements, and your readiness scored again over time, so movement is visible rather than assumed.' },
    ],
    portalIntro: 'One login. Everything I build for you, live. Nothing gets sent as a PDF you lose in your inbox. Every client gets their own portal, open from day one and updated as I adjust things. It runs in your phone\'s browser, so there is no app to download.',
    portal: [
      { name: 'Your Foundational Read', desc: 'The full read written out in plain language: your readiness, your pattern, and why I am prescribing what I am prescribing.' },
      { name: 'Training Program', desc: 'Every session with sets, reps, and loads. Log each workout as you go so I can see what actually happened, not what was planned.' },
      { name: 'Nutrition Plan', desc: 'Your meals and targets, with food swaps if something does not suit you, and simple adherence logging.' },
      { name: 'Daily Sequences', desc: 'A Morning Reset and an Evening Rhythm built to your read. Short, specific, and the part most {audience} are missing.' },
      { name: 'Recovery Protocols', desc: 'Prescribed recovery work for whatever your read flagged, rather than generic advice to sleep more.' },
      { name: 'Supplement Stack', desc: 'What to take, when to take it, and the reason it is there. Nothing on the list without a reason.' },
      { name: 'Weekly Check-In', desc: 'Submit in a few minutes each week. Your full check-in history sits there, with my written response on every one.' },
      { name: 'Progress', desc: 'Photos, measurements, and your Progress Read at the end of each block, tracked in one place over time.' },
      { name: 'Blood Work', desc: 'Upload your panels and see your markers read against your profile, plus a guide you can hand to your GP.' },
      { name: 'Messages and Resources', desc: 'A direct line to me between check-ins, alongside your guides, glossary, and reference material.' },
    ],
    coachScript: '"Once I\'ve got that, I build everything around it. Your training program, what you eat, a short morning and evening routine, recovery work, supplements. All of it sits in a private website you log into on your phone. There\'s no app to download, and nothing gets emailed to you as a PDF you lose. It\'s open from day one and I update it as I change things."',
  },
  {
    number: '04',
    title: 'I read every week and adjust',
    subtitle: 'Stage Four · Two reads running together',
    heading: 'I read every week and adjust',
    body: 'While a block is live, two reads run together: the Foundational Read that set the boundaries, and the Weekly Read from each check-in. Each feeds the next. I read, I adjust, I read again. The plan adapts as your body adapts, right up to the end of the block.',
    reads: [
      { tag: 'The Foundation', name: 'Foundational Read', desc: 'Produced once at the start. Defines your biological profile, readiness, and the boundaries I work within. Doesn\'t change week to week.' },
      { tag: 'The Weekly Update', name: 'Weekly Read', desc: 'Produced every week from your check-in. Captures how your body\'s responding to what we\'ve applied. Drives my next adjustment.' },
    ],
    coachScript: '"From there we\'re in a cycle. That first document sets the boundaries and doesn\'t change. Then every week you fill in a short check-in, and I write back on what your body did with what we applied and what I\'m changing next. That\'s the weekly one. It\'s not a static plan, it adapts as your body adapts."',
  },
  {
    number: '05',
    title: 'The Progress Read',
    subtitle: 'Stage Five · End of every block',
    heading: 'At the end of every block, I read you again',
    body: 'A training block is a chapter, not the whole story. When one finishes, I don\'t just roll into the next. I read your body again and set where it sits now against where it started. This is your Progress Read: proof, in plain terms, of how far the block actually moved you.',
    detail: 'You answer a short check-in, about five minutes, and I read it alongside everything from the block. Your readiness is scored again, so the shift is something you can see, not just something you have to take on faith.',
    note: 'Your Progress Read never changes the pattern I identified in your Foundational Read. It measures the one thing that matters to you between blocks: are you actually moving, and in the right direction.',
    coachScript: '"A block is a stretch of weeks working on one thing. When one finishes, instead of rolling straight into the next, I get you to answer a short check-in and send me your measurements and three photos - ten minutes - and I write up where you started against where you are now. Whether you can handle more than you could at the start, and by how much. I call that your Progress Read. It means you can see the shift instead of taking my word for it."',
  },
] as const

// ─── Pricing & Packages ────────────────────────────────────────────────────

/**
 * Said out loud when the price lands, so it follows the same rule as the stage
 * 3 scripts: the ordinary thing first, our name for it second. CFFS and CFWS
 * are gone. She has no idea what either letter means and this is the worst
 * possible moment to make her work it out. 26 Aug 2026.
 */
export const WHATS_INCLUDED = [
  'The full questionnaire, and the document I write off it: what\'s going on with your body and why',
  'A training program written from your answers, not a template',
  'Nutrition built around what your body is doing, adjusted as it changes',
  'A short check-in every week, and my written response on every one',
  'All of it in one place you log into on your phone, updated as I change things',
  'Direct access to me between sessions',
  'Two coached sessions a week with me (in-person packages)',
] as const

/**
 * Repriced 26 Aug 2026. The ORDER matters: this is the order he reads them out,
 * and it runs HIGHEST TO LOWEST.
 *
 * He opens on 3x at $225 AND says it is assessed. That is deliberate: it sets
 * the top of the sheet without being the thing he is selling, so 2x at $189
 * arrives as the sensible middle rather than as the opening ask. Most clients
 * start on 2x. 1x at $139 is there if 2x is a stretch. Online last.
 *
 * Nobody had ever paid a list price. Every paying client was on the 50% launch
 * rate or a negotiated one, and per session what they actually pay lands
 * between $68 and $75. The launch rate was the market price, so the list came
 * down to meet it. 3x is $225 because that is what Greg already pays for 3x.
 *
 * Must stay in step with COACHING_PACKAGES in `src/lib/coaching-packages.ts`,
 * which is what actually bills. This list is only what he reads on the call.
 */
export const PACKAGES = [
  { tier: 'In-Person 3x', price: '$225/week', desc: 'Three coached sessions per week. He OPENS here and says it is assessed, so it anchors the sheet without being the thing he sells.', coachAssessed: true },
  { tier: 'In-Person 2x', price: '$189/week', desc: 'Two coached sessions per week. Where most people actually start.', coachAssessed: false },
  { tier: 'In-Person 1x + self-led', price: '$139/week', desc: 'One coached session per week, you train independently the rest. Offered if 2x is a stretch.', coachAssessed: false },
  { tier: 'Online', price: '$69/week', desc: 'Same system, same interpretation, weekly check-ins and direct access, no in-person sessions.', coachAssessed: false },
] as const

export const COMMENCEMENT_FEE = '$297'

/**
 * Retired 26 Aug 2026. Half rate for the DURATION of the engagement meant the
 * discount never ended, so the book would have filled with permanently
 * half-price clients and the revenue ceiling halved with it. The list prices
 * came down instead, which is the honest version of the same thing.
 *
 * Kept as an export because the companion still has to tell him what to say if
 * a lead has heard about it, and because the clients already on it keep it.
 */
export const FOUNDING_OFFER = {
  headline: 'Founding rate: retired. Do not offer it.',
  blurb: 'The 50% launch rate is gone. The list prices came down instead, so there is nothing left to discount off. Anyone already on it keeps it for as long as they stay. If a lead has heard about it from someone, say it closed, and that the current rates are lower than the ones it was discounting.',
}

// ─── Coach drawer content ──────────────────────────────────────────────────

export const OBJECTION_HANDLING = {
  toneIndicator: 'Tone: Solution to resistance',
  when: 'Use only when pricing has been presented → price objection raised → objection handled → resistance remains.',
  steps: [
    {
      label: 'Step 1, Handle the objection',
      content: `They say: "That's a lot" / "It's too expensive" / "I can't justify that"

Repeat back: "Yeah, feels like a stretch right now. Got it."

"Here's how I'd look at it. You're not paying for the sessions. You're paying for me reading your body the whole time, loading it, recovering it, working out what's actually going on, adjusting. Most people don't have that at any price point.

The real question isn't whether it's expensive. It's whether what you've been doing has actually been working."

↳ Pause. Let them sit with it.
↳ If they move forward, Stage 4 decision panel, Path C (Full Rate).
↳ If price holds, move to Step 2.`,
    },
    {
      label: 'Step 2, Introduce Online',
      content: `"There's an online option. Same system, same weekly read, same direct access, just remote instead of face to face.

That's $69 a week. Same $297 to get started."

↳ If online works, Stage 4 decision panel, Path C (Online).
↳ If price still holds, non-enrolment is fine. Close cleanly.`,
    },
  ],
  boundary: 'No urgency. No discount framing. Do not re-offer after decline.',
}

export const ONLINE_SCRIPT = `"There's an online option, and it's not a lesser version. Same system, same weekly read, same coaching support. The only difference is we're not training together in person.

For some people that's actually the right fit, schedule, location, or just preference.

$69 a week. Same 12-week minimum. Same standards."`

// ─── Opening ───────────────────────────────────────────────────────────────

/**
 * Thank-you line, matched to how they actually arrived.
 *
 * "Thanks for reaching out" is wrong for most of the funnel. Someone who
 * clicked a cold ad, ran the free 14-day Challenge and then asked for a time
 * did not reach out, and greeting them as though they did skips two weeks of
 * their own effort. Added 2026-08-12.
 */
export type Arrival = 'challenge' | 'scorecard' | 'direct'

export const OPENING_THANKS: Record<Arrival, (firstName: string) => string> = {
  challenge: (n) => `Thanks for making the time, ${n}. You've just come off the 14 days, so you've already put work in before we've even spoken.`,
  scorecard: (n) => `Thanks for making the time, ${n}. You've done the scorecard, so you already know roughly where you're sitting.`,
  direct: (n) => `Thanks for reaching out, ${n}, and for making the time today.`,
}

export const OPENING_QUESTIONS = [
  'How did you come across Body Recode, and me?',
  'What was it about it that made you actually fill it in?',
] as const

export const OPENING_NOTE =
  'You already know the channel, it is on their lead page. Ask anyway. What they remember is not always what the tracking says, and the second question usually hands you the real reason they are here.'
