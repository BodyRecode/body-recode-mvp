import ReadingHeroShell from './reading-hero-shell'

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
      eyebrow="Foundational Reading"
      heroTitle="Your Starting Position"
      heroSub="A read of how your body is currently organising itself, across energy, recovery, sleep, stress, and training response. Not a verdict, a foundation we build from together."
      pill={reading.body_state_classification}
      clientName={client.name}
      aboutText={
        <p>
          <b>About this reading.</b> The intake you completed gave us a picture of how your system is currently working, across energy, recovery, sleep, stress, and training response. What follows is what stood out: where you are, what your body is signalling, and what we are deliberately doing and not doing in response. Nothing here diagnoses or prescribes. It is the foundation we build from together.
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
