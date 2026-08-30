/**
 * What body state is CURRENT for a client, and where that answer came from.
 *
 * THE PROBLEM (30 Aug 2026): `cffs.body_state_classification` is scored once at
 * intake and never changes. The Progress Read re-scores state onto
 * `programs.tr_new_body_state`. Almost every surface read the CFFS, so an hour
 * after Cristobal was re-scored to Transitioning his record still said
 * Remediation everywhere — including the client portal, which told him he was
 * "currently in Remediation".
 *
 * The fix is NOT to overwrite the CFFS. The foundational read is a permanent
 * artefact of who someone was at intake and it stays the anchor. It just has to
 * stop being presented as CURRENT once something more recent exists.
 *
 * Two vocabularies again: `tr_new_body_state` holds the public labels
 * (Depleted / Transitioning / Ready) while the CFFS and every display use the
 * internal ones (Remediation / Optimisation / Post-Optimisation). This
 * translates, and falls back to the foundational value if it cannot — a surface
 * should never render a word from the wrong vocabulary.
 */
import { cffsStateForAnyStateLabel } from '@/lib/pattern-doctrine'

export interface ReScoreSource {
  tr_new_body_state: string | null
  tr_state_direction?: string | null
  block_name?: string | null
  trajectory_reading_published_at?: string | null
}

export interface ResolvedBodyState {
  /** Render this as the client's state. Internal vocabulary. */
  label: string | null
  /** The CFFS value. Stays visible as the anchor, never presented as current. */
  foundational: string | null
  /** True when `label` came from a re-score rather than the foundational read. */
  reScored: boolean
  /** Public label of the re-score, for coach-facing provenance lines. */
  reScoredPublicLabel: string | null
  direction: string | null
  blockName: string | null
}

export function resolveCurrentBodyState(opts: {
  foundational: string | null
  reScore: ReScoreSource | null
  /**
   * Client-facing surfaces pass true: the client should meet a new state in a
   * Progress Read the coach has approved, not via a pill quietly changing
   * before anything has been said to them.
   */
  requirePublished?: boolean
}): ResolvedBodyState {
  const { foundational, reScore, requirePublished = false } = opts
  const base: ResolvedBodyState = {
    label: foundational,
    foundational,
    reScored: false,
    reScoredPublicLabel: null,
    direction: null,
    blockName: null,
  }

  if (!reScore?.tr_new_body_state) return base
  if (requirePublished && !reScore.trajectory_reading_published_at) return base

  const mapped = cffsStateForAnyStateLabel(reScore.tr_new_body_state)
  // Unrecognised label: keep the foundational value rather than render a word
  // from the wrong vocabulary.
  if (!mapped) return base
  if (mapped === foundational) return base

  return {
    label: mapped,
    foundational,
    reScored: true,
    reScoredPublicLabel: reScore.tr_new_body_state,
    direction: reScore.tr_state_direction ?? null,
    blockName: reScore.block_name ?? null,
  }
}

/** The most recent re-score for a client, or null. Newest program first. */
export function latestReScore<T extends ReScoreSource & { generated_at?: string | null }>(
  programs: T[] | null | undefined
): T | null {
  const withScore = (programs ?? []).filter(p => p.tr_new_body_state)
  if (!withScore.length) return null
  return withScore.sort((a, b) =>
    String(b.generated_at ?? '').localeCompare(String(a.generated_at ?? ''))
  )[0]
}
