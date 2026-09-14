import type { Step } from './buildout-types'

/**
 * Rey's own build steps: the things only Rey needs.
 *
 * Rey is the consumer product built on the Body Recode read and the coaching
 * engine (spec: Dropbox 05_REY/2026-09-13_REY_Product_Specification_v2.0.md).
 * Most of what Rey depends on is NOT here, because it is shared work and
 * already lives on the read or engine manifests. Duplicating it here would let
 * the same step exist twice and disagree.
 *
 * This file is storage, not a board. The Build board (build-sequence.ts)
 * arranges these steps, together with the read and engine steps, into the
 * order they are actually built. Update a step's status HERE.
 *
 * Section numbers in notes refer to the Rey specification.
 *
 * Added 14 Sep 2026.
 */
export const REY_STEPS: Step[] = [
  /* ── Decided ─────────────────────────────────────────────── */
  {
    id: 'rey-origin-recovered',
    title: 'The 2024 origin recovered',
    description: 'The original November 2024 Rey concept reconstructed and filed, so the later narrowing is visible.',
    status: 'shipped',
    shippedAt: '2026-09-13',
    effort: 'S',
    surfaces: ['Dropbox 05_REY/2026-09-13_REY_Origin_Recovered_2024.md'],
    notes: 'A recollection reconstructed from ChatGPT context, not a primary document. Older business plans or specs from the WeThrive period may still exist elsewhere.',
  },
  {
    id: 'rey-spec',
    title: 'The product specification',
    description: 'The whole product decided: audience, pricing, the session, first run, the loop, when it goes wrong, the re-read and housekeeping.',
    status: 'shipped',
    shippedAt: '2026-09-14',
    effort: 'M',
    surfaces: ['Dropbox 05_REY/2026-09-13_REY_Product_Specification_v2.0.md'],
    notes: 'Supersedes the two April 2026 documents, which had Rey as a delivery layer. Rey is now the whole product. The spec grows by section and is never rewritten.',
  },

  /* ── Stage 1: Rey on the web ─────────────────────────────── */
  {
    id: 'rey-consumer-read',
    title: 'The consumer read',
    description: 'The read written for her rather than for a coach. Same classification, same constraints, different writing.',
    status: 'planned',
    effort: 'L',
    notes: 'Kade\'s work, with writing support. Not a translation job: the existing read assumes the reader knows the doctrine. Keeps the two sections that define the product, what this does not mean and what is most commonly misread. Spec 4.3.',
  },
  {
    id: 'rey-progressive-intake',
    title: 'Progressive intake',
    description: '30 to 40 questions up front for a defensible read in about fifteen minutes, the rest asked by Rey across her first weeks.',
    status: 'planned',
    effort: 'M',
    blockedBy: 'minimum-question-set',
    notes: 'Decided 14 Sep. The read deepens the longer she stays, which turns data collection into retention. Blocked on choosing the question set, which is doctrinal. Spec 11.7.',
  },
  {
    id: 'rey-signup-subscription',
    title: 'Signup, trial and subscription',
    description: 'Seven-day trial with a card upfront, $199 a year or $29 a month chosen at signup, a reminder on day five.',
    status: 'planned',
    effort: 'M',
    notes: 'On the WEB, not in the app, so the subscription stays outside the app stores (Apple takes 15 to 30 percent). The app is only for training. Spec 3 and 11.1 to 11.2.',
  },
  {
    id: 'rey-plan-on-screen',
    title: 'Training and nutrition guidance on screen',
    description: 'Her plan shown on screen, with nutrition as targets and direction rather than a menu.',
    status: 'planned',
    effort: 'M',
    notes: 'Voice is for talking about the plan, not narrating it. Full meal plans sit behind an evidence gate (see Later). Spec 4.6.',
  },
  {
    id: 'rey-weekly-checkin',
    title: 'Weekly check-in',
    description: 'A short check-in on a day she chooses. Typed on the web first, voice when the app exists.',
    status: 'planned',
    effort: 'S',
    notes: 'Mostly built for coaching clients. She never logs a meal: one question, roughly on plan, a bit off, or off the rails. Spec 12.1 and 12.3.',
  },
  {
    id: 'rey-progress-view',
    title: 'What progress she sees',
    description: 'Sleep, readiness, symptoms, strength and measurements lead. Scale weight available, never the headline.',
    status: 'planned',
    effort: 'M',
    notes: 'For a woman in perimenopause the scale is the most misleading number she owns and the one most likely to make her quit. Spec 12.4.',
  },
  {
    id: 'rey-reread-moment',
    title: 'The re-read as a moment',
    description: 'Flagged a week ahead, a ten-minute re-ask, and a read with a before and after.',
    status: 'planned',
    effort: 'M',
    blockedBy: 'reread-generator',
    notes: 'Says what did NOT move as well as what did. Week 48 for annual subscribers is the story of her year, four weeks before renewal. Spec 14.',
  },
  {
    id: 'rey-consent-privacy',
    title: 'Tiered consent and the privacy policy',
    description: 'Run and improve Rey required; research and trial invitations her choice; her data never sold.',
    status: 'planned',
    effort: 'M',
    notes: 'A lawyer reviews it before launch. Consent cannot be retrofitted onto existing users, so this must be right on day one. Includes the clause that data moves with the business under the same promises if it is acquired. Spec 15.4 to 15.6.',
  },
  {
    id: 'rey-coachless-position',
    title: 'The position on running with no coach',
    description: 'A formal clinical and liability position, and insurance, for a product where nobody reviews what Rey tells her.',
    status: 'planned',
    effort: 'M',
    notes: 'A lawyer\'s work. Required before anyone pays.',
  },
  {
    id: 'rey-cancel-pause-delete',
    title: 'Cancel, refund, pause and delete',
    description: 'One-tap cancel, fourteen-day annual refund, pause for up to three months, download and delete everything.',
    status: 'planned',
    effort: 'S',
    notes: 'Pregnancy pauses her subscription at no cost. Spec 13.6, 13.8, 15.1 to 15.3.',
  },
  {
    id: 'rey-name-voice',
    title: 'Rey\'s name and voice',
    description: 'The actual name and the actual voice. Female, warm but direct is already decided.',
    status: 'planned',
    effort: 'S',
    notes: 'Brand decision, Kade\'s call. Governs every line Rey says. Spec 10.1.',
  },

  /* ── Stage 2: Rey in her ear ─────────────────────────────── */
  {
    id: 'rey-phone-app',
    title: 'The phone app',
    description: 'A real app, because headphone audio that keeps playing with the screen off cannot be a website.',
    status: 'planned',
    effort: 'L',
    notes: 'New territory. She signs in with the account created on the web.',
  },
  {
    id: 'rey-voice',
    title: 'Real-time voice',
    description: 'Speech in, understanding, speech out, fast enough to feel like a conversation in a noisy gym.',
    status: 'planned',
    effort: 'L',
    notes: 'The genuinely new capability. Making a working version is within reach; making it good under interruptions, gym noise and a phone in a pocket is where the effort goes. Spec 6.',
  },
  {
    id: 'rey-session-flow',
    title: 'The guided session',
    description: 'Warm-up, each exercise introduced with one cue, tempo called, effort asked as easy, about right or hard, rest timed, logged from the conversation.',
    status: 'planned',
    effort: 'M',
    notes: 'Rey paces tempo rather than counting reps, because it cannot see her. Spec 10.5 to 10.10.',
  },
  {
    id: 'rey-override-rules',
    title: 'When she can overrule Rey',
    description: 'Amber: yes, with a warning. Red: no, and Rey explains why. Pain stops the exercise immediately.',
    status: 'planned',
    effort: 'S',
    blockedBy: 'session-readiness-adapts',
    notes: 'A prescribed rest day counts as completing the plan and never breaks a streak. Spec 10.4, 10.7 and 10.8.',
  },
  {
    id: 'rey-music-ducking',
    title: 'Music ducking',
    description: 'Her music lowers when Rey speaks and comes back afterwards, across her own music apps.',
    status: 'planned',
    effort: 'M',
    notes: 'Critical and easy to overlook. If she has to choose between her playlist and her coach, she chooses the playlist. Spec 10.11.',
  },
  {
    id: 'rey-offline-sessions',
    title: 'Offline sessions',
    description: 'The session downloads before it starts and runs with no signal, syncing afterwards.',
    status: 'planned',
    effort: 'M',
    notes: 'Gyms have poor signal. A coach that goes silent mid-set is worse than none. Spec 10.2.',
  },
  {
    id: 'rey-talk-level',
    title: 'Talking level',
    description: 'Chatty, focused or minimal.',
    status: 'planned',
    effort: 'S',
    notes: 'Settles an argument that would otherwise lose half the users either way. Spec 10.11.',
  },
  {
    id: 'rey-first-refusal',
    title: 'The first refusal, planned into week one',
    description: 'Her first week is shaped so she experiences Rey holding a genuine line.',
    status: 'planned',
    effort: 'S',
    notes: 'Must be a real limit her read supports, never invented to make a point. If her first week is all green days she never discovers what makes Rey different. Spec 11.5.',
  },
  {
    id: 'rey-injury-disclosure',
    title: 'Something\'s hurting, one tap away',
    description: 'Reporting pain is the easiest action in the app, and it means adjusting, not stopping everything.',
    status: 'planned',
    effort: 'S',
    blockedBy: 'session-soreness-triage',
    notes: 'Rey cannot see her. If telling Rey feels like it will cost her a month, she will hide it. Anything significant pauses that area and sends her to a physiotherapist or GP. Rey is not a rehabilitation tool. Spec 13.3.',
  },
  {
    id: 'rey-distress-tested',
    title: 'Distress response, tested',
    description: 'Rey recognises distress, suggests her GP for low mood, and gives Lifeline 13 11 14 or 000 in a crisis.',
    status: 'planned',
    effort: 'M',
    notes: 'A responsibility, not a feature. Rey never counsels or diagnoses. Must be proven to work before launch, not assumed. Spec 13.9.',
  },

  /* ── Stage 3: the loop gets smart ────────────────────────── */
  {
    id: 'rey-between-sessions',
    title: 'Rey answers from her read, any time',
    description: 'She asks why she is so tired at nine at night, and Rey answers from her read rather than from the internet.',
    status: 'planned',
    effort: 'L',
    notes: 'The capability no competitor can offer, because none has a read to answer from. When a question is outside her read or belongs with a clinician, Rey says so. Spec 12.7.',
  },
  {
    id: 'rey-notices',
    title: 'Rey notices things',
    description: 'Small weekly observations drawn from her own record.',
    status: 'planned',
    effort: 'M',
    notes: 'Every observation must be real. An invented pattern damages trust in the read itself. Spec 12.8 and 12.9.',
  },
  {
    id: 'rey-rest-day-check',
    title: 'Rest-day voice check: sleep, flushes, mood',
    description: 'An optional twenty-second check on rest days. Where cycle and symptom tracking lives.',
    status: 'planned',
    effort: 'S',
    notes: 'Captures the most valuable signal in the product without feeling like tracking. Spec 12.2.',
  },
  {
    id: 'rey-notifications',
    title: 'Notifications about her body, never engagement',
    description: 'A reminder she set, the weekly check-in, and genuine observations. Nothing else.',
    status: 'planned',
    effort: 'S',
    notes: 'Never "don\'t break your streak". Spec 12.5.',
  },
  {
    id: 'rey-bloodwork',
    title: 'Bloodwork into the read',
    description: 'She photographs a pathology report and the read incorporates it.',
    status: 'planned',
    effort: 'M',
    notes: 'A large differentiator, and the clearest justification for the price over an algorithm. Blood panel handling already exists in the coaching product; porting it is the work.',
  },
  {
    id: 'rey-clinician-access',
    title: 'Her GP or physio can see her read',
    description: 'Read-only access for a period she chooses, expiring automatically.',
    status: 'planned',
    effort: 'S',
    notes: 'She walks into an appointment with a document. The quiet bridge to practitioners without selling to them. Spec 15.10.',
  },

  /* ── Later ───────────────────────────────────────────────── */
  {
    id: 'rey-full-meal-plans',
    title: 'Full meal plans, behind the evidence gate',
    description: 'Twenty-one meals with swaps and per-meal detail.',
    status: 'deferred',
    effort: 'L',
    notes: 'Ships when the nutrition engine runs clean for real people without correction: a run of consecutive plans that would have been signed off unchanged. A condition, not a date. Under-eating is the most common harm in exactly this audience. Spec 7.4.',
  },
  {
    id: 'rey-audience-b',
    title: 'Widen to busy professionals of both sexes',
    description: 'The second audience, once the first is working.',
    status: 'deferred',
    effort: 'M',
    notes: 'A for the marketing, both in the build, B when A works. Realistically around a thousand subscribers. Spec 2.',
  },
  {
    id: 'rey-gym-portability',
    title: 'Her read follows her into any gym',
    description: 'The intelligence belongs to her profile, not to the facility.',
    status: 'deferred',
    effort: 'L',
    notes: 'The strongest idea in the 2024 origin work, and the consumer mirror of the platform strategy. Not version one. Spec 9.',
  },
]
