import type { Phase, Step } from './buildout-types'
import { PHASES as READ_PHASES } from './saas-buildout-manifest'
import { PHASES as ENGINE_PHASES } from './performance-coaching-buildout-manifest'
import { REY_STEPS } from './rey-buildout-manifest'

/**
 * THE BUILD BOARD. One order for everything, instead of three boards.
 *
 * Decided 14 Sep 2026. Three separate boards (the read, the coaching engine,
 * Rey) meant three percentages and three "next up"s for one person building
 * one engine. This file is the single build order.
 *
 * It does NOT hold any step. Every step is written down exactly once, in the
 * file for the part of the system it belongs to:
 *   - saas-buildout-manifest.ts                 the Body Recode read
 *   - performance-coaching-buildout-manifest.ts the coaching engine
 *   - rey-buildout-manifest.ts                  Rey's own delivery
 * This file only ARRANGES those steps by id into stages, and labels which
 * products each one serves. To change a status, edit the source file. A step
 * therefore cannot exist twice, and cannot be done on one board and open on
 * another.
 *
 * Two guards keep it honest, and both render on the board rather than failing
 * silently:
 *   - UNSORTED: a step added to a source file but never placed here, or parked,
 *     appears at the top until someone decides where it goes. A new step can
 *     never quietly vanish from the build order.
 *   - MISSING: an id placed here that no longer exists in any source file
 *     appears as a blocked placeholder naming the id.
 */

export type Product = 'Rey' | 'Read' | 'Coaching'

type Placement = { id: string; tags: Product[] }

type Stage = {
  label: string
  title: string
  description: string
  longDescription: string[]
  steps: Placement[]
}

const ALL: Product[] = ['Rey', 'Read', 'Coaching']
const at = (tags: Product[], ...ids: string[]): Placement[] => ids.map((id) => ({ id, tags }))

/* ─────────────────────────────────────────────────────────────
 * THE SEQUENCE
 * ───────────────────────────────────────────────────────────── */

