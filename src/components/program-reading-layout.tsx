import ReadingHeroShell from './reading-hero-shell'

/**
 * Program Reading layout.
 *
 * Used by:
 *   - /portal/[token]/program/reading  (full-screen client view)
 *   - PDF generation route
 *
 * Migrated 2026-07-20 from a bespoke cream-narrow-column editorial layout to
 * the shared dark-hero editorial shell (ReadingHeroShell). Same visual grammar
 * as Foundational / Trajectory / Nutrition readings so the four documents
 * present as one coherent series.
 */

export interface ProgramReadingData {
  pr_why_this_block: string | null
  pr_what_this_program_is_doing: string | null
  pr_how_well_know_its_working: string | null
  pr_what_were_not_doing_yet: string | null
  pr_coach_note: string | null
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  generated_at: string
  program_reading_published_at: string | null
}

export interface ProgramReadingClientMeta {
  name: string
}

export default function ProgramReadingLayout({
  reading,
  client,
}: {
  reading: ProgramReadingData
  client: ProgramReadingClientMeta
}) {
  const pill = [reading.progression_phase, reading.training_goal].filter(Boolean).join(' · ') || null

  return (
    <ReadingHeroShell
      eyebrow="Program Reading"
      heroTitle={reading.block_name}
      heroSub="Why this block, what it is doing, and how we will read it as it unfolds. The bridge from your Foundational Reading to the sessions in this block."
      pill={pill}
      clientName={client.name}
      aboutText={
        <p>
          <b>About this reading.</b> Every block is built from where your body currently is, not from a generic template. This reading explains what we are trying to shift this time, what the work will ask of you, and what we are deliberately not chasing yet. Read it once before your first session. It frames everything that follows.
        </p>
      }
      sections={[
        { key: 'pr_why_this_block',             label: 'Why this block',                icon: 'target', content: reading.pr_why_this_block },
        { key: 'pr_what_this_program_is_doing', label: 'What this program is doing',    icon: 'pulse',  content: reading.pr_what_this_program_is_doing },
        { key: 'pr_how_well_know_its_working',  label: 'How we will know it is working', icon: 'compass', content: reading.pr_how_well_know_its_working },
        { key: 'pr_what_were_not_doing_yet',    label: 'What we are not doing yet',      icon: 'hold',   content: reading.pr_what_were_not_doing_yet },
      ]}
      coachNote={{ content: reading.pr_coach_note }}
    />
  )
}
