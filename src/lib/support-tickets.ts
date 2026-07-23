export const CATEGORY_LABELS = {
  bug: 'Bug',
  question: 'Question',
  'feature-request': 'Feature request',
  urgent: 'Something is wrong right now',
} as const

export type SupportCategory = keyof typeof CATEGORY_LABELS

export const CATEGORIES: SupportCategory[] = ['bug', 'question', 'feature-request', 'urgent']

export function isValidCategory(v: string): v is SupportCategory {
  return (CATEGORIES as string[]).includes(v)
}

export const STATUS_LABELS = {
  new: 'New',
  looking: 'Looking',
  fixed: 'Fixed',
  'wont-fix': "Won't fix",
} as const

export type SupportStatus = keyof typeof STATUS_LABELS

export const STATUSES: SupportStatus[] = ['new', 'looking', 'fixed', 'wont-fix']

export function isValidStatus(v: string): v is SupportStatus {
  return (STATUSES as string[]).includes(v)
}

export function statusAccent(status: SupportStatus): 'amber' | 'blue' | 'sage' | 'neutral' {
  if (status === 'new') return 'amber'
  if (status === 'looking') return 'blue'
  if (status === 'fixed') return 'sage'
  return 'neutral'
}

export function categoryAccent(cat: SupportCategory): 'red' | 'amber' | 'blue' | 'neutral' {
  if (cat === 'urgent') return 'red'
  if (cat === 'bug') return 'amber'
  if (cat === 'feature-request') return 'blue'
  return 'neutral'
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