const STAGES: Stage[] = [
  {
    label: 'Already built',
    title: 'What everything stands on',
    description: 'The parts of the read and the engine that are done, verified against the code, and on the path.',
    longDescription: [
      'Not a stage of work. The finished foundation that every later stage depends on, shown so that what is done is visible in one place.',
      'The engine pieces were audited against the code on 14 Sep 2026. Anything the auto-memory claimed but the code did not support was left out and corrected.',
    ],
    steps: [
      ...at(['Rey', 'Read'], 'read-internal-entrypoint', 'read-takes-answers-directly', 'input-cycle-phase', 'input-hormonal-status', 'progress-check-collection', 'reread-trigger-hole', 'reread-time-trigger'),
      ...at(['Rey', 'Coaching'], 'engine-program-generation', 'engine-set-ceiling-clamp', 'engine-block-brief-wired', 'engine-recovery-soft-gate', 'engine-nutrition-validation', 'engine-supplements-attached', 'engine-workout-logging', 'engine-effort-creep', 'engine-progress-read'),
      ...at(['Rey'], 'rey-origin-recovered', 'rey-spec'),
    ],
  },
  {
    label: 'Stage 0 · Engine',
    title: 'The engine runs without Kade',
    description: 'Everything that currently depends on a coach reviewing, deciding or judging, plus the reliability a coach used to provide by noticing. Required before anyone pays.',
    longDescription: [
      'The engine was built to help a coach, not to replace one. Every plan is reviewed by Kade, every next block is built when Kade decides, and progress happens when Kade judges it. Rey removes Kade entirely.',
      'The auto-memory already names the core of this as the single biggest thing blocking licensing: the doctrine lives in the written instructions to the model, and almost nothing in code checks the output obeys it.',
      'Kade was also the engine\'s test suite. Faults were found because he logged real sessions and read every plan. The regression tests, the model-change test set and the hardened AI calls replace that noticing. None of this is Rey-only; it serves every product.',
    ],
    steps: [
      ...at(ALL, 'solo-doctrine-checked-in-code', 'engine-nutrition-revise', 'solo-regression-tests', 'solo-ai-call-hardening', 'solo-model-change-evaluation'),
      ...at(ALL, 'solo-next-block-auto', 'solo-progression', 'solo-equipment-programming', 'reread-generator', 'solo-cost-at-scale'),
    ],
  },
  {
    label: 'Stage 0 · Company',
    title: 'The company, the name and the records',
    description: 'Not development work, blocked by nothing, and slow. Runs alongside the engine work from now.',
    longDescription: [
      'A name takes months to register whenever it is started, so parking it costs those months for nothing. Customer contracts, data processing terms and insurance need a company to sit with, and an investor or acquirer checks that the business accounts and the intellectual property belong to it.',
      'The research and development records start now because the 43.5% refund is only as strong as records written at the time the work happens.',
    ],
    steps: [
      ...at(ALL, 'oliver-question-zero', 'incorporate', 'head-licence', 'company-accounts-transfer', 'trade-marks', 'rd-records'),
    ],
  },
  {
    label: 'Stage 1 · Name and demand',
    title: 'Prove the name is available and the price sells',
    description: 'Before building Stage 1: is "Rey" free to use, what is the brand, and will this woman pay $199 a year.',
    longDescription: [
      'The cheapest steps on the board and the ones that can save the most. A trade mark conflict found after the app, domain and marketing are built is expensive. A price nobody clicks, found after Stage 1 is built, is more expensive still.',
      'The price test can start today against the audience already held, in parallel with Stage 0.',
    ],
    steps: [
      ...at(['Rey'], 'rey-price-test', 'rey-trade-mark', 'rey-brand-decision', 'rey-landing-site'),
    ],
  },
  {
    label: 'Stage 1 · Product',
    title: 'Rey on the web',
    description: 'The first thing she can pay for: an account, her read, her plan, the first week, the weekly check-in and the re-read. No voice yet.',
    longDescription: [
      'Everything the Rey specification places on the web rather than in the app. Much of it already exists as the coaching portal, pointed at a consumer instead of a client.',
      'It tests the question that matters most, whether women will pay $199 a year for the read and the loop, before months are spent on voice. The read is the differentiator; voice is how Rey delivers it.',
      'Blocked more by doctrine than by code: choosing the 30 to 40 questions, and writing the read for her rather than for a coach. Both are Kade\'s work.',
    ],
    steps: [
      ...at(['Rey', 'Read'], 'minimum-question-set'),
      ...at(['Rey'], 'rey-consumer-read', 'rey-name-voice'),
      ...at(['Rey'], 'rey-consumer-accounts', 'rey-progressive-intake', 'rey-signup-subscription', 'rey-first-week', 'rey-starting-from-zero', 'rey-plan-on-screen', 'rey-weekly-checkin', 'rey-progress-view', 'rey-journey-edges'),
      ...at(['Rey', 'Read'], 'reread-outputs-changes'),
      ...at(['Rey'], 'rey-reread-moment', 'rey-cancel-pause-delete'),
      ...at(['Rey', 'Read'], 'reread-pause-on-freeze'),
      ...at(['Rey'], 'rey-support', 'rey-accessibility', 'rey-metrics'),
      ...at(['Rey', 'Read'], 'evidence-did-the-read-land', 'evidence-client-retention'),
    ],
  },
  {
    label: 'Stage 1 · Clinical safety',
    title: 'Safe with nobody watching',
    description: 'The screening and governance a coach provides by judgement, made explicit, before any woman pays.',
    longDescription: [
      'In the coaching practice Kade screens every client, reads every plan and notices when something is wrong. Rey has no Kade, so each of those judgements has to become a step: who Rey must not program for, who must not receive nutrition targets, and what happens when Rey gets it wrong.',
      'Pre-exercise screening is probably the single most important liability control in the product. An independent clinician reviewing the doctrine is what makes the rest credible.',
    ],
    steps: [
      ...at(ALL, 'rey-clinical-advisor', 'rey-pre-exercise-screening', 'rey-pregnancy-screen', 'rey-disordered-eating-screen', 'rey-medication-handling', 'rey-adverse-events'),
    ],
  },
  {
    label: 'Stage 1 · Legal, privacy and tax',
    title: 'Allowed to sell it',
    description: 'Medical device status, claims, terms, privacy, health data sent overseas, automated decisions, liability, insurance and GST.',
    longDescription: [
      'The first step decides much of the rest. The TGA regulates software that diagnoses or guides treatment of a condition as a medical device. Wellness software and coaching software are excluded, but only while they make no claims about a disease or condition, and every function must qualify for the whole product to stay excluded. Get that opinion before building the functions that test it, and keep every word inside it.',
      'Privacy obligations apply regardless of the size of the business, because a business providing a health service and holding health information is not covered by the small business exemption. From 10 December 2026, privacy policies must also describe automated decisions that significantly affect people.',
      'Most of these steps are a lawyer\'s or an accountant\'s work. None can be skipped by building faster.',
    ],
    steps: [
      ...at(ALL, 'rey-tga-samd-position', 'rey-claims-language'),
      ...at(['Rey'], 'rey-terms-of-service', 'rey-consent-privacy'),
      ...at(ALL, 'health-data-position', 'rey-privacy-cross-border', 'rey-automated-decisions-disclosure', 'rey-state-health-records'),
      ...at(['Rey'], 'rey-ai-disclosure'),
      ...at(ALL, 'rey-spam-compliance'),
      ...at(['Rey'], 'rey-coachless-position'),
      ...at(ALL, 'rey-insurance', 'rey-gst-tax'),
    ],
  },
  {
    label: 'Stage 1 · Security',
    title: 'Safe to hold health information from strangers',
    description: 'What the system does to protect health information once the public, not twelve known clients, can sign up.',
    longDescription: [
      'The coaching practice holds twelve clients whom Kade knows, and only Kade can start a read. Open public signup changes the exposure: strangers store health information, and anyone, or any script, can trigger work that costs money.',
      'The penetration test comes last deliberately, so it finds what the earlier steps missed.',
    ],
    steps: [
      ...at(ALL, 'security-subprocessor-register', 'security-route-guard-audit', 'security-access-control', 'security-access-logging', 'security-encryption-verified', 'security-backups-restore', 'security-monitoring', 'security-ai-abuse-limits', 'security-retention-deletion', 'security-breach-process', 'security-pen-test'),
    ],
  },
  {
    label: 'Stage 2',
    title: 'Rey in her ear',
    description: 'The phone app and the voice-guided session. The part that feels like nothing else.',
    longDescription: [
      'Built on top of something already earning and already retaining, rather than as a bet before anyone has paid.',
      'The engine capabilities come first in this stage, because the voice session is only as safe as what sits underneath it: today\'s session changing with her readiness, the soreness triage written as doctrine, and the system choosing a safe swap.',
    ],
    steps: [
      ...at(['Rey', 'Coaching'], 'session-readiness-adapts', 'session-soreness-triage', 'session-system-swap'),
      ...at(['Rey'], 'rey-phone-app', 'rey-app-store-compliance', 'rey-voice', 'rey-voice-data-policy', 'rey-session-flow', 'rey-exercise-content', 'rey-override-rules', 'rey-injury-disclosure', 'rey-music-ducking', 'rey-offline-sessions', 'rey-talk-level', 'rey-first-refusal', 'rey-distress-tested', 'security-prompt-injection'),
    ],
  },
  {
    label: 'Stage 3',
    title: 'The loop gets smart',
    description: 'Rey between sessions, noticing things, symptom check-ins, bloodwork, and her read shared with a clinician.',
    longDescription: [
      'What makes her feel the absence of Rey if she cancelled. The capability no competitor can offer is here: Rey answering from her own read at any hour, rather than from the internet.',
    ],
    steps: [
      ...at(['Rey'], 'rey-between-sessions', 'rey-notices', 'rey-rest-day-check', 'rey-notifications'),
      ...at(['Rey', 'Read'], 'evidence-adherence-delta', 'evidence-view'),
      ...at(['Rey'], 'rey-bloodwork', 'rey-clinician-access'),
    ],
  },
  {
    label: 'Stage 4',
    title: 'The engine\'s second customer',
    description: 'The coach\'s own screen, a studio owner account, and other companies\' software. Only once coaches show they want it.',
    longDescription: [
      'Rey is the engine\'s first customer. A coach, a club or another platform is simply another customer of the same engine, so none of this is a rebuild when its time comes.',
      'Deprioritised 14 Sep 2026. The read has never been offered to a coach, so there is no evidence yet that coaches want it. Door 1, other companies\' software, conflicts with Rey: a platform whose customers are coaches will not embed technology from the company building the app that replaces those coaches for many of their clients. Do not sign an exclusive platform deal while Rey is the direction.',
    ],
    steps: [
      ...at(['Read', 'Coaching'], 'read-usable-by-stranger', 'coach-screen', 'door2-support-surface', 'door2-interpretation-copilot', 'first-outside-coach', 'evidence-multi-coach', 'security-tenant-isolation-proof', 'security-questionnaire-pack'),
      ...at(['Read'], 'external-access', 'ongoing-data-source', 'presentation-split'),
    ],
  },
  {
    label: 'Later',
    title: 'Worth building, not yet',
    description: 'Wearables, machine measurements, extra inputs, full meal plans, the second audience, and a read that follows her into any gym.',
    longDescription: [
      'Real work with a real case, deliberately after the stages above. Full meal plans are gated on evidence rather than scheduled.',
    ],
    steps: [
      ...at(['Rey', 'Read'], 'watch-data-slot'),
      ...at(['Rey'], 'rey-full-meal-plans', 'rey-audience-b', 'rey-gym-portability'),
      ...at(['Read'], 'measurement-list-model', 'measurement-typed-entry', 'measurement-document-extract', 'measurement-competence-doctrine', 'measurement-plausibility-trust', 'measurement-typing-input', 'measurement-in-reread', 'measurement-partner-integration'),
      ...at(['Read'], 'input-apnoea-screen', 'input-grip-strength', 'input-bp-resting-hr', 'input-measured-rmr', 'input-cgm', 'input-salivary-cortisol'),
    ],
  },
]

