/**
 * Starter presets for Mode A+ doctrine parameters. New Collective
 * partners open the tenant settings editor and see a "Load preset"
 * dropdown; picking one populates all six fields with a sensible
 * starting shape they can then tune. Alternative to starting from an
 * empty form.
 *
 * Rules for authoring presets:
 * - Every preset MUST pass validateDoctrineParameters(). Tests enforce
 *   this via test-doctrine-parameters-presets.ts.
 * - Substitution keys should be sufficiently unique to avoid accidental
 *   substring matches (see the substring-behavior test in
 *   test-doctrine-parameters-runtime.ts). Prefer multi-word "from" values.
 * - Never include a platform-protected term (state names, Fat Map zones,
 *   nutrition units) in bannedPhrases or in either side of a
 *   terminologySubstitutions entry - the validator will reject the
 *   preset at save-time.
 * - Guidance blocks are prose and CAN reference protected terms freely.
 */

export type Preset = {
  id: string
  label: string
  description: string
  parameters: {
    voiceTone: string
    bannedPhrases: string[]
    terminologySubstitutions: Record<string, string>
    checkinCoachingGuidance: string
    programGenerationGuidance: string
    nutritionGenerationGuidance: string
  }
}

export const PRESETS: Preset[] = [
  {
    id: 'yoga-breath-forward',
    label: 'Yoga (breath-forward)',
    description: 'Warm, grounded, breath-first voice. For yoga-adjacent movement partners. Reframes intensity language as sensation.',
    parameters: {
      voiceTone: 'warm, grounded, and breath-forward',
      bannedPhrases: ['downregulate', 'sympathetic dominance', 'hard set', 'smash'],
      terminologySubstitutions: {
        'winding down': 'settling',
        'hard set': 'strong effort',
      },
      checkinCoachingGuidance: 'Emphasise breath awareness in every regulation cue. Frame effort as sensation rather than measurement. Prefer "notice" over "track". Never prescribe metrics without a felt-sense anchor.',
      programGenerationGuidance: 'Prefer one restorative session per week. Weave breath cues into every session brief. Avoid clinical intensity language in the client-facing summary.',
      nutritionGenerationGuidance: 'Frame nutrition as nourishment rather than fuel efficiency. Emphasise plant-forward defaults where sensible. Keep meal briefs sensory (colour, texture) rather than macro-first.',
    },
  },
  {
    id: 'powerlifting-blunt',
    label: 'Powerlifting (blunt / direct)',
    description: 'Direct, plainspoken, outcome-focused. For strength-sport partners. Assumes client wants technical honesty.',
    parameters: {
      voiceTone: 'direct, plainspoken, no-fluff',
      bannedPhrases: ['gentle', 'sit with', 'notice how it feels', 'soften'],
      terminologySubstitutions: {},
      checkinCoachingGuidance: 'Say the thing. If a lift is behind schedule, say it. Coaching feedback should be technical and outcome-focused. Avoid softening language.',
      programGenerationGuidance: 'Anchor around heavy compound work. Sessions can run 60-90 minutes. Include weekly max-effort or dynamic-effort intent by phase. Speak plainly about progression targets.',
      nutritionGenerationGuidance: 'Frame nutrition as fuel for output. Prioritise total protein availability and carb timing around sessions. Blunt about deficit / surplus reality.',
    },
  },
  {
    id: 'corporate-wellness',
    label: 'Corporate wellness (professional)',
    description: 'Calm, evidence-referenced, workday-aware. For partners serving professionals. Avoids gym-culture slang.',
    parameters: {
      voiceTone: 'professional, calm, evidence-referenced',
      bannedPhrases: ['smash', 'crush it', 'hustle', 'grind'],
      terminologySubstitutions: {
        'workout': 'session',
      },
      checkinCoachingGuidance: 'Frame progress in professional cadence: consistency, sustainability, recovery around workweeks. Reference travel weeks and meeting-heavy stretches. Avoid gym slang throughout.',
      programGenerationGuidance: 'Prefer 3-4 sessions per week, 45-60 minutes each. Design around commute, meetings, and travel. Provide clear at-home fallback options for every prescribed session.',
      nutritionGenerationGuidance: 'Design around common professional constraints: lunch meetings, travel, evening events. Prioritise simple defaults over precision. Include one "boardroom-friendly" option per meal slot.',
    },
  },
  {
    id: 'rehab-gentle',
    label: 'Rehab / return-to-training (gentle-cautious)',
    description: 'Patient, careful, signal-first. For rehab or return-to-training partners. Never uses push-through language.',
    parameters: {
      voiceTone: 'patient, careful, and encouraging',
      bannedPhrases: ['push through', 'smash', 'grind', 'no pain no gain'],
      terminologySubstitutions: {},
      checkinCoachingGuidance: 'Prioritise pain and discomfort signals over load progression. Any "push" language should be reframed as "test at a level you trust today". Never override a caution signal in service of a target.',
      programGenerationGuidance: 'Start below current capacity and build gradually. Include mobility and regulation blocks in every session. Never prescribe near-max effort. Explicitly signpost regression paths in every session brief.',
      nutritionGenerationGuidance: 'Emphasise anti-inflammatory patterns. Prioritise adequate protein for tissue repair. Keep expectations gentle and process-oriented rather than outcome-driven.',
    },
  },
]

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id)
}
