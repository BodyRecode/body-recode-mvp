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
    1: 'Energy is significantly depleted — relying on caffeine, crashing through the day. Core signal that the body is running on reserves.',
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
    2: 'Stress is moderate — has an ongoing background effect.',
    3: 'Stress load is low to moderate. Not a significant driver in the current picture.',
  },
  '04': {
    1: 'Training response has stalled or regressed. Classic depletion-state pattern.',
    2: 'Training response is inconsistent. Hit and miss.',
    3: 'Training response is good — getting stronger, fitter, recovering between sessions.',
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
    opening: 'Their scorecard came back as Depleted State. Body is in protection mode — cortisol elevated, metabolism suppressed, fat loss and performance shut down. The scorecard surfaced the signal. The call is about understanding what\'s driving it.',
    // Spoken to the lead. Plain, direct.
    interpretation: 'What you\'re seeing isn\'t an effort or willpower thing — your body\'s protecting itself. When you\'re running on poor sleep, high stress, and training that isn\'t paying off, your body shifts into preservation mode. The fact that fat loss has stalled and training feels harder than it should — those are two sides of the same thing.',
    pattern: 'Depleted State: body in protection mode. Cortisol up, metabolism down. Adding more training stimulus makes it worse. The fix is smarter management, not harder work.',
  },
  'Transitioning State': {
    colour: 'text-amber-700 border-amber-200 bg-amber-50',
    badge: 'bg-amber-400',
    opening: 'Their scorecard came back as Transitioning State. They\'ve got capacity but something\'s blocking consistent response. Sleep, stress, recovery rhythm, or a mismatch between training load and where their body is right now. Call is about identifying which.',
    interpretation: 'You\'ve got the capacity — you\'re just not consistently expressing it. Some weeks things click, other weeks they don\'t. That inconsistency is the actual issue. Usually it\'s one or two things holding the rest of it back.',
    pattern: 'Transitioning State: capacity is there, consistency isn\'t. Usually one or two sections dragging the picture. Identify the specific drivers and address them in order.',
  },
  'Ready State': {
    colour: 'text-blue-500 border-blue-500/30 bg-blue-500/10',
    badge: 'bg-blue-500',
    opening: 'Their scorecard came back as Ready State. Foundations are in place. If results aren\'t happening at this score, it\'s a prescription problem — the what and how of training and nutrition, not the foundation.',
    interpretation: 'You\'ve got the foundations — energy, sleep, stress, recovery are all in the right place. So when results aren\'t happening, it\'s not a foundation issue. It\'s the training or the nutrition approach not matching where you actually are.',
    pattern: 'Ready State: foundations solid. If results aren\'t happening, it\'s the prescription. Focus on the training and nutrition approach.',
  },
}

// ─── How The System Works (mirrors performance.bodyrecode.au/how-it-works) ─

export const HOW_IT_WORKS_STAGES = [
  {
    number: '01',
    title: 'Biological Intake',
    subtitle: '221 Data Points',
    body: 'The system begins with a structured biological intake across eight signal domains. 221 data points in total. Nothing is assumed. Nothing is filled in from a template.',
    chips: ['Training History', 'Nutrition History', 'Metabolic Indicators', 'Hormonal Signals', 'Recovery Patterns', 'Stress Markers', 'Sleep Quality', 'Body Composition'],
    coachScript: '"First thing you do is the foundational intake. 221 questions across eight areas. This is what gives me the data to read what\'s actually going on with your body — not from a template, from you."',
  },
  {
    number: '02',
    title: 'Where it shows up',
    subtitle: 'Four location-plus-signal pairs',
    body: 'Your body shows biological load in four ways. Where you carry it narrows it down, but three of the four push fat to the same place, so the signal that comes with it is what actually decides.',
    zones: [
      { dot: 'red',    region: 'Front of the middle, while arms and legs stay lean', driver: 'Stress and cortisol' },
      { dot: 'amber',  region: 'Mid-back, lower back and love handles, front spared', driver: 'Insulin, with an afternoon crash' },
      { dot: 'purple', region: 'Hips, glutes and thighs, or moving to the middle',    driver: 'Oestrogen' },
      { dot: 'cyan',   region: 'Middle filling while muscle and drive fall',          driver: 'Androgen' },
    ],
    coachScript: '"Your body shows this in four ways. Front of your middle while your arms and legs stay lean \u2014 that\'s stress. Back and sides, mid-back and love handles, with the front spared \u2014 that\'s insulin, and the two to four o\'clock crash tells you the same thing. Hips and thighs, or it starting to move to your middle \u2014 that\'s oestrogen. Middle filling while muscle and drive drop off \u2014 that\'s androgen. Where you carry it narrows it down. The signal that comes with it is what decides."',
  },
  {
    number: '03',
    title: 'What type of body',
    subtitle: 'Four biological profiles',
    body: 'Your scorecard already pointed at one of these. It is a provisional read from a handful of answers. The intake is what confirms it or moves it, because each one needs a materially different approach.',
    pieces: [
      { name: 'Stress-Stored', desc: 'Managing a lot, holding on. The harder you push, the tighter the body holds.' },
      { name: 'Estrogen-Shift', desc: 'Body has changed. What used to work doesn\'t anymore. Distribution and recovery feel different.' },
      { name: 'Insulin-Drift', desc: 'Energy is inconsistent. Eating well but feeling flat. Body partitioning energy differently than it used to.' },
      { name: 'Androgen-Decline', desc: 'Response has dropped off. Muscle harder to hold, recovery slower than it used to be.' },
    ],
    coachScript: '"Your scorecard already put you in one of these four \u2014 that\'s what it pointed at, off a handful of answers. Your intake is what confirms it or moves it, because 221 questions tells me a lot more than five does. Once it\'s confirmed it sets the rules for everything I do with you."',
    bridge: 'Two reads of the same body. Where the load is showing narrows it down. The signal that comes with it decides which driver it is. Both feed into how I write your training and nutrition — neither alone gives the full picture, which is exactly why the scorecard read stays provisional until the intake.',
  },
  {
    number: '04',
    title: 'Execution',
    subtitle: 'Program · Nutrition · Synthesis · Portal',
    body: 'With the read in place, execution begins. Training, nutrition, and weekly check-in synthesis are all delivered through your client portal. Live from day one.',
    pieces: [
      { name: 'Training Program', desc: 'Load, volume and modality derived from your read — not a template' },
      { name: 'Nutrition Structure', desc: 'Built around your biological profile, adjusted as state shifts' },
      { name: 'Weekly Check-In', desc: 'Structured data capture produces the CFWS in real time' },
      { name: 'Client Portal', desc: 'Program, plan, synthesis docs and check-in history in one place' },
    ],
    coachScript: '"Everything lives in your portal — training program, nutrition, weekly check-ins. All in one place. All driven by your read."',
  },
  {
    number: '05',
    title: 'The Continuous Loop',
    subtitle: 'CFFS + CFWS in parallel',
    body: 'Two documents run in parallel the whole way through: the CFFS — the foundation that doesn\'t change — and the CFWS, your weekly read. I produce a fresh CFWS every week, capturing how your body\'s responding to what we\'ve applied.',
    coachScript: '"Once we\'re going we\'re in a continuous cycle — I read, I adjust, I read again. Every week I do what\'s called a CFWS — your weekly read on how your body\'s responding to what we\'ve applied. That feeds my next adjustment. It\'s not a static plan, it adapts as your body adapts."',
  },
] as const

