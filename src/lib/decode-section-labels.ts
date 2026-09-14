/**
 * The five scored areas, as her Decode pages name them.
 *
 * A woman who is not training answers 04 and 05 as everyday capacity and body
 * shape (same keys, same 1-3 scale), so naming them "training response" and
 * "fat loss response" back to her would describe questions she never saw.
 * Added 14 Sep 2026 when the audience widened beyond women already training.
 */
export type SectionKey = '01' | '02' | '03' | '04' | '05'

const LABELS: Record<SectionKey, string> = {
  '01': 'Energy',
  '02': 'Sleep',
  '03': 'Stress load',
  '04': 'Training response',
  '05': 'Fat loss response',
}

const NOT_TRAINING: Partial<Record<SectionKey, string>> = {
  '04': 'Everyday capacity',
  '05': 'Body shape',
}

export function decodeSectionLabel(key: SectionKey, trainingStatus: string | null | undefined): string {
  return (trainingStatus === 'none' && NOT_TRAINING[key]) || LABELS[key]
}