/* ─────────────────────────────────────────────────────────────
 * PARKED: real work that is not on this path.
 *
 * Mostly the plumbing for other coaches running the whole coaching product
 * under their own brand (the Collective). It is kept, with its history, on the
 * two older boards, and excluded from this board's progress.
 * ───────────────────────────────────────────────────────────── */

const PARKED_ENGINE_PHASES = [
  'Decide & verify',
  'Pilot-ready (hand-gloved)',
  'Product-ready',
  'Billing',
  'Scale & doctrine mode B',
  'Coach Co-Pilot',
  'Operator Console',
]
const PARKED_IDS = ['product-tier-gating']

/* ─────────────────────────────────────────────────────────────
 * ASSEMBLY
 * ───────────────────────────────────────────────────────────── */

type Source = 'read' | 'engine' | 'rey'

function buildRegistry() {
  const registry = new Map<string, { step: Step; source: Source }>()
  const duplicates: string[] = []
  const add = (step: Step, source: Source) => {
    if (registry.has(step.id)) duplicates.push(step.id)
    else registry.set(step.id, { step, source })
  }
  for (const p of READ_PHASES) for (const s of p.steps) add(s, 'read')
  for (const p of ENGINE_PHASES) for (const s of p.steps) add(s, 'engine')
  for (const s of REY_STEPS) add(s, 'rey')
  return { registry, duplicates }
}

