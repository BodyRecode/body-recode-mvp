/**
 * Model tiers, named by CONSEQUENCE rather than by capability.
 *
 * Why this file exists (2026-07-29):
 *
 * Every model in the system was chosen at its call site, which meant nobody
 * ever saw the whole picture. An audit found that 40 of 44 AI surfaces ran on
 * Haiku 4.5, including the CFFS, the macro arc, the training program, nutrition,
 * blood-panel analysis, medication-interaction analysis and the training-age
 * classifier. Meanwhile `draft-reply`, which writes a text message back to a
 * client, ran on Opus 5.
 *
 * The system was spending its best model on SMS and its cheapest on deciding a
 * 52-year-old's training load against a live sacroiliac injury.
 *
 * The symptom was a week of doctrine failures that all looked like prompt bugs:
 * an arc that did not sum to its own window, intensification smuggled into a
 * block labelled accumulation, an endurance history read as resistance training
 * age. Those are reasoning failures under load, not instruction failures. A
 * model that cannot hold four blocks of arithmetic and a permission gate at the
 * same time will keep producing them however the prompt is worded.
 *
 * Pick the tier by what happens when the output is WRONG, not by how hard the
 * task looks:
 *
 *   CLINICAL     A wrong answer reaches a client's body, or a coach acts on it.
 *                Training load, nutrition, blood markers, medications, state
 *                and pattern classification. Never downgrade one of these to
 *                save cost; the cost of being wrong is a person.
 *
 *   STRUCTURAL   A wrong answer corrupts a document a coach will trust and
 *                build months of work on. Macro arcs, readings, guidance.
 *
 *   OPERATIONAL  A wrong answer is visible immediately and costs a retry.
 *                Content drafts, summaries, reminders, extraction, routing.
 *
 * These are low-frequency generations. A program is written once per block, a
 * CFFS once per client. Moving them up a tier is a rounding error against a
 * single coaching session, and it is the difference between doctrine that holds
 * and doctrine that holds only when Kade reads every output. That distinction
 * is the entire white-label question.
 */

export const AI_MODELS = {
  /** Highest-consequence reads. Wrong output reaches a client's body. */
  clinical: 'claude-sonnet-5',
  /** Documents a coach builds months of work on top of. */
  structural: 'claude-sonnet-5',
  /** Drafting, summarising, extraction, routing. Cheap and retryable. */
  operational: 'claude-haiku-4-5-20251001',
} as const

export type AIModelTier = keyof typeof AI_MODELS

/**
 * The deepest read in the system: 221 intake points, photos, blood markers,
 * state and pattern classification in one pass. Everything downstream inherits
 * its errors.
 *
 * Deliberately Sonnet, not Opus. Almost all of the quality gain is in the
 * Haiku -> Sonnet step: that is where the model becomes able to hold the whole
 * doctrine, the arithmetic and the permission gates at once. Opus buys a
 * further margin for roughly five times the price, and the CFFS is the most
 * token-heavy call in the system because it carries photos. At Collective
 * scale that margin is not worth the bill.
 *
 * Flip this one line to 'claude-opus-5' if a specific client's read justifies
 * it. Nothing else needs to change.
 */
export const CFFS_MODEL: string = AI_MODELS.clinical
