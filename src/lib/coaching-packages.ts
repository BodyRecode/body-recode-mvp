export type CoachingPackageValue =
  | 'online'
  | '1x'
  | '2x'
  | '3x'
  | 'online_launch'
  | '1x_launch'
  | '2x_launch'
  | '3x_launch'

export interface CoachingPackage {
  value: CoachingPackageValue
  label: string
  price: string
  stripe: string
  tier: 'standard' | 'launch'
  format: 'online' | 'in_person'
  sessionsPerWeek: number
}

export const COACHING_PACKAGES: CoachingPackage[] = [
  { value: 'online',         label: 'Online',                   price: '$149/week',   stripe: 'https://buy.stripe.com/aFacN72Ey2GW7MH2915ZC02', tier: 'standard', format: 'online',    sessionsPerWeek: 0 },
  { value: '1x',             label: 'In-Person 1x + self-led',  price: '$199/week',   stripe: 'https://buy.stripe.com/eVq5kFeng0yO6ID7tl5ZC0a', tier: 'standard', format: 'in_person', sessionsPerWeek: 1 },
  { value: '2x',             label: 'In-Person 2x',             price: '$299/week',   stripe: 'https://buy.stripe.com/4gM28t3ICftIff9cNF5ZC00', tier: 'standard', format: 'in_person', sessionsPerWeek: 2 },
  { value: '3x',             label: 'In-Person 3x',             price: '$409/week',   stripe: 'https://buy.stripe.com/aFabJ3frk0yO8QL6ph5ZC03', tier: 'standard', format: 'in_person', sessionsPerWeek: 3 },
  { value: 'online_launch',  label: 'Online (Launch)',          price: '$74.50/week', stripe: 'https://buy.stripe.com/14A28t0wq5T8aYT8xp5ZC04', tier: 'launch',   format: 'online',    sessionsPerWeek: 0 },
  { value: '1x_launch',      label: 'In-Person 1x + self-led (Launch)', price: '$99.50/week', stripe: 'https://buy.stripe.com/bJefZj0wqdlA3wrbJB5ZC0b', tier: 'launch',   format: 'in_person', sessionsPerWeek: 1 },
  { value: '2x_launch',      label: 'In-Person 2x (Launch)',    price: '$149.50/week',stripe: 'https://buy.stripe.com/4gM4gB3IC4P46IDcNF5ZC05', tier: 'launch',   format: 'in_person', sessionsPerWeek: 2 },
  { value: '3x_launch',      label: 'In-Person 3x (Launch)',    price: '$204.50/week',stripe: 'https://buy.stripe.com/eVq7sNdjc0yO6ID4h95ZC06', tier: 'launch',   format: 'in_person', sessionsPerWeek: 3 },
]

const BY_VALUE: Record<string, CoachingPackage> = Object.fromEntries(
  COACHING_PACKAGES.map(p => [p.value, p])
)

export function getCoachingPackage(value: string | null | undefined): CoachingPackage | null {
  if (!value) return null
  return BY_VALUE[value] ?? null
}

export const ONLINE_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.format === 'online').map(p => p.value)

export const IN_PERSON_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.format === 'in_person').map(p => p.value)

export const ONE_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 1).map(p => p.value)

export const TWO_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 2).map(p => p.value)

export const THREE_SESSION_PACKAGE_VALUES: CoachingPackageValue[] = COACHING_PACKAGES
  .filter(p => p.sessionsPerWeek === 3).map(p => p.value)
