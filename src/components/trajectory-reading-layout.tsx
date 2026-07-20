import ReadingHeroShell from './reading-hero-shell'

/**
 * Block-end Trajectory Reading layout.
 *
 * Used by:
 *   - /portal/[token]/program/trajectory-reading
 *
 * Migrated 2026-07-20 from a bespoke cream-narrow-column editorial layout to
 * the shared dark-hero editorial shell (ReadingHeroShell). Same visual grammar
 * as Foundational / Program / Nutrition readings.
 */

export interface TrajectoryReadingData {
  tr_where_this_block_started: string | null
  tr_how_your_signal_moved: string | null
  tr_what_held_steady: string | null
  tr_what_this_sets_up_next: string | null
  tr_coach_note: string | null
  block_name: string
  progression_phase: string | null
  training_goal: string | null
  generated_at: string
  trajectory_reading_published_at: string | null
}

export interface TrajectoryReadingClientMeta {
  name: string
}

export default function TrajectoryReadingLayout({
  reading,
  client,
}: {
  reading: TrajectoryReadingData
  client: TrajectoryReadingClientMeta
}) {
  const pill = [reading.progression_phase, reading.training_goal].filter(Boolean).join(' · ') || null

  return (
    <ReadingHeroShell
      eyebrow="Block-End Reading"
      heroTitle={reading.block_name}
      heroSub="How your body moved across this block, read as one arc. Direction held across weeks is the signal, not any single week on its own."
      pill={pill}
      clientName={client.name}
      aboutText={
        <p>
          <b>About this reading.</b> A single week is never the verdict. Direction held across weeks is the signal. This reading is here so you can see the shape of where you have been travelling, trust that the work compounded even on the flat weeks, and carry that into what comes next.
        </p>
      }
      sections={[
        { key: 'tr_where_this_block_started', label: 'Where this block started', icon: 'pin',     content: reading.tr_where_this_block_started },
        { key: 'tr_how_your_signal_moved',    label: 'How your signal moved',    icon: 'path',    content: reading.tr_how_your_signal_moved },
        { key: 'tr_what_held_steady',         label: 'What held steady',         icon: 'hold',    content: reading.tr_what_held_steady },
        { key: 'tr_what_this_sets_up_next',   label: 'What this sets up next',   icon: 'compass', content: reading.tr_what_this_sets_up_next },
      ]}
      coachNote={{ content: reading.tr_coach_note }}
    />
  )
}
