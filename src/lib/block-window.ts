/**
 * When a training block starts and ends.
 *
 * There are two dates on a program and they are not the same thing:
 *  - `generated_at` is when the DRAFT was built
 *  - `activated_at` is when it was promoted to active and the client began it
 *
 * Everything that asks "how far into the block is she" wants the second. Until
 * 27 Aug 2026 only the first existed, so the block's clock started when the
 * coach generated it. A draft sitting five weeks before approval would have
 * been treated as five weeks old on its first day, and the block-end Progress
 * Check would have fired almost immediately.
 *
 * `activated_at` is backfilled to `generated_at` for every row that predates
 * the column, so the fallback is history, not a guess.
 */

export type BlockDates = {
  activated_at?: string | null
  generated_at?: string | null
  week_duration?: number | null
}

/** The moment the client started this block, or null if unknowable. */
export function blockStartMs(program: BlockDates | null | undefined): number | null {
  const start = program?.activated_at ?? program?.generated_at
  return start ? new Date(start).getTime() : null
}

/** The moment the block finishes: start + duration weeks. Null if unknowable. */
export function blockEndMs(program: BlockDates | null | undefined): number | null {
  const start = blockStartMs(program)
  if (start == null || !program?.week_duration) return null
  return start + program.week_duration * 7 * 24 * 60 * 60 * 1000
}

/**
 * The moment the FINAL week begins: start + (duration - 1) weeks.
 *
 * 2026-08-31. The Progress Check gate used to wait for `blockEndMs`, the
 * calendar end. But the portal has always told the client, in her final week,
 * "finish the week and send your check-in, and your Progress Check opens
 * next". The backend did not keep that promise: Razia sat in week 8 of 8
 * reading it, sent her check-in, and nothing opened, because the end date was
 * still six days away. Keying on the final week also survives bad activation
 * dates - her Block 2 was activated eight days before Block 1 finished, so her
 * recorded dates never matched what she actually did.
 */
export function blockFinalWeekStartMs(program: BlockDates | null | undefined): number | null {
  const start = blockStartMs(program)
  if (start == null || !program?.week_duration) return null
  return start + (program.week_duration - 1) * 7 * 24 * 60 * 60 * 1000
}

/** Which week of the block she is in, 1-based. Null if unknowable. */
export function blockWeek(program: BlockDates | null | undefined, now = Date.now()): number | null {
  const start = blockStartMs(program)
  if (start == null) return null
  return Math.floor((now - start) / (7 * 24 * 60 * 60 * 1000)) + 1
}

/** Has the final week been completed? Not "has she reached it". */
export function blockFinished(program: BlockDates | null | undefined, now = Date.now()): boolean {
  const end = blockEndMs(program)
  return end != null && now >= end
}