// ─── Pricing & Packages ────────────────────────────────────────────────────

export const WHATS_INCLUDED = [
  'Foundational intake and CFFS — your biological read',
  'Training program written from your data, not a template',
  'Nutrition structure built around your profile',
  'Weekly check-in and CFWS — your weekly read on how your body\'s responding',
  'Direct access between sessions',
  'Two coached sessions per week (in-person packages)',
] as const

export const PACKAGES = [
  { tier: 'In-Person 2x', price: '$299/week', founding: '$149.50/week', desc: 'Two coached sessions per week. The default starting structure.', coachAssessed: false, stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00', stripeFounding: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05' },
  { tier: 'In-Person 3x', price: '$409/week', founding: '$204.50/week', desc: 'Three coached sessions per week. Offered when schedule and capacity allow.', coachAssessed: true, stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03', stripeFounding: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06' },
  { tier: 'In-Person 1x + self-led', price: '$199/week', founding: '$99.50/week', desc: 'One coached session per week, you train independently the rest. For clients who already train consistently on their own.', coachAssessed: true, stripe: 'https://buy.stripe.com/eVq5kFeng0yO6ID7tl5ZC0a', stripeFounding: 'https://buy.stripe.com/bJefZj0wqdlA3wrbJB5ZC0b' },
  { tier: 'Online', price: '$149/week', founding: '$74.50/week', desc: 'Same system, same interpretation, weekly check-ins and direct access — no in-person sessions.', coachAssessed: false, stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02', stripeFounding: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04' },
] as const

export const COMMENCEMENT_FEE = '$297'

export const FOUNDING_OFFER = {
  headline: 'Founding Client Offer · First 20 clients · 50% off',
  blurb: 'Half rate for the duration of their engagement. No agreement, no extra requirement — same coaching, half the fee. Mention only after the standard pricing has landed, or when relevant to the conversation.',
}

// ─── Coach drawer content ──────────────────────────────────────────────────

export const OBJECTION_HANDLING = {
  toneIndicator: 'Tone: Solution to resistance',
  when: 'Use only when pricing has been presented → price objection raised → objection handled → resistance remains.',
  steps: [
    {
      label: 'Step 1 — Handle the objection',
      content: `They say: "That's a lot" / "It's too expensive" / "I can't justify that"

Repeat back: "Yeah — feels like a stretch right now. Got it."

"Here's how I'd look at it. You're not paying for two sessions a week. You're paying for me reading your body the whole time — loading it, recovering it, working out what's actually going on, adjusting. Most people don't have that at any price point.

The real question isn't whether it's expensive. It's whether what you've been doing has actually been working."

↳ Pause. Let them sit with it.
↳ If they move forward — Stage 4 decision panel, Path C (Full Rate).
↳ If price holds — move to Step 2.`,
    },
    {
      label: 'Step 2 — Introduce Online',
      content: `"There's an online option. Same system, same weekly read, same direct access — just remote instead of face to face.

That's $149 a week. Same $297 to get started."

↳ If online works — Stage 4 decision panel, Path C (Online).
↳ If price still holds — non-enrolment is fine. Close cleanly.`,
    },
  ],
  boundary: 'No urgency. No discount framing. Do not re-offer after decline.',
}

export const ONLINE_SCRIPT = `"There's an online option — and it's not a lesser version. Same system, same weekly read, same coaching support. The only difference is we're not training together in person.

For some people that's actually the right fit — schedule, location, or just preference.

$149 a week. Same 12-week minimum. Same standards."`
