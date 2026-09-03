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
 * The deepest read in the system: 230 intake points, photos, blood markers,
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

/**
 * Reasoning effort, measured rather than assumed.
 *
 * Vicki's program generation, 2026-07-30, identical prompt and data:
 *
 *              default effort      effort: 'low'
 *   time       307.6s              71.0s
 *   output     31,610 tokens       7,598 tokens
 *   exercises  3-4 per session     5-6 per session
 *   slots      3-4 of 5 used       all 5 used
 *
 * Extended thinking made it strictly worse. It spent the whole output budget
 * deliberating and then produced a THINNER program. At 20k tokens it consumed
 * the entire allowance on thinking and emitted no text at all, which surfaced as
 * `stop_reason=max_tokens` with no content and then a 504.
 *
 * The reason is the task shape. Program generation is structured assembly
 * against explicit doctrine: fixed slots, a filtered exercise list, hard RPE
 * ceilings. There is little to reason about and a lot to lay out, so deliberation
 * costs budget without buying accuracy.
 *
 * ASSEMBLY   Large structured output against explicit rules. Slots, schemas,
 *            enumerated choices. Low effort: the rules do the thinking.
 *
 * ANALYSIS   Genuine synthesis where the answer is not implied by the inputs.
 *            The CFFS reading 230 intake points, a macro arc trading a fixed
 *            deadline against a Red readiness gate. Leave the default.
 *
 * Do not generalise this without measuring. `npm run repro:program` and
 * `npm run time:program` exist so effort is set from numbers, not from a hunch
 * about how hard a task looks.
 */
export const AI_EFFORT = {
  assembly: 'low',
} as const