const DEFAULT_TAGS: Record<Source, Product[]> = { read: ['Read'], engine: ['Coaching'], rey: ['Rey'] }

function assemble() {
  const { registry, duplicates } = buildRegistry()

  const parked = new Set<string>(PARKED_IDS)
  for (const p of ENGINE_PHASES) {
    if (PARKED_ENGINE_PHASES.includes(p.title)) for (const s of p.steps) parked.add(s.id)
  }

  const placed = new Set<string>()
  const missing: string[] = []

  const phases: Phase[] = STAGES.map((stage) => ({
    id: 0,
    order: 0,
    label: stage.label,
    title: stage.title,
    description: stage.description,
    longDescription: stage.longDescription,
    steps: stage.steps.map(({ id, tags }) => {
      placed.add(id)
      const hit = registry.get(id)
      if (!hit) {
        missing.push(id)
        return {
          id,
          title: `Missing step: ${id}`,
          description: 'This id is placed on the Build board but no longer exists in any source file.',
          status: 'blocked' as const,
          effort: 'S' as const,
          notes: 'It was probably renamed or removed. Find it in the read, engine or Rey manifest and correct the id in build-sequence.ts.',
          tags,
        }
      }
      return { ...hit.step, tags }
    }),
  }))

  const unsorted = [...registry.entries()]
    .filter(([id]) => !placed.has(id) && !parked.has(id))
    .map(([, { step, source }]) => ({ ...step, tags: DEFAULT_TAGS[source] }))

  if (unsorted.length > 0) {
    phases.unshift({
      id: 0,
      order: 0,
      label: 'Needs a stage',
      title: 'Unsorted',
      description: 'Steps added to a source file but never placed in the build order or parked.',
      longDescription: [
        'A step here was written down in the read, engine or Rey manifest without being given a place in the sequence. It is shown rather than hidden so it cannot silently fall out of the build order. Place it in a stage, or park it, in build-sequence.ts.',
      ],
      steps: unsorted,
    })
  }

  return {
    phases: phases.map((p, i) => ({ ...p, id: i, order: i })),
    health: {
      unsorted: unsorted.map((s) => s.id),
      missing,
      duplicates,
      parkedCount: parked.size,
      placedCount: placed.size,
    },
  }
}

const ASSEMBLED = assemble()

export const BUILD_PHASES: Phase[] = ASSEMBLED.phases
export const BUILD_HEALTH = ASSEMBLED.health
