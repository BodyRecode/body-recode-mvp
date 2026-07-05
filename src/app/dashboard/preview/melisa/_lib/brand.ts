/**
 * Melisa preview brand tokens. Single source of truth for the mock
 * tenant so every preview page reads the same values. When Melisa hands
 * over her real brand pack at seed time, these get replaced by her
 * tenant_config.brand JSON - this file gets deleted.
 */
export const MELISA_BRAND = {
  name: 'Melisa',
  sub: 'Yoga and Somatic Practice',
  tagline: 'Movement is the practice. Attention is the point.',
  location: 'Brisbane',
  founder: 'Melisa',
  monogram: 'M',

  // Palette - warm-neutral yoga-luxe
  bg: '#faf6ef',           // page cream
  bgDeep: '#f4ede0',       // sidebar / muted panel
  card: '#ffffff',
  border: '#e8dfd0',       // warm cream border
  ink: '#2c2418',          // deep espresso
  inkMid: '#6b5f4d',
  inkLight: '#a89b85',

  // Accents
  accent: '#7a8a6b',       // sage
  accentText: '#4d5a41',   // deeper sage for text on light
  accentSoft: 'rgba(122, 138, 107, 0.1)',
  accentBorder: '#c5cfba',

  warm: '#b06c47',         // terracotta - state indicator
  warmSoft: 'rgba(176, 108, 71, 0.1)',

  danger: '#a63b2d',       // reddish-terra for warnings
  ok: '#5b7a4d',           // muted green for confirmations

  // Typography
  serif: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
  mono: "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
} as const

export const MELISA_NAV = [
  { slug: '',           label: 'Home',       kind: 'home' },
  { slug: 'students',   label: 'Students',   kind: 'students' },
  { slug: 'check-ins',  label: 'Check-ins',  kind: 'check-ins' },
  { slug: 'plans',      label: 'Plans',      kind: 'plans' },
  { slug: 'content',    label: 'Content',    kind: 'content' },
  { slug: 'insights',   label: 'Insights',   kind: 'insights' },
  { slug: 'settings',   label: 'Settings',   kind: 'settings' },
] as const
