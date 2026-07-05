/**
 * Design tokens for the Harmony website mock. Deliberately separate
 * from the dashboard preview tokens (in ../melisa/_lib/brand.ts) so
 * the marketing site can lean editorial while the dashboard stays
 * clean UI-app aesthetic.
 *
 * When Melisa hands over her real brand pack these values get replaced.
 */
export const H = {
  name: 'Harmony',
  sub: 'Yoga & Meditation',
  location: 'Brisbane',
  founder: 'Melisa',
  logoUrl: '/preview/hermony/logo-cropped.png',

  // Palette - warm editorial
  cream:      '#FAF6EF',   // page bg
  creamDeep:  '#F0E9DA',   // section-alt bg
  ink:        '#1A1A1A',   // dark text + wordmark
  inkSoft:    '#3F3A32',   // secondary text
  inkLight:   '#8A8175',   // meta text
  terracotta: '#B06C47',   // brand accent
  terracottaSoft: 'rgba(176, 108, 71, 0.09)',
  terracottaDeep: '#8A5335',
  border:     '#E4DBC8',   // warm cream border

  // Type stacks
  serif: "'Cormorant Garamond', 'Playfair Display', Georgia, 'Times New Roman', serif",
  sans:  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif",
  mono:  "ui-monospace, 'JetBrains Mono', 'SF Mono', Menlo, monospace",
} as const

// Product ladder (Harmony's funnel, mirroring BR's Hormozi money model)
export const LADDER = {
  scorecard: {
    label: 'Practice Readiness Assessment',
    short: 'The Assessment',
    price: 'Free · 2 minutes',
    hook: 'Where your practice is right now',
  },
  read: {
    label: 'Your Practice Read',
    short: 'The Read',
    price: '$47',
    hook: 'A personalised written analysis of your practice state, drafted after your assessment',
  },
  call: {
    label: 'Foundation Call',
    short: 'The Call',
    price: 'Complimentary · 30 min',
    hook: 'A one-time conversation with Melisa to decide whether the studio is the right place for you',
  },
  onboard: {
    label: 'Studio Onboarding',
    short: 'Onboarding',
    price: '$260',
    hook: 'One-time. Includes your practice foundations, first block programme, nutrition foundation, welcome kit.',
  },
  membership: {
    label: 'Studio Membership',
    short: 'The Studio',
    price: '$180 / month',
    hook: 'Ongoing coaching, personalised weekly practice plans, monthly readings, in-studio + at-home classes.',
  },
} as const
