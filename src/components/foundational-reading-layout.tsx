import ReadingHeroShell from './reading-hero-shell'
import { BRAND } from '@/lib/brand-tokens'

/**
 * Foundational Reading layout.
 *
 * Used by:
 *   - /dashboard/clients/[id]/foundational-reading-preview  (Kade preview / PDF source)
 *   - /portal/[token]/foundational-reading                  (client view)
 *   - /api/.../foundational-reading/pdf                     (puppeteer, print media)
 *
 * Redesigned 2026-07-12 to match the client portal (dark hero + tinted ground).
 * Refactored 2026-07-20 onto the shared ReadingHeroShell so all four readings
 * (Foundational, Program, Trajectory, Nutrition) present as one series.
 */

/**
 * The read is coloured by the client's own readiness and nothing else. The keys
 * are the internal names because that is what is stored; the client never sees
 * them, only the colour they produce.
 */
const READINESS_INK: Record<string, string> = {
  Remediation: BRAND.remediation,
  Optimisation: BRAND.optimisation,
  'Post-Optimisation': BRAND.postOptimisation,
  // AND THE CLIENT'S OWN WORDS, because by the time this component sees the
  // value the portal has already translated it. Keying only on the internal
  // names meant the lookup quietly found nothing and the cover came out
  // colourless, which is exactly what it looked like.
  Depleted: BRAND.remediation,
  Transitioning: BRAND.optimisation,
  Ready: BRAND.postOptimisation,
}
const READINESS_INK_ON_DARK: Record<string, string> = {
  Remediation: BRAND.remediationOnDark,
  Optimisation: BRAND.optimisationOnDark,
  'Post-Optimisation': BRAND.postOptimisationOnDark,
  Depleted: BRAND.remediationOnDark,
  Transitioning: BRAND.optimisationOnDark,
  Ready: BRAND.postOptimisationOnDark,
}

export interface ReadingData {
  cr_where_you_are: string | null
  cr_what_your_body_is_telling_us: string | null
  cr_what_were_focusing_on_first: string | null
  cr_what_were_not_doing_yet: string | null
  cr_coach_note: string | null
  body_state_classification: string | null
  generated_at: string
  client_reading_published_at: string | null
}

export interface ClientMeta {
  name: string
}

export default function ReadingLayout({
  reading,
  client,
}: {
  reading: ReadingData
  client: ClientMeta
}) {
  return (
    <ReadingHeroShell
      eyebrow="Foundational Read"
      heroTitle="Your Starting Position"
      heroSub="A read of how your body is currently organising itself, across energy, recovery, sleep, stress, and training response. Not a verdict, a foundation we build from together."
      pill={reading.body_state_classification}
      clientName={client.name}
      dateLine={new Date(reading.client_reading_published_at ?? reading.generated_at)
        .toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
      accent={READINESS_INK[reading.body_state_classification ?? '']}
      accentOnDark={READINESS_INK_ON_DARK[reading.body_state_classification ?? '']}
      aboutText={
        <p>
          The intake you completed gave us a picture of how your system is currently working, across energy, recovery, sleep, stress, and training response. What follows is what stood out: where you are, what your body is signalling, and what we are deliberately doing and not doing in response. Nothing here diagnoses or prescribes. Any pattern named here describes how your body is behaving, not a measurement of your hormone levels. It is the foundation we build from together.
        </p>
      }
      sections={[
        { key: 'cr_where_you_are',                label: 'Where you are right now',        icon: 'pin',    content: reading.cr_where_you_are },
        { key: 'cr_what_your_body_is_telling_us', label: 'What your body is telling us',   icon: 'pulse',  content: reading.cr_what_your_body_is_telling_us },
        { key: 'cr_what_were_focusing_on_first',  label: 'What we are focusing on first',  icon: 'target', content: reading.cr_what_were_focusing_on_first },
        { key: 'cr_what_were_not_doing_yet',      label: 'What we are not doing yet',      icon: 'hold',   content: reading.cr_what_were_not_doing_yet },
      ]}
      coachNote={{ content: reading.cr_coach_note }}
    />
  )
}
