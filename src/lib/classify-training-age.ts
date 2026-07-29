import Anthropic from '@anthropic-ai/sdk'
import { AI_MODELS } from './ai-models'

export type TrainingAge = 'beginner' | 'intermediate' | 'advanced'

/**
 * Classify a client's training age from their demonstrated HISTORY, independent
 * of current regulation/stress/body state. Mirrors the classification doctrine
 * in suggest-prescription (2026-07-12 fix) so regenerate-program stops
 * perpetuating a stale/under-classified training_age.
 *
 * Returns null on failure — callers should fall back to the existing value.
 */
export async function classifyTrainingAge(context: string): Promise<TrainingAge | null> {
  const system = `You classify a coaching client's TRAINING AGE from their demonstrated training HISTORY only. It describes who they ARE as a trainer, not how they present right now.

- advanced: multiple years of consistent structured training, established compound lifts, and/or demonstrated tolerance to serious load or endurance volume (runs distance events, long training history, clearly "trains seriously"). ADVANCED even if currently deconditioned, stressed, injured, or dysregulated.
- intermediate: roughly 1-3 years consistent training, competent with the main movement patterns, some load history.
- beginner: genuinely new to structured training, or a long lay-off with no established lifts.

CRITICAL: a Red regulation gate, high stress, or a Remediation body state describes CURRENT READINESS, not training history. They must NEVER lower the classification. Classify the history only. When history is genuinely ambiguous, default UPWARD, never downward.

Reply with ONLY one word: beginner, intermediate, or advanced.`

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY!, maxRetries: 3 })
    const resp = await anthropic.messages.create({
      model: AI_MODELS.clinical,
      max_tokens: 12,
      system,
      messages: [{ role: 'user', content: context }],
    })
    const block = resp.content.find(b => b.type === 'text')
    const t = (block && block.type === 'text' ? block.text : '').trim().toLowerCase()
    if (t.includes('advanced')) return 'advanced'
    if (t.includes('intermediate')) return 'intermediate'
    if (t.includes('beginner')) return 'beginner'
    return null
  } catch (err) {
    console.error('[classify-training-age] failed:', err instanceof Error ? err.message : err)
    return null
  }
}
