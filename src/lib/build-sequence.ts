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
    label: 'Stage 0',
    title: 'The engine runs without Kade',
    description: 'Everything that currently depends on a coach reviewing, deciding or judging. Required before anyone pays.',
    longDescription: [
      'The engine was built to help a coach, not to replace one. Every plan is reviewed by Kade, every next block is built when Kade decides, and progress happens when Kade judges it. Rey removes Kade entirely.',
      'The auto-memory already names the core of this as the single biggest thing blocking licensing: the doctrine lives in the written instructions to the model, and almost nothing in code checks the output obeys it.',
      'None of this is Rey-only. The same work unblocks the Body Recode read sold on its own and any future coach product, so it is never wasted whichever product ships first. The company and trade mark work runs alongside, because a name takes months to register whenever it is started.',
    ],
    steps: [
      ...at(ALL, 'solo-doctrine-checked-in-code', 'engine-nutrition-revise', 'solo-next-block-auto', 'solo-progression', 'solo-equipment-programming', 'reread-generator'),
      ...at(ALL, 'oliver-question-zero', 'incorporate', 'head-licence', 'trade-marks'),
    ],
  },
  {
    label: 'Stage 1',
    title: 'Rey on the web',
    description: 'The first thing she can pay for: signup, her read, her plan, the weekly check-in and the re-read. No voice yet.',
    longDescription: [
      'Everything the Rey specification places on the web rather than in the app. Almost all of it already exists as the coaching portal, pointed at a consumer instead of a client.',
      'It tests the question that matters most, whether women will pay $199 a year for the read and the loop, before months are spent on voice. The read is the differentiator; voice is how Rey delivers it. The first can be proven without the second.',
      'This stage is blocked more by doctrine than by code: choosing the 30 to 40 questions, and writing the read for her rather than for a coach. Both are Kade\'s work. The evidence steps apply to her directly in Rey: did the read land, and does she stay, measured from the very first customer with a baseline.',
    ],
    steps: [
      ...at(['Rey', 'Read'], 'minimum-question-set'),
      ...at(['Rey'], 'rey-consumer-read', 'rey-name-voice'),
      ...at(['Rey'], 'rey-progressive-intake', 'rey-signup-subscription', 'rey-plan-on-screen', 'rey-weekly-checkin', 'rey-progress-view'),
      ...at(['Rey', 'Read'], 'reread-outputs-changes'),
      ...at(['Rey'], 'rey-reread-moment', 'rey-cancel-pause-delete'),
      ...at(['Rey', 'Read'], 'reread-pause-on-freeze', 'evidence-did-the-read-land', 'evidence-client-retention'),
      ...at(['Rey'], 'rey-consent-privacy', 'rey-coachless-position'),
      ...at(ALL, 'health-data-position'),
      ...at(ALL, 'security-subprocessor-register', 'security-route-guard-audit', 'security-access-control', 'security-retention-deletion', 'security-breach-process'),
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
      ...at(['Rey'], 'rey-phone-app', 'rey-voice', 'rey-session-flow', 'rey-override-rules', 'rey-injury-disclosure', 'rey-music-ducking', 'rey-offline-sessions', 'rey-talk-level', 'rey-first-refusal', 'rey-distress-tested'),
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
