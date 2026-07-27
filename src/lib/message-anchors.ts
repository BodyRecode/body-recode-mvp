/**
 * Message anchors: what a message is *about*.
 *
 * A general message (anchor_kind null) is the Phase 1 behaviour and still
 * valid. An anchored message is tied to an artefact, so "why is my protein
 * this high?" lives on the nutrition plan rather than floating in a chat log
 * where neither side can find it three weeks later.
 *
 * The label is snapshotted onto the message at send time rather than joined
 * at read time: blocks get renamed and archived, and the message should still
 * read correctly afterwards.
 */

export const ANCHOR_KINDS = [
  'foundational_reading',
  'program',
  'nutrition',
  'checkin',
  'bloods',
  'supplements',
  'recovery',
  'routine',
] as const

export type AnchorKind = (typeof ANCHOR_KINDS)[number]

export function isAnchorKind(value: unknown): value is AnchorKind {
  return typeof value === 'string' && (ANCHOR_KINDS as readonly string[]).includes(value)
}

interface AnchorDef {
  /** Shown on the chip when no per-message label was captured. */
  fallbackLabel: string
  /** Client-facing page this anchor refers to, relative to the portal root. */
  portalPath: string
  /** What the client sees on the "ask" button for this artefact. */
  askLabel: string
}

const ANCHORS: Record<AnchorKind, AnchorDef> = {
  foundational_reading: {
    fallbackLabel: 'Foundational Reading',
    portalPath: 'foundational-reading',
    askLabel: 'Ask about your reading',
  },
  program: {
    fallbackLabel: 'Training program',
    portalPath: 'program',
    askLabel: 'Ask about your program',
  },
  nutrition: {
    fallbackLabel: 'Nutrition plan',
    // The plan lives at my-plan; /nutrition is a legacy redirect to the check-in.
    portalPath: 'my-plan',
    askLabel: 'Ask about your nutrition',
  },
  checkin: {
    fallbackLabel: 'Weekly check-in',
    portalPath: 'checkin-history',
    askLabel: 'Ask about your check-in',
  },
  bloods: {
    fallbackLabel: 'Health markers',
    portalPath: 'bloods',
    askLabel: 'Ask about your bloods',
  },
  supplements: {
    fallbackLabel: 'Supplement stack',
    portalPath: 'supplements',
    askLabel: 'Ask about your stack',
  },
  recovery: {
    fallbackLabel: 'Recovery protocols',
    portalPath: 'recovery',
    askLabel: 'Ask about recovery',
  },
  routine: {
    fallbackLabel: 'Daily sequences',
    portalPath: 'routine',
    askLabel: 'Ask about your routine',
  },
}

export function anchorFallbackLabel(kind: AnchorKind): string {
  return ANCHORS[kind].fallbackLabel
}

export function anchorAskLabel(kind: AnchorKind): string {
  return ANCHORS[kind].askLabel
}

/** The client-facing page an anchored message refers to. */
export function anchorPortalHref(token: string, kind: AnchorKind): string {
  return `/portal/${token}/${ANCHORS[kind].portalPath}`
}

/** Deep link that opens the message thread with the composer pre-anchored. */
export function askAboutHref(
  token: string,
  kind: AnchorKind,
  label?: string | null,
): string {
  const params = new URLSearchParams({ about: kind })
  if (label) params.set('label', label)
  return `/portal/${token}/message?${params.toString()}`
}

/** What the chip reads on a message, preferring the snapshot taken at send time. */
export function anchorChipLabel(kind: AnchorKind, label?: string | null): string {
  const trimmed = label?.trim()
  return trimmed && trimmed.length > 0 ? trimmed : ANCHORS[kind].fallbackLabel
}
