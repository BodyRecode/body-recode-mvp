/**
 * Deterministic preview of what a Mode A+ doctrine parameter config
 * DOES before saving. No LLM call - shows the exact system-prompt
 * fragments the generators will produce, and applies terminology
 * substitutions + banned-phrase checks to a fixed sample paragraph so
 * the coach can see the effect immediately.
 *
 * Powers the "Preview" button on /dashboard/settings/tenant.
 *
 * Pure function so preview is:
 *   - free (no Anthropic API cost per click)
 *   - deterministic (no LLM variance across previews)
 *   - fast (< 1ms)
 *
 * Live-LLM previews are a future add-on (would run a stub check-in
 * through the actual generator with the tuning applied); this static
 * preview covers 90% of the "what does my config do" question.
 */

import { applyTerminologyWith, findBannedIn } from './doctrine-parameters'

export type PreviewInput = {
  voiceTone?: string
  bannedPhrases?: string[]
  terminologySubstitutions?: Record<string, string>
  checkinCoachingGuidance?: string
  programGenerationGuidance?: string
  nutritionGenerationGuidance?: string
}

export type PreviewOutput = {
  systemPromptBlocks: {
    generator: string
    text: string
  }[]
  substitutionDemo: {
    before: string
    after: string
    substitutionsApplied: string[]
  }
  bannedPhraseDemo: {
    sample: string
    hits: string[]
  }
  summary: {
    hasVoiceTone: boolean
    bannedPhraseCount: number
    substitutionCount: number
    guidanceFieldsSet: number
  }
}

/**
 * Sample paragraph used for terminology + banned-phrase demos. Chosen
 * to exercise common banned phrases (from the Yoga + Powerlifting +
 * Corporate wellness presets) so partners see a hit or a substitution
 * on almost any realistic config.
 *
 * Kept intentionally generic - it is NOT client content, it is a
 * training-visualisation sentence for the coach.
 */
const DEMO_SUBSTITUTION_SAMPLE =
  'This week your recovery capacity looked lower than last block, so we softened one hard set on Wednesday and shifted the winding down block earlier. Notice the sensation of nasal breath through the mobility work. Your workout on Friday can flex 5 min shorter if the day runs long.'

const DEMO_BANNED_SAMPLE =
  'You need to downregulate the sympathetic dominance, push through the last hard set, and smash the finisher. Grind through it. Trust the process.'

/**
 * Build one "PARTNER TUNING" block matching the shape each generator
 * emits, but from the SUPPLIED parameters (not the tenant config).
 * Mirrors renderPartnerTuningSection() in each generator prompt.
 */
function buildTuningBlock(
  params: PreviewInput,
  guidanceField: 'checkin' | 'program' | 'nutrition' | 'none',
): string {
  const tone = params.voiceTone?.trim()
  const banned = (params.bannedPhrases ?? []).filter((p) => p.trim().length > 0)
  const guidance =
    guidanceField === 'checkin'
      ? params.checkinCoachingGuidance?.trim()
      : guidanceField === 'program'
        ? params.programGenerationGuidance?.trim()
        : guidanceField === 'nutrition'
          ? params.nutritionGenerationGuidance?.trim()
          : undefined

  if (!tone && banned.length === 0 && !guidance) {
    return '(empty - your Mode A+ config adds nothing to this generator)'
  }

  const lines: string[] = []
  lines.push("PARTNER TUNING (Mode A+ overlay — additive to the above, does not replace Kade's voice discipline):")
  if (tone) lines.push(`- Additional tone cue to apply throughout: ${tone}`)
  if (banned.length > 0) {
    lines.push(
      `- Additional banned phrases (do NOT use, in addition to the platform-wide banned-terms list): ${banned.map((p) => `"${p}"`).join(', ')}`,
    )
  }
  if (guidance) {
    const label =
      guidanceField === 'checkin'
        ? 'Partner check-in coaching philosophy'
        : guidanceField === 'program'
          ? 'Partner program coaching philosophy'
          : 'Partner nutrition coaching philosophy'
    lines.push(`- ${label}: ${guidance}`)
  }
  return lines.join('\n')
}

export function buildPreview(params: PreviewInput): PreviewOutput {
  const subs = params.terminologySubstitutions ?? {}
  const banned = (params.bannedPhrases ?? []).filter((p) => p.trim().length > 0)

  const after = applyTerminologyWith(DEMO_SUBSTITUTION_SAMPLE, subs)
  const substitutionsApplied: string[] = []
  for (const [from, to] of Object.entries(subs)) {
    if (!from.trim() || !to.trim()) continue
    if (DEMO_SUBSTITUTION_SAMPLE.toLowerCase().includes(from.toLowerCase())) {
      substitutionsApplied.push(`"${from}" → "${to}"`)
    }
  }

  const bannedHits: string[] = []
  for (const phrase of banned) {
    const hit = findBannedIn(DEMO_BANNED_SAMPLE, [phrase])
    if (hit) bannedHits.push(hit)
  }

  return {
    systemPromptBlocks: [
      {
        generator: 'Weekly check-in feedback',
        text: buildTuningBlock(params, 'checkin'),
      },
      {
        generator: 'Program generation + reading',
        text: buildTuningBlock(params, 'program'),
      },
      {
        generator: 'Nutrition plan + reading',
        text: buildTuningBlock(params, 'nutrition'),
      },
      {
        generator: 'Foundational / trajectory / medications reading',
        text: buildTuningBlock(params, 'none'),
      },
    ],
    substitutionDemo: {
      before: DEMO_SUBSTITUTION_SAMPLE,
      after,
      substitutionsApplied,
    },
    bannedPhraseDemo: {
      sample: DEMO_BANNED_SAMPLE,
      hits: bannedHits,
    },
    summary: {
      hasVoiceTone: (params.voiceTone?.trim().length ?? 0) > 0,
      bannedPhraseCount: banned.length,
      substitutionCount: Object.keys(subs).filter(
        (k) => k.trim() && subs[k]?.trim(),
      ).length,
      guidanceFieldsSet: [
        params.checkinCoachingGuidance,
        params.programGenerationGuidance,
        params.nutritionGenerationGuidance,
      ].filter((g) => g?.trim().length).length,
    },
  }
}
